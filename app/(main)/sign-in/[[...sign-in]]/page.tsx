import { SignIn } from '@clerk/nextjs'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>
}) {
  const params = await searchParams
  const redirectUrl = params.redirect_url || '/'

  return (
    <div className="bg-muted flex w-full flex-1 items-center justify-center p-6 md:p-10">
      <div className="flex flex-col items-center gap-8">
        <div className="text-center space-y-2 max-w-md">
          <h1 className="text-2xl font-semibold text-foreground">
            Sign in to Husky Search
          </h1>
          <p className="text-sm text-muted-foreground">
            You must sign in or sign up with a <span className="font-semibold text-foreground">@uw.edu</span> email address to access course data.
          </p>
        </div>
        <SignIn fallbackRedirectUrl={redirectUrl} />
      </div>
    </div>
  )
}