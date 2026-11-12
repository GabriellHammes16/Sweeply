use crate::{cleanup::open_log, AppState};
use serde::Serialize;
use std::{ffi::c_void, io::Write, path::Path, ptr};
use sysinfo::{Pid, ProcessesToUpdate};
use windows_sys::Win32::{
    Foundation::{CloseHandle, FILETIME, HANDLE, WAIT_OBJECT_0},
    Security::{EqualSid, GetTokenInformation, TokenUser, TOKEN_QUERY, TOKEN_USER},
    System::{RemoteDesktop::ProcessIdToSessionId, Threading::*},
};

struct Handle(HANDLE);
impl Drop for Handle {
    fn drop(&mut self) {
        unsafe {
            CloseHandle(self.0);
        }
    }
}
fn last_error(context: &str) -> String {
    format!("{}: {}", context, std::io::Error::last_os_error())
}
fn wide(value: &str) -> Vec<u16> {
    value.encode_utf16().chain(Some(0)).collect()
}

fn token_user(process: HANDLE) -> Result<Vec<usize>, String> {
    let mut token = ptr::null_mut();
    if unsafe { OpenProcessToken(process, TOKEN_QUERY, &mut token) } == 0 {
        return Err(last_error("Usuário indisponível"));
    }
    let token = Handle(token);
    let mut size = 0;
    unsafe {
        GetTokenInformation(token.0, TokenUser, ptr::null_mut(), 0, &mut size);
    }
    if size < std::mem::size_of::<TOKEN_USER>() as u32 || size > 65_536 {
        return Err("Identidade do usuário inválida".into());
    }
    let mut buffer = vec![0usize; (size as usize).div_ceil(std::mem::size_of::<usize>())];
    if unsafe {
        GetTokenInformation(
            token.0,
            TokenUser,
            buffer.as_mut_ptr().cast(),
            size,
            &mut size,
        )
    } == 0
    {
        return Err(last_error("Usuário indisponível"));
    }
    Ok(buffer)
}
fn same_user(process: HANDLE) -> Result<bool, String> {
    let target = token_user(process)?;
    let current = token_user(unsafe { GetCurrentProcess() })?;
    Ok(unsafe {
        EqualSid(
            (*(target.as_ptr().cast::<TOKEN_USER>())).User.Sid,
            (*(current.as_ptr().cast::<TOKEN_USER>())).User.Sid,
        )
    } != 0)
}
fn protected_reason(pid: u32, path: &str, windows: &str) -> Option<&'static str> {
    let path = path
        .strip_prefix("\\\\?\\")
        .unwrap_or(path)
        .replace('/', "\\")
        .to_lowercase();
    let name = path.rsplit('\\').next().unwrap_or("");
    if pid <= 4 || pid == std::process::id() {
        return Some("O sistema e o próprio Sweeply são protegidos.");
    }
    if name == "msedgewebview2.exe" {
        return Some("Processos WebView2 são protegidos para preservar a interface do aplicativo.");
    }
    if [
        "system",
        "registry",
        "secure system",
        "memory compression",
        "smss.exe",
        "csrss.exe",
        "wininit.exe",
        "winlogon.exe",
        "services.exe",
        "lsass.exe",
        "lsaiso.exe",
        "svchost.exe",
        "dwm.exe",
        "explorer.exe",
        "sihost.exe",
        "fontdrvhost.exe",
        "msmpeng.exe",
        "mssense.exe",
        "securityhealthservice.exe",
        "sgrmbroker.exe",
    ]
    .contains(&name)
    {
        return Some("Processo essencial ou de proteção do Windows.");
    }
    let windows = windows
        .strip_prefix("\\\\?\\")
        .unwrap_or(windows)
        .trim_end_matches(['\\', '/'])
        .to_lowercase();
    if windows.is_empty() || path.starts_with(&(windows + "\\")) {
        return Some("Executáveis do Windows não podem ser encerrados pelo Sweeply.");
    }
    None
}
struct Inspected {
    handle: Handle,
    path: String,
    identity: String,
    blocked: Option<String>,
}
fn inspect(pid: u32, termination: bool) -> Result<Inspected, String> {
    if pid <= 4 {
        return Err("Processo do sistema protegido".into());
    }
    let rights = PROCESS_QUERY_LIMITED_INFORMATION
        | PROCESS_SYNCHRONIZE
        | if termination { PROCESS_TERMINATE } else { 0 };
    let raw = unsafe { OpenProcess(rights, 0, pid) };
    if raw.is_null() {
        return Err(last_error("Processo encerrado, protegido ou sem permissão"));
    }
    let handle = Handle(raw);
    let mut path = vec![0u16; 32768];
    let mut length = path.len() as u32;
    if unsafe { QueryFullProcessImageNameW(handle.0, 0, path.as_mut_ptr(), &mut length) } == 0 {
        return Err(last_error("Caminho do processo indisponível"));
    }
    let path = String::from_utf16_lossy(&path[..length as usize]);
    let mut created = FILETIME::default();
    let mut exited = FILETIME::default();
    let mut kernel = FILETIME::default();
    let mut user = FILETIME::default();
    if unsafe { GetProcessTimes(handle.0, &mut created, &mut exited, &mut kernel, &mut user) } == 0
    {
        return Err(last_error("Identidade do processo indisponível"));
    }
    let identity =
        ((u64::from(created.dwHighDateTime) << 32) | u64::from(created.dwLowDateTime)).to_string();
    let windows =
        std::env::var("WINDIR").map_err(|_| "Não foi possível identificar a pasta do Windows")?;
    let mut blocked = protected_reason(pid, &path, &windows).map(str::to_owned);
    if blocked.is_none() {
        let mut critical = 0;
        let mut session = 0;
        let mut current_session = 0;
        if unsafe { IsProcessCritical(handle.0, &mut critical) } == 0 {
            blocked = Some("Não foi possível verificar se o processo é essencial.".into());
        } else if critical != 0 {
            blocked = Some("Processo crítico do Windows protegido.".into());
        } else if unsafe { ProcessIdToSessionId(pid, &mut session) } == 0
            || unsafe { ProcessIdToSessionId(std::process::id(), &mut current_session) } == 0
            || session != current_session
        {
            blocked = Some("Processos de outras sessões são protegidos.".into());
        } else if !same_user(handle.0)? {
            blocked = Some("Processos de outros usuários ou serviços são protegidos.".into());
        }
    }
    Ok(Inspected {
        handle,
        path,
        identity,
        blocked,
    })
}

