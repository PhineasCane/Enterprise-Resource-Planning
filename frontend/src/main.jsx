import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";
import AppRouter from "./AppRouter";
import store from "./store/index";
import { setAuthToken } from "./services/api";
import AuthProvider from "./components/Auth/AuthProvider";
import "./index.css";

// Initialize auth token from localStorage
const token = localStorage.getItem("token");
if (token) {
  setAuthToken(token);
}

const root = createRoot(document.getElementById("root"));
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 30 * 60 * 1000,
      refetchOnWindowFocus: true,
      refetchInterval: 2 * 60 * 1000,
      refetchIntervalInBackground: true,
      retry: 1,
    },
  },
});

root.render(
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </QueryClientProvider>
  </Provider>
);
