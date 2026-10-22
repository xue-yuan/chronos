import { parseDateKey, shiftDateKey, startOfDay, toDateKey, WEEKDAY_SHORT } from './date.ts';
import type { DailyPlan, Habit, HabitLog } from './model.ts';

export const isEveryDay = (habit: Pick<Habit, 'frequency'>) =>
    !habit.frequency || habit.frequency.length === 0 || habit.frequency.length >= 7;

export const scheduleLabel = (habit: Pick<Habit, 'frequency'>) => {
    if (isEveryDay(habit)) return 'Every day';
    const days = [...habit.frequency!].sort((a, b) => a - b);
    if (days.join() === '1,2,3,4,5') return 'Weekdays';
    if (days.join() === '0,6') return 'Weekends';
    return days.map(d => WEEKDAY_SHORT[d]).join(' · ');
};

const createdKey = (habit: Habit) => (habit.createdAt ? toDateKey(startOfDay(new Date(habit.createdAt))) : '');

export const isDueOn = (habit: Habit, dateKey: string) =>
    isEveryDay(habit) || habit.frequency!.includes(parseDateKey(dateKey).getDay());

export const isLogDone = (habit: Habit, log: HabitLog | undefined) => {
    if (!log) return false;
    if (log.completed) return true;
    if (habit.mode !== 'quantifiable') return false;
    const value = Number(log.value) || 0;
    const target = habit.dailyTarget ?? 0;
    return target > 0 ? value >= target : value > 0;
};

const hasActivity = (habit: Habit, log: HabitLog | undefined) => isLogDone(habit, log) || (Number(log?.value) || 0) > 0;

export const habitsForDay = (habits: Habit[], dateKey: string, plan: DailyPlan | null | undefined) => {
    const logs = plan?.habitLogs ?? {};
    return habits
        .filter(h => (isDueOn(h, dateKey) && createdKey(h) <= dateKey) || hasActivity(h, logs[h.id]))
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
};

export interface DayStatus {
    dueHabits: Habit[];
    habitsDone: number;
    tasksDone: number;
    tasksTotal: number;
    bigThingSet: boolean;
    bigThingDone: boolean;
    /** The streak rule: the ONE thing is done and every due habit is done. */
    complete: boolean;
    done: number;
    total: number;
    ratio: number;
}

export const dayStatus = (plan: DailyPlan | null | undefined, habits: Habit[], dateKey: string): DayStatus => {
    const dueHabits = habitsForDay(habits, dateKey, plan);
    const habitsDone = dueHabits.filter(h => isLogDone(h, plan?.habitLogs[h.id])).length;
    const tasks = [...(plan?.mediumThings ?? []), ...(plan?.smallThings ?? [])].filter(t => t.text.trim());
    const tasksDone = tasks.filter(t => t.completed).length;
    const bigThingSet = !!plan?.bigThing.text.trim();
    const bigThingDone = !!plan?.bigThing.completed;
    const total = dueHabits.length + tasks.length + (bigThingSet ? 1 : 0);
    const done = habitsDone + tasksDone + (bigThingDone ? 1 : 0);
    return {
        dueHabits,
        habitsDone,
        tasksDone,
        tasksTotal: tasks.length,
        bigThingSet,
        bigThingDone,
        complete: !!plan && bigThingDone && habitsDone === dueHabits.length,
        done,
        total,
        ratio: total ? done / total : 0,
    };
};

export const dayStreak = (plansByDate: Map<string, DailyPlan>, habits: Habit[], today: string) => {
    const isComplete = (key: string) => {
        const plan = plansByDate.get(key);
        return !!plan && dayStatus(plan, habits, key).complete;
    };
    const includesToday = isComplete(today);
    let key = includesToday ? today : shiftDateKey(today, -1);
    let count = 0;
    while (count <= plansByDate.size && isComplete(key)) {
        count++;
        key = shiftDateKey(key, -1);
    }
    return { count, includesToday };
};

export const habitStreak = (habit: Habit, plansByDate: Map<string, DailyPlan>, today: string, fromKey: string) => {
    const created = createdKey(habit);
    const start = created && created > fromKey ? created : fromKey;
    let run = 0;
    let best = 0;
    let current = 0;
    for (let key = start; key <= today; key = shiftDateKey(key, 1)) {
        const done = isLogDone(habit, plansByDate.get(key)?.habitLogs[habit.id]);
        if (done) {
            run++;
        } else if (isDueOn(habit, key) && key !== today) {
            run = 0;
        }
        best = Math.max(best, run);
        current = run;
    }
    return { current, best };
};

/** 0..1+ intensity for heatmap cells. */
export const habitIntensity = (habit: Habit, log: HabitLog | undefined) => {
    if (!log) return 0;
    if (habit.mode === 'quantifiable' && habit.dailyTarget) return Math.max(0, (Number(log.value) || 0) / habit.dailyTarget);
    return isLogDone(habit, log) ? 1 : 0;
};

export const nextLog = (habit: Habit, log: HabitLog | undefined, delta: number | 'toggle' | 'reset'): HabitLog => {
    if (delta === 'reset') return { completed: false, value: 0 };
    if (habit.mode !== 'quantifiable' || delta === 'toggle') {
        const completed = !isLogDone(habit, log);
        return { completed, value: completed ? 1 : 0 };
    }
    const value = Math.max(0, Math.round(((Number(log?.value) || 0) + delta) * 100) / 100);
    const target = habit.dailyTarget ?? 0;
    return { completed: target > 0 ? value >= target : value > 0, value };
};

/** Aggregate over a set of days, ignoring future days and days with nothing planned. */
export const rangeSummary = (keys: string[], get: (key: string) => DailyPlan | null, habits: Habit[], today: string) => {
    let tracked = 0;
    let perfect = 0;
    let sum = 0;
    for (const key of keys) {
        if (key > today) continue;
        const plan = get(key);
        if (!plan) continue;
        const s = dayStatus(plan, habits, key);
        if (s.total === 0) continue;
        tracked++;
        sum += s.ratio;
        if (s.complete) perfect++;
    }
    return { tracked, perfect, ratio: tracked ? sum / tracked : null };
};
