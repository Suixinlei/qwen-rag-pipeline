import { Grid, GridItem, LinkBox } from '@chakra-ui/react';
import { Box, Heading, LinkOverlay } from '@chakra-ui/react';

function Card({ title, to }) {
  return (
    <LinkBox as="article" p="5" borderWidth="1px" rounded="md">
      <Heading size="md" my="2">
        <LinkBox>
          <LinkOverlay href={to}>
            {title}
          </LinkOverlay>
        </LinkBox>
      </Heading>
    </LinkBox>
  );
}

export default function Home() {
  return (
    <Grid templateColumns="repeat(2, 1fr)" gap="6" height="100vh" width="80vw" alignItems="center" justifyContent="center">
      <GridItem colSpan={1}>
        <Card title="Go to RAG" to="/rag" />
      </GridItem>
      <GridItem colSpan={1}>
        <Card title="Go to Assistant" to="/assistant" />
      </GridItem>
    </Grid>
  );
}
