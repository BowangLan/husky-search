import Link from "next/link"
import { useUserStore } from "@/store/user.store"
import { useClerk } from "@clerk/nextjs"

import { Card, CardContent } from "@/components/ui/card"

import { Button } from "./ui/button"

export const StudentRequiredCard = ({
  featureName,
}: {
  featureName: string
}) => {
  return (
    <Card hoverInteraction={false}>
      <StudentRequiredCardContent featureName={featureName} />
    </Card>
  )
}

export const StudentRequiredCardContent = ({
  featureName,
}: {
  featureName: string
}) => {
  const isSignedIn = useUserStore((state) => state.isSignedIn)
  const { signOut } = useClerk()

  return (
    <CardContent className="relative p-6">
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center space-y-6 max-w-md">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-foreground tracking-tight">
              Student Access Required
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed font-light">
              {featureName} are only available to verified UW students. Please
              sign in with your UW email to view {featureName}.
            </p>
            {isSignedIn ? (
              <Button
                variant="secondary"
                className="mt-4 hidden"
                onClick={() => signOut()}
              >
                Sign out
              </Button>
            ) : (
              <Link href="/sign-in">
                <Button variant="secondary" className="mt-4">
                  Sign in
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </CardContent>
  )
}
