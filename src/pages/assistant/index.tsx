import * as React from "react";

interface IDashScopeWorkflowChatChatParam {
  onMessage: (message: any) => void;
  listenIdArr: string[];
}

interface IDashScopeAgentChatChatParam {
  onMessage: (message: any) => void;
}

class DashScopeWorkflowChat {
  apiUrl: string;
  sessionId: string;

  constructor(url: string) {
    this.apiUrl = url;
    this.sessionId = "";
  }

  async chat(prompt: string, chatParam: IDashScopeWorkflowChatChatParam) {
    const { onMessage = () => {}, listenIdArr = [] } = chatParam;
    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        session_id: this.sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error("API request failed");
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      return;
    }

    let buffer = ""; // 用于存储未完成的数据
    let outputText = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        onMessage({
          success: true,
          done: true,
          data: { text: "" },
        });
        // 读取完毕
        break;
      }

      // 将新的数据添加到buffer中
      buffer += decoder.decode(value, { stream: true });

      const messages = buffer.split("\n");
      buffer = messages.pop() || ""; // 保留最后一个可能不完整的消息

      for (const text of messages) {
        if (text.startsWith("data:")) {
          const data = text.slice(5);

          try {
            const parsed = JSON.parse(data);
            if (!this.sessionId && parsed?.output?.session_id) {
              this.sessionId = parsed.output.session_id;
            }

            // 过程流式输出
            if (Array.isArray(parsed.output.thoughts)) {
              for (const thought of parsed.output.thoughts) {
                // 解析 thought
                try {
                  const thoughtData = JSON.parse(thought.response);
                  console.log("thoughtData", thoughtData);
                  if (
                    listenIdArr.includes(thoughtData.nodeId) &&
                    thoughtData.nodeStatus === "executing"
                  ) {
                    let thoughtOutput = thoughtData.output;
                    if (typeof thoughtOutput === "string") {
                      thoughtOutput = JSON.parse(thoughtOutput);
                    }
                    console.log('thoughtOutput', thoughtOutput.result);
                    onMessage({
                      success: true,
                      data: {
                        text: thoughtOutput.result,
                      },
                    });
                  }
                } catch (e) {
                  console.error("Failed to parse thought:", e);
                }
              }
            }

            if (parsed.output.finish_reason === "stop" && parsed.output.text) {
              outputText = parsed.output.text;
              break;
            }
          } catch (e) {
            console.error("Failed to parse JSON:", e);
          }
        }
      }
    }

    return outputText;
  }
}

class DashScopeAgentChat {
  apiUrl: string;
  sessionId: string;

  constructor(url: string) {
    this.apiUrl = url;
    this.sessionId = "";
  }

  async chat(prompt: string, chatParam: IDashScopeAgentChatChatParam): Promise<string> {
    const { onMessage } = chatParam;
    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        session_id: this.sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error("API request failed");
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      return '';
    }

    let buffer = ""; // 用于存储未完成的数据
    let outputText = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        onMessage({
          success: true,
          done: true,
          data: { text: "" },
        });
        // 读取完毕
        break;
      }

      // 将新的数据添加到buffer中
      buffer += decoder.decode(value, { stream: true });

      const messages = buffer.split("\n");
      buffer = messages.pop() || ""; // 保留最后一个可能不完整的消息

      for (const text of messages) {
        if (text.startsWith("data:")) {
          const data = text.slice(5);

          try {
            const parsed = JSON.parse(data);
            if (!this.sessionId && parsed?.output?.session_id) {
              this.sessionId = parsed.output.session_id;
            }

            if (parsed.output.text) {
              onMessage({
                success: true,
                data: {
                  text: parsed.output.text,
                },
              });
              outputText += parsed.output.text;
            }
          } catch (e) {
            console.error("Failed to parse JSON:", e);
          }
        }
      }
    }

    return outputText;
  }
}

export default function Assistant() {
  React.useEffect(() => {
    // @ts-ignore
    const client = new window.ChatAISDK();
    const chatInstance = new DashScopeAgentChat(
      `${process.env.API_URL}/api/agent`
    );
    const flowInstance = new DashScopeWorkflowChat(
      `${process.env.API_URL}/api/flow`
    );
    client.setConfig({
      uiConfig: {
        stream: true,
      },
    });
    client.onRequest = {
      doChat: async (
        params: { prompt: string },
        onMessage: (message: any) => void
      ) => {
        const llmResponse = await chatInstance.chat(params.prompt, {
          onMessage,
        });

        // 开始第二段请求
        if (llmResponse.includes('我已经确定完成，信息完整')) {
          client.appendMsg({
            type: 'system',
            text: '已经确定完成，信息完整，开始第二段请求',
          });
          const flowResponse = await flowInstance.chat(llmResponse, {
            onMessage,
            listenIdArr: ['AppRefer_w8Xw', 'AppRefer_5rC5'],
          });

          console.log('flowResponse', flowResponse);

          client.appendMsg({
            content: {
              text: flowResponse,
            },
            position: 'left',

          });
        }
      },
    };
  }, []);
  return (
    <div
      id="chatai-root"
      style={{
        width: "100vw",
        height: "100vh",
      }}
    ></div>
  );
}
