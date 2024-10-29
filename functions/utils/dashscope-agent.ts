import type { PagesFunction } from "@cloudflare/workers-types";
import { Env } from './types';
import { createDashScopeRequest } from './dashscope-request-completion';

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function createErrorResponse(error: Error, corsHeaders: Record<string, string>) {
  return new Response(
    JSON.stringify({ error: error.message }),
    {
      status: error.message === 'Method not allowed' ? 405 : 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  );
}

export function createWorker(appId: string): PagesFunction<Env> {
  return async (context) => {
    if (context.request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    try {
      if (context.request.method !== 'POST') {
        throw new Error('Method not allowed');
      }

      const { prompt } = await context.request.json();

      if (!prompt) {
        throw new Error('Prompt is required');
      }

      const response = await createDashScopeRequest(
        appId,
        context.env.DASHSCOPE_API_KEY,
        prompt
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`DashScope API error: ${error}`);
      }

      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          ...CORS_HEADERS
        }
      });

    } catch (error) {
      return createErrorResponse(error, CORS_HEADERS);
    }
  };
}