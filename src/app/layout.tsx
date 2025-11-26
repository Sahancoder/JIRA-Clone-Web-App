import type { Metadata } from "next";
import "./globals.css";
import AppProviders from "@/components/providers/app-providers";

export const metadata: Metadata = {
  title: "JIRA - Project Management & Collaboration",
  description: "Modern project management tool built with Next.js, Hono, and Appwrite",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-background text-foreground">
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
