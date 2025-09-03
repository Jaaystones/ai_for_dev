import config, { isProduction, isBrowser } from '@/lib/config';

// Event types for type safety
export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, string | number | boolean>;
}

export interface PollAnalyticsEvents {
  poll_created: {
    poll_id: string;
    option_count: number;
    has_description: boolean;
    expiry_hours: number;
  };
  poll_voted: {
    poll_id: string;
    option_id: string;
    vote_method: 'click' | 'keyboard';
  };
  poll_viewed: {
    poll_id: string;
    view_duration?: number;
  };
  poll_shared: {
    poll_id: string;
    share_method: 'link' | 'qr' | 'social';
  };
}

class Analytics {
  private isEnabled: boolean;
  private events: AnalyticsEvent[] = [];

  constructor() {
    this.isEnabled = config.features.analyticsEnabled && isProduction && isBrowser;
    this.initializeGoogleAnalytics();
    this.initializeHotjar();
  }

  private initializeGoogleAnalytics() {
    if (!this.isEnabled || !config.analytics.googleAnalyticsId) return;

    // Load Google Analytics 4
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${config.analytics.googleAnalyticsId}`;
    script.async = true;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', config.analytics.googleAnalyticsId, {
      page_title: document.title,
      page_location: window.location.href,
    });
  }

  private initializeHotjar() {
    if (!this.isEnabled || !config.analytics.hotjarId) return;

    // Load Hotjar
    (function(h: any, o: any, t: any, j: any, a?: any, r?: any) {
      h.hj = h.hj || function() { (h.hj.q = h.hj.q || []).push(arguments) };
      h._hjSettings = { hjid: config.analytics.hotjarId, hjsv: 6 };
      a = o.getElementsByTagName('head')[0];
      r = o.createElement('script'); r.async = 1;
      r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
      a.appendChild(r);
    })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');
  }

  // Track custom events
  track<T extends keyof PollAnalyticsEvents>(
    eventName: T,
    properties: PollAnalyticsEvents[T]
  ): void {
    if (!this.isEnabled) {
      // Store events in development for debugging
      if (!isProduction) {
        console.log('📊 Analytics Event:', eventName, properties);
      }
      return;
    }

    // Google Analytics 4
    if (window.gtag && config.analytics.googleAnalyticsId) {
      window.gtag('event', eventName, {
        event_category: 'poll_interaction',
        ...properties,
      });
    }

    // Custom analytics endpoint (if needed)
    this.sendCustomEvent(eventName, properties);
  }

  // Track page views
  trackPageView(path: string, title?: string): void {
    if (!this.isEnabled) return;

    if (window.gtag && config.analytics.googleAnalyticsId) {
      window.gtag('config', config.analytics.googleAnalyticsId, {
        page_path: path,
        page_title: title || document.title,
      });
    }
  }

  // Track user interactions
  trackInteraction(element: string, action: string, label?: string): void {
    this.track('poll_viewed' as any, {
      poll_id: `interaction_${element}`,
    } as any);

    if (!this.isEnabled) return;

    if (window.gtag) {
      window.gtag('event', action, {
        event_category: 'user_interaction',
        event_label: label,
        custom_element: element,
      });
    }
  }

  // Track performance metrics
  trackPerformance(metric: string, value: number, unit: string = 'ms'): void {
    if (!this.isEnabled) return;

    if (window.gtag) {
      window.gtag('event', 'performance_metric', {
        event_category: 'performance',
        metric_name: metric,
        metric_value: value,
        metric_unit: unit,
      });
    }
  }

  // Track errors
  trackError(error: Error, context?: string): void {
    if (!this.isEnabled) {
      console.error('🔥 Error:', error, context);
      return;
    }

    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        custom_context: context,
        custom_stack: error.stack?.substring(0, 150), // Truncate stack trace
      });
    }
  }

  // Send events to custom analytics endpoint
  private async sendCustomEvent(eventName: string, properties: any): Promise<void> {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: eventName,
          properties,
          timestamp: new Date().toISOString(),
          session_id: this.getSessionId(),
        }),
      });
    } catch (error) {
      // Fail silently for analytics
      console.warn('Analytics event failed:', error);
    }
  }

  // Generate or retrieve session ID
  private getSessionId(): string {
    if (!isBrowser) return 'server';
    
    let sessionId = sessionStorage.getItem('analytics_session');
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session', sessionId);
    }
    return sessionId;
  }
}

// Global analytics instance
export const analytics = new Analytics();

// Convenience hooks for React components
export function useAnalytics() {
  return {
    track: analytics.track.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackInteraction: analytics.trackInteraction.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
  };
}

// TypeScript declarations for global gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
    hj: (...args: any[]) => void;
    _hjSettings: { hjid: number; hjsv: number };
  }
}
