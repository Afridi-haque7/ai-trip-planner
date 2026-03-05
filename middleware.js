// import { NextResponse, NextRequest } from "next/server";
// export { default } from "next-auth/middleware";
// import { getToken } from "next-auth/jwt";

// // This function can be marked `async` if using `await` inside
// export async function middleware(request) {
//   const token = await getToken({ req: request });
//   const url = request.nextUrl;

//   if (token && (
//     url.pathname.startsWith("/sign-in") ||
//     url.pathname.startsWith("/sign-up")
//   )) {
//     return NextResponse.redirect(new URL("/dashboard", request.url));
//   }
// //   return NextResponse.redirect(new URL("/", request.url));
// }

// // See "Matching Paths" below to learn more
// export const config = {
//   matcher: ["/sign-in", "/sign-up", "/"],
// };


import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = ["/view-trip", "/create-trip", "/dashboard"];
const LOGIN_PAGE = "/login";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path)
  );
  const isLoginPage = pathname === LOGIN_PAGE;

  // Better Auth session cookie name
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ??
    request.cookies.get("__Secure-better-auth.session_token");

  const hasSession = !!sessionCookie?.value;

  // Logged-in user on login page → send to dashboard
  if (hasSession && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Unauthenticated user on protected route → send to login
  if (!hasSession && isProtected) {
    const loginUrl = new URL(LOGIN_PAGE, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/view-trip/:path*",
    "/create-trip/:path*",
  ],
};