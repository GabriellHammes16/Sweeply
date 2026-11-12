use crate::{storage::is_link, AppState};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashSet,
    fs,
    io::Write,
    path::PathBuf,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

const AGE: Duration = Duration::from_secs(7 * 24 * 3600);
const EXPIRY: Duration = Duration::from_secs(15 * 60);
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Deserialize, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum Category {
    UserTemp,
    WindowsTemp,
    Prefetch,
}
impl Category {
    fn label(self) -> &'static str {
        match self {
            Self::UserTemp => "%TEMP%",
            Self::WindowsTemp => "Temp do Windows",
            Self::Prefetch => "Prefetch",
        }
    }
}
#[derive(Clone)]
pub struct Candidate {
    id: usize,
    path: PathBuf,
    size: u64,
    modified: SystemTime,
    category: Category,
}
pub struct Plan {
    id: String,
    roots: Vec<PathBuf>,
    created: Instant,
    files: Vec<Candidate>,
    skipped: usize,
    blocked: usize,
    warnings: Vec<String>,
}
#[derive(Serialize)]
pub struct FileView {
    id: usize,
    path: String,
    size: u64,
    category: Category,
}
#[derive(Serialize)]
pub struct PlanView {
    id: String,
    files: Vec<FileView>,
    total: u64,
    skipped: usize,
    blocked: usize,
    warnings: Vec<String>,
}
#[derive(Serialize)]
pub struct ResultView {
    deleted: usize,
    freed: u64,
    skipped: usize,
    errors: Vec<String>,
}
fn category_root(category: Category) -> Result<PathBuf, String> {
    let requested = match category {
        Category::UserTemp => {
            let local =
                std::env::var_os("LOCALAPPDATA").ok_or("Pasta local do usuário indisponível")?;
            let usual = PathBuf::from(local).join("Temp");
            let configured = std::env::var_os("TEMP").map(PathBuf::from).unwrap_or(usual);
            if !configured
                .file_name()
                .is_some_and(|n| n.eq_ignore_ascii_case("temp"))
            {
                return Err("%TEMP% aponta para uma pasta personalizada sem nome Temp; limpeza indisponível por segurança".into());
            }
            configured
        }
        Category::WindowsTemp | Category::Prefetch => {
            let windows = std::env::var_os("WINDIR").ok_or("Pasta do Windows indisponível")?;
            PathBuf::from(windows).join(if category == Category::Prefetch {
                "Prefetch"
            } else {
                "Temp"
            })
        }
    };
    if !requested.is_absolute()
        || requested
            .components()
            .any(|c| matches!(c, std::path::Component::ParentDir))
    {
        return Err("Pasta temporária inválida".into());
    }
    for ancestor in requested.ancestors() {
        if is_link(&fs::symlink_metadata(ancestor).map_err(|e| e.to_string())?) {
            return Err(
                "A pasta temporária usa links ou redirecionamentos e não será limpa".into(),
            );
        }
    }
    if requested.to_string_lossy().starts_with("\\\\") {
        return Err("Pastas de rede não são permitidas".into());
    }
    let root = requested.canonicalize().map_err(|e| e.to_string())?;
    if !root.is_dir() {
        return Err("Pasta temporária indisponível".into());
    }
    Ok(root)
}
fn eligible(meta: &fs::Metadata) -> bool {
    meta.is_file()
        && !is_link(meta)
        && !meta.permissions().readonly()
        && meta
            .modified()
            .ok()
            .and_then(|t| SystemTime::now().duration_since(t).ok())
            .is_some_and(|a| a >= AGE)
}
fn scan_roots(roots: Vec<(PathBuf, Category)>) -> Result<Plan, String> {
    let mut plan = Plan {
        id: format!(
            "{}-{}",
            std::process::id(),
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .map_err(|e| e.to_string())?
                .as_nanos()
        ),
        roots: roots.iter().map(|(path, _)| path.clone()).collect(),
        created: Instant::now(),
        files: vec![],
        skipped: 0,
        blocked: 0,
        warnings: vec![],
    };
    let mut stack = roots;
    let mut visited_dirs = HashSet::new();
    while let Some((dir, category)) = stack.pop() {
        if !visited_dirs.insert(dir.clone()) {
            continue;
        }
        let entries = match fs::read_dir(&dir) {
            Ok(e) => e,
            Err(e) => {
                plan.skipped += 1;
                plan.blocked += 1;
                if plan.roots.contains(&dir) {
                    plan.warnings.push(format!(
                        "{}: não foi possível ler a pasta. Pode exigir administrador. {}",
                        category.label(),
                        e
                    ));
                }
                continue;
            }
        };
        for entry in entries {
            let entry = match entry {
                Ok(e) => e,
                Err(_) => {
                    plan.skipped += 1;
                    plan.blocked += 1;
                    continue;
                }
            };
            let path = entry.path();
            let meta = match fs::symlink_metadata(&path) {
                Ok(m) => m,
                Err(_) => {
                    plan.skipped += 1;
                    plan.blocked += 1;
                    continue;
                }
            };
            if is_link(&meta) {
                plan.skipped += 1;
                continue;
            }
            if meta.is_file() && meta.permissions().readonly() {
                plan.skipped += 1;
                plan.blocked += 1;
                continue;
            }
            if meta.is_dir() {
                if category != Category::Prefetch {
                    stack.push((path, category));
                }
            } else if eligible(&meta)
                && (category != Category::Prefetch
                    || path
                        .extension()
                        .is_some_and(|e| e.eq_ignore_ascii_case("pf")))
            {
                let candidate = Candidate {
                    id: plan.files.len(),
                    path,
                    size: meta.len(),
                    modified: meta.modified().map_err(|e| e.to_string())?,
                    category,
                };
                match open_candidate(&plan, &candidate) {
                    Ok(_) => plan.files.push(candidate),
                    Err(_) => {
                        plan.skipped += 1;
                        plan.blocked += 1;
                    }
                }
            } else {
                plan.skipped += 1;
            }
        }
    }
    plan.created = Instant::now();
    Ok(plan)
}
#[cfg(test)]
fn scan(root: PathBuf) -> Result<Plan, String> {
    scan_roots(vec![(root, Category::UserTemp)])
}
fn validate(plan: &Plan, candidate: &Candidate) -> Result<(), String> {
    let root = plan
        .roots
        .iter()
        .find(|root| candidate.path.starts_with(root) && candidate.path != **root)
        .ok_or("Arquivo fora da pasta permitida")?;
    let mut current = Some(candidate.path.as_path());
    while let Some(p) = current {
        let m = fs::symlink_metadata(p).map_err(|e| e.to_string())?;
        if is_link(&m) {
            return Err("Links e pontos de montagem são ignorados".into());
        }
        if p == root {
            return Ok(());
        }
        current = p.parent();
    }
    Err("Caminho não permitido".into())
}
#[cfg(windows)]
fn open_candidate(plan: &Plan, candidate: &Candidate) -> Result<fs::File, String> {
    use std::os::windows::{fs::OpenOptionsExt, io::AsRawHandle};
    use windows_sys::Win32::Storage::FileSystem::GetFinalPathNameByHandleW;
    validate(plan, candidate)?;
    // O handle não compartilha escrita nem renomeação; a exclusão usa o mesmo objeto validado.
    let file = fs::OpenOptions::new()
        .access_mode(0x00010000 | 0x80)
        .share_mode(1)
        .custom_flags(0x00200000)
        .open(&candidate.path)
        .map_err(|e| e.to_string())?;
    let meta = file.metadata().map_err(|e| e.to_string())?;
    if !eligible(&meta)
        || meta.len() != candidate.size
        || meta.modified().ok() != Some(candidate.modified)
    {
        return Err("Arquivo alterado após a análise".into());
    }
    let mut buf = vec![0u16; 32768];
    let len = unsafe {
        GetFinalPathNameByHandleW(file.as_raw_handle(), buf.as_mut_ptr(), buf.len() as u32, 0)
    };
    if len == 0 || len as usize >= buf.len() {
        return Err("Não foi possível validar o caminho do arquivo".into());
    }
    let final_path = PathBuf::from(String::from_utf16_lossy(&buf[..len as usize]));
    if !plan
        .roots
        .iter()
        .any(|root| final_path.starts_with(root) && final_path != *root)
    {
        return Err("Arquivo fora da pasta temporária".into());
    }
    Ok(file)
}
#[cfg(not(windows))]
fn open_candidate(_plan: &Plan, _candidate: &Candidate) -> Result<fs::File, String> {
    Err("Limpeza disponível somente no Windows".into())
}
#[cfg(windows)]
fn delete_candidate(plan: &Plan, candidate: &Candidate) -> Result<u64, String> {
    use std::os::windows::io::AsRawHandle;
    use windows_sys::Win32::Storage::FileSystem::{
        FileDispositionInfo, SetFileInformationByHandle, FILE_DISPOSITION_INFO,
    };
    let file = open_candidate(plan, candidate)?;
    let disposition = FILE_DISPOSITION_INFO { DeleteFile: true };
    let ok = unsafe {
        SetFileInformationByHandle(
            file.as_raw_handle(),
            FileDispositionInfo,
            &disposition as *const _ as *const _,
            std::mem::size_of_val(&disposition) as u32,
        )
    };
    if ok == 0 {
        return Err(std::io::Error::last_os_error().to_string());
    }
    drop(file);
    Ok(candidate.size)
}
#[cfg(not(windows))]
fn delete_candidate(_plan: &Plan, _candidate: &Candidate) -> Result<u64, String> {
    Err("Limpeza disponível somente no Windows".into())
}

