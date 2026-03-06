import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import ServiceWorkerRegister from '@/components/common/ServiceWorkerRegister';
import UpdateChecker from '@/components/common/UpdateChecker';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EduBrain - 초등교사 업무·법률 AI 자문',
  description: '공식 사이트 5곳+ 교차검증으로 정확한 교육법령·업무 답변을 제공하는 AI 시스템',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'EduBrain',
  },
  icons: {
    icon: '/icon-192.svg',
    apple: '/icon-192.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#3b82f6',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}>
        <ServiceWorkerRegister />
        <UpdateChecker />
        <Sidebar />
        <main className="lg:ml-64 min-h-screen p-4 lg:p-8 pt-16 lg:pt-8">
          {children}
        </main>
      </body>
    </html>
  );
}
