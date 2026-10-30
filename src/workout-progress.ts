import type { Store } from "./engine";
import { workoutCalories } from "./engine";
import { programs } from "./catalog";

export const sessionKey = (date: string, day: number, level: string) =>
  `${date}-${day}-${level}`;
export const rolloverDate = (
  selected: string,
  previousToday: string,
  today: string,
) => (selected === previousToday ? today : selected);
export function toggleExercise(store: Store, key: string, name: string): Store {
  const done = store.completed[key] || [];
  return {
    ...store,
    completed: {
      ...store.completed,
      [key]: done.includes(name)
        ? done.filter((n) => n !== name)
        : [...done, name],
    },
  };
}

// Broad activity categories, not laboratory measurements of individual moves.
// 2024 Adult Compendium: conditioning exercise, codes 02054, 02024, 02022.
export function exerciseEstimate(
  name: string,
  day: number,
  level: string,
  weight: number,
  minutes?: number,
) {
  const duration =
    minutes ??
    (day === 3
      ? 1.5
      : day === 2
        ? level === "Beginner"
          ? 2
          : 8 / 3
        : level === "Beginner"
          ? 3
          : 4);
  const met =
    day === 3
      ? 2.3
      : /twist|crunch|plank|bridge/i.test(name)
        ? 2.8
        : /climber|knees|push-up|lunge|punch/i.test(name)
          ? 3.8
          : 3.5;
  return {
    minutes: duration,
    calories: workoutCalories(met, weight, duration),
    met,
  };
}
export function togglePlannedExercise(
  store: Store,
  date: string,
  day: number,
  level: string,
  name: string,
  minutes?: number,
): Store {
  if (!store.profile) throw Error("Add your weight in your profile first.");
  const key = sessionKey(date, day, level),
    next = toggleExercise(store, key, name);
  const oldSession = store.workouts.find((w) => w.identity === key);
  const prefix = key + "::";
  let workouts = store.workouts.filter(
    (w) => w.identity !== key && w.identity !== prefix + name,
  );
  // Split a previously logged whole session once, preventing double counting.
  if (oldSession)
    workouts = workouts.filter((w) => !w.identity?.startsWith(prefix));
  const names = oldSession
    ? next.completed[key]
    : next.completed[key].includes(name)
      ? [name]
      : [];
  for (const exercise of names) {
    const estimate = exerciseEstimate(
      exercise,
      day,
      level,
      store.profile.weight,
      exercise === name ? minutes : undefined,
    );
    workouts.push({
      id: crypto.randomUUID(),
      date,
      identity: prefix + exercise,
      name: `${exercise} · ${programs[day].name}`,
      minutes: estimate.minutes,
      calories: estimate.calories,
    });
  }
  return { ...next, workouts };
}
export function removeWorkout(store: Store, workoutId: string): Store {
  const workout = store.workouts.find((w) => w.id === workoutId);
  const completed = { ...store.completed };
  if (workout?.identity) {
    const [key, name] = workout.identity.split("::");
    if (name) completed[key] = (completed[key] || []).filter((n) => n !== name);
    else delete completed[key];
  }
  return {
    ...store,
    completed,
    workouts: store.workouts.filter((w) => w.id !== workoutId),
  };
}
