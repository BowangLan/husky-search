import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function capitalize(str: string) {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function capitalizeSingle(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}


export function calculateEasiness(data: { gpa: number; count: number }[], options = {}) {
  // Default config
  const config = {
    maxGPA: 4, // maximum GPA scale
    lowThreshold: 30, // GPA threshold for "low performers"
    weights: { mean: 0.6, spread: 0.2, low: 0.2 },
    ...options,
  };

  const { maxGPA, lowThreshold, weights } = config;

  // Total students
  const N = data.reduce((sum, d) => sum + d.count, 0);

  if (N === 0) return 0; // avoid division by zero

  // Weighted mean GPA
  const mean =
    data.reduce((sum, d) => sum + d.count * d.gpa, 0) / N;

  // Weighted variance
  const variance =
    data.reduce(
      (sum, d) => sum + d.count * Math.pow(d.gpa - mean, 2),
      0
    ) / N;

  const stdDev = Math.sqrt(variance);

  // Proportion of low performers
  const lowCount = data
    .filter((d) => d.gpa < lowThreshold)
    .reduce((sum, d) => sum + d.count, 0);

  const pLow = lowCount / N;

  // Easiness score formula
  let score =
    weights.mean * (mean / maxGPA) -
    weights.spread * (stdDev / maxGPA) -
    weights.low * pLow;

  // Clamp between 0 and 1
  score = Math.max(0, Math.min(1, score));

  return score;
}


export const getColor5 = (value: number) => {
  if (value >= 4) return "var(--color-green-500)"
  if (value >= 3) return "var(--color-yellow-500)"
  if (value >= 2) return "var(--color-orange-500)"
  if (value >= 1) return "var(--color-red-500)"
  return "var(--color-gray-500)"
}

export const getColor5Classes = (value: number) => {
  if (value >= 4) return "bg-green-500"
  if (value >= 3) return "bg-yellow-500"
  if (value >= 2) return "bg-orange-500"
  if (value >= 1) return "bg-red-500"
  return "bg-gray-500"
}

export const getColor4 = (value: number) => {
  if (value >= 3.5) return "green"
  if (value >= 3) return "yellow"
  if (value >= 2) return "orange"
  if (value >= 1) return "red"
  return "gray"
}

export const getColor100 = (value: number) => {
  if (value >= 90) return "green"
  if (value >= 80) return "blue"
  if (value >= 60) return "yellow"
  if (value >= 40) return "orange"
  if (value >= 20) return "red"
  return "gray"
}

const genEdLabels = {
  "A&H": "Arts & Humanities",
  "SSc": "Social Sciences",
  "NSc": "Natural Sciences",
  "C": "English Composition",
  "W": "Writing",
  "DIV": "Diversity",
  "RSN": "Reasoning",
}

export const getGenEdLabel = (label: string) => {
  return genEdLabels[label as keyof typeof genEdLabels] ?? label
}

export const formatTimeString = (time: number) => {
  // input: "830"
  // output: "8:30 AM"
  const hours = Math.floor(Number(time) / 100)
  const minutes = Number(time) % 100
  const ampm = hours >= 12 ? "PM" : "AM"
  const hours12 = hours % 12 || 12
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${ampm}`
}

export const weekDays = ["M", "T", "W", "Th", "F", "Sa", "Su"] as const

export const expandDays = (days?: string): string[] => {
  if (!days) return []
  // Handle combinations like "MWF", "TTh", "TuTh", etc.
  // Normalize tokens: Th or Thu treated as Th; Tu treated as T
  const normalized = days
    .replace(/Thu|Th/g, "Th")
    .replace(/Tu/g, "T")
    .replace(/Su|Sun/g, "Su")
    .replace(/Sa|Sat/g, "Sa")
  const result: string[] = []
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i]
    if (ch === "T" && normalized[i + 1] === "h") {
      result.push("Th")
      i += 1
    } else if (
      (ch === "S" && normalized[i + 1] === "a") ||
      (ch === "S" && normalized[i + 1] === "u")
    ) {
      // already handled above by replacement, kept for safety
      continue
    } else if (ch.match(/[MTWF]/)) {
      result.push(ch)
    }
  }
  return result
}

export function formatTerm(term?: string) {
  if (!term) return ""
  // Expected like "20252" -> year 2025, quarter code 2 → SP25 mapping by provided examples AU24, WI25, SP25
  const year = term.slice(0, 4)
  const q = term.slice(4)
  const quarterMap: Record<string, string> = {
    "1": "WI",
    "2": "SP",
    "3": "SU",
    "4": "AU",
  }
  const shortYear = year.slice(2)
  return `${quarterMap[q] || ""}${shortYear}`
}
