use arboard::{Clipboard, ImageData};
use base64::prelude::*;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::Emitter;

#[tauri::command]
fn start_clipboard_monitor(app: tauri::AppHandle) {
    //クリップボード検知のライブラリを使用している。
    let clipboard = Arc::new(Mutex::new(
        Clipboard::new().expect("Failed to initialize clipboard"),
    ));

    thread::spawn(move || {
        let clipboard = clipboard.clone();
        let mut last_text: String = String::new();
        let mut last_image: Option<ImageData> = None;

        loop {
            let mut clipboard_guard = clipboard.lock().unwrap();
            if let Ok(content) = clipboard_guard.get_text() {
                if content != last_text {
                    last_text = content.clone();
                    app.emit("clipboard_text_update", content).unwrap();
                }
            }

            if let Ok(image) = clipboard_guard.get_image() {
                // 画像の取得(byteをbase64に変換するところがうまくいかず断念)
                if last_image
                    .as_ref()
                    .map_or(true, |prev| prev.bytes != image.bytes)
                {
                    last_image = Some(image.clone());
                    println!("Clipboard image detected");

                    let encoded_image = format!(
                        "data:image/png;base64,{}",
                        BASE64_STANDARD.encode(image.bytes)
                    );
                    app.emit("clipboard_image_update", encoded_image).ok();
                }
            }

            thread::sleep(Duration::from_secs(1)); // 1秒間隔でチェック
                                                   //thread::sleep(Duration::from_millis(500)); // 0.5秒間隔でチェック
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard::init())
        //.invoke_handler(tauri::generate_handler![start_clipboard_monitor])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
