export const metadata = {
  title: "Re-entry WebMCP SDK",
  description: "A runnable WebMCP and Re-entry Host SDK preview",
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
