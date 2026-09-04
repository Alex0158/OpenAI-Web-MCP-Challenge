import "./globals.css";

export const metadata = {
  title: "Re-entry SDK Playground",
  description: "A test-only playground for Re-entry SDK workflows.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
