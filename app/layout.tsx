import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpeakFlow — Talk your way to better English",
  description: "Practice English conversation and mock interviews question-by-question, with live transcription and real AI feedback after every answer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
