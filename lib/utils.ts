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