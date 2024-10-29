import { useState } from "react";
import {
  Box,
  VStack,
  Heading,
  Input,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import { Toaster, toaster } from "@/components/ui/toaster";
import "./App.css";

const callDashScope = async (prompt: string) => {
  try {
    const response = await fetch(
      `${process.env.API_URL}/api/rag`,
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

function App() {
  const [prompt, setPrompt] = useState("CnTable 出现数据重复行怎么办？");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toaster.create({
        title: "请输入内容",
        duration: 2000,
      });
      return;
    }
  
    setIsLoading(true);
    setResult("");
  
    try {
      const response = await callDashScope(prompt);
  
      if (!response.ok) throw new Error("API request failed");
  
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = ''; // 用于存储未完成的数据
  
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
  
        // 将新的数据添加到buffer中
        buffer += decoder.decode(value, { stream: true });
  
        // 处理buffer中的完整消息
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || ''; // 保留最后一个可能不完整的消息
  
        for (const message of messages) {
          if (!message.trim()) continue;
  
          // 解析消息中的各个字段
          const messageLines = message.split('\n');
          let eventData: { output: { text?: string }, type?: string, subject?: string };
  
          for (const line of messageLines) {
            if (line.startsWith('data:')) {
              try {
                eventData = JSON.parse(line.slice(5));
                if (eventData?.type === 'classification') {
                  setResult(prev => prev + `问题类型：${eventData.subject}\n开始转接下一个 agent...\n`);
                } else if (eventData?.output?.text) {
                  setResult(prev => prev + eventData.output.text);
                }
              } catch (e) {
                console.error('Error parsing JSON:', e);
              }
            }
          }
        }
      }
  
      // 处理最后可能残留的数据
      if (buffer.trim()) {
        const messageLines = buffer.split('\n');
        for (const line of messageLines) {
          if (line.startsWith('data:')) {
            try {
              const eventData = JSON.parse(line.slice(5));
              if (eventData?.output?.text) {
                setResult(prev => prev + eventData.output.text);
              }
            } catch (e) {
              console.error('Error parsing JSON:', e);
            }
          }
        }
      }
  
    } catch (error: any) {
      toaster.create({
        title: "请求失败",
        description: error.message,
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <Box p={4} maxW="800px" mx="auto">
      <VStack align="stretch">
        <Heading as="h1" size="xl" textAlign="center">
          AI 问答助手
        </Heading>
        
        <Box>
          <Text mb={2}>请输入你的问题：</Text>
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="例如：CnTable 出现数据重复行怎么办?"
            size="lg"
          />
        </Box>

        <Button
          onClick={handleSubmit}
        >
          获取回答
        </Button>

        {(result || isLoading) && (
          <Box>
            <Text mb={2} fontWeight="bold">
              回答：
            </Text>
            <Textarea
              value={result}
              readOnly
              minH="200px"
              p={4}
              borderRadius="md"
              bg="gray.50"
              whiteSpace="pre-wrap"
            />
          </Box>
        )}
      </VStack>
      <Toaster />
    </Box>
  );
}

export default App;
