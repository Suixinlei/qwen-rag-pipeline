import * as React from 'react';
import { Transform } from 'stream';

const callDashScope = async (prompt: string) => {
  try {
    const response = await fetch(
      `${process.env.API_URL}/api/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
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


export default function Assistant() {
  React.useEffect(() => {
    // init
    if (!window.ChatAISDK) {
      window.addEventListener('onChatAILoad', init);
      return;
    }
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
      doChat: async (params) => {
        console.log('params', params);
        const response = await callDashScope(params.prompt);

        const transformStream = new Transform({
          transform(chunk, encoding, callback) {
            // 转换数据
            const data = JSON.parse(chunk);
            const transformed = {
              ...data,
              timestamp: new Date()
            };
            
            // 推送转换后的数据
            this.push(JSON.stringify(transformed));
            callback();
          }
        });
        // 使用
sourceStream
.pipe(transformStream)
.pipe(response);
        return response.body.pipe(transformStream).pipe();
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
