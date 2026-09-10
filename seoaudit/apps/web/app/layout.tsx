import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { CrawlProvider } from "@/lib/CrawlContext";
import { SessionProvider } from "@/components/SessionProvider";
import { HeaderWithOrganizations } from "@/components/HeaderWithOrganizations";

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
    <html lang="en" className={`${GeistSans.className} antialiased dark:bg-gray-950`}>
      <body>
        <SessionProvider>
          <HeaderWithOrganizations />
          <CrawlProvider>{children}</CrawlProvider>
        </SessionProvider>
      </body>
    </html>
  );
}