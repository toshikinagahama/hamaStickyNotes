import { useState, useEffect, useRef, BaseSyntheticEvent } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./App.css";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { exists, mkdir, create, BaseDirectory } from "@tauri-apps/plugin-fs";
import { register } from "@tauri-apps/plugin-global-shortcut";
import {
  writeText,
  readText,
  readImage,
} from "@tauri-apps/plugin-clipboard-manager";

function App() {
  const appWindow = getCurrentWindow();
  const [isTop, setIsTop] = useState<boolean>(false);
  const [saveTimeStr, setSaveTimeStr] = useState<string>("");
  const [textAreaContent, setTextAreaContent] = useState<string>("");
  const [selectedTabNo, setSelectedTabNo] = useState<number>(0);
  const refPrevClipboard = useRef<String>("");
  const refClipboards = useRef([]);
  const [clipboards, setClipboards] = useState([]);
  const refPrevClipboardImage = useRef<Image>(null);
  const refClipboardsImage = useRef([]);
  const [clipboardsImage, setClipboardsImage] = useState([]);
  const refIsTop = useRef(false);
  refIsTop.current = isTop;
  const refTextArea = useRef<HTMLTextAreaElement>(null!);
  const TAB_MEMO = 0;
  const TAB_CLIPBOARD = 1;

  function base64encode(data: Uint8Array) {
    return btoa([...data].map((n) => String.fromCharCode(n)).join(""));
  }
  function arrayBufferToBase64(buffer, callback) {
    console.log(buffer);
    const blob = new Blob([buffer], {
      type: "application/octet-binary",
    });
    const reader = new FileReader();
    reader.onload = function (evt) {
      const dataurl = evt.target.result;
      console.log(dataurl);
      console.log(dataurl.substr(dataurl.indexOf(",") + 1));
      callback(dataurl.substr(dataurl.indexOf(",") + 1));
    };
    reader.readAsDataURL(blob);
  }

  const keyEventListener = (e: KeyboardEvent) => {
    if (e.ctrlKey) {
      if (e.keyCode === 84) {
        //T
        appWindow.setAlwaysOnTop(!refIsTop.current);
        setIsTop(!refIsTop.current);
      } else if (e.keyCode === 83) {
        //S
        saveMemo();
      }
    } else if (e.key === "Escape") {
      refTextArea.current.blur();
    }

    if (e.metaKey) {
      if (e.keyCode === 83) {
        //S
        saveMemo();
      }
    }
  };

  const saveMemo = async () => {
    {
      const file = await create("hama_sticky_notes/memos/tmp.txt", {
        baseDir: BaseDirectory.Home,
      });
      file.write(new TextEncoder().encode(refTextArea.current.value));
      file.close();
    }
    const d = new Date();
    setSaveTimeStr(`${d.getHours()}:${d.getMinutes()}:${d.getSeconds()} saved`);
  };

  const onMouseDownTextArea = (e: BaseSyntheticEvent) => {
    refTextArea.current.focus();
  };

  const createInitFiles = async () => {
    {
      //ベースディレクトリ
      const dirExists = await exists("hama_sticky_notes", {
        baseDir: BaseDirectory.Home,
      });
      if (!dirExists)
        await mkdir("hama_sticky_notes", {
          baseDir: BaseDirectory.Home,
        });
    }
    {
      //ファイルほぞｎディレクトリ
      const dirExists = await exists("hama_sticky_notes/memos", {
        baseDir: BaseDirectory.Home,
      });
      if (!dirExists)
        await mkdir("hama_sticky_notes/memos", {
          baseDir: BaseDirectory.Home,
        });
    }
    {
      const fileExists = await exists("hama_sticky_notes/config.json", {
        baseDir: BaseDirectory.Home,
      });
      if (!fileExists) {
        const file = await create("hama_sticky_notes/config.json", {
          baseDir: BaseDirectory.Home,
        });
        file.write(new TextEncoder().encode("Hello world"));
        file.close();
      }
    }
  };

  const registerShortCuts = async () => {
    await register("CommandOrControl+Shift+F12", () => {
      console.log("Shortcut triggered");
      appWindow.show();
      appWindow.setFocus();
      appWindow.setAlwaysOnTop(true);
      setIsTop(true);
      refTextArea.current.focus();
    });
  };

  useEffect(() => {
    document.addEventListener("keydown", keyEventListener);

    (async () => {
      createInitFiles();
      registerShortCuts();
      setInterval(() => {
        const polling = async () => {
          try {
            const clipboard = await readText();
            if (refPrevClipboard.current != clipboard) {
              console.log(clipboard);
              refPrevClipboard.current = clipboard;
              setClipboards([...refClipboards.current, clipboard]);
              refClipboards.current.push(clipboard);
            }
          } catch {
            //const clipboard = await readImage();
            //console.log(clipboard);
            //const src =
            //  "data:image/png;charset=utf-8;base64,   " +
            //  base64encode(await clipboard.rgba());
            //if (refPrevClipboardImage.current != src) {
            //  console.log(src);
            //  refPrevClipboardImage.current = src;
            //  setClipboardsImage([...refClipboardsImage.current, src]);
            //  refClipboardsImage.current.push(src);
            //}
          }
        };
        polling();
      }, 1000);
    })();
  }, []);

  return (
    <main className="w-full h-[calc(100vh-20px)] flex flex-col justify-start text-left overflow-scroll">
      <ul className="flex flex-wrap text-sm font-medium text-center border-b border-gray-700 text-gray-400">
        <li className="me-2">
          <a
            onClick={(e) => {
              setSelectedTabNo(TAB_MEMO);
            }}
            className={`inline-block py-2 px-8 rounded-t-lg hover:bg-gray-800 hover:text-gray-300 
                ${
                  selectedTabNo === TAB_MEMO ? "bg-gray-800 text-blue-500" : ""
                }`}
          >
            Memo
          </a>
        </li>
        <li className="me-2">
          <a
            onClick={(e) => {
              setSelectedTabNo(TAB_CLIPBOARD);
            }}
            className={`inline-block py-2 px-4 rounded-t-lg hover:bg-gray-800 hover:text-gray-300 
                ${
                  selectedTabNo === TAB_CLIPBOARD
                    ? "bg-gray-800 text-blue-500"
                    : ""
                }`}
          >
            Clipboard
          </a>
        </li>
      </ul>
      {selectedTabNo === TAB_MEMO && (
        <textarea
          ref={refTextArea}
          className="w-full h-full bg-transparent outline-none overflow-scroll resize-none hidden-scrollbar"
          value={textAreaContent}
          onChange={(e) => {
            setTextAreaContent(e.target.value);
          }}
        ></textarea>
      )}
      {selectedTabNo === TAB_CLIPBOARD && (
        <div>
          <button
            className="px-4 py-2 bg-gray-800 mb-8"
            onClick={() => {
              setClipboards([]);
              refPrevClipboard.current = "";
              refClipboards.current = [];
            }}
          >
            clean
          </button>
          {clipboards.map((s, index) => (
            <div>
              <p key={index}>{s}</p>
              <br></br>
            </div>
          ))}
        </div>
      )}
      <footer className="fixed left-0 bottom-0 w-full text-xs pt-0 pl-2 bg-[#000000f0]">
        {isTop === true ? "always top" : "hideable"}| {saveTimeStr}
      </footer>
    </main>
  );
}

export default App;
