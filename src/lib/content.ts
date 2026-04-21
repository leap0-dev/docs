import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  clientPrefix: 'LEAP0_',
  client: {
    LEAP0_API_URL: z.url().default('https://api.dev-01.leap0.dev'),
    LEAP0_SANDBOX_DOMAIN: z.string().min(1).default('sandbox.dev-01.leap0.dev'),
    LEAP0_PRESIGNED_DOMAIN: z.string().min(1).default('dev-01.leap0.app'),
    LEAP0_APP_URL: z.url().default('https://app.leap0.dev/login'),
    LEAP0_CONTACT_EMAIL: z.email().default('steven.passynkov@leap0.dev'),
    LEAP0_POSTHOG_KEY: z.string().min(1).optional(),
    LEAP0_POSTHOG_HOST: z.url().default('https://us.i.posthog.com'),
    LEAP0_POSTHOG_UI_HOST: z.url().default('https://us.posthog.com'),
  },
  runtimeEnv: {
    LEAP0_API_URL: import.meta.env.LEAP0_API_URL,
    LEAP0_SANDBOX_DOMAIN: import.meta.env.LEAP0_SANDBOX_DOMAIN,
    LEAP0_PRESIGNED_DOMAIN: import.meta.env.LEAP0_PRESIGNED_DOMAIN,
    LEAP0_APP_URL: import.meta.env.LEAP0_APP_URL,
    LEAP0_CONTACT_EMAIL: import.meta.env.LEAP0_CONTACT_EMAIL,
    LEAP0_POSTHOG_KEY: import.meta.env.LEAP0_POSTHOG_KEY,
    LEAP0_POSTHOG_HOST: import.meta.env.LEAP0_POSTHOG_HOST,
    LEAP0_POSTHOG_UI_HOST: import.meta.env.LEAP0_POSTHOG_UI_HOST,
  },
  emptyStringAsUndefined: true,
});

export const docsBaseUrl = '';
