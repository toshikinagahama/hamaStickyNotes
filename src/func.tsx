import {
  exists,
  mkdir,
  create,
  readTextFile,
  BaseDirectory,
} from "@tauri-apps/plugin-fs";

export const readMemo = async () => {
  const content: string = await readTextFile(
    "hama_sticky_notes/memos/tmp.txt",
    {
      baseDir: BaseDirectory.Home,
    },
  );
  return content;
};

export const createInitFiles = async () => {
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
    //ファイル保存ディレクトリ
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
      await file.write(new TextEncoder().encode(""));
      await file.close();
    }
  }
};

export const saveMemo = async (content: string) => {
  {
    const file = await create("hama_sticky_notes/memos/tmp.txt", {
      baseDir: BaseDirectory.Home,
    });
    await file.write(new TextEncoder().encode(content));
    await file.close();
  }
};
