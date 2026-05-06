import { AppShell } from "@/components/layout/app-shell";
import { CommandPalette } from "@/components/command/command-palette";
import { KeyboardProvider } from "@/components/layout/keyboard-provider";
import { TodayWidget } from "@/components/today/today-widget";
import { RealtimeProvider } from "@/components/notifications/realtime-provider";
import { requireOrganization } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Enforce: has session cookie + owns an org. Redirects to /setup otherwise.
  await requireOrganization();

  return (
    <KeyboardProvider>
      <AppShell>{children}</AppShell>
      <CommandPalette />
      <TodayWidget />
      <RealtimeProvider />
    </KeyboardProvider>
  );
}
