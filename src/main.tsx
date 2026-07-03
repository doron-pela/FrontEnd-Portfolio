// src/main.tsx
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";

// Import the auto-generated route tree
import { routeTree } from "./routeTree.gen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for maximum TypeScript type-safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// 1. Create a client instance outside of components to avoid resets on re-renders
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data stays "fresh" for 5 minutes
      gcTime: 1000 * 60 * 10,    // Unused data remains in cache for 10 minutes
      retry: 3,                  // Retry failed requests once before showing error
      refetchOnWindowFocus: false, // Turn off automatic refetching when switching tabs
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router}>
      </RouterProvider>
    </QueryClientProvider>
  </StrictMode>,
);
