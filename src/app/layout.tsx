import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RIIQX Content Engine — AI Growth System",
  description:
    "Multi-agent AI content automation dashboard for RIIQX streetwear. Generate trend-aligned, brand-consistent Instagram content strategies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=DM+Sans:wght@400;500;700&family=Oswald:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
