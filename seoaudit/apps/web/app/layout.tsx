import type { Metadata } from "next";
import "./globals.css";
import { CrawlProvider } from "@/lib/CrawlContext";
import { SessionProvider, Toaster } from "@seo-optimizer/ui";
import { Header } from "@/components/Header";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { getRequestLanguage } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "SEO Audit",
  description: "Analyze and optimize your website's SEO",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = await getRequestLanguage();

  return (
    <html lang={lang} data-theme="cupcake" className="antialiased">
      <body>
        <LanguageProvider initialLanguage={lang}>
          <SessionProvider>
            <Header />
            <CrawlProvider>{children}</CrawlProvider>
          </SessionProvider>
          <Toaster />
        </LanguageProvider>
      </body>
    </html>
  );
}