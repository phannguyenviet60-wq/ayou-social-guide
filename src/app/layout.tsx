import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '阿柚答疑 - 社会化指南小助手',
  description:
    '小红书虚拟产品售后答疑智能助手，关于百度网盘资料的任何问题都可以来问我～',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased bg-xhs-bg text-xhs-text min-h-screen">
        {children}
      </body>
    </html>
  );
}
