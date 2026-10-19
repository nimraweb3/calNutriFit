import { z } from "zod";
export const preferencesSchema = z.object({
  completed: z.literal(true),
  goal: z.enum([
    "Lose weight",
    "Gain weight",
    "Build muscle",
    "Maintain current weight",
    "Improve overall health",
  ]),
  units: z.enum(["metric", "imperial"]),
  targetWeight: z.number().min(30).max(300).optional(),
  workouts: z.array(z.string().min(1).max(60)).max(7),
  diet: z.string().min(1).max(80),
  allergies: z.string().max(500),
  cuisines: z.string().max(500),
});
export type Preferences = z.infer<typeof preferencesSchema>;
export type UpdateJournal = (
  fn: (s: import("./engine").Store) => import("./engine").Store,
) => Promise<boolean>;
