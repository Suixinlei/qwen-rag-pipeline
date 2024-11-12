import type { PagesFunction } from "@cloudflare/workers-types";
import { Env } from "../utils/types";
import { CORS_HEADERS } from "../utils/constant";
import { createChatPipeline } from "../utils/chat-pipeline";

export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (context.request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        ...CORS_HEADERS,
      },
    });
  }

  let requestData;
  try {
    requestData = await context.request.json();
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        ...CORS_HEADERS,
      },
    });
  }

  const { prompt, session_id } = requestData;
  console.log("requestData", requestData);
  if (!prompt) {
    return new Response(JSON.stringify({ error: "Prompt is required" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        ...CORS_HEADERS,
      },
    });
  }

  try {
    // 获取上游 API 的 SSE 数据
    const llmResponse = await createChatPipeline(
      "ea3a1309288342acace7347199b5a6f0",
      context.env.DASHSCOPE_API_KEY,
      prompt,
      session_id
    );

    // 创建响应
    const transformedResponse = new Response(
      llmResponse, // 通过转换流处理数据
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );

    return transformedResponse;
  } catch (error) {
    console.error("Stream error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
};
