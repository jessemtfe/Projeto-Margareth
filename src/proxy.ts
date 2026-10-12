import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, getAuthenticatedUser, hasRole } from "../lib/auth";

const publicPaths = new Set(["/login", "/cadastro"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthApi = pathname.startsWith("/api/auth/");
  const isPublicPage = publicPaths.has(pathname);

  if (isAuthApi) {
    return NextResponse.next();
  }

  const user = await getAuthenticatedUser(
    request.cookies.get(AUTH_COOKIE)?.value,
  );

  if (isPublicPage) {
    if (user && isPublicPage) {
      return NextResponse.redirect(
        new URL("/", process.env.PUBLIC_APP_URL ?? request.url),
      );
    }
    return NextResponse.next();
  }

  if (!user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
    }

    const loginUrl = new URL(
      "/login",
      process.env.PUBLIC_APP_URL ?? request.url,
    );
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/usuarios" && user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (
    pathname.startsWith("/api/") &&
    !["GET", "HEAD", "OPTIONS"].includes(request.method) &&
    !hasRole(user, "EDITOR")
  ) {
    return NextResponse.json(
      { error: "Sua conta não tem permissão para alterar dados." },
      { status: 403 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|icon.svg|favicon.ico|login-recycling.jpeg|login-recycling.webp).*)",
  ],
};
