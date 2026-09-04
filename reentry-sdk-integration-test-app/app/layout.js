import "./globals.css";

export const metadata = {
  title: "Re-entry SDK Integration Test",
  description: "Test-only Re-entry consent integration.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
