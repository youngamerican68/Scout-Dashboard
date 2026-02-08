import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "Clawdbot Scout Tracker",
  description: "Ideas and tools suggested by Clawdbot from Twitter and Discord scouting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Sidebar />
        <main className="md:ml-64 min-h-screen bg-slate-900 p-4 pt-18 md:p-8 md:pt-8">
          {children}
        </main>
      </body>
    </html>
  );
}
