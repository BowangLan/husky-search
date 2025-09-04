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

