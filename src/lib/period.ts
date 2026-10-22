import { addDays, isoWeek, isoWeekStart, isoWeeksInYear, parseDateKey, toDateKey } from './date.ts';

export type Zoom = 'day' | 'week' | 'month' | 'year';

export interface WeekRef { year: number; week: number }
export interface MonthRef { year: number; month: number }

const pad = (n: number) => String(n).padStart(2, '0');

export const isValidDateKey = (s: string | undefined): s is string =>
    !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && toDateKey(parseDateKey(s)) === s;

export const weekParam = (w: WeekRef) => `${w.year}-W${pad(w.week)}`;

export const parseWeekParam = (s: string | undefined): WeekRef | null => {
    const m = /^(\d{4})-W(\d{2})$/.exec(s ?? '');
    if (!m) return null;
    const year = Number(m[1]);
    const week = Number(m[2]);
    return week >= 1 && week <= isoWeeksInYear(year) ? { year, week } : null;
};

export const monthParam = (m: MonthRef) => `${m.year}-${pad(m.month + 1)}`;

export const parseMonthParam = (s: string | undefined): MonthRef | null => {
    const m = /^(\d{4})-(\d{2})$/.exec(s ?? '');
    if (!m) return null;
    const month = Number(m[2]) - 1;
    return month >= 0 && month <= 11 ? { year: Number(m[1]), month } : null;
};

export const parseYearParam = (s: string | undefined): number | null =>
    /^\d{4}$/.test(s ?? '') ? Number(s) : null;

export const href = {
    day: (key: string, today: string) => (key === today ? '/' : `/day/${key}`),
    week: (w: WeekRef) => `/week/${weekParam(w)}`,
    month: (m: MonthRef) => `/month/${monthParam(m)}`,
    year: (year: number) => `/year/${year}`,
};

export const monthOfDay = (key: string): MonthRef => {
    const d = parseDateKey(key);
    return { year: d.getFullYear(), month: d.getMonth() };
};

export const weekOfDay = (key: string): WeekRef => isoWeek(parseDateKey(key));

/** The month a week belongs to: the month containing its Thursday. */
export const monthOfWeek = (w: WeekRef): MonthRef => {
    const thursday = addDays(isoWeekStart(w.year, w.week), 3);
    return { year: thursday.getFullYear(), month: thursday.getMonth() };
};

export const daysOfWeek = (w: WeekRef) =>
    Array.from({ length: 7 }, (_, i) => toDateKey(addDays(isoWeekStart(w.year, w.week), i)));

export const daysOfMonth = (m: MonthRef) => {
    const last = new Date(m.year, m.month + 1, 0).getDate();
    return Array.from({ length: last }, (_, i) => toDateKey(new Date(m.year, m.month, i + 1)));
};

export const daysOfYear = (year: number) => {
    const keys: string[] = [];
    for (let d = new Date(year, 0, 1); d.getFullYear() === year; d = addDays(d, 1)) keys.push(toDateKey(d));
    return keys;
};

/** ISO weeks belonging to a month (4 or 5 of them). */
export const weeksOfMonth = (m: MonthRef): WeekRef[] => {
    let d = new Date(m.year, m.month, 1);
    while (d.getDay() !== 4) d = addDays(d, 1);
    const weeks: WeekRef[] = [];
    for (; d.getMonth() === m.month; d = addDays(d, 7)) weeks.push(isoWeek(d));
    return weeks;
};

/** Monday-first calendar rows covering a month, each tagged with its ISO week. */
export const monthGrid = (m: MonthRef) => {
    const first = new Date(m.year, m.month, 1);
    const last = new Date(m.year, m.month + 1, 0);
    const rows: { week: WeekRef; days: { key: string; inMonth: boolean }[] }[] = [];
    for (let start = addDays(first, -((first.getDay() || 7) - 1)); start <= last; start = addDays(start, 7)) {
        rows.push({
            week: isoWeek(start),
            days: Array.from({ length: 7 }, (_, i) => {
                const d = addDays(start, i);
                return { key: toDateKey(d), inMonth: d.getMonth() === m.month };
            }),
        });
    }
    return rows;
};

export const shiftMonth = (m: MonthRef, n: number): MonthRef => {
    const d = new Date(m.year, m.month + n, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
};

export const sameWeek = (a: WeekRef, b: WeekRef) => a.year === b.year && a.week === b.week;
export const sameMonth = (a: MonthRef, b: MonthRef) => a.year === b.year && a.month === b.month;
