import posthog from 'posthog-js';
import { env } from '@/lib/content';

let initialized = false;

export function initPostHog() {
  if (initialized || typeof window === 'undefined') return posthog;

  if (!env.LEAP0_POSTHOG_KEY) return null;

  posthog.init(env.LEAP0_POSTHOG_KEY, {
    api_host: env.LEAP0_POSTHOG_HOST,
    ui_host: env.LEAP0_POSTHOG_UI_HOST,
    defaults: '2026-01-30',
    autocapture: true,
    capture_pageview: true,
    capture_pageleave: 'if_capture_pageview',
    disable_session_recording: false,
    persistence: 'localStorage+cookie',
  });

  initialized = true;
  return posthog;
}

export function getPostHog() {
  return initPostHog();
}
