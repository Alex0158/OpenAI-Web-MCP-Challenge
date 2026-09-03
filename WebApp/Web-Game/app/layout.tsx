import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Sleepless Kingdom",
  description: "A persistent magical frontier",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  const content = publishableKey
    ? <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>
    : children;
  return (
    <html lang="en">
      <body>{content}</body>
    </html>
  );
}
