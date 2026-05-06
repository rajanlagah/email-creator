export interface FeatureCard {
  id: string;
  tag: string;
  title: string;
  description: string;
  videoUrl: string;
  ctaText: string;
  ctaUrl: string;
}

export interface FIItem {
  id: string;
  title: string;
  description: string;
}

export interface EmailData {
  monthYear: string; // "YYYY-MM" from <input type="month">
  preheader: string;
  heroHeadline: string;
  heroSubtext: string;
  featureCards: FeatureCard[];
  fiItems: FIItem[];
  ctaHeadline: string;
}
