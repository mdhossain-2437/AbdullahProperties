use reqwest::Url;
use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::{Path, PathBuf},
    time::Duration,
};
use tauri::{AppHandle, Manager};
use uuid::Uuid;
use windows::{
    core::PCWSTR,
    Win32::{
        Foundation::{LocalFree, HLOCAL},
        Security::Cryptography::{
            CryptProtectData, CryptUnprotectData, CRYPTPROTECT_UI_FORBIDDEN, CRYPT_INTEGER_BLOB,
        },
    },
};
use zeroize::{Zeroize, ZeroizeOnDrop, Zeroizing};

const CREDENTIAL_FILE_NAME: &str = "office-device-session-v1.bin";
const DPAPI_ENTROPY: &[u8] = b"Abdullah Properties Office device credential v1";
const PRODUCTION_API_ORIGIN: &str =
    "https://abdullah-properties-joypurhat.zedamorello0079.chatgpt.site";
const MAX_ACTIVATION_RESPONSE_BYTES: u64 = 64 * 1024;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct DeviceActivationInput {
    api_origin: String,
    pairing_code: String,
}

#[derive(Deserialize, Zeroize, ZeroizeOnDrop)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct DeviceCredentialInput {
    api_origin: String,
    device_id: String,
    device_name: String,
    token: String,
    expires_at: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ActivationRequest<'a> {
    code: &'a str,
    platform: &'static str,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ActivationDevice {
    id: String,
    name: String,
    platform: String,
    status: String,
    expires_at: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ActivationCredential {
    scheme: String,
    token: String,
    expires_at: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ActivationResponse {
    protocol_version: u8,
    device: ActivationDevice,
    credential: ActivationCredential,
}

#[derive(Deserialize)]
struct ActivationErrorResponse {
    message: Option<String>,
}

#[derive(Serialize, Deserialize, Zeroize, ZeroizeOnDrop)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct StoredDeviceCredential {
    schema_version: u8,
    api_origin: String,
    device_id: String,
    device_name: String,
    token: String,
    expires_at: String,
    stored_at: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct DeviceCredentialStatus {
    connected: bool,
    protection: &'static str,
    api_origin: Option<String>,
    device_id: Option<String>,
    device_name: Option<String>,
    expires_at: Option<String>,
    stored_at: Option<String>,
}

impl DeviceCredentialStatus {
    fn disconnected() -> Self {
        Self {
            connected: false,
            protection: "windows-dpapi-current-user",
            api_origin: None,
            device_id: None,
            device_name: None,
            expires_at: None,
            stored_at: None,
        }
    }
}

impl StoredDeviceCredential {
    fn status(&self) -> DeviceCredentialStatus {
        DeviceCredentialStatus {
            connected: true,
            protection: "windows-dpapi-current-user",
            api_origin: Some(self.api_origin.clone()),
            device_id: Some(self.device_id.clone()),
            device_name: Some(self.device_name.clone()),
            expires_at: Some(self.expires_at.clone()),
            stored_at: Some(self.stored_at.clone()),
        }
    }

    pub(crate) fn api_origin(&self) -> &str {
        &self.api_origin
    }

    pub(crate) fn token(&self) -> &str {
        &self.token
    }
}

fn normalized_api_origin(value: &str) -> Result<String, String> {
    let mut url =
        Url::parse(value.trim()).map_err(|_| "Enter a valid Office API origin.".to_owned())?;
    if !url.username().is_empty()
        || url.password().is_some()
        || url.query().is_some()
        || url.fragment().is_some()
        || url.path() != "/"
    {
        return Err("The Office API address must be an origin without credentials, path, query, or fragment.".into());
    }
    let is_secure = url.scheme() == "https";
    let is_debug_localhost = cfg!(debug_assertions)
        && url.scheme() == "http"
        && matches!(url.host_str(), Some("localhost" | "127.0.0.1" | "::1"));
    if !is_secure && !is_debug_localhost {
        return Err(
            "The Office API requires HTTPS; HTTP is allowed only for localhost debug builds."
                .into(),
        );
    }
    url.set_path("");
    let origin = url.as_str().trim_end_matches('/').to_owned();
    if origin != PRODUCTION_API_ORIGIN && !is_debug_localhost {
        return Err(
            "This release connects only to the verified Abdullah Properties service.".into(),
        );
    }
    Ok(origin)
}

fn normalized_pairing_code(value: &str) -> Result<String, String> {
    let code = value.trim().to_ascii_uppercase();
    let bytes = code.as_bytes();
    let valid_character =
        |byte: u8| matches!(byte, b'A'..=b'H' | b'J'..=b'N' | b'P'..=b'Z' | b'2'..=b'9');
    if bytes.len() != 12
        || &bytes[0..3] != b"AP-"
        || bytes[7] != b'-'
        || !bytes[3..7].iter().copied().all(valid_character)
        || !bytes[8..12].iter().copied().all(valid_character)
    {
        return Err("Enter the complete one-time pairing code.".into());
    }
    Ok(code)
}

fn validate_input(value: &DeviceCredentialInput) -> Result<String, String> {
    let origin = normalized_api_origin(&value.api_origin)?;
    Uuid::parse_str(&value.device_id)
        .map_err(|_| "The device ID must be a valid UUID.".to_owned())?;
    let name_length = value.device_name.trim().chars().count();
    if !(2..=80).contains(&name_length) {
        return Err("The device name must contain 2 to 80 characters.".into());
    }
    if !(32..=1_024).contains(&value.token.len()) || value.token.chars().any(char::is_whitespace) {
        return Err("The one-time device token is malformed.".into());
    }
    if value.expires_at.len() > 80 || !value.expires_at.contains('T') {
        return Err("The device credential expiry is malformed.".into());
    }
    Ok(origin)
}

fn credential_path(app: &AppHandle) -> Result<PathBuf, String> {
    let directory = app
        .path()
        .app_config_dir()
        .map_err(|error| format!("The protected credential directory is unavailable: {error}"))?;
    fs::create_dir_all(&directory).map_err(|error| {
        format!("The protected credential directory could not be created: {error}")
    })?;
    Ok(directory.join(CREDENTIAL_FILE_NAME))
}

fn data_blob(value: &[u8]) -> Result<CRYPT_INTEGER_BLOB, String> {
    let length = u32::try_from(value.len())
        .map_err(|_| "The credential payload is too large.".to_owned())?;
    Ok(CRYPT_INTEGER_BLOB {
        cbData: length,
        pbData: value.as_ptr().cast_mut(),
    })
}

fn copy_and_free_blob(value: CRYPT_INTEGER_BLOB) -> Result<Vec<u8>, String> {
    if value.pbData.is_null() || value.cbData == 0 {
        if !value.pbData.is_null() {
            unsafe {
                let _ = LocalFree(Some(HLOCAL(value.pbData.cast())));
            }
        }
        return Err("Windows returned an empty protected credential.".into());
    }
    let bytes = unsafe { std::slice::from_raw_parts(value.pbData, value.cbData as usize) }.to_vec();
    unsafe {
        let _ = LocalFree(Some(HLOCAL(value.pbData.cast())));
    }
    Ok(bytes)
}

fn protect_secret(value: &[u8]) -> Result<Vec<u8>, String> {
    let input = data_blob(value)?;
    let entropy = data_blob(DPAPI_ENTROPY)?;
    let mut output = CRYPT_INTEGER_BLOB::default();
    unsafe {
        CryptProtectData(
            &input,
            PCWSTR::null(),
            Some(&entropy),
            None,
            None,
            CRYPTPROTECT_UI_FORBIDDEN,
            &mut output,
        )
    }
    .map_err(|error| format!("Windows could not protect the device credential: {error}"))?;
    copy_and_free_blob(output)
}

fn unprotect_secret(value: &[u8]) -> Result<Zeroizing<Vec<u8>>, String> {
    let input = data_blob(value)?;
    let entropy = data_blob(DPAPI_ENTROPY)?;
    let mut output = CRYPT_INTEGER_BLOB::default();
    unsafe {
        CryptUnprotectData(
            &input,
            None,
            Some(&entropy),
            None,
            None,
            CRYPTPROTECT_UI_FORBIDDEN,
            &mut output,
        )
    }
    .map_err(|_| {
        "Windows could not unlock this device credential for the current user.".to_owned()
    })?;
    Ok(Zeroizing::new(copy_and_free_blob(output)?))
}

fn write_credential(path: &Path, credential: &StoredDeviceCredential) -> Result<(), String> {
    let serialized = Zeroizing::new(
        serde_json::to_vec(credential)
            .map_err(|error| format!("The device credential could not be encoded: {error}"))?,
    );
    let protected = protect_secret(serialized.as_slice())?;
    let temporary = path.with_extension(format!("tmp-{}", Uuid::new_v4()));
    fs::write(&temporary, protected)
        .map_err(|error| format!("The protected credential could not be written: {error}"))?;
    if path.exists() {
        fs::remove_file(path).map_err(|error| {
            format!("The previous protected credential could not be rotated: {error}")
        })?;
    }
    fs::rename(&temporary, path)
        .map_err(|error| format!("The protected credential could not be finalized: {error}"))?;
    Ok(())
}

pub(crate) fn read_credential(app: &AppHandle) -> Result<Option<StoredDeviceCredential>, String> {
    let path = credential_path(app)?;
    let encrypted = match fs::read(path) {
        Ok(value) => value,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(error) => {
            return Err(format!(
                "The protected credential could not be read: {error}"
            ))
        }
    };
    let plaintext = unprotect_secret(&encrypted)?;
    let credential: StoredDeviceCredential = serde_json::from_slice(plaintext.as_slice())
        .map_err(|_| "The protected device credential is damaged.".to_owned())?;
    if credential.schema_version != 1 {
        return Err("The protected device credential uses an unsupported version.".into());
    }
    Ok(Some(credential))
}

async fn persist_device_credential(
    app: AppHandle,
    value: DeviceCredentialInput,
) -> Result<DeviceCredentialStatus, String> {
    let origin = validate_input(&value)?;
    let credential = StoredDeviceCredential {
        schema_version: 1,
        api_origin: origin,
        device_id: value.device_id.trim().to_owned(),
        device_name: value.device_name.trim().to_owned(),
        token: value.token.trim().to_owned(),
        expires_at: value.expires_at.trim().to_owned(),
        stored_at: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_err(|_| "The Windows system clock is invalid.".to_owned())?
            .as_secs()
            .to_string(),
    };
    let status = credential.status();
    tauri::async_runtime::spawn_blocking(move || {
        let path = credential_path(&app)?;
        write_credential(&path, &credential)
    })
    .await
    .map_err(|error| format!("The credential task could not finish: {error}"))??;
    Ok(status)
}

#[tauri::command]
pub(crate) async fn activate_device(
    app: AppHandle,
    value: DeviceActivationInput,
) -> Result<DeviceCredentialStatus, String> {
    let api_origin = normalized_api_origin(&value.api_origin)?;
    let pairing_code = normalized_pairing_code(&value.pairing_code)?;
    let endpoint = format!("{api_origin}/api/office/v1/devices/activate");
    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .connect_timeout(Duration::from_secs(8))
        .timeout(Duration::from_secs(20))
        .https_only(!cfg!(debug_assertions))
        .build()
        .map_err(|error| format!("The activation client could not start: {error}"))?;
    let response = client
        .post(endpoint)
        .header(reqwest::header::ACCEPT, "application/json")
        .json(&ActivationRequest {
            code: &pairing_code,
            platform: "windows",
        })
        .send()
        .await
        .map_err(|error| format!("The verified pairing service is unavailable: {error}"))?;
    if response
        .content_length()
        .is_some_and(|length| length > MAX_ACTIVATION_RESPONSE_BYTES)
    {
        return Err("The pairing service returned an oversized response.".into());
    }
    let status = response.status();
    let body = response
        .bytes()
        .await
        .map_err(|error| format!("The pairing response could not be read: {error}"))?;
    if body.len() as u64 > MAX_ACTIVATION_RESPONSE_BYTES {
        return Err("The pairing service returned an oversized response.".into());
    }
    if !status.is_success() {
        let message = serde_json::from_slice::<ActivationErrorResponse>(&body)
            .ok()
            .and_then(|value| value.message)
            .filter(|value| !value.trim().is_empty() && value.chars().count() <= 300)
            .unwrap_or_else(|| {
                "The pairing code was rejected. Generate a new code on the hosted website.".into()
            });
        return Err(message);
    }
    let activation: ActivationResponse = serde_json::from_slice(&body)
        .map_err(|_| "The pairing service returned an invalid response.".to_owned())?;
    if activation.protocol_version != 1
        || activation.device.platform != "windows"
        || activation.device.status != "active"
        || activation.credential.scheme != "Bearer"
        || activation.credential.expires_at != activation.device.expires_at
    {
        return Err("The pairing service returned an unsupported activation envelope.".into());
    }
    persist_device_credential(
        app,
        DeviceCredentialInput {
            api_origin,
            device_id: activation.device.id,
            device_name: activation.device.name,
            token: activation.credential.token,
            expires_at: activation.credential.expires_at,
        },
    )
    .await
}

#[tauri::command]
pub(crate) async fn get_device_credential_status(
    app: AppHandle,
) -> Result<DeviceCredentialStatus, String> {
    tauri::async_runtime::spawn_blocking(move || {
        read_credential(&app).map(|value| {
            value
                .as_ref()
                .map(StoredDeviceCredential::status)
                .unwrap_or_else(DeviceCredentialStatus::disconnected)
        })
    })
    .await
    .map_err(|error| format!("The credential status task could not finish: {error}"))?
}

#[tauri::command]
pub(crate) async fn remove_device_credential(
    app: AppHandle,
) -> Result<DeviceCredentialStatus, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let path = credential_path(&app)?;
        match fs::remove_file(path) {
            Ok(()) => Ok(DeviceCredentialStatus::disconnected()),
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                Ok(DeviceCredentialStatus::disconnected())
            }
            Err(error) => Err(format!(
                "The protected credential could not be removed: {error}"
            )),
        }
    })
    .await
    .map_err(|error| format!("The credential removal task could not finish: {error}"))?
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validates_https_device_credentials() {
        let input = DeviceCredentialInput {
            api_origin: PRODUCTION_API_ORIGIN.into(),
            device_id: "11111111-1111-4111-8111-111111111111".into(),
            device_name: "Joypurhat reception".into(),
            token: "x".repeat(48),
            expires_at: "2026-08-15T12:00:00.000Z".into(),
        };
        assert_eq!(validate_input(&input), Ok(PRODUCTION_API_ORIGIN.into()));
    }

    #[test]
    fn validates_short_lived_pairing_codes() {
        assert_eq!(
            normalized_pairing_code(" ap-abcd-2345 "),
            Ok("AP-ABCD-2345".into())
        );
        assert!(normalized_pairing_code("AP-0000-0000").is_err());
        assert!(normalized_pairing_code("AP-ABCD-O123").is_err());
    }

    #[test]
    fn rejects_untrusted_https_origins() {
        assert!(normalized_api_origin("https://attacker.example").is_err());
    }

    #[test]
    fn rejects_insecure_remote_origins() {
        let input = DeviceCredentialInput {
            api_origin: "http://office.example.com".into(),
            device_id: "11111111-1111-4111-8111-111111111111".into(),
            device_name: "Joypurhat reception".into(),
            token: "x".repeat(48),
            expires_at: "2026-08-15T12:00:00.000Z".into(),
        };
        assert!(validate_input(&input).is_err());
    }

    #[test]
    fn windows_dpapi_round_trip_preserves_secret_bytes() {
        let plaintext = Zeroizing::new(b"temporary-device-secret".to_vec());
        let protected = protect_secret(plaintext.as_slice()).expect("DPAPI protection should work");
        assert_ne!(protected, plaintext.as_slice());
        let restored = unprotect_secret(&protected).expect("DPAPI unprotection should work");
        assert_eq!(restored.as_slice(), plaintext.as_slice());
    }
}
