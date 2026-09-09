import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { WakeHouse } from "@/components/wake-house";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            retry: 2,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <WakeHouse />
      {children}
    </QueryClientProvider>
  );
}
