import { createBrowserRouter, type RouteObject } from 'react-router';
import { HydrateFallback } from './hydrate-fallback';

// Pages load with route-level lazy so each feature gets its own chunk. The app shell is the
// layout route; feature routes are added as children by the feature tickets.
export const routes: RouteObject[] = [
  {
    lazy: () => import('./app-shell'),
    HydrateFallback,
    children: [
      { index: true, lazy: () => import('./home-page') },
      { path: '*', lazy: () => import('./not-found') },
    ],
  },
];

export const createRouter = () => createBrowserRouter(routes);
