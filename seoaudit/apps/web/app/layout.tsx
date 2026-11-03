import type { Metadata } from "next";
import "./globals.css";
import { CrawlProvider } from "@/lib/CrawlContext";
import { SessionProvider, Toaster } from "@seo-optimizer/ui";
import { Header } from "@/components/Header";
import { cookies, headers } from "next/headers";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { LANDING_LANGUAGE_HEADER, LANGUAGE_COOKIE, resolveLanguage } from "@/lib/i18n/language";

export const metadata: Metadata = {
  title: "SEO Audit",
  description: "Analyze and optimize your website's SEO",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const lang = resolveLanguage(
    requestHeaders.get(LANDING_LANGUAGE_HEADER),
    (await cookies()).get(LANGUAGE_COOKIE)?.value,
    requestHeaders.get("accept-language")
  );

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