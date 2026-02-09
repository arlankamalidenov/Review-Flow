import React from 'react';

export interface WPCredentials {
  url: string;
  username: string;
  appPassword: string;
}

export interface RenderedContent {
  rendered: string;
}

// Post statuses for start_reviews CPT
export enum ReviewStatus {
  Published = 'publish',
  Pending = 'pending',
  Draft = 'draft',
  Trash = 'trash',
}

export type ReviewFilter = ReviewStatus | 'all' | 'archive' | 'cover-lab' | 'video-reels';
export type ProjectId = 'bfisherman' | 'rbesolov';

export interface ProjectConfig {
  id: ProjectId;
  name: string;
  endpoint: string;
  mapping: {
    author: string;
    email: string;
    text: string;
    rating: string;
    photo: string;
    meta: string;
    country_iso?: string;
  };
}

export const PROJECTS: ProjectConfig[] = [
  {
    id: 'bfisherman',
    name: 'Bfisherman.no',
    endpoint: '/wp-json/wp/v2/start_reviews',
    mapping: {
      author: 'acf.student_name',
      email: 'acf.bf_email',
      text: 'acf.review_text',
      rating: 'acf.review_rating',
      photo: 'acf.review_photo',
      meta: 'acf.module_number',
      country_iso: 'acf.review_country_iso'
    }
  },
  {
    id: 'rbesolov',
    name: 'RBesolov.com',
    endpoint: '/wp-json/wp/v2/reviews-renat',
    mapping: {
      author: 'acf.review_name',
      email: 'acf.review_email', // Assuming email exists
      text: 'acf.review_message',
      rating: 'acf.review_rating',
      photo: 'acf.review_image.url',
      meta: 'acf.review_country_name',
      country_iso: 'acf.review_country_iso' // If available
    }
  }
];

export interface UnifiedReview {
  id: number;
  date: string;
  status: ReviewStatus;
  author: string;
  email: string;
  text: string;
  rating: number;
  photo: string | number | null; // URL string or ID number
  meta: string;
  country_iso?: string;
  originalData: any; // Keep the original response for specialized processing
}

// ACF fields structure for start_reviews
export interface StartReviewACF {
  student_name: string;
  bf_email: string;
  review_text: string;
  review_rating: number;
  module_number: string;
  review_country_iso: string;
  review_photo?: number | false;
}

// Main start_reviews post type
export interface StartReview {
  id: number;
  date: string;
  status: ReviewStatus;
  title: { rendered: string };
  acf: StartReviewACF;
}

export interface SidebarLink {
  label: string;
  icon: React.ReactNode;
  statusFilter: ReviewStatus | 'all';
}