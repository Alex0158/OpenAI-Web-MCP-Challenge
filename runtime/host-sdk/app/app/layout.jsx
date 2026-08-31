export const metadata = {
  title: "Continuation SDK Preview",
  description: "A polished browser preview for the WebMCP continuation SDK",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#f3f5f9", color: "#182230", fontFamily: "system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
