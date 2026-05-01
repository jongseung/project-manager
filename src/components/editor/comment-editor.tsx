"use client";

import { useEffect, useMemo, useCallback, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { useTheme } from "next-themes";
import { BlockNoteView } from "@blocknote/shadcn";
import {
  useCreateBlockNote,
  SuggestionMenuController,
  useBlockNoteEditor,
} from "@blocknote/react";
import {
  BlockNoteSchema,
  defaultInlineContentSpecs,
  defaultBlockSpecs,
} from "@blocknote/core";
import type { Block } from "@blocknote/core";
import { filterSuggestionItems } from "@blocknote/core/extensions";
import { createReactInlineContentSpec } from "@blocknote/react";
import "@blocknote/shadcn/style.css";

// Mention inline content spec
const Mention = createReactInlineContentSpec(
  {
    type: "mention" as const,
    propSchema: {
      user: { default: "" },
      userId: { default: "" },
    },
    content: "none",
  },
  {
    render: (props) => (
      <span
        className="inline-flex items-center rounded px-1 py-0.5 text-xs font-medium bg-primary/15 text-primary"
        data-user-id={props.inlineContent.props.userId}
      >
        @{props.inlineContent.props.user}
      </span>
    ),
  }
);

const schema = BlockNoteSchema.create({
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    mention: Mention,
  },
  blockSpecs: {
    ...defaultBlockSpecs,
  },
});

export type CommentEditorRef = {
  getJSON: () => Block[];
  getPlainText: () => string;
  getMentionedUserIds: () => string[];
  clear: () => void;
  isEmpty: () => boolean;
};

interface CommentEditorProps {
  placeholder?: string;
  members?: { id: string; name: string; color: string }[];
  onSubmit?: () => void;
  readOnly?: boolean;
  initialContent?: string;
  onReady?: (api: CommentEditorRef) => void;
}

