import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lab Inventory & Borrowing System",
  description: "Laboratory Inventory & Borrowing Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
