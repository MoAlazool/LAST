import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";

export interface UsageStatus {
  plan: "free" | "pro";
  limit: number | null; // null = unlimited (Pro)
  used: number;
  remaining: number | null;
  resetAt: string | null;
  enforced: boolean;
}

export class UsageLimitError extends Error {
  status: UsageStatus;
  constructor(status: UsageStatus) {
    super("Free plan limit reached");
    this.status = status;
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await auth.currentUser?.getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchUsage(): Promise<UsageStatus> {
  const res = await fetch("/api/usage", { headers: await authHeaders() });
  if (!res.ok) throw new Error("Could not load usage");
  return res.json();
}

/** Uses one analysis attempt. Throws UsageLimitError when the free quota is used up. */
export async function consumeAnalysisAttempt(): Promise<UsageStatus> {
  const res = await fetch("/api/usage/consume", { method: "POST", headers: await authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (res.status === 429) throw new UsageLimitError(data as UsageStatus);
  if (!res.ok) throw new Error(data?.error || "Could not start analysis");
  return data as UsageStatus;
}

export const USAGE_QUERY_KEY = "usage";

export function useUsage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const query = useQuery<UsageStatus>({
    queryKey: [USAGE_QUERY_KEY, user?.uid],
    queryFn: fetchUsage,
    enabled: !!user?.uid,
    staleTime: 30_000,
    // Re-check around the reset time so the counter refills without a page reload.
    refetchInterval: 60_000,
  });
  return {
    usage: query.data,
    isLoading: query.isLoading,
    setUsage: (u: UsageStatus) => queryClient.setQueryData([USAGE_QUERY_KEY, user?.uid], u),
    refresh: () => queryClient.invalidateQueries({ queryKey: [USAGE_QUERY_KEY] }),
  };
}

/** "5h 12m" / "38m" until the window resets. */
export function formatResetIn(resetAt: string | null | undefined, ar: boolean): string {
  if (!resetAt) return "";
  const ms = new Date(resetAt).getTime() - Date.now();
  if (ms <= 0) return ar ? "الآن" : "now";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.max(1, Math.floor((ms % 3_600_000) / 60_000));
  if (ar) return h > 0 ? `${h} س ${m} د` : `${m} د`;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
