use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use serde_json::Map;

use crate::utils::file::{deserialize_from_json, fix_json, serialize_to_json};

use super::db::{read_local_mod, LocalDatabase};

#[derive(Serialize, Deserialize)]
struct ModStubConfig {
    enabled: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    settings: Option<Map<String, serde_json::Value>>,
}

fn read_config(config_path: &Path) -> Result<ModStubConfig, anyhow::Error> {
    fix_json(config_path).ok();
    deserialize_from_json(config_path)
}

fn write_config(conf: &ModStubConfig, config_path: &Path) -> Result<(), anyhow::Error> {
    serialize_to_json(&conf, config_path, false)?;
    Ok(())
}

pub fn copy_default_config(mod_path: &Path) -> Result<(), anyhow::Error> {
    let default_config_path = mod_path.join("default-config.json");
    if default_config_path.is_file() {
        let default_config = read_config(&default_config_path)?;
        let config_path = mod_path.join("config.json");
        write_config(&default_config, &config_path)?;
        Ok(())
    } else {
        Err(anyhow::Error::msg(format!(
            "Can't Load Default Config From {}",
            default_config_path.to_str().unwrap()
        )))
    }
}

pub fn get_mod_enabled(mod_path: &Path) -> Result<bool, anyhow::Error> {
    let config_path = mod_path.join("config.json");
    if config_path.is_file() {
        let conf = read_config(&config_path)?;
        Ok(conf.enabled)
    } else {
        Ok(false)
    }
}

pub fn toggle_mod(
    mod_path: &Path,
    local_db: &LocalDatabase,
    enabled: bool,
    recursive: bool,
) -> Result<(), anyhow::Error> {
    let config_path = mod_path.join("config.json");
    if config_path.is_file() {
        let mut config = read_config(&config_path)?;
        config.enabled = enabled;
        write_config(&config, &config_path)?;
    } else {
        copy_default_config(mod_path)?;
        toggle_mod(mod_path, local_db, enabled, recursive)?;
    }
    if recursive {
        let local_mod = read_local_mod(&mod_path.join("manifest.json"))?;
        if let Some(deps) = local_mod.manifest.dependencies {
            for dep in deps.iter() {
                let dep_mod = local_db.get_mod(dep);
                if let Some(dep_mod) = dep_mod {
                    toggle_mod(
                        &PathBuf::from(&dep_mod.mod_path),
                        local_db,
                        enabled,
                        recursive,
                    )?;
                }
            }
        }
    }
    Ok(())
}
