import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "BBDFi - Buy, Borrow, Die | DeFi Edition",
  description:
    "The wealth strategy of billionaires, now accessible to everyone. Deposit crypto, borrow USDC, never sell.",
  keywords: [
    "DeFi",
    "AAVE",
    "Buy Borrow Die",
    "USDC",
    "Base",
    "Crypto",
    "Lending",
  ],
  openGraph: {
    title: "BBDFi - Buy, Borrow, Die",
    description: "The wealth strategy of billionaires, now accessible to everyone.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800&family=Sora:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

