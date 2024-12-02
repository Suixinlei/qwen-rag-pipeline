import type { PagesFunction } from "@cloudflare/workers-types";
import { Env } from "../utils/types";
import { CORS_HEADERS } from "../utils/constant";

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

  const { image } = requestData;

  if (!image) {
    return new Response(JSON.stringify({ error: "image is required" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        ...CORS_HEADERS,
      },
    });
  }

  try {
    const response = await fetch(`https://dashscope.aliyuncs.com/api/v1/apps/949810866e9749b59851a94de71fdfe5/completion`, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${context.env.DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ 
        input: {
          prompt: 'input ',
          bizParams: {
            image,
          },
        },
        parameters: {
          has_thoughts: false,
          incremental_output: false,
        }
       }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch from Dashscope API");
    }

    const responseJson = await response.json();

    const result = JSON.parse(responseJson.output.text);

    // 将 result.image 中的 ```json 和 ``` 替换为空字符串
    result.image = JSON.parse(result.image.replace(/```json/g, "").replace(/```/g, ""));
    // 将 result.content 中的 ```json 和 ``` 替换为空字符串
    result.content = JSON.parse(result.content.replace(/```json/g, "").replace(/```/g, ""));

    const transformedResponse = new Response(JSON.stringify(result), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        ...CORS_HEADERS,
      },
    });

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
