import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RightSpot | Rental workflow workspace",
  description: "A bounded rental workflow demo with clear human control.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
