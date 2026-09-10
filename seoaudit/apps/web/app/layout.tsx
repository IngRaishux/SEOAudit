import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { CrawlProvider } from "@/lib/CrawlContext";
import { SessionProvider } from "@/components/SessionProvider";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "SEO Audit",
  description: "Analyze and optimize your website's SEO",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="cupcake" className={`${GeistSans.className} antialiased`}>
      <body>
        <SessionProvider>
          <Header />
          <CrawlProvider>{children}</CrawlProvider>
        </SessionProvider>
      </body>
    </html>
  );
}