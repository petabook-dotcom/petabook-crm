"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ACCESS_COOKIE_MAX_AGE,
  ACCESS_COOKIE_NAME,
  accessCookieValue,
  isValidAccessPassword,
} from "@/lib/access/session";

export interface AccessState {
  error: string | null;
}

function safeDestination(value: FormDataEntryValue | null) {
  const destination = String(value ?? "/pipeline");
  return destination.startsWith("/") && !destination.startsWith("//") && destination !== "/access"
    ? destination
    : "/pipeline";
}

export async function unlockCrmAction(
  _previousState: AccessState,
  formData: FormData,
): Promise<AccessState> {
  const password = String(formData.get("password") ?? "");
  if (!isValidAccessPassword(password)) {
    return { error: "Palavra-passe incorreta." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE_NAME, accessCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_COOKIE_MAX_AGE,
  });

  redirect(safeDestination(formData.get("from")));
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  redirect("/access");
}
