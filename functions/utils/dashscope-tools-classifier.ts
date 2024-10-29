interface ClassifierResponse {
  subject: string;
  error?: string;
}

export async function getClassification(prompt: string, apiKey: string): Promise<ClassifierResponse> {
  const APP_ID = '98de7b041d5943a5804a152485ce69f7';

  try {
    const response = await fetch(
      `https://dashscope.aliyuncs.com/api/v1/apps/${APP_ID}/completion`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: {
            prompt: prompt
          },
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DashScope API error: ${error}`);
    }

    const data = await response.json();

    return JSON.parse(data?.output?.text);

  } catch (error) {
    return {
      subject: '',
      error: error.message
    };
  }
}