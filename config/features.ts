const parseBoolean = (value: string | undefined, defaultValue: boolean) => {
  if (typeof value === "undefined") return defaultValue
  const normalized = value.toLowerCase().trim()
  if (["1", "true", "on", "yes"].includes(normalized)) return true
  if (["0", "false", "off", "no"].includes(normalized)) return false
  return defaultValue
}

const scheduleEnabled = parseBoolean(
  process.env.NEXT_PUBLIC_ENABLE_SCHEDULE_FEATURE,
  false,
)

export const FEATURES = {
  schedule: scheduleEnabled,
} as const

export const isScheduleFeatureEnabled = () => FEATURES.schedule
