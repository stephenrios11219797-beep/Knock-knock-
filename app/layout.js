import Link from "next/link";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header style={{ padding: "16px", borderBottom: "1px solid #ccc" }}>
          <Link href="/" style={{ marginRight: 12 }}>
            Home
          </Link>
          <Link href="/map">
            Map
          </Link>
        </header>

        <main style={{ padding: "16px" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
