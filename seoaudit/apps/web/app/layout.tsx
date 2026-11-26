import type { Metadata } from "next";
import "./globals.css";
import { CrawlProvider } from "@/lib/CrawlContext";
import { SessionProvider, Toaster } from "@seo-optimizer/ui";
import { Header } from "@/components/Header";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { getRequestLanguage, getServerTranslations } from "@/lib/i18n/server";
import { BRAND_NAME, siteUrl } from "@/lib/brand";

export async function generateMetadata(): Promise<Metadata> {
  const { home } = getServerTranslations(await getRequestLanguage());
  return {
    metadataBase: siteUrl(),
    title: { default: BRAND_NAME, template: `%s · ${BRAND_NAME}` },
    description: home.footer.tagline,
    openGraph: { siteName: BRAND_NAME, type: "website" },
  };
}

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