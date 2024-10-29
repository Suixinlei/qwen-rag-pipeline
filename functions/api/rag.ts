import type { PagesFunction } from "@cloudflare/workers-types";
import { Env } from '../utils/types';
import { CORS_HEADERS } from '../utils/constant';
import { getClassification } from '../utils/dashscope-tools-classifier';
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
    console.log('执行')
    try {
      // 1. 调用分类 API
      const classifierResponse = await getClassification(prompt, context.env.DASHSCOPE_API_KEY);

      console.log(classifierResponse.subject);

      // 将分类结果写入流
      await writer.write(
        encoder.encode(
          `data: ${JSON.stringify({
            type: "classification",
            ...classifierResponse,
          })}\n\n`
        )
      );

      // 2. 根据 subject 选择合适的 API
      let apiEndpoint: string;
      switch (classifierResponse.subject) {
        case "技术答疑类":
          apiEndpoint = "2f2f0b3085bd4545a4dd546c9074c857";
          break;
        case "需求或新功能相关":
          apiEndpoint = "05882bd08778477eaca8e09c12e09835";
          break;
        default:
          throw new Error(`Unknown subject: ${classifierResponse.subject}`);
      }

      // 3. 调用相应的 API
      const llmResponse = await createWorker(apiEndpoint, context.env.DASHSCOPE_API_KEY, prompt);

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
      console.log(error);
      // 如果发生错误，将错误信息写入流
      await writer.write(
        encoder.encode(
          `data: ${JSON.stringify({
            type: "error",
            error: error.message,
          })}\n\n`
        )
      );
    } finally {
      await writer.close();
    }
  })();

  // 等待处理完成
  context.waitUntil(processPromise);

  // 返回流式响应
  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      ...CORS_HEADERS,
    },
  });
};