#[tauri::command]
pub async fn scan_cleanup(
    categories: Vec<Category>,
    state: tauri::State<'_, AppState>,
) -> Result<PlanView, String> {
    if categories.is_empty() || categories.len() > 3 {
        return Err("Selecione de uma a três categorias válidas".into());
    }
    let shared = state.cleanup.clone();
    let lock = state.scan_lock.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let _guard = lock
            .try_lock()
            .map_err(|_| "Uma análise já está em andamento")?;
        let mut roots = vec![];
        let mut warnings = vec![];
        for category in categories.into_iter().collect::<HashSet<_>>() {
            match category_root(category) {
                Ok(root) if !roots.iter().any(|(p, _)| p == &root) => roots.push((root, category)),
                Ok(_) => {}
                Err(e) => warnings.push(format!("{}: {}", category.label(), e)),
            }
        }
        let mut plan = scan_roots(roots)?;
        plan.warnings.extend(warnings);
        let view = PlanView {
            id: plan.id.clone(),
            total: plan.files.iter().map(|f| f.size).sum(),
            files: plan
                .files
                .iter()
                .map(|f| FileView {
                    id: f.id,
                    path: f.path.to_string_lossy().into_owned(),
                    size: f.size,
                    category: f.category,
                })
                .collect(),
            skipped: plan.skipped,
            blocked: plan.blocked,
            warnings: plan.warnings.clone(),
        };
        *shared.lock().map_err(|_| "Plano indisponível")? = Some(plan);
        Ok(view)
    })
    .await
    .map_err(|e| e.to_string())?
}
#[tauri::command]
pub async fn execute_cleanup(
    plan_id: String,
    ids: Vec<usize>,
    state: tauri::State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<ResultView, String> {
    if ids.is_empty() {
        return Err("Seleção inválida".into());
    }
    let shared = state.cleanup.clone();
    let lock = state.scan_lock.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let _guard = lock
            .try_lock()
            .map_err(|_| "Uma operação já está em andamento")?;
        let mut stored = shared.lock().map_err(|_| "Plano indisponível")?;
        let plan = stored
            .as_ref()
            .ok_or("Analise os arquivos antes de limpar")?;
        if plan.id != plan_id || plan.created.elapsed() > EXPIRY {
            return Err("A análise expirou. Analise novamente".into());
        }
        if ids.len() > plan.files.len() {
            return Err("Seleção inválida".into());
        }
        let ids: HashSet<_> = ids.into_iter().collect();
        if ids.iter().any(|id| *id >= plan.files.len()) {
            return Err("Arquivo não pertence à análise".into());
        }
        let plan = stored.take().ok_or("Plano indisponível")?;
        drop(stored);
        let mut log = open_log(&app)?;
        writeln!(log, "start={} selected={}", plan.id, ids.len()).map_err(|e| e.to_string())?;
        log.sync_data().map_err(|e| e.to_string())?;
        let mut result = ResultView {
            deleted: 0,
            freed: 0,
            skipped: 0,
            errors: vec![],
        };
        for file in plan.files.iter().filter(|f| ids.contains(&f.id)) {
            match delete_candidate(&plan, file) {
                Ok(size) => {
                    result.deleted += 1;
                    result.freed += size;
                }
                Err(e) => {
                    result.skipped += 1;
                    if result.errors.len() < 100 {
                        result.errors.push(format!("Item {}: {}", file.id + 1, e));
                    }
                }
            }
        }
        if let Err(e) = writeln!(
            log,
            "end={} deleted={} freed={} skipped={}",
            plan.id, result.deleted, result.freed, result.skipped
        )
        .and_then(|_| log.sync_data())
        {
            result.errors.push(format!(
                "A limpeza terminou, mas o relatório não pôde ser salvo: {e}"
            ));
        }
        Ok(result)
    })
    .await
    .map_err(|e| e.to_string())?
}

