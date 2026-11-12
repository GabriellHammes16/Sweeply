use crate::AppState;
use serde::Serialize;
use std::time::Duration;
use tauri_plugin_updater::{Error, UpdaterExt};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInfo {
    current_version: String,
    version: Option<String>,
    notes: Option<String>,
    published: bool,
}
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadProgress {
    downloaded: u64,
    total: Option<u64>,
    installing: bool,
}
fn trusted_download(url: &tauri::Url) -> bool {
    url.scheme() == "https"
        && url.host_str() == Some("github.com")
        && url.username().is_empty()
        && url.password().is_none()
        && url.port_or_known_default() == Some(443)
        && url
            .path()
            .starts_with("/GabriellHammes16/Sweeply/releases/download/")
        && url.query().is_none()
        && url.fragment().is_none()
}
#[tauri::command]
pub async fn check_updates(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<UpdateInfo, String> {
    let result = app
        .updater_builder()
        .timeout(Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?
        .check()
        .await;
    let (update, published) = match result {
        Ok(update) => (update, true),
        Err(Error::ReleaseNotFound) => (None, false),
        Err(e) => {
            return Err(format!(
            "Não foi possível consultar atualizações. Verifique sua conexão e tente novamente. {e}"
        ))
        }
    };
    if update
        .as_ref()
        .is_some_and(|u| !trusted_download(&u.download_url))
    {
        return Err("A atualização não aponta para uma release oficial do Sweeply.".into());
    }
    let info = UpdateInfo {
        current_version: app.package_info().version.to_string(),
        version: update.as_ref().map(|u| u.version.clone()),
        notes: update.as_ref().and_then(|u| u.body.clone()),
        published,
    };
    *state
        .updates
        .lock()
        .map_err(|_| "Atualizador indisponível")? = update;
    Ok(info)
}
#[tauri::command]
pub async fn install_update(
    version: String,
    confirmed: bool,
    progress: tauri::ipc::Channel<DownloadProgress>,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    if !confirmed {
        return Err("Confirme a instalação da atualização.".into());
    }
    let shared = state.updates.clone();
    let lock = state.scan_lock.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let _guard = lock
            .try_lock()
            .map_err(|_| "Conclua ou cancele a análise/limpeza em andamento antes de atualizar.")?;
        let mut update = shared
            .lock()
            .map_err(|_| "Atualizador indisponível")?
            .clone()
            .ok_or("Verifique as atualizações antes de instalar.")?;
        if update.version != version || !trusted_download(&update.download_url) {
            return Err("A atualização mudou. Verifique novamente antes de instalar.".into());
        }
        update.timeout = Some(Duration::from_secs(600));
        let mut downloaded = 0u64;
        let installing = progress.clone();
        tauri::async_runtime::block_on(update.download_and_install(
            move |chunk, total| {
                downloaded = downloaded.saturating_add(chunk as u64);
                let _ = progress.send(DownloadProgress {
                    downloaded,
                    total,
                    installing: false,
                });
            },
            move || {
                let _ = installing.send(DownloadProgress {
                    downloaded: 0,
                    total: None,
                    installing: true,
                });
            },
        ))
        .map_err(|e| format!("Não foi possível concluir a atualização. Tente novamente. {e}"))
    })
    .await
    .map_err(|e| e.to_string())?
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn accepts_only_official_https_release_assets() {
        for url in [
            "http://github.com/GabriellHammes16/Sweeply/releases/download/v1/x.exe",
            "https://evil.example/GabriellHammes16/Sweeply/releases/download/v1/x.exe",
            "https://github.com/attacker/Sweeply/releases/download/v1/x.exe",
            "https://user@github.com/GabriellHammes16/Sweeply/releases/download/v1/x.exe",
        ] {
            assert!(!trusted_download(&url.parse().unwrap()));
        }
        assert!(trusted_download(&"https://github.com/GabriellHammes16/Sweeply/releases/download/v0.2.0/Sweeply-setup.exe".parse().unwrap()));
    }
}
