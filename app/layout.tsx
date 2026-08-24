import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpeakFlow — Talk your way to better English",
  description: "Improve your English by simply talking. Natural AI conversations and mock interviews with realtime voice.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
