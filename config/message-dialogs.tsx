import { ReactNode } from "react"
import { isEmailFromUW } from "@/constants"

/**
 * Context shared with custom display conditions.
 */
export type MessageDialogConditionContext = {
  pathname: string
  isSignedIn: boolean
  hasBeenShownBefore: boolean
  hasOptedOut: boolean
  getStorageValue: (key: string) => string | null
  user?: any // Clerk user object
}

export type MessageDialogDisplayCondition =
  | { type: "showOnce" }
  | { type: "anonymousOnly" }
  | { type: "signedInOnly" }
  | {
      type: "pathname"
      /** Glob style patterns ("/courses/*"), regular expressions, or plain paths. */
      patterns: Array<string | RegExp>
    }
  | { type: "respectOptOut" }
  | {
      type: "custom"
      shouldShow: (
        ctx: MessageDialogConditionContext
      ) => boolean | Promise<boolean>
    }

export type MessageDialogActionContext = {
  dismiss: () => void
  dismissAndOptOut: () => void
}

export type MessageDialogRenderContext = MessageDialogActionContext & {
  config: MessageDialogConfig
}

export type MessageDialogRenderDialogContext = MessageDialogRenderContext & {
  defaultDialog: ReactNode
}

export type MessageDialogAction = {
  label: string
  href?: string
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "ghost"
    | "link"
    | "destructive"
  dismissOnClick?: boolean
  dontShowAgain?: boolean
  onClick?: (
    ctx: MessageDialogActionContext
  ) => void | boolean | Promise<void | boolean>
}

export type MessageDialogTone =
  | "default"
  | "info"
  | "success"
  | "warning"
  | "danger"

export type MessageDialogConfig = {
  id: string
  title: ReactNode
  description?: ReactNode
  renderContent?: (ctx: MessageDialogRenderContext) => ReactNode
  renderDialog?: (ctx: MessageDialogRenderDialogContext) => ReactNode
  actions?: MessageDialogAction[]
  conditions?: MessageDialogDisplayCondition[]
  allowClose?: boolean
  allowDontShowAgain?: boolean
  dontShowAgainLabel?: string
  tone?: MessageDialogTone
  eyebrow?: ReactNode
  icon?: ReactNode
  contentClassName?: string
  cardClassName?: string
}

export const messageDialogConfigs: MessageDialogConfig[] = [
  // {
  //   id: "welcome-anon",
  //   eyebrow: "New here?",
  //   title: "Please sign in!",
  //   renderContent: () => (
  //     <div className="space-y-2 text-base/relaxed font-light text-foreground">
  //       <p>Please sign in with your UW email!</p>
  //       <p>
  //         We're currently in the beta period, so all course data is temporarily
  //         available to anyone.
  //       </p>
  //       <p>
  //         But in the future, we'll begin to limit features and parts of course
  //         data (specifically, DawgPath and CEC data) to only logged-in users
  //         with a UW email. This is to ensure that data restricted to only
  //         students by UW is respected.
  //       </p>
  //     </div>
  //   ),
  //   tone: "info",
  //   conditions: [
  //     { type: "anonymousOnly" },
  //     // { type: "pathname", patterns: ["/", "/courses/*"] },
  //     // { type: "respectOptOut" },
  //     { type: "showOnce" },
  //   ],
  //   // allowDontShowAgain: true,
  //   actions: [
  //     { label: "Maybe later", variant: "ghost" },
  //     {
  //       label: "Sign in",
  //       href: "/sign-in",
  //       variant: "default",
  //     },
  //   ],
  // },
  {
    id: "feature-roadmap",
    eyebrow: "Feature Roadmap",
    title: "Vote on upcoming features and suggest your own ideas!",
    renderContent: () => (
      <div className="space-y-2 text-base/relaxed font-light text-foreground">
        <p>
          You can now vote on upcoming features or suggest your own ideas! Open
          the feature roadmap from the{" "}
          <span className="font-bold">Roadmap</span> button in the{" "}
          <span className="font-bold italic">bottom left</span> corner of the
          screen.
        </p>
        <p>We'll use your feedback to shape the future of Husky Search.</p>
        <p>Thank you for your help!</p>
      </div>
    ),
    conditions: [{ type: "showOnce" }],
    tone: "info",
  },
  {
    id: "welcome-anon",
    eyebrow: "New here?",
    title: "Please sign in!",
    renderContent: () => (
      <div className="space-y-2 text-base/relaxed font-light text-foreground">
        <p>Sign in with your UW email!</p>
        <p>
          Access to course data now requires signing in with your UW email
          address.
        </p>
        <p>
          Please sign in to view courses and features. Data restricted by UW
          (including MyPlan, DawgPath and CEC information) is available only to
          logged-in users with a UW email.
        </p>
      </div>
    ),
    tone: "info",
    conditions: [
      { type: "anonymousOnly" },
      // { type: "pathname", patterns: ["/", "/courses/*"] },
      // { type: "respectOptOut" },
      { type: "showOnce" },
    ],
    // allowDontShowAgain: true,
    actions: [
      { label: "Maybe later", variant: "ghost" },
      {
        label: "Sign in",
        href: "/sign-in",
        variant: "default",
      },
    ],
  },
  {
    id: "non-uw-email",
    eyebrow: "Access Limited",
    title: "UW Email Required",
    renderContent: () => (
      <div className="space-y-2 text-base/relaxed font-light text-foreground">
        <p>
          You're signed in with a non-UW email address. Some features and course
          data are restricted to UW students only.
        </p>
        <p>
          To access full features including DawgPath and CEC data, please sign
          in with your UW email address (@u.washington.edu, @uw.edu, or
          @cs.washington.edu).
        </p>
      </div>
    ),
    tone: "warning",
    conditions: [
      { type: "signedInOnly" },
      {
        type: "custom",
        shouldShow: async (ctx) => {
          if (!ctx.isSignedIn || !ctx.user) {
            return false
          }

          return !ctx.user.emailAddresses.some((email: any) =>
            isEmailFromUW(email.emailAddress)
          )
        },
      },
      // { type: "showOnce" },
    ],
    allowDontShowAgain: true,
    actions: [
      { label: "I understand", variant: "secondary" },
      {
        label: "Sign in with UW email",
        href: "/sign-in",
        variant: "default",
      },
    ],
  },
]

/**
 * Example configuration:
 *
 * export const messageDialogConfigs: MessageDialogConfig[] = [
 *   {
 *     id: "welcome-anon",
 *     eyebrow: "New here?",
 *     title: "Unlock the full Husky Search experience",
 *     description: "Sign in with your UW credentials to save favorites and more.",
 *     tone: "info",
 *     conditions: [
 *       { type: "anonymousOnly" },
 *       { type: "pathname", patterns: ["/", "/courses/*"] },
 *       { type: "respectOptOut" },
 *       { type: "showOnce" },
 *     ],
 *     allowDontShowAgain: true,
 *     actions: [
 *       { label: "Sign in", href: "/sign-in", variant: "default" },
 *       { label: "Maybe later", variant: "ghost" },
 *     ],
 *   },
 * ]
 */