// Custom mention suggestion menu item component
function MentionSuggestionItem({ item, isSelected, onClick }: {
  item: { title: string; icon: React.ReactNode; onItemClick: () => void };
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 w-full px-2.5 py-1.5 text-xs text-left transition-colors rounded-md ${
        isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
      }`}
    >
      {item.icon}
      <span className="truncate">{item.title}</span>
    </button>
  );
}

// Custom mention suggestion menu
function MentionSuggestionMenu({ items, selectedIndex, onItemClick }: {
  items: any[];
  selectedIndex: number | undefined;
  onItemClick?: (item: any) => void;
}) {
  return (
    <div className="bg-popover border rounded-lg shadow-lg py-1 px-1 min-w-[180px] max-w-[240px] z-50">
      {items.length === 0 ? (
        <div className="px-2.5 py-1.5 text-xs text-muted-foreground">멤버를 찾을 수 없습니다</div>
      ) : (
        items.map((item, index) => (
          <MentionSuggestionItem
            key={item.title}
            item={item}
            isSelected={index === selectedIndex}
            onClick={() => onItemClick?.(item)}
          />
        ))
      )}
    </div>
  );
}

function MentionMenu({ members, menuOpenRef }: { members: { id: string; name: string; color: string }[]; menuOpenRef: React.MutableRefObject<boolean> }) {
  const editor = useBlockNoteEditor(schema);

  const getMentionItems = useCallback(
    (query: string) => {
      const items = members.map((m) => ({
        title: m.name,
        onItemClick: () => {
          editor.insertInlineContent([
            {
              type: "mention" as const,
              props: { user: m.name, userId: m.id },
            },
            " ",
          ]);
          menuOpenRef.current = false;
        },
        icon: (
          <div
            className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
            style={{ backgroundColor: m.color }}
          >
            {m.name.charAt(0)}
          </div>
        ),
      }));

      const filtered = filterSuggestionItems(items, query);
      menuOpenRef.current = filtered.length > 0;
      return Promise.resolve(filtered);
    },
    [editor, members, menuOpenRef]
  );

  return (
    <SuggestionMenuController
      triggerCharacter="@"
      getItems={getMentionItems}
      suggestionMenuComponent={MentionSuggestionMenu}
      onItemClick={(item) => item.onItemClick()}
    />
  );
}

export const CommentEditor = forwardRef<CommentEditorRef, CommentEditorProps>(
  function CommentEditor({ placeholder, members = [], onSubmit, readOnly = false, initialContent, onReady }, ref) {
    const { resolvedTheme } = useTheme();
    const mentionMenuOpenRef = useRef(false);

    const parsedContent = useMemo(() => {
      if (!initialContent) return undefined;
      try {
        const parsed = JSON.parse(initialContent);
        if (Array.isArray(parsed)) return parsed;
        return undefined;
      } catch {
        // Plain text fallback: convert to BlockNote format
        if (!initialContent.trim()) return undefined;
        const lines = initialContent.split("\n");
        const blocks: any[] = [];
        for (const line of lines) {
          const imgMatch = line.match(/\[image:(data:image\/[^\]]+)\]/);
          if (imgMatch) {
            blocks.push({
              type: "image",
              props: { url: imgMatch[1], width: 400 },
            });
          } else if (line.trim()) {
            const parts = line.split(/(@[\w-]+)/g);
            const content: any[] = [];
            for (const part of parts) {
              if (part.startsWith("@")) {
                content.push({
                  type: "mention",
                  props: { user: part.slice(1), userId: "" },
                });
              } else if (part) {
                content.push(part);
              }
            }
            blocks.push({
              type: "paragraph",
              content,
            });
          }
        }
        return blocks.length > 0 ? blocks : undefined;
      }
    }, [initialContent]);

    const uploadFile = useMemo(() => {
      return async (file: File): Promise<string> => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      };
    }, []);

    const editor = useCreateBlockNote({
      schema,
      initialContent: parsedContent,
      uploadFile,
    });

    const api = useMemo<CommentEditorRef>(() => ({
      getJSON: () => editor.document as Block[],
      getPlainText: () => {
        let text = "";
        for (const block of editor.document) {
          if (block.content && Array.isArray(block.content)) {
            for (const item of block.content as any[]) {
              if (typeof item === "string") text += item;
              else if (item.type === "text") text += item.text;
              else if (item.type === "mention") text += `@${item.props.user}`;
            }
            text += "\n";
          }
        }
        return text.trim();
      },
      getMentionedUserIds: () => {
        const ids: string[] = [];
        for (const block of editor.document) {
          if (block.content && Array.isArray(block.content)) {
            for (const item of block.content as any[]) {
              if (item.type === "mention" && item.props?.userId) {
                ids.push(item.props.userId);
              }
            }
          }
        }
        return [...new Set(ids)];
      },
      clear: () => {
        editor.replaceBlocks(editor.document, [{ type: "paragraph" }]);
      },
      isEmpty: () => {
        const doc = editor.document;
        if (doc.length === 0) return true;
        if (doc.length === 1) {
          const block = doc[0];
          if (block.type === "paragraph") {
            const content = block.content as any[] | undefined;
            if (!content || content.length === 0) return true;
          }
        }
        return false;
      },
    }), [editor]);

    useImperativeHandle(ref, () => api, [api]);

    useEffect(() => {
      onReady?.(api);
    }, [api, onReady]);

    // Handle Enter to submit (without Shift)
    // Capture phase is used so we intercept before BlockNote's own handlers
    useEffect(() => {
      if (readOnly || !onSubmit) return;
      const el = editor.domElement;
      if (!el) return;

      const handler = (e: KeyboardEvent) => {
        if (e.key === "Enter" && e.shiftKey && !e.isComposing) {
          if (mentionMenuOpenRef.current) return;
          e.preventDefault();
          e.stopPropagation();
          onSubmit();
        }
      };
      el.addEventListener("keydown", handler, true);
      return () => el.removeEventListener("keydown", handler, true);
    }, [editor, onSubmit, readOnly]);

    // Stop image paste propagation to prevent parent handler from also processing it
    useEffect(() => {
      const el = editor.domElement;
      if (!el || readOnly) return;

      const handlePaste = (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            e.stopPropagation();
            return;
          }
        }
      };
      el.addEventListener("paste", handlePaste);
      return () => el.removeEventListener("paste", handlePaste);
    }, [editor, readOnly]);

    return (
      <div className={`comment-editor-wrapper ${readOnly ? "comment-editor-readonly" : "rounded-md border"}`}>
        <style>{`
          .comment-editor-wrapper .bn-editor {
            font-size: 13px;
            line-height: 1.5;
          }
          .comment-editor-wrapper:not(.comment-editor-readonly) .bn-editor {
            min-height: 36px;
            padding: 4px 8px;
          }
          .comment-editor-readonly .bn-editor {
            min-height: auto;
            padding: 0;
          }
          .comment-editor-wrapper .bn-block-content { padding: 1px 0; }
          .comment-editor-wrapper .bn-block-group { padding-left: 0; }
          .comment-editor-wrapper .bn-side-menu { display: none; }
          .comment-editor-wrapper .bn-block-outer:first-child { margin-top: 0; }
          .comment-editor-wrapper .bn-block-outer:last-child { margin-bottom: 0; }
          .comment-editor-wrapper .bn-block-outer { margin: 0; }
          .comment-editor-wrapper .bn-image-block-content-wrapper { margin: 4px 0; }
          .comment-editor-wrapper .bn-image-block-content-wrapper img {
            max-height: ${readOnly ? "200px" : "120px"};
            border-radius: 8px;
            border: 1px solid hsl(var(--border));
          }
          .comment-editor-readonly .bn-container,
          .comment-editor-readonly .bn-default-styles {
            background: transparent !important;
          }
          .comment-editor-wrapper .bn-inline-content { line-height: 1.6; }
        `}</style>
        <BlockNoteView
          editor={editor}
          editable={!readOnly}
          theme={resolvedTheme === "dark" ? "dark" : "light"}
          sideMenu={false}
          formattingToolbar={false}
        >
          {!readOnly && members.length > 0 && (
            <MentionMenu members={members} menuOpenRef={mentionMenuOpenRef} />
          )}
        </BlockNoteView>
      </div>
    );
  }
);
