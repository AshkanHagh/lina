type ElapsedTimeUnit = "seconds" | "minutes" | "hours";

export function getElapsedTime(createdAt: Date, unit: ElapsedTimeUnit) {
  const now = Date.now();
  const diff = now - createdAt.getTime();

  switch (unit) {
    case "seconds": {
      return diff / 1000;
    }
    case "minutes": {
      return diff / (1000 * 60);
    }
    case "hours": {
      return diff / (1000 * 60 * 60);
    }
  }
}