#[derive(Default, Serialize)]
#[serde(rename_all = "camelCase")]
struct Version {
    description: Option<String>,
    company: Option<String>,
    file_version: Option<String>,
    product: Option<String>,
}
fn version(path: &str) -> Version {
    use windows_sys::Win32::Storage::FileSystem::{
        GetFileVersionInfoSizeW, GetFileVersionInfoW, VerQueryValueW,
    };
    let path = wide(path);
    let size = unsafe { GetFileVersionInfoSizeW(path.as_ptr(), ptr::null_mut()) };
    if size == 0 || size > 1_048_576 {
        return Version::default();
    }
    let mut data = vec![0u32; (size as usize).div_ceil(4)];
    if unsafe { GetFileVersionInfoW(path.as_ptr(), 0, size, data.as_mut_ptr().cast()) } == 0 {
        return Version::default();
    }
    let query = |key: &str| -> Option<(*mut c_void, usize)> {
        let mut value = ptr::null_mut();
        let mut length = 0;
        if unsafe {
            VerQueryValueW(
                data.as_ptr().cast(),
                wide(key).as_ptr(),
                &mut value,
                &mut length,
            )
        } == 0
            || value.is_null()
        {
            return None;
        }
        Some((value, length as usize))
    };
    let inside = |pointer: *mut c_void, bytes: usize| {
        let start = data.as_ptr() as usize;
        let at = pointer as usize;
        at >= start
            && at
                .checked_add(bytes)
                .is_some_and(|end| end <= start + size as usize)
    };
    let (language, codepage) = query("\\VarFileInfo\\Translation")
        .filter(|(p, n)| *n >= 4 && inside(*p, 4))
        .map(|(p, _)| unsafe {
            (
                ptr::read_unaligned(p.cast::<u16>()),
                ptr::read_unaligned(p.cast::<u16>().add(1)),
            )
        })
        .unwrap_or((0x409, 0x4b0));
    let string = |field: &str| -> Option<String> {
        let (p, len) = query(&format!(
            "\\StringFileInfo\\{language:04x}{codepage:04x}\\{field}"
        ))?;
        if len == 0 || len > 4096 || !inside(p, len * 2) || !(p as usize).is_multiple_of(2) {
            return None;
        }
        let units = unsafe { std::slice::from_raw_parts(p.cast::<u16>(), len) };
        let text = String::from_utf16_lossy(units)
            .trim_end_matches('\0')
            .trim()
            .to_owned();
        if text.is_empty() {
            None
        } else {
            Some(text)
        }
    };
    Version {
        description: string("FileDescription"),
        company: string("CompanyName"),
        file_version: string("FileVersion"),
        product: string("ProductName"),
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Details {
    pid: u32,
    name: String,
    path: Option<String>,
    cpu: f32,
    memory: u64,
    parent_pid: Option<u32>,
    start_time: u64,
    run_time: u64,
    status: String,
    identity: Option<String>,
    termination_block: Option<String>,
    #[serde(flatten)]
    version: Version,
}
#[tauri::command]
pub async fn process_details(
    pid: u32,
    state: tauri::State<'_, AppState>,
) -> Result<Details, String> {
    let shared = state.system.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let mut guard = shared.lock().map_err(|_| "Monitor indisponível")?;
        let system = guard.as_mut().map_err(|e| e.clone())?;
        system.refresh_processes(ProcessesToUpdate::Some(&[Pid::from_u32(pid)]), true);
        let p = system
            .process(Pid::from_u32(pid))
            .ok_or("O processo já foi encerrado. Atualize a lista.")?;
        let (path, identity, blocked) = match inspect(pid, false) {
            Ok(i) => (Some(i.path), Some(i.identity), i.blocked),
            Err(e) => (
                p.exe().map(|p| p.to_string_lossy().into_owned()),
                None,
                Some(e),
            ),
        };
        let metadata = path.as_deref().map(version).unwrap_or_default();
        Ok(Details {
            pid,
            name: path
                .as_deref()
                .and_then(|p| Path::new(p).file_name())
                .map(|n| n.to_string_lossy().into_owned())
                .unwrap_or_else(|| p.name().to_string_lossy().into_owned()),
            path,
            cpu: (p.cpu_usage() / system.cpus().len().max(1) as f32).clamp(0.0, 100.0),
            memory: p.memory(),
            parent_pid: p.parent().map(|pid| pid.as_u32()),
            start_time: p.start_time(),
            run_time: p.run_time(),
            status: p.status().to_string(),
            identity,
            termination_block: blocked,
            version: metadata,
        })
    })
    .await
    .map_err(|e| e.to_string())?
}

