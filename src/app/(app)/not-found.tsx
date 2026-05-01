import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
      <FileQuestion className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-lg font-semibold">페이지를 찾을 수 없습니다</h2>
      <p className="text-sm text-muted-foreground max-w-md">
        이동하려는 페이지가 존재하지 않거나, 접근 권한이 없습니다.
      </p>
      <div className="flex gap-2">
        <Link href="/dashboard">
          <Button variant="default">대시보드로</Button>
        </Link>
        <Link href="/today">
          <Button variant="outline">오늘 할 일</Button>
        </Link>
      </div>
    </div>
  );
}
