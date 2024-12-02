// src/router/index.tsx
import { RouteObject, useRoutes } from 'react-router-dom';
import ImagePage from '@/pages/image';

const routes: RouteObject[] = [
  {
    path: '/',
    // Layout
    // element: <Layout />,
    children: [
      {
        path: 'image',
        element: <ImagePage />
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
