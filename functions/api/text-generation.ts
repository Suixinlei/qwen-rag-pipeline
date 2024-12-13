export const onRequest = async (context) => {
    const { request, env } = context;
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
  
    // 只允许 POST 请求
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }
  
    try {
      // 克隆请求体，因为它只能被读取一次
      const body = await request.json();
      
      // 构建发往 DashScope 的请求
      const dashscopeResponse = await fetch(
        'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.DASHSCOPE_API_KEY}`,
          },
          body: JSON.stringify(body),
        }
      );
  
      // 从 DashScope 获取响应
      const data = await dashscopeResponse.json();
  
      // 返回响应给客户端
      return new Response(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: dashscopeResponse.status,
      });
  
    } catch (error) {
      // 错误处理
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  };