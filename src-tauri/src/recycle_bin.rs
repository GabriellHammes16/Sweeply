use crate::{cleanup::open_log, AppState};
use serde::Serialize;
use std::io::Write;

#[derive(Serialize)]
pub struct Status {
    count: u64,
    size: u64,
}

#[cfg(windows)]
fn query() -> Result<Status, String> {
    use windows_sys::Win32::UI::Shell::{SHQueryRecycleBinW, SHQUERYRBINFO};
    let mut info = SHQUERYRBINFO {
        cbSize: std::mem::size_of::<SHQUERYRBINFO>() as u32,
        i64Size: 0,
        i64NumItems: 0,
    };
    let result = unsafe { SHQueryRecycleBinW(std::ptr::null(), &mut info) };
    if result < 0 {
        return Err(format!(
            "Não foi possível consultar a Lixeira (0x{:08X})",
            result as u32
        ));
    }
    Ok(Status {
        count: info.i64NumItems.max(0) as u64,
        size: info.i64Size.max(0) as u64,
    })
}
#[cfg(not(windows))]
fn query() -> Result<Status, String> {
    Err("Lixeira disponível somente no Windows".into())
}

#[tauri::command]
pub async fn recycle_bin_status() -> Result<Status, String> {
    tauri::async_runtime::spawn_blocking(query)
        .await
        .map_err(|e| e.to_string())?
}

#[cfg(windows)]
const EMPTY_FLAGS: u32 = windows_sys::Win32::UI::Shell::SHERB_NOSOUND;

#[tauri::command]
pub async fn empty_recycle_bin(
    state: tauri::State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<Status, String> {
    let lock = state.scan_lock.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let _guard = lock
            .try_lock()
            .map_err(|_| "Uma operação já está em andamento")?;
        let before = query()?;
        if before.count == 0 {
            return Ok(before);
        }
        let mut log = open_log(&app)?;
        writeln!(log, "recycle_bin start count={}", before.count)
            .and_then(|_| log.sync_data())
            .map_err(|e| e.to_string())?;
        #[cfg(windows)]
        {
            // Sem SHERB_NOCONFIRMATION: o Windows exige confirmação antes de esvaziar todas as unidades.
            let result = unsafe {
                windows_sys::Win32::UI::Shell::SHEmptyRecycleBinW(
                    std::ptr::null_mut(),
                    std::ptr::null(),
                    EMPTY_FLAGS,
                )
            };
            if result < 0 {
                let _ = writeln!(
                    log,
                    "recycle_bin cancelled_or_failed=0x{:08X}",
                    result as u32
                );
                return Err(format!(
                    "Esvaziamento cancelado ou não concluído (0x{:08X})",
                    result as u32
                ));
            }
        }
        let after = query()?;
        writeln!(log, "recycle_bin end remaining={}", after.count)
            .and_then(|_| log.sync_data())
            .map_err(|e| format!("Operação finalizada, mas o log falhou: {e}"))?;
        Ok(after)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[cfg(test)]
mod tests {
    #[test]
    #[cfg(windows)]
    fn emptying_keeps_windows_confirmation_enabled() {
        assert_eq!(
            super::EMPTY_FLAGS & windows_sys::Win32::UI::Shell::SHERB_NOCONFIRMATION,
            0
        );
    }
}
