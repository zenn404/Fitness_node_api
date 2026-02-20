export type DifficultyType = "Beginner" | "Intermediate" | "Advanced";

export function getDifficultyColor  (difficulty: DifficultyType ): string {
  switch (difficulty) {
    case "Beginner":
      return "#4ade80";
    case "Intermediate":
      return "#fbbf24";
    case "Advanced":
      return "#f87171";
    default:
      return "#9ca3af";
  }
};