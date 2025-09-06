export const getSessionEnrollState = (session: any) => {
  if (session.stateKey !== "active") return session.stateKey
  if (session.enrollCount >= session.enrollMaximum) {
    return "closed"
  } else if (session.enrollStatus === "add code required") {
    return "add code required"
  }
  return "open"
}

export const enrollStateToOutlineClasses = {
  closed: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30",
  open: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30",
  "add code required": "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
  other: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/30",
}

export const enrollStateToPrimaryClasses = {
  closed: "bg-rose-500 text-rose-50 dark:bg-rose-500 dark:text-rose-50",
  open: "bg-emerald-500 text-emerald-50 dark:bg-emerald-500 dark:text-emerald-50",
  "add code required": "bg-amber-500 text-amber-50 dark:bg-amber-500 dark:text-amber-50",
  other: "bg-slate-500 text-slate-50 dark:bg-slate-500 dark:text-slate-50",
}

export const getEnrollOutlineClasses = (enrollState: string) => {
  return enrollStateToOutlineClasses[enrollState as keyof typeof enrollStateToOutlineClasses] ?? enrollStateToOutlineClasses.other
}

export const getEnrollPrimaryClasses = (enrollState: string) => {
  return enrollStateToPrimaryClasses[enrollState as keyof typeof enrollStateToPrimaryClasses] ?? enrollStateToPrimaryClasses.other
}