pub(crate) fn open_log(app: &tauri::AppHandle) -> Result<fs::File, String> {
    use tauri::Manager;
    let log_dir = app.path().app_local_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&log_dir).map_err(|e| e.to_string())?;
    let log_path = log_dir.join("cleanup.log");
    // shortcut: limite de 1 MB por log; adote rotação quando houver histórico extenso.
    if fs::metadata(&log_path).is_ok_and(|m| m.len() > 1_000_000) {
        return Err("Log cheio. Arquive cleanup.log e analise novamente".into());
    }
    fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(log_path)
        .map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    fn fixture() -> PathBuf {
        let p = std::env::temp_dir().join(format!(
            "sweeply-cleanup-test-{}-{}",
            std::process::id(),
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir(&p).unwrap();
        p.canonicalize().unwrap()
    }
    fn old_file(path: &std::path::Path) {
        fs::write(path, b"fixture").unwrap();
        fs::File::options()
            .write(true)
            .open(path)
            .unwrap()
            .set_times(
                fs::FileTimes::new()
                    .set_modified(SystemTime::now() - AGE - Duration::from_secs(60)),
            )
            .unwrap();
    }
    #[test]
    #[cfg(windows)]
    fn complete_scan_cleans_deep_and_large_tree_once() {
        let root = fixture();
        let mut deep = root.clone();
        for _ in 0..35 {
            deep = deep.join("d");
            fs::create_dir(&deep).unwrap();
        }
        old_file(&deep.join("old"));
        for i in 0..10_001 {
            old_file(&root.join(format!("old-{i}")));
        }
        let plan = scan(root.clone()).unwrap();
        let found = plan.files.len();
        for file in &plan.files {
            delete_candidate(&plan, file).unwrap();
        }
        let again = scan(root.clone()).unwrap();
        let remaining = again.files.len();
        // Remove somente a árvore de fixtures criada por este teste, inclusive se a asserção falhar.
        fs::remove_dir_all(&root).unwrap();
        assert_eq!(
            found, 10_002,
            "a primeira leitura precisa incluir toda a árvore"
        );
        assert_eq!(
            remaining, 0,
            "uma limpeza completa deve deixar a releitura vazia"
        );
    }
    #[test]
    #[cfg(windows)]
    fn scan_reports_locked_file_as_unavailable_instead_of_cleanable() {
        use std::os::windows::fs::OpenOptionsExt;
        let root = fixture();
        let path = root.join("locked");
        old_file(&path);
        let locked = fs::OpenOptions::new()
            .read(true)
            .share_mode(0)
            .open(&path)
            .unwrap();
        let plan = scan(root.clone()).unwrap();
        drop(locked);
        fs::remove_file(&path).unwrap();
        fs::remove_dir(root).unwrap();
        assert!(
            plan.files.is_empty(),
            "arquivos bloqueados não são candidatos removíveis"
        );
        assert_eq!(plan.skipped, 1);
    }
    #[test]
    #[cfg(windows)]
    fn categories_preserve_prefetch_metadata_and_readonly_files() {
        let root = fixture();
        let pf = root.join("program.pf");
        let metadata = root.join("Layout.ini");
        let readonly = root.join("protected.pf");
        old_file(&pf);
        old_file(&metadata);
        old_file(&readonly);
        let mut permissions = fs::metadata(&readonly).unwrap().permissions();
        permissions.set_readonly(true);
        fs::set_permissions(&readonly, permissions).unwrap();
        let plan = scan_roots(vec![(root.clone(), Category::Prefetch)]).unwrap();
        assert_eq!(plan.files.len(), 1);
        assert_eq!(plan.files[0].path, pf);
        assert_eq!(plan.blocked, 1);
        delete_candidate(&plan, &plan.files[0]).unwrap();
        assert!(metadata.exists());
        assert!(readonly.exists());
        let mut permissions = fs::metadata(&readonly).unwrap().permissions();
        permissions.set_readonly(false);
        fs::set_permissions(&readonly, permissions).unwrap();
        fs::remove_file(metadata).unwrap();
        fs::remove_file(readonly).unwrap();
        fs::remove_dir(root).unwrap();
    }
    #[test]
    fn scan_excludes_recent_and_rejects_outside() {
        let p = fixture();
        fs::write(p.join("recent"), b"keep").unwrap();
        let old = p.join("old");
        fs::write(&old, b"12345").unwrap();
        fs::File::options()
            .write(true)
            .open(&old)
            .unwrap()
            .set_times(
                fs::FileTimes::new()
                    .set_modified(SystemTime::now() - AGE - Duration::from_secs(60)),
            )
            .unwrap();
        let plan = scan(p.clone()).unwrap();
        assert_eq!(plan.files.len(), 1);
        assert_eq!(plan.files[0].size, 5);
        let mut forged = plan.files[0].clone();
        forged.path = p.parent().unwrap().join("outside");
        assert!(validate(&plan, &forged).is_err());
        fs::remove_file(p.join("recent")).unwrap();
        fs::remove_file(old).unwrap();
        fs::remove_dir(p).unwrap();
    }
    #[test]
    #[cfg(windows)]
    fn deletes_only_unchanged_file_and_preserves_open_file() {
        let p = fixture();
        let old = p.join("old");
        fs::write(&old, b"123").unwrap();
        fs::File::options()
            .write(true)
            .open(&old)
            .unwrap()
            .set_times(
                fs::FileTimes::new()
                    .set_modified(SystemTime::now() - AGE - Duration::from_secs(60)),
            )
            .unwrap();
        let plan = scan(p.clone()).unwrap();
        fs::write(&old, b"changed").unwrap();
        assert!(delete_candidate(&plan, &plan.files[0]).is_err());
        assert!(old.exists());
        fs::File::options()
            .write(true)
            .open(&old)
            .unwrap()
            .set_times(
                fs::FileTimes::new()
                    .set_modified(SystemTime::now() - AGE - Duration::from_secs(60)),
            )
            .unwrap();
        let plan = scan(p.clone()).unwrap();
        use std::os::windows::fs::OpenOptionsExt;
        let locked = fs::OpenOptions::new()
            .read(true)
            .share_mode(0)
            .open(&old)
            .unwrap();
        assert!(delete_candidate(&plan, &plan.files[0]).is_err());
        drop(locked);
        assert_eq!(delete_candidate(&plan, &plan.files[0]).unwrap(), 7);
        assert!(!old.exists());
        fs::remove_dir(p).unwrap();
    }
}
