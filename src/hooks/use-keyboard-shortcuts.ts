"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger in inputs/textareas
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      // Cmd/Ctrl shortcuts
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case "k":
            // Handled by CommandPalette
            return;
        }
      }

      // Navigation shortcuts (no modifier)
      switch (e.key) {
        case "g":
          if (e.shiftKey) return;
          // Wait for second key
          const handleSecondKey = (e2: KeyboardEvent) => {
            document.removeEventListener("keydown", handleSecondKey);
            switch (e2.key) {
              case "t": router.push("/today"); break;
              case "s": router.push("/standup"); break;
              case "d": router.push("/dashboard"); break;
              case "w": router.push("/workspaces"); break;
              case "m": router.push("/mindmaps"); break;
            }
          };
          document.addEventListener("keydown", handleSecondKey, { once: true });
          setTimeout(() => document.removeEventListener("keydown", handleSecondKey), 1000);
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [router]);
}
