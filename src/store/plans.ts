import { createEffect, createMemo, createSignal, onCleanup, type Accessor } from "solid-js";
import { collection, doc, onSnapshot, query, setDoc, where, type DocumentData } from "firebase/firestore";
import { db } from "../firebase";
import { authStore } from "./auth";
import { reportError } from "./toast";
import { docIds, normalizeAnnual, normalizeMonthly, normalizeWeekly, pickPrimary, type MonthlyPlan } from "../lib/model";

export type { AnnualPlan, MonthlyPlan, WeeklyPlan, DailyPlan, Task } from "../lib/model";

interface PlanKey {
    uid: string;
    id: string;
    fields: Record<string, string | number>;
}

function createPlanDoc<T extends { id: string }>(
    collectionName: string,
    keyFn: () => PlanKey | null,
    normalize: (raw: DocumentData, id: string) => T,
) {
    const key = createMemo(keyFn, null, { equals: (a, b) => a?.id === b?.id });
    const [data, setData] = createSignal<T | null>(null);
    const [ready, setReady] = createSignal(false);

    createEffect(() => {
        const k = key();
        setData(null);
        setReady(false);
        if (!k) return;

        const q = query(
            collection(db, collectionName),
            where("uid", "==", k.uid),
            ...Object.entries(k.fields).map(([field, value]) => where(field, "==", value)),
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setData(() => pickPrimary(snapshot.docs.map(d => normalize(d.data(), d.id))) ?? null);
            setReady(true);
        }, (err) => {
            reportError("Loading plan")(err);
            setReady(true);
        });
        onCleanup(unsubscribe);
    });

    const save = (patch: DocumentData) => {
        const k = key();
        if (!k || !ready()) return;
        const id = data()?.id ?? k.id;
        setDoc(doc(db, collectionName, id), { ...patch, uid: k.uid, ...k.fields }, { merge: true })
            .catch(reportError("Saving plan"));
    };

    return { data, ready, save };
}

const uid = () => authStore.user()?.uid;

export const useWeeklyPlan = (when: Accessor<{ year: number; week: number }>) =>
    createPlanDoc("weekly_plans", () => {
        const u = uid();
        if (!u) return null;
        const { year, week } = when();
        return { uid: u, id: docIds.weekly(u, year, week), fields: { year, week } };
    }, normalizeWeekly);

export const useMonthlyPlan = (when: Accessor<{ year: number; month: number }>) =>
    createPlanDoc("monthly_plans", () => {
        const u = uid();
        if (!u) return null;
        const { year, month } = when();
        return { uid: u, id: docIds.monthly(u, year, month), fields: { year, month } };
    }, normalizeMonthly);

export const useAnnualPlan = (year: Accessor<number>) =>
    createPlanDoc("annual_plans", () => {
        const u = uid();
        if (!u) return null;
        return { uid: u, id: docIds.annual(u, year()), fields: { year: year() } };
    }, normalizeAnnual);

/** All monthly plans of a year in one query, keyed by month (0-11). */
export const useMonthlyPlansOfYear = (year: Accessor<number>) => {
    const [plans, setPlans] = createSignal<Map<number, MonthlyPlan>>(new Map());
    createEffect(() => {
        const u = uid();
        const y = year();
        setPlans(new Map());
        if (!u) return;
        const q = query(collection(db, "monthly_plans"), where("uid", "==", u), where("year", "==", y));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const byMonth = new Map<number, MonthlyPlan[]>();
            for (const d of snapshot.docs) {
                const plan = normalizeMonthly(d.data(), d.id);
                byMonth.set(plan.month, [...(byMonth.get(plan.month) ?? []), plan]);
            }
            setPlans(new Map([...byMonth].map(([m, list]) => [m, pickPrimary(list)!])));
        }, reportError("Loading months"));
        onCleanup(unsubscribe);
    });
    return plans;
};
