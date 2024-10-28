import type { PagesFunction } from "@cloudflare/workers-types";

interface Env {
  DASHSCOPE_API_KEY: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (context.request.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const { prompt } = await context.request.json();

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const APP_ID = '2f2f0b3085bd4545a4dd546c9074c857';

    const response = await fetch(
      `https://dashscope.aliyuncs.com/api/v1/apps/${APP_ID}/completion`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${context.env.DASHSCOPE_API_KEY}`,
          'Content-Type': 'application/json',
          'X-DashScope-SSE': 'enable',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          input: {
            prompt: prompt
          },
          parameters: {
            incremental_output: true,
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DashScope API error: ${error}`);
    }

    // 直接转发流式响应
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...corsHeaders
      }
    });

  } catch (error) {
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
};
