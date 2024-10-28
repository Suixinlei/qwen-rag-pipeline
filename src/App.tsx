import { useState } from 'react'
import { Box, VStack, Heading, Button } from "@chakra-ui/react"
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Box p={4}>
      <VStack spacing={4}>
        <Heading as="h1" size="xl">Welcome to Chakra UI</Heading>
        <Button  onClick={() => setCount(count + 1)}>
          Click me
        </Button>
        <Box>
          Count: {count}
        </Box>
      </VStack>
    </Box>
  )
}

export default App
