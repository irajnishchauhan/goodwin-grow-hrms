import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Goodwin Grow HRMS | Workforce & Payroll Portal",
    template: "%s | Goodwin Grow HRMS",
  },
  description: "Enterprise HRMS, Attendance, Leave Management & Statutory Payroll System",
  icons: {
    icon: [
      { url: "/goodwin-logo.png", type: "image/png" },
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: "/goodwin-logo.png",
    apple: "/goodwin-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/goodwin-logo.png" type="image/png" />
        <link rel="shortcut icon" href="/goodwin-logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/goodwin-logo.png" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
