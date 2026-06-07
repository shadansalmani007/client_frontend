import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthBootstrap } from "./AuthBootstrap.jsx";
import { ToastViewport } from "../components/ToastViewport.jsx";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry(failureCount, error) {
          if ([401, 403, 404].includes(error?.status)) {
            return false;
          }

          return failureCount < 1;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function OptionalGoogleOAuthProvider({ children }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  if (!clientId) {
    return children;
  }

  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>;
}

export function AppProviders({ children }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <OptionalGoogleOAuthProvider>
      <QueryClientProvider client={queryClient}>
        <AuthBootstrap />
        {children}
        <ToastViewport />
      </QueryClientProvider>
    </OptionalGoogleOAuthProvider>
  );
}
