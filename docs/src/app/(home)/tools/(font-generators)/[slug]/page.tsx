import { ToolPageLayout } from "../../components/ToolPageLayout";
import { FontGeneratorTool } from "../../components/FontGeneratorTool";
import { platformConfigs, platformList } from "../../components/platform-configs";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate static params for all platforms at build time
export async function generateStaticParams() {
  return platformList.map(platform => ({
    slug: `${platform.id}-font-generator`,
  }));
}

// Generate metadata dynamically based on slug
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  // Extract platform ID from slug (remove '-font-generator' suffix)
  const platformId = slug.replace("-font-generator", "");
  const platform = platformConfigs[platformId];

  if (!platform) {
    return {
      title: "Font Generator Not Found",
    };
  }

  return {
    title: `Free ${platform.displayName} | Unicode Font Styles for ${platform.name}`,
    description: platform.description,
    openGraph: {
      title: `Free ${platform.displayName}`,
      description: platform.description,
      type: "website",
      url: `https://rybbit.com/tools/${platform.id}-font-generator`,
      siteName: "Rybbit Documentation",
    },
    twitter: {
      card: "summary_large_image",
      title: `Free ${platform.displayName}`,
      description: platform.description,
    },
    alternates: {
      canonical: `https://rybbit.com/tools/${platform.id}-font-generator`,
    },
  };
}

export default async function PlatformFontGeneratorPage({ params }: PageProps) {
  const { slug } = await params;
  // Extract platform ID from slug (remove '-font-generator' suffix)
  const platformId = slug.replace("-font-generator", "");
  const platform = platformConfigs[platformId];

  // Handle invalid platform
  if (!platform) {
    notFound();
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: platform.displayName,
    description: platform.description,
    url: `https://rybbit.com/tools/${platform.id}-font-generator`,
    applicationCategory: "Utility",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Organization",
      name: "Rybbit",
      url: "https://rybbit.com",
    },
  };

  const educationalContent = (
    <>
      <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
        About {platform.name} Font Styles
      </h2>
      <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-6">
        {platform.educationalContent}
      </p>

      <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">How to Use</h3>
      <ol className="space-y-2 text-neutral-700 dark:text-neutral-300 mb-6">
        <li>
          <strong>Type your text</strong> in the input box above
        </li>
        <li>
          <strong>Browse the font styles</strong> that appear automatically
        </li>
        <li>
          <strong>Click "Copy"</strong> on any style you like
        </li>
        <li>
          <strong>Paste it</strong> into your {platform.name} posts, comments, or bio
        </li>
      </ol>

      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-6">
        <strong>Note:</strong> These fonts use Unicode characters and work across most platforms and devices. However,
        some fonts may not display correctly on older systems or certain applications.
      </p>
    </>
  );

  return (
    <ToolPageLayout
      toolSlug={`${platform.id}-font-generator`}
      title={platform.displayName}
      description={platform.description}
      badge="Free Tool"
      toolComponent={
        <FontGeneratorTool platformName={platform.name} characterLimit={platform.characterLimit} />
      }
      educationalContent={educationalContent}
      faqs={[]}
      relatedToolsCategory="social-media"
      ctaTitle="Track your social media engagement with Rybbit"
      ctaDescription="Monitor clicks, traffic sources, and content performance across all your social platforms."
      ctaEventLocation={`${platform.id}_font_generator_cta`}
      structuredData={structuredData}
    />
  );
}
