export const metadata = {
  title: 'Knock Knock',
  description: 'Door to door sales app',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header>
          <strong>Knock Knock</strong>
        </header>

        <main>{children}</main>
      </body>
    </html>
  );
}