fn terminate(pid: u32, expected_identity: &str) -> Result<String, String> {
    let inspected = inspect(pid, true)?;
    if let Some(reason) = inspected.blocked {
        return Err(reason);
    }
    if inspected.identity != expected_identity {
        return Err("O PID foi reutilizado. Abra os detalhes novamente antes de encerrar.".into());
    }
    if unsafe { WaitForSingleObject(inspected.handle.0, 0) } == WAIT_OBJECT_0 {
        return Err("O processo já foi encerrado.".into());
    }
    if unsafe { TerminateProcess(inspected.handle.0, 1) } == 0 {
        return Err(last_error("Não foi possível encerrar o processo"));
    }
    if unsafe { WaitForSingleObject(inspected.handle.0, 2000) } == WAIT_OBJECT_0 {
        Ok("Processo encerrado.".into())
    } else {
        Ok("Encerramento solicitado. O Windows ainda está finalizando o processo.".into())
    }
}
#[tauri::command]
pub async fn terminate_process(
    pid: u32,
    identity: String,
    confirmed: bool,
    app: tauri::AppHandle,
) -> Result<String, String> {
    if !confirmed
        || identity.is_empty()
        || identity.len() > 20
        || !identity.bytes().all(|b| b.is_ascii_digit())
    {
        return Err("Confirme o encerramento de um processo revisado.".into());
    }
    tauri::async_runtime::spawn_blocking(move || {
        let mut log = open_log(&app)?;
        writeln!(log, "process request pid={pid}")
            .and_then(|_| log.sync_data())
            .map_err(|e| e.to_string())?;
        let result = terminate(pid, &identity);
        let recorded = writeln!(log, "process result pid={pid} success={}", result.is_ok())
            .and_then(|_| log.sync_data());
        match (result, recorded) {
            (Ok(message), Err(e)) => Ok(format!("{message} Não foi possível salvar o log: {e}")),
            (result, _) => result,
        }
    })
    .await
    .map_err(|e| e.to_string())?
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn protects_essential_processes_and_windows_paths() {
        assert!(protected_reason(4, "C:\\Apps\\app.exe", "C:\\Windows").is_some());
        assert!(protected_reason(9999, "C:\\Apps\\LSASS.EXE", "C:\\Windows").is_some());
        assert!(protected_reason(9999, "c:\\WINDOWS\\System32\\app.exe", "C:\\Windows").is_some());
        assert!(protected_reason(9999, "C:\\WindowsApps\\app.exe", "C:\\Windows").is_none());
    }
    #[test]
    fn reads_executable_metadata_and_handles_missing_resources() {
        let path = std::path::PathBuf::from(std::env::var_os("WINDIR").unwrap())
            .join("System32/kernel32.dll");
        let metadata = version(&path.to_string_lossy());
        assert!(metadata.description.is_some());
        assert!(metadata.file_version.is_some());
        assert!(version("C:\\sweeply-missing-file-for-test.exe")
            .description
            .is_none());
    }
    #[test]
    #[ignore = "subprocesso isolado usado somente pelo teste de encerramento"]
    fn termination_fixture() {
        if std::env::var_os("SWEEPLY_PROCESS_FIXTURE").is_some() {
            std::thread::sleep(std::time::Duration::from_secs(30));
        }
    }
    #[test]
    fn rejects_stale_identity_and_terminates_only_fixture_child() {
        let mut child = std::process::Command::new(std::env::current_exe().unwrap())
            .args([
                "--exact",
                "processes::tests::termination_fixture",
                "--ignored",
            ])
            .env("SWEEPLY_PROCESS_FIXTURE", "1")
            .stdout(std::process::Stdio::null())
            .spawn()
            .unwrap();
        let inspected = inspect(child.id(), false).unwrap();
        let rejected = terminate(child.id(), "0");
        let alive = child.try_wait().unwrap().is_none();
        let result = terminate(child.id(), &inspected.identity);
        if result.is_err() {
            let _ = child.kill();
        }
        let _ = child.wait();
        assert!(rejected.is_err());
        assert!(alive);
        assert!(result.is_ok(), "{result:?}");
    }
}
