use crate::AppState;
use serde::Serialize;
use sysinfo::{Disks, ProcessesToUpdate, System};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Disk {
    name: String,
    mount: String,
    total: u64,
    available: u64,
    kind: String,
}
#[derive(Serialize)]
pub struct Process {
    pid: u32,
    name: String,
    cpu: f32,
    memory: u64,
    path: Option<String>,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Report {
    hostname: String,
    os: String,
    cpu_name: String,
    cpu: f32,
    memory_used: u64,
    memory_total: u64,
    uptime: u64,
    disks: Vec<Disk>,
    processes: Vec<Process>,
}
pub fn disks() -> Result<Disks, String> {
    Disks::new_with_refreshed_list().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn system_snapshot(state: tauri::State<'_, AppState>) -> Result<Report, String> {
    let shared = state.system.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let mut guard = shared.lock().map_err(|_| "Monitor indisponível")?;
        let s = guard.as_mut().map_err(|e| e.clone())?;
        s.refresh_cpu_usage();
        s.refresh_memory();
        s.refresh_processes(ProcessesToUpdate::All, true);
        let cores = s.cpus().len().max(1) as f32;
        let processes = s
            .processes()
            .values()
            .map(|p| Process {
                pid: p.pid().as_u32(),
                name: p.name().to_string_lossy().into_owned(),
                cpu: (p.cpu_usage() / cores).clamp(0.0, 100.0),
                memory: p.memory(),
                path: p.exe().map(|p| p.to_string_lossy().into_owned()),
            })
            .collect();
        Ok(Report {
            hostname: System::host_name().unwrap_or_else(|_| "Este computador".into()),
            os: System::long_os_version().unwrap_or_else(|_| "Windows".into()),
            cpu_name: s
                .cpus()
                .first()
                .map(|c| c.brand().to_owned())
                .unwrap_or_default(),
            cpu: s.global_cpu_usage().clamp(0.0, 100.0),
            memory_used: s.used_memory(),
            memory_total: s.total_memory(),
            uptime: System::uptime().unwrap_or(0),
            disks: disks()?
                .iter()
                .map(|d| Disk {
                    name: d.name().to_string_lossy().into_owned(),
                    mount: d.mount_point().to_string_lossy().into_owned(),
                    total: d.total_space(),
                    available: d.available_space(),
                    kind: format!("{:?}", d.kind()),
                })
                .collect(),
            processes,
        })
    })
    .await
    .map_err(|e| e.to_string())?
}
