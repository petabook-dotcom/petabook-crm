import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE_NAME, isValidAccessCookie } from "@/lib/access/session";

export async function requireCrmAccess() {
  const cookieStore = await cookies();
  if (!isValidAccessCookie(cookieStore.get(ACCESS_COOKIE_NAME)?.value)) {
    redirect("/access");
  }
}
