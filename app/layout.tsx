import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Decision Intelligence System",
  description: "Turn signals, decisions, and feedback into organizational intelligence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
