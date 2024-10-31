import { PagesFunction } from "@cloudflare/workers-types";
import { Env } from "../utils/types";
import { CORS_HEADERS } from "../utils/constant";
import { createWorker } from "../utils/dashscope-agent";


export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (context.request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      }
    );
  }

  let requestData;
  try {
    requestData = await context.request.json();
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Invalid JSON" }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      }
    );
  }

  const { prompt } = requestData;
  if (!prompt) {
    return new Response(
      JSON.stringify({ error: "Prompt is required" }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      }
    );
  }

  // 创建 TransformStream 用于流式输出
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // 创建处理 Promise
  const processPromise = (async () => {
    try {
      // 1. 调用分类 API
      const llmResponse = await createWorker('e2a2b9829c8646b0b7ce9c255d525817', context.env.DASHSCOPE_API_KEY, prompt);
      
      // 4. 读取 API 响应流并写入我们的输出流
      const reader = llmResponse.getReader();
      if (!reader) {
        throw new Error("Failed to get reader from LLM response");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await writer.write(value);
      }
    } catch (error) {
      console.error(error);
      await writer.write(encoder.encode(JSON.stringify({ error: error.message })));
    } finally {
      writer.close();
    }
  })();

  // 等待处理完成
  context.waitUntil(processPromise);

  // 返回 Response
  return new Response(readable, {
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}