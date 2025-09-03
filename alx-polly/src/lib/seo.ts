import { Metadata } from 'next';
import config from '@/lib/config';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  keywords?: string[];
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

export function generateMetadata({
  title,
  description = config.seo.siteDescription,
  image,
  url,
  type = 'website',
  keywords = [],
  author,
  publishedTime,
  modifiedTime,
}: SEOProps = {}): Metadata {
  const fullTitle = title ? `${title} | ${config.seo.siteName}` : config.seo.siteName;
  const fullUrl = url ? `${config.seo.siteUrl}${url}` : config.seo.siteUrl;
  const imageUrl = image ? `${config.seo.siteUrl}${image}` : `${config.seo.siteUrl}/og-image.png`;

  return {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    authors: author ? [{ name: author }] : undefined,
    creator: config.seo.siteName,
    publisher: config.seo.siteName,
    
    // Open Graph
    openGraph: {
      type,
      title: fullTitle,
      description,
      url: fullUrl,
      siteName: config.seo.siteName,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },
    
    // Twitter
    twitter: {
      card: 'summary_large_image',
      site: config.seo.twitterHandle,
      creator: config.seo.twitterHandle,
      title: fullTitle,
      description,
      images: [imageUrl],
    },
    
    // Additional meta tags
    other: {
      'theme-color': '#3b82f6',
      'color-scheme': 'light dark',
    },
    
    // Robots
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    
    // Verification
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      yandex: process.env.YANDEX_VERIFICATION,
      yahoo: process.env.YAHOO_VERIFICATION,
    },
  };
}

// Pre-defined metadata for common pages
export const defaultMetadata = generateMetadata();

export const createPollMetadata = generateMetadata({
  title: 'Create New Poll',
  description: 'Create engaging polls with custom options and real-time voting results',
  keywords: ['create poll', 'survey', 'voting', 'questionnaire'],
});

export const pollsListMetadata = generateMetadata({
  title: 'All Polls',
  description: 'Browse and vote on active polls from the community',
  keywords: ['polls', 'voting', 'community', 'surveys'],
});

// JSON-LD structured data
export function generatePollStructuredData(poll: {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  totalVotes: number;
  options: Array<{ id: string; text: string; voteCount: number }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': `${config.seo.siteUrl}/polls/${poll.id}`,
    name: poll.title,
    description: poll.description,
    url: `${config.seo.siteUrl}/polls/${poll.id}`,
    dateCreated: poll.createdAt,
    author: {
      '@type': 'Organization',
      name: config.seo.siteName,
    },
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/VoteAction',
      userInteractionCount: poll.totalVotes,
    },
    hasPart: poll.options.map(option => ({
      '@type': 'CreativeWork',
      name: option.text,
      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/VoteAction',
        userInteractionCount: option.voteCount,
      },
    })),
  };
}
