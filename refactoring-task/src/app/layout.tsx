import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bitsmtiths",
  description: "Refactoring Task",
};

type TRootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: Readonly<TRootLayoutProps>) {
  return (
    <html lang="en">
      <body className="bg-white">{children}</body>
    </html>
  );
}
