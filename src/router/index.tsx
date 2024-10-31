// src/router/index.tsx
import { RouteObject, useRoutes } from 'react-router-dom';
import RagPage from '@/pages/rag';
import HomePage from '@/pages/home';

const routes: RouteObject[] = [
  {
    path: '/',
    // Layout
    // element: <Layout />,
    children: [
      {
        index: true, // 默认子路由
        element: <HomePage />
      },
      {
        path: 'rag',
        element: <RagPage />
      }
    ]
  },
  // {
  //   path: '*',
  //   element: <NotFound />
  // }
];

export default function Router() {
  return useRoutes(routes);
}
