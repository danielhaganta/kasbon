import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const AUTH_PATHS = ["/login", "/signup"];
// No-cache headers Supabase adds when it sets auth cookies.
const AUTH_CACHE_HEADERS = ["cache-control", "expires", "pragma"];

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Route handlers answer 401 JSON themselves.
  if (pathname.startsWith("/api/")) return response;

  const isAuthPath = AUTH_PATHS.includes(pathname);
  if (!user && !isAuthPath) return redirectTo(request, response, "/login");
  if (user && isAuthPath) return redirectTo(request, response, "/");

  return response;
}

// Carry over refreshed auth cookies, otherwise the session is lost on redirect.
function redirectTo(request: NextRequest, response: NextResponse, path: string) {
  const redirect = NextResponse.redirect(new URL(path, request.url));
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  AUTH_CACHE_HEADERS.forEach((key) => {
    const value = response.headers.get(key);
    if (value) redirect.headers.set(key, value);
  });
  return redirect;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
