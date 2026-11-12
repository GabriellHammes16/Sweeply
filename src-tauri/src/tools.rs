use std::{path::PathBuf, process::Command};

#[tauri::command]
pub fn open_windows_tool(tool: String) -> Result<(), String> {
    let uri = match tool.as_str() {
        "startup" => "ms-settings:startupapps",
        "security" => "windowsdefender:",
        "updates" => "ms-settings:windowsupdate",
        "network" => "ms-settings:network-status",
        "storage" => "ms-settings:storagesense",
        "diagnostics" => "ms-settings:troubleshoot",
        _ => return Err("Ferramenta não permitida".into()),
    };
    explorer(uri)
}
fn explorer(argument: &str) -> Result<(), String> {
    let windows = std::env::var_os("WINDIR").ok_or("Pasta do Windows indisponível")?;
    Command::new(PathBuf::from(windows).join("explorer.exe"))
        .arg(argument)
        .spawn()
        .map(|_| ())
        .map_err(|e| e.to_string())
}
#[tauri::command]
pub fn open_location(path: String) -> Result<(), String> {
    let p = PathBuf::from(&path);
    if !p.is_absolute() || path.starts_with("\\\\") || path.contains('"') || path.contains('\0') {
        return Err("Somente caminhos locais absolutos são permitidos".into());
    }
    let p = p.canonicalize().map_err(|e| e.to_string())?;
    // A canonicalização do Windows usa o prefixo estendido; Explorer recebe o caminho local comum.
    let text = p.to_string_lossy();
    let ordinary = text.strip_prefix("\\\\?\\").unwrap_or(&text);
    if ordinary.starts_with("UNC\\") {
        return Err("Caminhos de rede não são permitidos".into());
    }
    let folder = if p.is_file() {
        p.parent()
            .ok_or("Pasta indisponível")?
            .to_string_lossy()
            .into_owned()
    } else {
        text.into_owned()
    };
    explorer(folder.strip_prefix("\\\\?\\").unwrap_or(&folder))
}
