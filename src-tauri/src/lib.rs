mod cleanup;
mod processes;
mod recycle_bin;
mod storage;
mod system;
mod tools;
mod updates;

use std::sync::{Arc, Mutex};
use sysinfo::System;

pub struct AppState {
    system: Arc<Mutex<Result<System, String>>>,
    cleanup: Arc<Mutex<Option<cleanup::Plan>>>,
    scan_lock: Arc<Mutex<()>>,
    storage_scan: Mutex<Option<Arc<storage::ScanControl>>>,
    updates: Arc<Mutex<Option<tauri_plugin_updater::Update>>>,
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(AppState {
            system: Arc::new(Mutex::new(System::new_all().map_err(|e| e.to_string()))),
            cleanup: Arc::new(Mutex::new(None)),
            scan_lock: Arc::new(Mutex::new(())),
            storage_scan: Mutex::new(None),
            updates: Arc::new(Mutex::new(None)),
        })
        .invoke_handler(tauri::generate_handler![
            system::system_snapshot,
            updates::check_updates,
            updates::install_update,
            processes::process_details,
            processes::terminate_process,
            cleanup::scan_cleanup,
            cleanup::execute_cleanup,
            recycle_bin::recycle_bin_status,
            recycle_bin::empty_recycle_bin,
            storage::scan_storage,
            storage::storage_progress,
            storage::cancel_storage,
            tools::open_windows_tool,
            tools::open_location,
        ])
        .run(tauri::generate_context!())
        .expect("Não foi possível iniciar o Sweeply");
}
