import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE, deleteAuthSession } from "../../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const cookieStore = await cookies();
  await deleteAuthSession(cookieStore.get(AUTH_COOKIE)?.value);

  const response = NextResponse.json({ message: "Sessão encerrada." });
  response.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
