export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav style={{ padding: 12, borderBottom: "1px solid #ccc" }}>
          <a href="/" style={{ marginRight: 12 }}>Home</a>
          <a href="/rep" style={{ marginRight: 12 }}>Rep</a>
          <a href="/manager">Manager</a>
        </nav>

        <main style={{ padding: 12 }}>
          {children}
        </main>
      </body>
    </html>
  );
}
