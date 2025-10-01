import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Helper function: Yeh object ko URL search parameters (?key=value) mein convert karta hai.
function paramsToSearch(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    // Sirf woh values add karein jo undefined ya null nahi hain
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }
  const searchString = searchParams.toString();
  // Agar search parameters hain, toh '?' ke saath return karein
  return searchString ? `?${searchString}` : "";
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

// UPDATED getQueryFn: Yeh function ab queryKey se sahi URL construct karta hai
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // queryKey ka pehla element URL path (string) hona chahiye
    const [baseUrl, params] = queryKey;
    
    let url = baseUrl as string;
    
    // Agar queryKey ka doosra element object hai (jismein parameters hote hain),
    // toh use paramsToSearch se URL mein append karein.
    if (typeof params === "object" && params !== null) {
      url += paramsToSearch(params as Record<string, any>);
    }

    // Fetch call ab correct URL use karega (e.g., /api/products?category=electronics)
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
