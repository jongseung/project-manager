"use client";

import { useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import { BlockNoteView } from "@blocknote/shadcn";
import { useCreateBlockNote } from "@blocknote/react";
import type { Block } from "@blocknote/core";
import "@blocknote/shadcn/style.css";

interface BlockEditorProps {
  content: string;
  onChange: (content: string) => void;
  editable?: boolean;
  taskId?: string;
}

export function BlockEditor({ content, onChange, editable = true, taskId }: BlockEditorProps) {
  const { resolvedTheme } = useTheme();
  const initialContent = useMemo(() => {
    if (!content) return undefined;
    try {
      return JSON.parse(content) as Block[];
    } catch {
      return [{ type: "paragraph", content: content }] as unknown as Block[];
    }
  }, []);

  const uploadFile = useMemo(() => {
    return async (file: File): Promise<string> => {
      // 서버 업로드 없이 base64로 바로 에디터에 표시
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    };
  }, []);

  const editor = useCreateBlockNote({ initialContent, uploadFile });

  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      const blocks = editor.document;
      onChange(JSON.stringify(blocks));
    };
    editor.onEditorContentChange(handler);
  }, [editor, onChange]);

  return (
    <div className="min-h-[120px] max-h-[360px] overflow-y-auto rounded-md border bn-small bg-background">
      <style>{`.bn-small .bn-editor { font-size: 13px; background: transparent !important; } .bn-small .bn-block-content { padding: 2px 0; } .bn-small .bn-container { background: transparent !important; } .bn-small .bn-default-styles { background: transparent !important; }`}</style>
      <BlockNoteView editor={editor} editable={editable} theme={resolvedTheme === "dark" ? "dark" : "light"} />
    </div>
  );
}
