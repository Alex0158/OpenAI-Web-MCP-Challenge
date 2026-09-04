import "./globals.css";

export const metadata = {
  title: "Re-entry SDK Test App",
  description: "Test-only Re-entry consent integration.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
