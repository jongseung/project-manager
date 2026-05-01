import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: { default: "PM — 프로젝트 매니저", template: "%s | PM" },
  description: "팀의 업무를 체계적으로 관리하는 프로젝트 매니저. 칸반보드, 스프린트, OKR, 데일리 스크럼을 하나의 도구로.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "PM — 프로젝트 매니저",
    description: "팀의 업무를 체계적으로 관리하는 프로젝트 매니저",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
