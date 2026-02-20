import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 60_000, // 60 seconds before data is considered stale
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
