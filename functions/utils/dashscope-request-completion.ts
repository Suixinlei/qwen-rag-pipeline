export async function createDashScopeRequest(
  appId: string,
  apiKey: string,
  prompt: string,
  isPipeline?: boolean
) {
  return fetch(
    `https://dashscope.aliyuncs.com/api/v1/apps/${appId}/completion`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-SSE': 'enable',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        input: {
          prompt: prompt
        },
        parameters: {
          has_thoughts: isPipeline,
          incremental_output: true,
        }
      })
    }
  );
}