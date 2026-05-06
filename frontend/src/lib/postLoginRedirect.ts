import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import api from "@/lib/axios";
import { useAuthStore, type AuthUser } from "@/store/authStore";

/**
 * After setting the access token, load `/users/me` and send admins to the dashboard,
 * everyone else to the homepage.
 */
export async function completeLoginAndRedirect(
  router: AppRouterInstance,
  options?: { customerFallback?: string },
): Promise<void> {
  const fallback = options?.customerFallback;
  try {
    const { data } = await api.get<AuthUser>("/users/me");
    useAuthStore.getState().setUser(data);
    if (data.is_admin) {
      router.push("/admin/dashboard");
    } else {
      router.push("/");
    }
  } catch {
    if (
      fallback &&
      fallback.startsWith("/") &&
      !fallback.startsWith("//")
    ) {
      router.push(fallback);
    } else {
      router.push("/");
    }
  }
  router.refresh();
}
