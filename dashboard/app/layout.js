import "./globals.css";

export const metadata = {
  title: "Content Dashboard",
  description: "Daily LinkedIn / X content, images, and posting status.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
