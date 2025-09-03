const config = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000'),
    retryAttempts: 3,
  },
  poll: {
    maxOptions: parseInt(process.env.NEXT_PUBLIC_MAX_POLL_OPTIONS || '10'),
    minOptions: parseInt(process.env.NEXT_PUBLIC_MIN_POLL_OPTIONS || '2'),
    maxTitleLength: parseInt(process.env.NEXT_PUBLIC_MAX_TITLE_LENGTH || '200'),
    minTitleLength: parseInt(process.env.NEXT_PUBLIC_MIN_TITLE_LENGTH || '10'),
    maxDescriptionLength: parseInt(process.env.NEXT_PUBLIC_MAX_DESCRIPTION_LENGTH || '500'),
    defaultExpiryHours: parseInt(process.env.NEXT_PUBLIC_DEFAULT_EXPIRY_HOURS || '24'),
    maxExpiryDays: parseInt(process.env.NEXT_PUBLIC_MAX_EXPIRY_DAYS || '7'),
    minExpiryMinutes: parseInt(process.env.NEXT_PUBLIC_MIN_EXPIRY_MINUTES || '5'),
  },
  ui: {
    animationDuration: parseInt(process.env.NEXT_PUBLIC_ANIMATION_DURATION || '300'),
    toastDuration: parseInt(process.env.NEXT_PUBLIC_TOAST_DURATION || '5000'),
    pageSize: parseInt(process.env.NEXT_PUBLIC_PAGE_SIZE || '10'),
    skeletonCount: parseInt(process.env.NEXT_PUBLIC_SKELETON_COUNT || '3'),
  },
  features: {
    qrCodeEnabled: process.env.NEXT_PUBLIC_QR_CODE_ENABLED !== 'false',
    multipleVotesEnabled: process.env.NEXT_PUBLIC_MULTIPLE_VOTES_ENABLED !== 'false',
    authRequired: process.env.NEXT_PUBLIC_AUTH_REQUIRED !== 'false',
    analyticsEnabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true',
    darkModeEnabled: process.env.NEXT_PUBLIC_DARK_MODE_ENABLED !== 'false',
  },
  seo: {
    siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'ALX Polly',
    siteDescription: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Create and vote on polls with real-time results',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://alx-polly.vercel.app',
    twitterHandle: process.env.NEXT_PUBLIC_TWITTER_HANDLE || '@alxpolly',
  },
  analytics: {
    googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID,
    hotjarId: process.env.NEXT_PUBLIC_HOTJAR_ID,
  },
} as const;

// Type-safe config access
export type Config = typeof config;
export type ApiConfig = Config['api'];
export type PollConfig = Config['poll'];
export type UIConfig = Config['ui'];
export type FeatureFlags = Config['features'];

// Helper functions
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isBrowser = typeof window !== 'undefined';

// Feature flag helper
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return config.features[feature];
}

// API endpoint builder
export function buildApiUrl(endpoint: string): string {
  return `${config.api.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
}

export default config;
