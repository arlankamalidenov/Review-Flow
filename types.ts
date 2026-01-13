import React from 'react';

export interface WPCredentials {
  url: string;
  username: string;
  appPassword: string;
}

export interface RenderedContent {
  rendered: string;
}

export enum CommentStatus {
  Approved = 'approved',
  Hold = 'hold',
  Spam = 'spam',
  Trash = 'trash',
}

export interface WPComment {
  id: number;
  post: number;
  parent: number;
  author: number;
  author_name: string;
  author_email: string;
  author_url: string;
  author_ip: string;
  author_user_agent: string;
  date: string;
  date_gmt: string;
  content: RenderedContent;
  link: string;
  status: CommentStatus;
  type: string;
  author_avatar_urls?: Record<string, string>;
}

export interface SidebarLink {
  label: string;
  icon: React.ReactNode;
  statusFilter: CommentStatus | 'all';
}