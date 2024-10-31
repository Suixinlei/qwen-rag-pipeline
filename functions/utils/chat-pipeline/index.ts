export async function createChatPipeline(appId: string, apiKey: string, prompt: string) {
  const response = await fetch(
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
          has_thoughts: true,
          incremental_output: true,
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DashScope API error: ${error}`);
  }

  return response.body;
}