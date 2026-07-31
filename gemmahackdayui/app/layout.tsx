import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { UrlGuard } from "@/components/UrlGuard";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gemma 4 Study Companion",
  description: "Your personalized AI study companion powered by Gemma 4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.className} h-full antialiased`} suppressHydrationWarning>
      {/* Light theme base colors: slate-50 background, slate-800 text */}
      <body className="min-h-full flex bg-slate-50 text-slate-800" suppressHydrationWarning>
        <UrlGuard>
          <main className="flex-1 w-full overflow-y-auto">
            {children}
          </main>
          <Toaster richColors position="top-right" />
        </UrlGuard>
      </body>
    </html>
  );
}
