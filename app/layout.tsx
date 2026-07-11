import type { Metadata } from "next";
import "./globals.css";
import { DataProvider } from "@/context/DataContext";

export const metadata: Metadata = {
  title: "Fill Rate Analytics",
  description: "Dashboard de Fill Rate — 100% cliente, sin backend",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-base text-slate-200 antialiased">
        <DataProvider>{children}</DataProvider>
      </body>
    </html>
  );
}
