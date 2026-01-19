export const metadata = {
  title: "Knock Knock",
  description: "Knock knock app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
