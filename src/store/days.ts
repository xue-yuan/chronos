import { createEffect, createMemo, createRoot, createSignal, onCleanup } from "solid-js";
import { collection, doc, increment, onSnapshot, query, setDoc, where, type Query } from "firebase/firestore";
import { db } from "../firebase";
import { authStore } from "./auth";
import { habitsStore } from "./habits";
import { today } from "./clock";
import { reportError } from "./toast";
import { docIds, normalizeDaily, pickPrimary, type DailyPlan, type HabitLog, type Task } from "../lib/model";
import { dayStatus, dayStreak } from "../lib/progress";

export interface DailyPatch {
    bigThing?: Partial<DailyPlan['bigThing']>;
    mediumThings?: Task[];
    smallThings?: Task[];
    habitLogs?: Record<string, HabitLog | { completed: boolean; value: ReturnType<typeof increment> }>;
    note?: string;
}

function createDaysStore() {
    const [minYear, setMinYear] = createSignal(new Date().getFullYear() - 1);
    const [plans, setPlans] = createSignal<Map<string, DailyPlan>>(new Map());
    const [ready, setReady] = createSignal(false);

    const windowStart = () => `${minYear()}-01-01`;

    createEffect(() => {
        const uid = authStore.user()?.uid;
        const start = windowStart();
        setReady(false);
        if (!uid) {
            setPlans(new Map());
            return;
        }

        const byUid = query(collection(db, "daily_plans"), where("uid", "==", uid));
        const ranged = query(byUid, where("date", ">=", start));

        const listen = (q: Query, canFallBack: boolean): (() => void) => onSnapshot(q, (snapshot) => {
            const grouped = new Map<string, DailyPlan[]>();
            for (const d of snapshot.docs) {
                const plan = normalizeDaily(d.data(), d.id);
                if (!plan.date || plan.date < start) continue;
                const list = grouped.get(plan.date);
                if (list) list.push(plan); else grouped.set(plan.date, [plan]);
            }
            const next = new Map<string, DailyPlan>();
            for (const [date, list] of grouped) next.set(date, list.length === 1 ? list[0] : pickPrimary(list)!);
            setPlans(next);
            setReady(true);
        }, (err) => {
            if (canFallBack && err.code === 'failed-precondition') {
                console.warn("[chronos] Missing Firestore index, falling back to an unbounded query.", err.message);
                unsubscribe = listen(byUid, false);
                return;
            }
            reportError("Loading your days")(err);
            setReady(true);
        });

        let unsubscribe = listen(ranged, true);
        onCleanup(() => unsubscribe());
    });

    /** Extend the live window so older years (annual view, old dates) are available. */
    const requireYear = (year: number) => {
        if (year < minYear()) setMinYear(year);
    };

    const get = (key: string) => plans().get(key) ?? null;

    const save = (key: string, patch: DailyPatch) => {
        const uid = authStore.user()?.uid;
        if (!uid || !ready()) return;
        const id = get(key)?.id ?? docIds.daily(uid, key);
        setDoc(doc(db, "daily_plans", id), { ...patch, uid, date: key }, { merge: true })
            .catch(reportError("Saving your day"));
    };

    const setHabitLog = (key: string, habitId: string, log: HabitLog, delta?: number) =>
        save(key, { habitLogs: { [habitId]: delta === undefined ? log : { completed: log.completed, value: increment(delta) } } });

    const streak = createMemo(() => dayStreak(plans(), habitsStore.habits() ?? [], today()));

    const todayStatus = createMemo(() => dayStatus(get(today()), habitsStore.habits() ?? [], today()));

    return { plans, ready, windowStart, requireYear, get, save, setHabitLog, streak, todayStatus };
}

export const daysStore = createRoot(createDaysStore);
