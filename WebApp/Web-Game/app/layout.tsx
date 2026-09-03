import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sleepless Kingdom",
  description: "A persistent magical frontier",
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
