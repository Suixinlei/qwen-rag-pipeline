import type { PagesFunction } from "@cloudflare/workers-types";
import { Env } from "../utils/types";
import { CORS_HEADERS } from "../utils/constant";
import { createChatPipeline } from "../utils/chat-pipeline";

interface SummaryData {
  data: {
    text: string;
    answerId: string;
    firstTokenCostTime: number;
    debugInfo: {
      raw: string;
      deltaCostTime: number;
    };
  };
  success: boolean;
}

interface SourceData {
  output: {
    thoughts: Array<{
      response: string;
    }>;
    session_id: string;
    finish_reason: string;
    text?: string;
  };
  usage: Record<string, any>;
  request_id: string;
}

interface NodeResponse {
  nodeType: string;
  nodeStatus: string;
  nodeId: string;
  nodeResult?: string;
  nodeExecTime?: string;
}

interface NodeResult {
  result: string;
}

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

  let alreadySentSessionId = false;
  const startTime = Date.now();
  let firstTokenTime: number | null = null;

  // 创建转换流
  const transformer = new TransformStream({
    transform(chunk: Uint8Array, controller) {
      try {
        // 确保 chunk 是 Uint8Array 类型
        const text =
          typeof chunk === "string" ? chunk : new TextDecoder().decode(chunk);

        const messages = text.split("\n\n");

        for (const message of messages) {
          if (!message.trim()) continue;

          // 解析消息中的各个字段
          const messageLines = message.split("\n");

          for (const line of messageLines) {
            if (line.startsWith("data:")) {
              if (firstTokenTime === null) {
                firstTokenTime = Date.now() - startTime;
              }

              const jsonData: SourceData = JSON.parse(line.slice(5));

              console.log('jsonData', jsonData);

              if (!session_id && !alreadySentSessionId) {
                const session_id = jsonData.output.session_id;

                controller.enqueue(
                  new TextEncoder().encode(
                    `data: ${JSON.stringify({
                      type: "session_id",
                      session_id,
                    })}\n\n`
                  )
                );
                alreadySentSessionId = true;
              }

              // 获取最后一条 executing 状态的思维链
              console.log("----------------------");
              console.log("jsonData", jsonData.output);
              console.log("----------------------");

              if (Array.isArray(jsonData.output.thoughts)) {
                const assistantThought = jsonData.output.thoughts
                  .find((thought) => {
                    try {
                      const parsedResponse = JSON.parse(
                        thought.response
                      ) as NodeResponse;
                      return parsedResponse.nodeId === "LLM_QNLs";
                    } catch {
                      return false;
                    }
                  });

                if (assistantThought) {
                  try {
                    const parsedResponse = JSON.parse(
                      assistantThought.response
                    ) as NodeResponse;
                    if (parsedResponse.nodeResult) {
                      const nodeResult = JSON.parse(
                        parsedResponse.nodeResult
                      ) as NodeResult;

                      // 构造转换后的数据
                      const transformed: string = JSON.stringify({
                        data: {
                          text: nodeResult.result,
                        },
                        success: true,
                      });

                      // 发送转换后的数据
                      controller.enqueue(
                        new TextEncoder().encode(`data: ${transformed}\n\n`)
                      );
                    }
                  } catch (error) {
                    console.error("Parse nodeResult error:", error);
                  }
                }
              }

              if (jsonData.output.text) {
                try {
                  const result = JSON.parse(jsonData.output.text);
                  console.log('result', result);
                  if (result.summary) {
                    controller.enqueue(
                      new TextEncoder().encode(
                        `data: ${JSON.stringify({
                          type: 'summary',
                          summary: result.summary,
                        })}\n\n`
                      )
                    );
                  }
                } catch {
                  // ignore
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Transform error:", error);
      }
    },
    flush(controller) {
      // 发送结束标记
      controller.enqueue(new TextEncoder().encode("data: [done]\n\n"));
    },
  });

  try {
    // 获取上游 API 的 SSE 数据
    const llmResponse = await createChatPipeline(
      "e2a2b9829c8646b0b7ce9c255d525817",
      context.env.DASHSCOPE_API_KEY,
      prompt,
      session_id
    );

    // 创建响应
    const transformedResponse = new Response(
      llmResponse.pipeThrough(transformer), // 通过转换流处理数据
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
