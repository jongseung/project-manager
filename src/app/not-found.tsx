import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 text-center bg-background">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <h2 className="text-xl font-semibold">페이지를 찾을 수 없습니다</h2>
      <p className="text-sm text-muted-foreground max-w-md">
        주소를 다시 확인하거나, 홈으로 돌아가 주세요.
      </p>
      <Link href="/">
        <Button>홈으로</Button>
      </Link>
    </div>
  );
}
