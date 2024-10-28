import type { PagesFunction } from "@cloudflare/workers-types";

interface DashScopeResponse {
  output: {
    text: string;
  };
  usage: {
    total_tokens: number;
  };
  request_id: string;
}

interface Env {
  DASHSCOPE_API_KEY: string;  // 在 Cloudflare Pages 中设置的环境变量
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // 处理 OPTIONS 请求
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 只接受 POST 请求
    if (context.request.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // 获取请求体
    const requestData = await context.request.json();
    const { prompt } = requestData;

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    // 调用 DashScope API
    const response = await fetch(
      'https://dashscope.aliyuncs.com/api/v1/apps/ea3a1309288342acace7347199b5a6f0/completion',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${context.env.DASHSCOPE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: {
            prompt: prompt
          },
          parameters: {},
          debug: {}
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DashScope API error: ${error}`);
    }

    const data: DashScopeResponse = await response.json();

    return new Response(
      JSON.stringify({
        text: data.output.text,
        usage: data.usage,
        request_id: data.request_id
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message
      }),
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
