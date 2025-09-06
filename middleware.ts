import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// const isPublicRoute = createRouteMatcher(['/sign-in(.*)'])
const isPrivateRoute = createRouteMatcher(['/profile'])

export default clerkMiddleware(async (auth, req) => {
  if (isPrivateRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

// In middleware auth mode, each page is protected by default.
// Exceptions are configured via the `unauthenticatedPaths` option.
// export default authkitMiddleware({
//   middlewareAuth: {
//     enabled: true,
//     unauthenticatedPaths: [
//       "/majors/:path*",
//       "/courses/:path*",
//       "/",
//       "/majors",
//       "/login",
//       "/courses/by-credits/:path*",
//     ],
//   },
// })

// // Match against pages that require authentication
// // Leave this out if you want authentication on every page in your application
// export const config = { matcher: ["/"] }
