import { auth } from "./auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isManagerRoute = req.nextUrl.pathname.startsWith("/manager");
  const isLoginPage = req.nextUrl.pathname === "/manager/login";

  // Protect all /manager/* routes except /manager/login
  if (isManagerRoute && !isLoginPage && !isLoggedIn) {
    return Response.redirect(new URL("/manager/login", req.nextUrl.origin));
  }

  // If logged in and trying to access login page, redirect to dashboard
  if (isLoginPage && isLoggedIn) {
    return Response.redirect(new URL("/manager/dashboard", req.nextUrl.origin));
  }

  return undefined;
});

export const config = {
  matcher: ["/manager/:path*"],
};

