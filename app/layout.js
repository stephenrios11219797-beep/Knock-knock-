import "./globals.css";

export const metadata = {
  title: "Knock Knock",
  description: "Field sales mapping app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="h-screen w-full overflow-hidden">
        {/* App Content */}
        <div className="h-full w-full pb-16">
          {children}
        </div>

        {/* Bottom Navigation */}
        <MainNav />
      </body>
    </html>
  );
}
