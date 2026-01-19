export const metadata = {
  title: "Knock Knock, Who’s There",
  description: "Door to door sales map",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
