use crate::{system, AppState};
use serde::Serialize;
use std::{
    fs,
    path::Path,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex,
    },
    time::{Duration, Instant},
};

#[derive(Clone, Serialize)]
pub struct Node {
    name: String,
    path: String,
    size: u64,
    children: Vec<Node>,
    protected: bool,
}
#[derive(Serialize)]
pub struct Report {
    root: Node,
    skipped: usize,
    cancelled: bool,
    visited: usize,
}
#[derive(Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Progress {
    visited: usize,
    files: usize,
    folders: usize,
    bytes: u64,
    skipped: usize,
    current_folder: String,
    elapsed_seconds: u64,
}
pub struct ScanControl {
    id: String,
    started: Instant,
    running: AtomicBool,
    cancelled: AtomicBool,
    progress: Mutex<Progress>,
}
impl ScanControl {
    fn new(id: String) -> Self {
        Self {
            id,
            started: Instant::now(),
            running: AtomicBool::new(true),
            cancelled: AtomicBool::new(false),
            progress: Mutex::new(Progress::default()),
        }
    }
}
struct Running(Arc<ScanControl>);
impl Drop for Running {
    fn drop(&mut self) {
        self.0.running.store(false, Ordering::Relaxed);
    }
}
struct Frame {
    node: Node,
    entries: fs::ReadDir,
    depth: usize,
}

