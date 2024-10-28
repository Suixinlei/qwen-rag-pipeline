import React, { useState } from "react";
import { Box, VStack, Heading, Button } from "@chakra-ui/react";
import "./App.css";

// React/TypeScript 示例
const callDashScope = async (prompt: string) => {
  try {
    const response = await fetch(
      "https://qwen-rag-pipeline.pages.dev/api/dashscope",
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
  const [count, setCount] = useState(0);

  React.useEffect(() => {
    async function fetchData() {
      // 使用示例
      try {
        const result = await callDashScope("CnTable 出现数据重复行怎么办?");
        console.log(result.text);
      } catch (error) {
        console.error("Error:", error);
      }
    }
    fetchData();
  }, []);

  return (
    <Box p={4}>
      <VStack>
        <Heading as="h1" size="xl">
          Welcome to Chakra UI
        </Heading>
        <Button onClick={() => setCount(count + 1)}>Click me</Button>
        <Box>Count: {count}</Box>
      </VStack>
    </Box>
  );
}

export default App;
