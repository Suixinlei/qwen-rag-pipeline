import { createDashScopeRequest } from './dashscope-request-completion';

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};


export async function createWorker(appId: string, apiKey: string, prompt: string) {
  const response = await createDashScopeRequest(
    appId,
    apiKey,
    prompt
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DashScope API error: ${error}`);
  }

  return response.body;
}