pub fn is_link(meta: &fs::Metadata) -> bool {
    #[cfg(windows)]
    {
        use std::os::windows::fs::MetadataExt;
        meta.file_attributes() & 0x400 != 0
    }
    #[cfg(not(windows))]
    {
        meta.file_type().is_symlink()
    }
}
fn node(path: &Path) -> Node {
    Node {
        name: path
            .file_name()
            .unwrap_or(path.as_os_str())
            .to_string_lossy()
            .into_owned(),
        path: path.to_string_lossy().into_owned(),
        size: 0,
        children: vec![],
        protected: false,
    }
}
fn frame(path: &Path, depth: usize) -> std::io::Result<Frame> {
    if is_link(&fs::symlink_metadata(path)?) {
        return Err(std::io::Error::other(
            "Links e pontos de montagem são ignorados",
        ));
    }
    Ok(Frame {
        node: node(path),
        entries: fs::read_dir(path)?,
        depth,
    })
}
fn attach(parent: &mut Frame, child: Node) {
    parent.node.size = parent.node.size.saturating_add(child.size);
    // shortcut: detalha quatro níveis e 128 filhos por pasta; todos os demais bytes entram nos totais.
    if parent.depth <= 3 && child.size > 0 {
        parent.node.children.push(child);
        if parent.node.children.len() > 256 {
            parent
                .node
                .children
                .sort_unstable_by_key(|n| std::cmp::Reverse(n.size));
            parent.node.children.truncate(128);
        }
    }
}
fn finish(mut frame: Frame) -> Node {
    frame
        .node
        .children
        .sort_unstable_by_key(|n| std::cmp::Reverse(n.size));
    frame.node.children.truncate(128);
    if frame.depth <= 3 {
        let represented = frame
            .node
            .children
            .iter()
            .fold(0u64, |sum, n| sum.saturating_add(n.size));
        if represented < frame.node.size {
            frame.node.children.push(Node {
                name: "Outros arquivos (agrupados)".into(),
                path: frame.node.path.clone(),
                size: frame.node.size - represented,
                children: vec![],
                protected: false,
            });
        }
    }
    frame.node
}
fn publish(control: &ScanControl, progress: &mut Progress) -> Result<(), String> {
    progress.elapsed_seconds = control.started.elapsed().as_secs();
    *control
        .progress
        .lock()
        .map_err(|_| "Andamento indisponível")? = progress.clone();
    Ok(())
}
fn scan_tree(path: &Path, control: &ScanControl) -> Result<Report, String> {
    let mut progress = control
        .progress
        .lock()
        .map_err(|_| "Andamento indisponível")?
        .clone();
    let mut stack =
        vec![frame(path, 0).map_err(|e| format!("Não foi possível analisar a unidade: {e}"))?];
    progress.visited += 1;
    progress.folders += 1;
    progress.current_folder = path.to_string_lossy().into_owned();
    publish(control, &mut progress)?;
    let mut last_update = Instant::now();
    let mut root = None;
    while !stack.is_empty() && !control.cancelled.load(Ordering::Relaxed) {
        let entry = stack
            .last_mut()
            .ok_or("Leitura indisponível")?
            .entries
            .next();
        match entry {
            Some(Ok(entry)) => {
                progress.visited += 1;
                match entry.metadata() {
                    Ok(meta) if !is_link(&meta) => {
                        if meta.is_dir() {
                            progress.folders += 1;
                            let path = entry.path();
                            let depth = stack.len();
                            match frame(&path, depth) {
                                Ok(next) => {
                                    progress.current_folder = next.node.path.clone();
                                    stack.push(next);
                                }
                                Err(_) => {
                                    progress.skipped += 1;
                                }
                            }
                        } else if meta.is_file() {
                            progress.files += 1;
                            progress.bytes = progress.bytes.saturating_add(meta.len());
                            let parent = stack.last_mut().ok_or("Pasta indisponível")?;
                            if parent.depth <= 3 {
                                let mut child = node(&entry.path());
                                child.size = meta.len();
                                attach(parent, child);
                            } else {
                                parent.node.size = parent.node.size.saturating_add(meta.len());
                            }
                        } else {
                            progress.skipped += 1;
                        }
                    }
                    _ => {
                        progress.skipped += 1;
                    }
                }
            }
            Some(Err(_)) => {
                progress.skipped += 1;
            }
            None => {
                let completed = finish(stack.pop().ok_or("Pasta indisponível")?);
                if let Some(parent) = stack.last_mut() {
                    progress.current_folder = parent.node.path.clone();
                    attach(parent, completed);
                } else {
                    root = Some(completed);
                }
            }
        }
        if last_update.elapsed() >= Duration::from_millis(250) {
            publish(control, &mut progress)?;
            last_update = Instant::now();
        }
    }
    // No cancelamento, agrega somente o que já foi lido e identifica o relatório como parcial.
    while let Some(current) = stack.pop() {
        let completed = finish(current);
        if let Some(parent) = stack.last_mut() {
            attach(parent, completed);
        } else {
            root = Some(completed);
        }
    }
    publish(control, &mut progress)?;
    Ok(Report {
        root: root.ok_or("Nenhum resultado disponível")?,
        skipped: progress.skipped,
        cancelled: control.cancelled.load(Ordering::Relaxed),
        visited: progress.visited,
    })
}
fn validate_id(id: &str) -> Result<(), String> {
    if id.is_empty() || id.len() > 64 || !id.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-')
    {
        Err("Identificador de análise inválido".into())
    } else {
        Ok(())
    }
}
#[tauri::command]
pub async fn scan_storage(
    mount: String,
    scan_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<Report, String> {
    validate_id(&scan_id)?;
    let control = Arc::new(ScanControl::new(scan_id));
    {
        let mut current = state
            .storage_scan
            .lock()
            .map_err(|_| "Análise indisponível")?;
        if current
            .as_ref()
            .is_some_and(|c| c.running.load(Ordering::Relaxed))
        {
            return Err("Uma análise de armazenamento já está em andamento".into());
        }
        *current = Some(control.clone());
    }
    let lock = state.scan_lock.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let _running = Running(control.clone());
        let _guard = lock
            .try_lock()
            .map_err(|_| "Uma operação já está em andamento")?;
        let disks = system::disks()?;
        let disk = disks
            .iter()
            .find(|d| d.mount_point().to_string_lossy() == mount)
            .ok_or("Selecione uma unidade detectada pelo Sweeply")?;
        scan_tree(disk.mount_point(), &control)
    })
    .await
    .map_err(|e| e.to_string())?
}
#[tauri::command]
pub fn storage_progress(
    scan_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<Option<Progress>, String> {
    validate_id(&scan_id)?;
    let current = state
        .storage_scan
        .lock()
        .map_err(|_| "Análise indisponível")?;
    let Some(control) = current.as_ref().filter(|c| c.id == scan_id) else {
        return Ok(None);
    };
    let mut progress = control
        .progress
        .lock()
        .map_err(|_| "Andamento indisponível")?
        .clone();
    if control.running.load(Ordering::Relaxed) {
        progress.elapsed_seconds = control.started.elapsed().as_secs();
    }
    Ok(Some(progress))
}
#[tauri::command]
pub fn cancel_storage(scan_id: String, state: tauri::State<'_, AppState>) -> Result<(), String> {
    validate_id(&scan_id)?;
    let current = state
        .storage_scan
        .lock()
        .map_err(|_| "Análise indisponível")?;
    if let Some(control) = current.as_ref().filter(|c| c.id == scan_id) {
        control.cancelled.store(true, Ordering::Relaxed);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    fn fixture() -> std::path::PathBuf {
        let path = std::env::temp_dir().join(format!(
            "ss-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir(&path).unwrap();
        path
    }
    #[test]
    fn hierarchy_has_correct_sizes() {
        let p = fixture();
        fs::create_dir(p.join("nested")).unwrap();
        fs::write(p.join("one"), b"123").unwrap();
        fs::write(p.join("nested/two"), b"45678").unwrap();
        let result = scan_tree(&p, &ScanControl::new("test".into())).unwrap();
        assert_eq!(result.root.size, 8);
        assert_eq!(result.root.children[0].size, 5);
        assert!(!result.cancelled);
        fs::remove_file(p.join("one")).unwrap();
        fs::remove_file(p.join("nested/two")).unwrap();
        fs::remove_dir(p.join("nested")).unwrap();
        fs::remove_dir(p).unwrap();
    }
    #[test]
    fn scan_does_not_cut_off_by_time_or_entry_count() {
        let p = fixture();
        fs::write(p.join("file"), b"123").unwrap();
        let mut expired_time = ScanControl::new("time".into());
        expired_time.started = Instant::now() - Duration::from_secs(21);
        let many_entries = ScanControl::new("entries".into());
        many_entries.progress.lock().unwrap().visited = 150_000;
        let sizes = [
            scan_tree(&p, &expired_time).unwrap().root.size,
            scan_tree(&p, &many_entries).unwrap().root.size,
        ];
        fs::remove_file(p.join("file")).unwrap();
        fs::remove_dir(p).unwrap();
        assert_eq!(
            sizes,
            [3, 3],
            "tempo e quantidade não podem deixar arquivos fora da análise"
        );
    }
    #[test]
    fn counts_deep_files_and_publishes_actual_progress() {
        let p = fixture();
        let mut deep = p.clone();
        for _ in 0..70 {
            deep = deep.join("d");
            fs::create_dir(&deep).unwrap();
        }
        fs::write(deep.join("file"), b"12345").unwrap();
        let control = ScanControl::new("deep".into());
        let report = scan_tree(&p, &control).unwrap();
        let progress = control.progress.lock().unwrap().clone();
        fs::remove_file(deep.join("file")).unwrap();
        for _ in 0..70 {
            fs::remove_dir(&deep).unwrap();
            deep.pop();
        }
        fs::remove_dir(p).unwrap();
        assert_eq!(report.root.size, 5);
        assert_eq!(progress.files, 1);
        assert_eq!(progress.folders, 71);
        assert_eq!(progress.visited, 72);
        assert_eq!(progress.bytes, 5);
    }
    #[test]
    fn cancellation_is_explicit_and_does_not_modify_files() {
        let p = fixture();
        fs::write(p.join("file"), b"keep").unwrap();
        let control = ScanControl::new("cancel".into());
        control.cancelled.store(true, Ordering::Relaxed);
        let report = scan_tree(&p, &control).unwrap();
        assert!(report.cancelled);
        assert_eq!(report.root.size, 0);
        assert_eq!(fs::read(p.join("file")).unwrap(), b"keep");
        fs::remove_file(p.join("file")).unwrap();
        fs::remove_dir(p).unwrap();
    }
}
