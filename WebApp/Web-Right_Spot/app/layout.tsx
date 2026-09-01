import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RightSpot",
  description: "A bounded rental workflow foundation.",
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
