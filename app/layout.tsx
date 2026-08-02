import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Community | CyclePlate",
  description:
    "A place to talk about your cycle, ask questions, and hear from women who have been through the same thing. Anonymous by default, moderated with love.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-cream antialiased">{children}</body>
    </html>
  );
}
