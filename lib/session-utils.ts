export const SessionEnrollState = {
  CLOSED: "closed",
  OPEN: "open",
  "ADD CODE REQUIRED": "add code required",
  "FACULTY CODE REQUIRED": "faculty code required",
  OTHER: "other",
} as const

export const getSessionEnrollState = (session: any) => {
  if (session.stateKey !== "active") return session.stateKey
  if (session.enrollCount >= session.enrollMaximum) {
    return SessionEnrollState.CLOSED
  } else if (session.enrollStatus === SessionEnrollState["ADD CODE REQUIRED"]) {
    return SessionEnrollState["ADD CODE REQUIRED"]
  } else if (session.enrollStatus === SessionEnrollState["FACULTY CODE REQUIRED"]) {
    return SessionEnrollState["FACULTY CODE REQUIRED"]
  }
  return SessionEnrollState.OPEN
}

export const enrollStateToOutlineClasses = {
  [SessionEnrollState.CLOSED]: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30",
  [SessionEnrollState.OPEN]: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30",
  [SessionEnrollState["ADD CODE REQUIRED"]]: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
  [SessionEnrollState["FACULTY CODE REQUIRED"]]: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
  [SessionEnrollState.OTHER]: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/30",
}

export const enrollStateToPrimaryClasses = {
  [SessionEnrollState.CLOSED]: "bg-rose-500 text-rose-50 dark:bg-rose-500 dark:text-rose-50",
  [SessionEnrollState.OPEN]: "bg-emerald-500 text-emerald-50 dark:bg-emerald-500 dark:text-emerald-50",
  [SessionEnrollState["ADD CODE REQUIRED"]]: "bg-amber-500 text-amber-50 dark:bg-amber-500 dark:text-amber-50",
  [SessionEnrollState["FACULTY CODE REQUIRED"]]: "bg-amber-500 text-amber-50 dark:bg-amber-500 dark:text-amber-50",
  [SessionEnrollState.OTHER]: "bg-slate-500 text-slate-50 dark:bg-slate-500 dark:text-slate-50",
}

export const getEnrollOutlineClasses = (enrollState: string) => {
  return enrollStateToOutlineClasses[enrollState as keyof typeof enrollStateToOutlineClasses] ?? enrollStateToOutlineClasses.other
}

export const getEnrollPrimaryClasses = (enrollState: string) => {
  return enrollStateToPrimaryClasses[enrollState as keyof typeof enrollStateToPrimaryClasses] ?? enrollStateToPrimaryClasses.other
}