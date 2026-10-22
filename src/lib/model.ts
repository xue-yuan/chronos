export interface Task {
    id: string;
    text: string;
    completed: boolean;
}

export interface HabitLog {
    completed: boolean;
    value: number;
}

export type HabitMode = 'checkbox' | 'quantifiable';

export interface Habit {
    id: string;
    uid: string;
    name: string;
    /** Weekdays (0 = Sunday) the habit is due. Missing or empty means every day. */
    frequency?: number[];
    mode: HabitMode;
    dailyTarget?: number | null;
    increment?: number;
    unit?: string;
    description?: string;
    color?: string;
    timeOfDay?: string;
    createdAt: number;
}

export interface DailyPlan {
    id: string;
    uid: string;
    date: string;
    bigThing: { text: string; completed: boolean };
    mediumThings: Task[];
    smallThings: Task[];
    habitLogs: Record<string, HabitLog>;
    note: string;
}

export interface WeeklyPlan {
    id: string;
    uid: string;
    year: number;
    week: number;
    goals: Task[];
}

export interface MonthlyPlan {
    id: string;
    uid: string;
    year: number;
    month: number;
    milestones: (Task & { startDate?: string; endDate?: string })[];
}

export interface AnnualPlan {
    id: string;
    uid: string;
    year: number;
    goals: Task[];
}

export const MEDIUM_LIMIT = 3;
export const SMALL_LIMIT = 5;

const pad = (n: number) => String(n).padStart(2, '0');

export const docIds = {
    daily: (uid: string, date: string) => `${uid}_${date}`,
    weekly: (uid: string, year: number, week: number) => `${uid}_${year}-W${pad(week)}`,
    monthly: (uid: string, year: number, month: number) => `${uid}_${year}-${pad(month + 1)}`,
    annual: (uid: string, year: number) => `${uid}_${year}`,
};

export const newId = () => crypto.randomUUID();

const asTasks = (v: unknown): Task[] =>
    Array.isArray(v)
        ? v.filter(t => t && typeof t === 'object').map((t: any) => ({
            ...t,
            id: String(t.id ?? newId()),
            text: typeof t.text === 'string' ? t.text : '',
            completed: !!t.completed,
        }))
        : [];

export const normalizeDaily = (raw: any, id: string): DailyPlan => ({
    id,
    uid: raw.uid,
    date: raw.date,
    bigThing: {
        text: typeof raw.bigThing?.text === 'string' ? raw.bigThing.text : '',
        completed: !!raw.bigThing?.completed,
    },
    mediumThings: asTasks(raw.mediumThings),
    smallThings: asTasks(raw.smallThings),
    habitLogs: raw.habitLogs && typeof raw.habitLogs === 'object' ? raw.habitLogs : {},
    note: typeof raw.note === 'string' ? raw.note : '',
});

export const normalizeWeekly = (raw: any, id: string): WeeklyPlan => {
    let goals = asTasks(raw.goals);
    if (goals.length === 0 && typeof raw.focus === 'string' && raw.focus.trim()) {
        goals = [{ id: 'legacy-focus', text: raw.focus.trim(), completed: false }];
    }
    return { id, uid: raw.uid, year: raw.year, week: raw.week, goals };
};

export const normalizeMonthly = (raw: any, id: string): MonthlyPlan => ({
    id, uid: raw.uid, year: raw.year, month: raw.month, milestones: asTasks(raw.milestones),
});

export const normalizeAnnual = (raw: any, id: string): AnnualPlan => ({
    id, uid: raw.uid, year: raw.year, goals: asTasks(raw.goals),
});

export const normalizeHabit = (raw: any, id: string): Habit => ({
    ...raw,
    id,
    name: typeof raw.name === 'string' ? raw.name : 'Untitled',
    mode: raw.mode === 'quantifiable' ? 'quantifiable' : 'checkbox',
    frequency: Array.isArray(raw.frequency) ? raw.frequency.filter((n: unknown) => Number.isInteger(n)) : undefined,
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : 0,
});

/**
 * Older versions could create several documents for the same day/week/etc.
 * Pick one deterministically: the one with the most content, ties broken by id,
 * so every view (and every write) agrees on which document is "the" plan.
 */
export const pickPrimary = <T extends { id: string }>(docs: T[], score: (d: T) => number = d => JSON.stringify(d).length): T | undefined => {
    let best: T | undefined;
    let bestScore = -Infinity;
    for (const d of docs) {
        const s = score(d);
        if (s > bestScore || (s === bestScore && best && d.id < best.id)) {
            best = d;
            bestScore = s;
        }
    }
    return best;
};
