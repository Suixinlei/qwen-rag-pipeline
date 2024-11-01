import * as React from 'react';

const callDashScope = async (prompt: string, session_id: string | null) => {
  console.log('请求参数', prompt, session_id);
  try {
    const response = await fetch(
      `${process.env.API_URL}/api/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, session_id }),
      }
    );

    if (!response.ok) {
      throw new Error("API request failed");
    }

    return response;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

let sessionId: string | null = null;

export default function Assistant() {
  React.useEffect(() => {
    // @ts-ignore
    const client = new window.ChatAISDK();
    client.setConfig({
      uiConfig: {
        stream: true
      }
    });
    // 前端手动添加一条消息
    client.appendMsg({
      // 消息id，不传时前端将默认给一个随机id
      // id: '***',
      // 消息内容
      content: {
        text: '随便问问题',
      },
      // 消息位置，支持 left | right
      position: 'left'
    });
    client.onRequest = {
      doChat: async (params: { prompt: string }, onMessage: (message: any) => void) => {
        const llmResponse = await callDashScope(params.prompt, sessionId);
        
        const reader = llmResponse.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          return;
        }

        let buffer = ''; // 用于存储未完成的数据
    
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          // 将新的数据添加到buffer中
          buffer += decoder.decode(value, { stream: true });

          const messages = buffer.split('\n\n');
          buffer = messages.pop() || ''; // 保留最后一个可能不完整的消息



          for (const text of messages) {
            if (text.startsWith('data: ')) {
              const data = text.slice(6);
              if (data.includes('[done]')) {
                console.log('---------done---------');
                onMessage({
                  success: true,
                  done: true,
                  data: { text: '' },
                })
                break;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed?.type === 'session_id') {
                  sessionId = parsed.session_id;
                  continue;
                }
                if (parsed?.type === 'summary') {
                  // 可以触发下一个 agent 了
                  client.appendMsg({
                    // 消息id，不传时前端将默认给一个随机id
                    // id: '***',
                    // 消息内容
                    content: {
                      text: '以下是准备触发下一个 agent 的参数: \n' + parsed.summary,
                    },
                    // 消息位置，支持 left | right
                    position: 'left'
                  });
                  continue;
                }
                onMessage(parsed);
              } catch (e) {
                console.error('Failed to parse JSON:', e);
              }

              
            }
          }
        }
      }
    }
  }, []);
  return (
    <div
      id="chatai-root"
      style={{
        width: "100vw",
        height: "100vh",
      }}
    >

    </div>
  );
}
