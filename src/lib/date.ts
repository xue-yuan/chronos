const pad = (n: number) => String(n).padStart(2, '0');

export const toDateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseDateKey = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
};

export const todayKey = () => toDateKey(new Date());

export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export const shiftDateKey = (key: string, n: number) => toDateKey(addDays(parseDateKey(key), n));

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const isSameDay = (a: Date, b: Date) => toDateKey(a) === toDateKey(b);

/** ISO-8601 week: weeks start on Monday and week 1 contains the year's first Thursday. */
export const isoWeek = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
    const week = Math.ceil(((d.getTime() - yearStart) / 86400000 + 1) / 7);
    return { year: d.getUTCFullYear(), week };
};

/** Dec 28 is always in the last ISO week of its year. */
export const isoWeeksInYear = (year: number) => isoWeek(new Date(year, 11, 28)).week;

export const isoWeekStart = (year: number, week: number) => {
    const jan4 = new Date(year, 0, 4);
    const mondayOfWeek1 = addDays(jan4, -((jan4.getDay() || 7) - 1));
    return addDays(mondayOfWeek1, (week - 1) * 7);
};

export const shiftIsoWeek = (year: number, week: number, n: number) => isoWeek(addDays(isoWeekStart(year, week), n * 7));

export const compareWeek = (a: { year: number; week: number }, b: { year: number; week: number }) =>
    a.year !== b.year ? a.year - b.year : a.week - b.week;

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
