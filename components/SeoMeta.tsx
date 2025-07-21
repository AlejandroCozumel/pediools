import Head from 'next/head';

interface SeoMetaProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  extraMeta?: React.ReactNode;
}

const DEFAULT_IMAGE = 'https://www.pedimath.com/og-image.jpg';
const DEFAULT_URL = 'https://www.pedimath.com';

export default function SeoMeta({
  title,
  description,
  image = DEFAULT_IMAGE,
  url = DEFAULT_URL,
  extraMeta,
}: SeoMetaProps) {
  const defaultJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "PediMath",
    "url": url,
    "description": description,
    "image": image,
  };
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(defaultJsonLd) }} />
      {/* Extra meta tags if needed */}
      {extraMeta}
    </Head>
  );
}