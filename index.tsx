import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConvexProvider, ConvexReactClient } from "convex/react";
import App from './App';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

import { ErrorBoundary } from './components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ConvexProvider client={convex}>
        <App />
      </ConvexProvider>
    </ErrorBoundary>
  </React.StrictMode>
);