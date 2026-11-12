import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "super-secret-jwt-key-lab-inventory-2026-min-32-chars"
);
const COOKIE_NAME = "lab_auth_token";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  let session: { id: string; role: string; username: string } | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET);
      session = payload as { id: string; role: string; username: string };
    } catch {
      session = null;
    }
  }

  // Redirect authenticated user away from /login
  if (pathname === "/login") {
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Protected application pages
  const protectedPages = ["/dashboard", "/items", "/borrow", "/returns", "/transactions", "/users"];
  const isProtectedPage = protectedPages.some((p) => pathname.startsWith(p));

  if (isProtectedPage) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Admin only pages
    if (pathname.startsWith("/users") && session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Protected API routes
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/login")) {
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }
    if (pathname.startsWith("/api/users") && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/items/:path*",
    "/borrow/:path*",
    "/returns/:path*",
    "/transactions/:path*",
    "/users/:path*",
    "/login",
    "/api/users/:path*",
    "/api/items/:path*",
    "/api/borrow/:path*",
    "/api/returns/:path*",
    "/api/dashboard/:path*",
  ],
};
