import { Header } from "@/components/layout/header";
import { SettingsView } from "./settings-view";

export default function SettingsPage() {
  return (
    <div>
      <Header title="설정" />
      <div className="p-6 max-w-2xl mx-auto">
        <SettingsView />
      </div>
    </div>
  );
}
