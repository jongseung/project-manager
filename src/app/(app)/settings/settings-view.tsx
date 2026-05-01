"use client";

import { useState, useRef } from "react";
import { Download, Upload, Keyboard } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { exportData, exportCSV } from "@/actions/export";
import { importData } from "@/actions/import";
import { toast } from "sonner";

export function SettingsView() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExportJSON() {
    setExporting(true);
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pm-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("JSON으로 내보내기 완료");
    } catch {
      toast.error("내보내기 실패");
    }
    setExporting(false);
  }

  async function handleExportCSV() {
    setExporting(true);
    try {
      const csv = await exportCSV();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pm-tasks-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV로 내보내기 완료");
    } catch {
      toast.error("내보내기 실패");
    }
    setExporting(false);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const result = await importData(text);
      if (result.success) {
        toast.success(`${result.data.imported}개 항목을 가져왔습니다`);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("가져오기 실패");
    }
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4" /> 데이터 내보내기
          </CardTitle>
          <CardDescription>백업 또는 다른 도구에서 사용하기 위해 데이터를 다운로드하세요.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button variant="outline" onClick={handleExportJSON} disabled={exporting}>
            JSON 내보내기 (전체 백업)
          </Button>
          <Button variant="outline" onClick={handleExportCSV} disabled={exporting}>
            CSV 내보내기 (태스크만)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4" /> 데이터 가져오기
          </CardTitle>
          <CardDescription>JSON 백업 파일에서 복원합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
            {importing ? "가져오는 중..." : "JSON 백업 가져오기"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Keyboard className="h-4 w-4" /> 키보드 단축키
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {[
              ["검색 / 이동", "⌘ K"],
              ["오늘 할 일로 이동", "G then T"],
              ["데일리 스크럼으로 이동", "G then S"],
              ["대시보드로 이동", "G then D"],
              ["워크스페이스로 이동", "G then W"],
              ["브레인스토밍으로 이동", "G then M"],
            ].map(([label, key]) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <kbd className="bg-muted px-2 py-0.5 rounded text-xs">{key}</kbd>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
