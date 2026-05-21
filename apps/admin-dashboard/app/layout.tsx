import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ParentMarry Admin",
  description: "Internal dashboard for the ParentMarry MVP",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
