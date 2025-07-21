import { Metadata } from "next";

const SITE_CONFIG = {
  siteName: "PediMath",
  baseUrl: "https://www.pedimath.com",
  defaultImage: "https://www.pedimath.com/og-image.jpg",
  author: "Alejandro Zamora",
  twitterHandle: "@alejadro_zamora",
  supportedLocales: ["en", "es"],
  themeColor: "#2563eb",
  backgroundColor: "#ffffff",
  medicalDisclaimer: "For educational purposes only. Always consult with healthcare professionals.",
  // socialMedia: {
  //   twitter: "https://twitter.com/pedimath",
  //   facebook: "https://www.facebook.com/pedimath",
  //   instagram: "https://www.instagram.com/pedimath",
  //   linkedin: "https://www.linkedin.com/company/pedimath",
  //   youtube: "https://www.youtube.com/@pedimath",
  // },
} as const;

interface SeoMetadataOptions {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  locale?: string;
  calculator?: string;
  noIndex?: boolean;
}

export function getSeoMetadata({
  title,
  description,
  keywords = [],
  image,
  url = "https://www.pedimath.com",
  locale = "en",
  calculator,
  noIndex = false,
}: SeoMetadataOptions): Metadata {
  // Enhanced title with site branding
  const fullTitle = title.includes(SITE_CONFIG.siteName) ? title : `${title} - ${SITE_CONFIG.siteName}`;

  // Use provided image or default
  const ogImage = image || SITE_CONFIG.defaultImage;
  const fullImageUrl = ogImage.startsWith("http") ? ogImage : `https://www.pedimath.com${ogImage}`;

  // Medical-specific keywords
  const medicalKeywords = [
    "pediatric calculator",
    "medical calculator",
    "healthcare tools",
    "pediatrics",
    "child health",
    ...keywords
  ];

  // Build alternate language URLs for the same page
  const alternateUrls = SITE_CONFIG.supportedLocales.reduce((acc, loc) => {
    // Extract the path from the URL and rebuild with different locale
    const urlPath = url.replace("https://www.pedimath.com", '');
    let altUrl;

    if (urlPath === '/' || urlPath === '') {
      // Home page
      altUrl = loc === "en" ? "/" : `/${loc}`;
    } else {
      // Other pages - handle locale switching
      const pathWithoutLocale = urlPath.replace(/^\/(en|es)/, '') || '';
      altUrl = loc === "en" ? pathWithoutLocale : `/${loc}${pathWithoutLocale}`;
    }

    acc[loc] = `https://www.pedimath.com${altUrl}`;
    return acc;
  }, {} as Record<string, string>);

  return {
    title: fullTitle,
    description,
    keywords: medicalKeywords,
    authors: [{ name: SITE_CONFIG.author }],
    creator: SITE_CONFIG.author,
    publisher: SITE_CONFIG.siteName,

    icons: {
      icon: [
        { url: "/pedimathLogo.svg", type: "image/svg+xml" },
        { url: "/favicon.ico", type: "image/x-icon" },
      ],
      shortcut: "/pedimathLogo.svg",
    },
    // Open Graph
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_CONFIG.siteName,
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale,
      type: "website",
    },

    // Twitter
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [fullImageUrl],
      creator: SITE_CONFIG.twitterHandle,
    },

    // Robots
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    },

    // Language alternates
    alternates: {
      canonical: url,
      languages: alternateUrls,
    },

    // Enhanced meta tags
    other: {
      "application-name": SITE_CONFIG.siteName,
      "apple-mobile-web-app-title": SITE_CONFIG.siteName,
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "default",
      "format-detection": "telephone=no",
      "mobile-web-app-capable": "yes",
      "theme-color": SITE_CONFIG.themeColor,
      "msapplication-TileColor": SITE_CONFIG.themeColor,
      "msapplication-config": "/browserconfig.xml",
      referrer: "origin-when-cross-origin",

      // Medical/Healthcare specific
      "medical-disclaimer": SITE_CONFIG.medicalDisclaimer,
      "content-type": "medical-calculator",
      ...(calculator && { "calculator-type": calculator }),
    },

    // Add verification tags when you have them
    verification: {
      google: "your-google-verification-code",
      // yandex: "your-yandex-verification-code",
      // yahoo: "your-yahoo-verification-code",
      // other: {
      //   "msvalidate.01": "your-bing-verification-code",
      // },
    },
  };
}