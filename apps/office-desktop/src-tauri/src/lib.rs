mod credentials;
mod offline;
mod sync;

use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_offline_office_core",
            sql: include_str!("../migrations/0001_offline_office_core.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "align_offline_protocol_v1",
            sql: include_str!("../migrations/0002_offline_protocol_v1.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "create_device_sync_receipts",
            sql: include_str!("../migrations/0003_device_sync_receipts.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "preserve_legacy_v1_recovery_queue",
            sql: include_str!("../migrations/0004_legacy_v1_recovery.sql"),
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .manage(sync::SyncGuard::default())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:abdullah-office.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            credentials::activate_device,
            credentials::get_device_credential_status,
            credentials::remove_device_credential,
            offline::commit_offline_record,
            sync::sync_office_operations,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
