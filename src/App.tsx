import { useState, useEffect, useRef } from "react";
import "./App.css";
import { createInitFiles, readMemo, saveMemo } from "./func.tsx";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { register } from "@tauri-apps/plugin-global-shortcut";
import clipboard from "tauri-plugin-clipboard-api";

function App() {
  const appWindow = getCurrentWindow();
  const [isTop, setIsTop] = useState<boolean>(false);
  const [saveTimeStr, setSaveTimeStr] = useState<string>("");
  const [textAreaContent, setTextAreaContent] = useState<string>("");
  const [selectedTabNo, setSelectedTabNo] = useState<number>(0);
  const refPrevClipboard = useRef<string>("");
  const tmpList1: string[] = [];
  const tmpList2: string[] = [];
  const tmpList3: string[] = [];
  const tmpList4: string[] = [];
  const refClipboards = useRef<string[]>(tmpList1);
  const [clipboards, setClipboards] = useState<string[]>(tmpList2);
  const refPrevClipboardImageStr = useRef<string>("");
  const refClipboardsImageStr = useRef<string[]>(tmpList3);
  const [clipboardsImageStr, setClipboardsImageStr] =
    useState<string[]>(tmpList4);
  const refIsTop = useRef(false);
  refIsTop.current = isTop;
  const refTextArea = useRef<HTMLTextAreaElement>(null!);
  const TAB_MEMO = 0;
  const TAB_CLIPBOARD = 1;

  const keyEventListener = (e: KeyboardEvent) => {
    if (e.ctrlKey) {
      if (e.keyCode === 84) {
        //T
        appWindow.setAlwaysOnTop(!refIsTop.current);
        setIsTop(!refIsTop.current);
      } else if (e.keyCode === 83) {
        //S
        saveMemo(refTextArea.current.value);
        const d = new Date();
        setSaveTimeStr(
          `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()} saved`,
        );
      }
    }
    if (e.metaKey) {
      if (e.keyCode === 83) {
        //S
        saveMemo(refTextArea.current.value);
        const d = new Date();
        setSaveTimeStr(
          `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()} saved`,
        );
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
    clipboard.startMonitor();

    clipboard.onClipboardUpdate(async () => {
      if (await clipboard.hasText()) {
        const text = await clipboard.readText();
        if (!refClipboards.current.includes(text)) {
          //base64のimage/pngは飛ばす
          if (!text.includes("data:image/png;base64,")) {
            refPrevClipboard.current = text;
            setClipboards([...refClipboards.current, text]);
            refClipboards.current.push(text);
          }
        }
      } else if (await clipboard.hasImage()) {
        const base64img = await clipboard.readImageBase64();
        const src = "data:image/png;base64," + base64img;
        if (!refClipboardsImageStr.current.includes(src)) {
          refPrevClipboardImageStr.current = src;
          setClipboardsImageStr([...refClipboardsImageStr.current, src]);
          refClipboardsImageStr.current.push(src);
        }
      }
    });
    (async () => {
      createInitFiles();
      registerShortCuts();
      //メモファイルの内容読込
      const content = await readMemo();
      setTextAreaContent(content);
    })();
  }, []);

  const onClickClipboard = (index: number) => {
    clipboard.writeText(clipboards[index]);
    setSaveTimeStr(`copied`);
  };

  const onClickClipboardImage = (index: number) => {
    clipboard.writeText(clipboardsImageStr[index]);
    setSaveTimeStr(`copied`);
  };

  return (
    <main className="w-full h-[calc(100vh-20px)] flex flex-col justify-start text-left overflow-scroll hidden-scrollbar">
      <ul className="flex flex-wrap text-sm font-medium text-center border-b border-gray-700 text-gray-400">
        <li className="me-2">
          <a
            onClick={() => {
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
            onClick={() => {
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
        <div className="">
          <button
            className="px-4 py-2 bg-white text-black mt-2 ml-2 mb-4 rounded-sm"
            onClick={() => {
              setClipboards([]);
              refPrevClipboard.current = "";
              refClipboards.current = [];
              setClipboardsImageStr([]);
              refPrevClipboardImageStr.current = "";
              refClipboardsImageStr.current = [];
              clipboard.clear();
            }}
          >
            clear
          </button>
          {clipboards.map((s, index) => (
            <div
              key={index}
              className="p-2 m-2 bg-[#ffffffb0] text-black rounded-md"
              onClick={() => {
                onClickClipboard(index);
              }}
            >
              <p key={index}>{s}</p>
              <br></br>
            </div>
          ))}
          {clipboardsImageStr.map((s, index) => (
            <div
              key={index}
              className="p-2 m-2 bg-[#ffffffb0] flex flex-row justify-center rounded-md"
              onClick={() => {
                onClickClipboardImage(index);
              }}
            >
              <img src={s} key={index} />
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
