import { shiftDay, targets, type Store } from "./engine";
import { dailyBalance } from "./daily-balance";
export function rangeDays(start: string, end: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(end) ||
    start > end
  )
    return [];
  const dates: string[] = [];
  for (let d = start; d <= end && dates.length <= 366; d = shiftDay(d, 1))
    dates.push(d);
  return dates.length > 366 ? [] : dates;
}
export function analyticsRows(data: Store, start: string, end: string) {
  return rangeDays(start, end).map((date) => {
    const b = dailyBalance(data, date),
      logged =
        data.entries.some((e) => e.date === date) ||
        data.supplementHistory.some((s) => s.date === date) ||
        data.supplements.some((s) => s.taken.includes(date)),
      workouts = data.workouts.filter((w) => w.date === date);
    return {
      date,
      intake: logged ? b.nutrients.calories : null,
      protein: logged ? b.nutrients.protein : null,
      carbs: logged ? b.nutrients.carbs : null,
      fat: logged ? b.nutrients.fat : null,
      burned: b.burned,
      workouts: workouts.length,
      minutes: workouts.reduce((n, w) => n + w.minutes, 0),
      weight: data.weights.find((w) => w.date === date)?.weight ?? null,
    };
  });
}
export function summarize(data: Store, start: string, end: string) {
  const rows = analyticsRows(data, start, end),
    logged = rows.filter((r) => r.intake !== null),
    t = targets(data.profile);
  return {
    rows,
    logged: logged.length,
    average: logged.length
      ? logged.reduce((n, r) => n + r.intake!, 0) / logged.length
      : null,
    proteinDays: t ? logged.filter((r) => r.protein! >= t.protein).length : 0,
    nearTarget: t
      ? logged.filter(
          (r) => Math.abs(r.intake! - t.calories) <= t.calories * 0.1,
        ).length
      : 0,
    belowTarget: t ? logged.filter((r) => r.intake! < t.calories).length : 0,
    activeDays: rows.filter((r) => r.workouts > 0).length,
    minutes: rows.reduce((n, r) => n + r.minutes, 0),
    burned: rows.reduce((n, r) => n + r.burned, 0),
    workouts: rows.reduce((n, r) => n + r.workouts, 0),
  };
}
