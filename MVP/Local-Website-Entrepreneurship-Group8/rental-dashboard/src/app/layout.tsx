import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Woonplek – Amsterdam Rental Dashboard",
  description: "Find and apply for rental apartments in Amsterdam",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
