type GPAData = {
  gpa: string;
  count: number;
}

export function weightedMeanGPA(data: GPAData[]): number {
  let totalWeighted = 0;
  let totalCount = 0;

  for (const entry of data) {
    const gpa = parseFloat(entry.gpa);
    totalWeighted += gpa * entry.count;
    totalCount += entry.count;
  }

  return totalCount === 0 ? 0 : totalWeighted / totalCount;
}


export function medianGPA(data: GPAData[]): number {
  // Sort by GPA ascending
  const sorted = [...data].sort(
    (a, b) => parseFloat(a.gpa) - parseFloat(b.gpa)
  );

  const totalCount = sorted.reduce((sum, d) => sum + d.count, 0);
  const mid = Math.floor(totalCount / 2);

  let cumulative = 0;
  for (const entry of sorted) {
    cumulative += entry.count;
    if (cumulative > mid) {
      return parseFloat(entry.gpa);
    }
  }

  return 0; // fallback
}


export function modeGPA(data: GPAData[]): number {
  let maxCount = -1;
  let mode = 0;

  for (const entry of data) {
    if (entry.count > maxCount) {
      maxCount = entry.count;
      mode = parseFloat(entry.gpa);
    }
  }

  return mode;
}

export function standardDeviationGPA(data: GPAData[]): number {
  const mean = weightedMeanGPA(data);
  let totalCount = 0;
  let varianceSum = 0;

  for (const entry of data) {
    const gpa = parseFloat(entry.gpa);
    varianceSum += entry.count * Math.pow(gpa - mean, 2);
    totalCount += entry.count;
  }

  return totalCount === 0 ? 0 : Math.sqrt(varianceSum / totalCount);
}

export function percentileGPA(data: GPAData[], percentile: number): number {
  if (percentile < 0 || percentile > 100) {
    throw new Error("Percentile must be between 0 and 100");
  }

  const sorted = [...data].sort(
    (a, b) => parseFloat(a.gpa) - parseFloat(b.gpa)
  );

  const totalCount = sorted.reduce((sum, d) => sum + d.count, 0);
  const target = (percentile / 100) * totalCount;

  let cumulative = 0;
  for (const entry of sorted) {
    cumulative += entry.count;
    if (cumulative >= target) {
      return parseFloat(entry.gpa);
    }
  }

  return parseFloat(sorted[sorted.length - 1].gpa); // fallback
}

export function easinessScore(data: GPAData[]): number {
  if (data.length === 0) return 0;

  const mean = weightedMeanGPA(data);
  const mode = modeGPA(data);
  const stdDev = standardDeviationGPA(data);

  // Assume GPA scale is 0–40 (like 4.0 but multiplied by 10)
  const maxGPA = 40;
  const minGPA = 0;

  const meanNorm = (mean - minGPA) / (maxGPA - minGPA);
  const modeNorm = (mode - minGPA) / (maxGPA - minGPA);

  // Normalize std dev (assume max possible spread ~10 GPA points)
  const stdNorm = Math.min(stdDev / 10, 1);

  // Weighted combination
  const w1 = 0.5; // mean importance
  const w2 = 0.3; // consistency importance
  const w3 = 0.2; // mode importance

  const score =
    w1 * meanNorm + w2 * (1 - stdNorm) + w3 * modeNorm;

  // Scale to 0–100
  return Math.round(score * 100);
}