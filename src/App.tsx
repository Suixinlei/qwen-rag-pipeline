import { useState } from "react";
import {
  Box,
  VStack,
  Heading,
  Button,
  Input,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { Toaster, toaster } from "@/components/ui/toaster";
import "./App.css";

const callDashScope = async (prompt: string) => {
  try {
    const response = await fetch(
      `${process.env.API_URL}/api/qwen`,
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

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

function App() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  console.log('isLoading', isLoading);

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toaster.create({
        title: "请输入内容",
        duration: 2000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await callDashScope(prompt);
      setResult(response.text);
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
          colorScheme="blue"
          onClick={handleSubmit}
        >
          获取回答
        </Button>

        {result && (
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
