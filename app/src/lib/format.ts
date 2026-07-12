export function formatDate(timestamp?: number) {
  if (!timestamp) return "—";
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function duration(start?: number, end?: number) {
  if (!start) return "—";
  const seconds = Math.max(0, Math.round(((end ?? Date.now()) - start) / 1000));
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export function mediaTimestamp(seconds?: number) {
  if (seconds === undefined) return "—";
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainder = total % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
    : `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export function compactId(id?: string, prefix = "") {
  if (!id) return "—";
  return `${prefix}${id.slice(-5).toUpperCase()}`;
}

export function sentenceCase(value: string) {
  return value.replaceAll("_", " ").replace(/^./, (char) => char.toUpperCase());
}

export function scoreTone(score: number) {
  if (score >= 80) return "strong";
  if (score >= 55) return "medium";
  return "weak";
}
