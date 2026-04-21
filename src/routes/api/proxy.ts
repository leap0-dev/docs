import { createFileRoute } from '@tanstack/react-router';
import { env } from '@/lib/content';
import { coreOpenAPI } from '@/lib/openapi';

const proxy = coreOpenAPI.createProxy({
  allowedOrigins: [new URL(env.LEAP0_API_URL).origin],
});

export const Route = createFileRoute('/api/proxy')({
  server: {
    handlers: {
      GET: async ({ request }) => proxy.GET(request),
      HEAD: async ({ request }) => proxy.HEAD(request),
      PUT: async ({ request }) => proxy.PUT(request),
      POST: async ({ request }) => proxy.POST(request),
      PATCH: async ({ request }) => proxy.PATCH(request),
      DELETE: async ({ request }) => proxy.DELETE(request),
    },
  },
});
