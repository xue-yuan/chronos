import { createResource, createRoot, createSignal } from "solid-js";
import { collection, query, where, getDocs, addDoc, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { authStore } from "./auth";

export interface AnnualPlan {
    id: string;
    uid: string;
    year: number;
    goals: { id: string; text: string; completed: boolean }[];
}

export interface MonthlyPlan {
    id: string;
    uid: string;
    year: number;
    month: number;
    milestones: { id: string; text: string; startDate: string; endDate: string; completed: boolean }[];
}

export interface WeeklyPlan {
    id: string;
    uid: string;
    year: number;
    week: number;
    focus: string;
    goals: { id: string; text: string; completed: boolean }[];
    blocks: { dayIndex: number; time: string; activity: string }[];
}

export interface DailyPlan {
    id: string;
    uid: string;
    date: string;
    bigThing: { text: string; completed: boolean };
    mediumThings: { id: string; text: string; completed: boolean }[];
    smallThings: { id: string; text: string; completed: boolean }[];
    habitLogs: { [habitId: string]: { completed: boolean; value: number } };
}

function createPlansStore() {
    const [viewDate, setViewDate] = createSignal(new Date());

    const [annualViewYear, setAnnualViewYear] = createSignal(new Date().getFullYear());

    const [monthlyViewYear, setMonthlyViewYear] = createSignal(new Date().getFullYear());
    const [monthlyViewMonth, setMonthlyViewMonth] = createSignal(new Date().getMonth());

    const [weeklyViewYear, setWeeklyViewYear] = createSignal(new Date().getFullYear());
    const [weeklyViewWeek, setWeeklyViewWeek] = createSignal(getWeekNumber(new Date()));

    const getTodayStr = () => {
        const d = viewDate();
        const offset = d.getTimezoneOffset();
        const local = new Date(d.getTime() - (offset * 60 * 1000));
        return local.toISOString().split('T')[0];
    };

    const prevDay = () => setViewDate(d => {
        const next = new Date(d);
        next.setDate(d.getDate() - 1);
        return next;
    });

    const nextDay = () => setViewDate(d => {
        const next = new Date(d);
        next.setDate(d.getDate() + 1);
        return next;
    });

    const prevYear = () => setAnnualViewYear(y => y - 1);
    const nextYear = () => setAnnualViewYear(y => y + 1);
    const resetAnnualView = () => setAnnualViewYear(new Date().getFullYear());

    const prevMonth = () => setMonthlyViewMonth(m => {
        if (m === 0) {
            setMonthlyViewYear(y => y - 1);
            return 11;
        }
        return m - 1;
    });

    const nextMonth = () => setMonthlyViewMonth(m => {
        if (m === 11) {
            setMonthlyViewYear(y => y + 1);
            return 0;
        }
        return m + 1;
    });
    const resetMonthlyView = () => {
        const d = new Date();
        setMonthlyViewYear(d.getFullYear());
        setMonthlyViewMonth(d.getMonth());
    };

    const prevWeek = () => setWeeklyViewWeek(w => {
        if (w === 1) {
            setWeeklyViewYear(y => y - 1);
            return 52;
        }
        return w - 1;
    });
    const nextWeek = () => setWeeklyViewWeek(w => {
        if (w === 52) {
            setWeeklyViewYear(y => y + 1);
            return 1;
        }
        return w + 1;
    });
    const resetWeeklyView = () => {
        const d = new Date();
        setWeeklyViewYear(d.getFullYear());
        setWeeklyViewWeek(getWeekNumber(d));
    };

    const [todayPlan, { mutate: mutateToday }] = createResource(
        () => ({ uid: authStore.user()?.uid, date: getTodayStr() }),
        async ({ uid, date }) => {
            if (!uid) return null;
            const q = query(collection(db, "daily_plans"), where("uid", "==", uid), where("date", "==", date));
            const snap = await getDocs(q);
            if (!snap.empty) {
                return { ...snap.docs[0].data(), id: snap.docs[0].id } as DailyPlan;
            }
            return null;
        }
    );

    import("solid-js").then(({ createEffect, onCleanup }) => {
        let unsubscribe: (() => void) | null = null;
        createEffect(() => {
            const uid = authStore.user()?.uid;
            const date = getTodayStr();

            if (unsubscribe) {
                unsubscribe();
                unsubscribe = null;
            }

            if (uid) {
                const q = query(collection(db, "daily_plans"), where("uid", "==", uid), where("date", "==", date));
                unsubscribe = onSnapshot(q, (snapshot) => {
                    if (!snapshot.empty) {
                        mutateToday({ ...snapshot.docs[0].data(), id: snapshot.docs[0].id } as DailyPlan);
                    } else {
                        mutateToday(null);
                    }
                });
            }
        });
        onCleanup(() => unsubscribe && unsubscribe());
    });

    const ensureTodayPlan = async (currentHabits?: any[]) => {
        const uid = authStore.user()?.uid;
        if (!uid) return;
        const date = getTodayStr();

        const viewingDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        viewingDate.setHours(0, 0, 0, 0);
        const isPast = viewingDate < today;

        let allHabits = currentHabits;
        if (!allHabits) {
            const habitsQ = query(collection(db, "habits"), where("uid", "==", uid));
            const habitsSnap = await getDocs(habitsQ);
            allHabits = habitsSnap.docs.map(d => ({ ...d.data(), id: d.id }));
        }

        const todaysHabits = allHabits!;

        let planToUpdate = todayPlan();

        if (!planToUpdate) {
            const q = query(collection(db, "daily_plans"), where("uid", "==", uid), where("date", "==", date));
            const snap = await getDocs(q);
            if (!snap.empty) {
                planToUpdate = { ...snap.docs[0].data(), id: snap.docs[0].id } as DailyPlan;
                mutateToday(planToUpdate);
            }
        }

        if (!planToUpdate && isPast) {
            return;
        }

        if (!planToUpdate) {
            const newPlan: Omit<DailyPlan, "id"> = {
                uid,
                date,
                bigThing: { text: "", completed: false },
                mediumThings: [],
                smallThings: [],
                habitLogs: {}
            };

            todaysHabits.forEach(h => {
                newPlan.habitLogs[h.id] = { completed: false, value: 0 };
            });

            await addDoc(collection(db, "daily_plans"), newPlan);
        } else {
            const updates: any = {};
            todaysHabits.forEach(h => {
                if (!planToUpdate!.habitLogs[h.id]) {
                    updates[`habitLogs.${h.id}`] = { completed: false, value: 0 };
                }
            });

            if (!planToUpdate.mediumThings) {
                updates.mediumThings = [];
            }
            if (!planToUpdate.smallThings) {
                updates.smallThings = [];
            }

            if (Object.keys(updates).length > 0) {
                await updateDoc(doc(db, "daily_plans", planToUpdate.id), updates);
            }
        }
    };

    const updateDailyPlan = async (id: string, data: Partial<DailyPlan>) => {
        await updateDoc(doc(db, "daily_plans", id), data);
    };

    const toggleHabit = async (planId: string, habitId: string, currentLog: { completed: boolean, value: number } | undefined, mode: 'checkbox' | 'quantifiable', target: number = 0, increment: number = 0) => {
        if (!planId) return;

        const log = currentLog || { completed: false, value: 0 };
        let newLog = { ...log };

        if (mode === 'checkbox') {
            newLog.completed = !newLog.completed;
            newLog.value = newLog.completed ? 1 : 0;
        } else {
            newLog.value = (newLog.value || 0) + increment;
            if (newLog.value >= target) {
                newLog.completed = true;
            }
        }

        await updateDoc(doc(db, "daily_plans", planId), {
            [`habitLogs.${habitId}`]: newLog
        });
    };

    const [annualPlan, { mutate: mutateAnnual }] = createResource(
        () => ({ uid: authStore.user()?.uid, year: annualViewYear() }),
        async ({ uid, year }) => {
            if (!uid) return null;
            const q = query(collection(db, "annual_plans"), where("uid", "==", uid), where("year", "==", year));
            const snap = await getDocs(q);
            if (!snap.empty) {
                return { ...snap.docs[0].data(), id: snap.docs[0].id } as AnnualPlan;
            }
            return null;
        }
    );

    const ensureAnnualPlan = async () => {
        const uid = authStore.user()?.uid;
        if (!uid) return;
        if (annualPlan.loading) return;

        const year = annualViewYear();
        let plan = annualPlan();

        if (!plan) {
            const q = query(collection(db, "annual_plans"), where("uid", "==", uid), where("year", "==", year));
            const snap = await getDocs(q);
            if (!snap.empty) {
                plan = { ...snap.docs[0].data(), id: snap.docs[0].id } as AnnualPlan;
                mutateAnnual(plan);
            }
        }

        if (!plan) {
            const newPlan: Omit<AnnualPlan, "id"> = {
                uid,
                year,
                goals: []
            };

            mutateAnnual({ ...newPlan, id: "temp-annual" } as AnnualPlan);
        }
    }

    const updateAnnualPlan = async (data: Partial<AnnualPlan>) => {
        const plan = annualPlan();
        if (plan) {
            mutateAnnual({ ...plan, ...data });

            if (plan.id === "temp-annual") {
                const { id, ...rest } = plan;
                const finalPlan = { ...rest, ...data };
                const docRef = await addDoc(collection(db, "annual_plans"), finalPlan);
                mutateAnnual({ ...finalPlan, id: docRef.id } as AnnualPlan);
            } else {
                await updateDoc(doc(db, "annual_plans", plan.id), data);
            }
        }
    }

    const [monthlyPlan, { mutate: mutateMonthly }] = createResource(
        () => ({ uid: authStore.user()?.uid, year: monthlyViewYear(), month: monthlyViewMonth() }),
        async ({ uid, year, month }) => {
            if (!uid) return null;
            const q = query(collection(db, "monthly_plans"), where("uid", "==", uid), where("year", "==", year), where("month", "==", month));
            const snap = await getDocs(q);
            if (!snap.empty) {
                return { ...snap.docs[0].data(), id: snap.docs[0].id } as MonthlyPlan;
            }
            return null;
        }
    );

    const ensureMonthlyPlan = async () => {
        const uid = authStore.user()?.uid;
        if (!uid) return;
        if (monthlyPlan.loading) return;

        const year = monthlyViewYear();
        const month = monthlyViewMonth();

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        const isPast = year < currentYear || (year === currentYear && month < currentMonth);

        let plan = monthlyPlan();

        if (!plan) {
            const q = query(collection(db, "monthly_plans"), where("uid", "==", uid), where("year", "==", year), where("month", "==", month));
            const snap = await getDocs(q);
            if (!snap.empty) {
                plan = { ...snap.docs[0].data(), id: snap.docs[0].id } as MonthlyPlan;
                mutateMonthly(plan);
            }
        }

        if (!plan) {
            const newPlan: Omit<MonthlyPlan, "id"> = {
                uid,
                year,
                month,
                milestones: []
            };

            if (isPast) {
                mutateMonthly({ ...newPlan, id: "temp-readonly" } as MonthlyPlan);
            } else {
                const docRef = await addDoc(collection(db, "monthly_plans"), newPlan);
                mutateMonthly({ ...newPlan, id: docRef.id } as MonthlyPlan);
            }
        }
    }

    const updateMonthlyPlan = async (data: Partial<MonthlyPlan>) => {
        const plan = monthlyPlan();
        if (plan) {
            mutateMonthly({ ...plan, ...data });
            await updateDoc(doc(db, "monthly_plans", plan.id), data);
        }
    }

    function getWeekNumber(d: Date) {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        var weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        return weekNo;
    }

    const [weeklyPlan, { mutate: mutateWeekly }] = createResource(
        () => ({ uid: authStore.user()?.uid, year: weeklyViewYear(), week: weeklyViewWeek() }),
        async ({ uid, year, week }) => {
            if (!uid) return null;
            const q = query(collection(db, "weekly_plans"), where("uid", "==", uid), where("year", "==", year), where("week", "==", week));
            const snap = await getDocs(q);
            if (!snap.empty) {
                return { ...snap.docs[0].data(), id: snap.docs[0].id } as WeeklyPlan;
            }
            return null;
        }
    );

    const ensureWeeklyPlan = async () => {
        const uid = authStore.user()?.uid;
        if (!uid) return;
        if (weeklyPlan.loading) return;

        const year = weeklyViewYear();
        const week = weeklyViewWeek();

        const currentYear = new Date().getFullYear();
        const currentWeek = getWeekNumber(new Date());
        const isPast = year < currentYear || (year === currentYear && week < currentWeek);

        let plan = weeklyPlan();

        if (!plan) {
            const q = query(collection(db, "weekly_plans"), where("uid", "==", uid), where("year", "==", year), where("week", "==", week));
            const snap = await getDocs(q);
            if (!snap.empty) {
                plan = { ...snap.docs[0].data(), id: snap.docs[0].id } as WeeklyPlan;
                mutateWeekly(plan);
            }
        }

        if (!plan) {
            const newPlan: Omit<WeeklyPlan, "id"> = {
                uid,
                year,
                week,
                focus: "",
                goals: [],
                blocks: []
            };

            if (isPast) {
                mutateWeekly({ ...newPlan, id: "temp-readonly" } as WeeklyPlan);
            } else {
                const docRef = await addDoc(collection(db, "weekly_plans"), newPlan);
                mutateWeekly({ ...newPlan, id: docRef.id } as WeeklyPlan);
            }
        }
    }

    const updateWeeklyPlan = async (data: Partial<WeeklyPlan>) => {
        const plan = weeklyPlan();
        if (plan) {
            mutateWeekly({ ...plan, ...data });
            await updateDoc(doc(db, "weekly_plans", plan.id), data);
        }
    }

    const [currentStreak, setCurrentStreak] = createSignal(0);

    import("solid-js").then(({ createEffect, onCleanup }) => {
        createEffect(() => {
            const uid = authStore.user()?.uid;
            if (!uid) {
                setCurrentStreak(0);
                return;
            }

            const q = query(
                collection(db, "daily_plans"),
                where("uid", "==", uid),
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const plans = snapshot.docs.map(d => d.data() as DailyPlan);
                plans.sort((a, b) => b.date.localeCompare(a.date));

                if (plans.length === 0) {
                    setCurrentStreak(0);
                    return;
                }

                const toDateStr = (d: Date) => {
                    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                };

                const isFullyCompleted = (plan: DailyPlan) => {
                    const bigThingDone = plan.bigThing?.completed;
                    const habitLogs = Object.values(plan.habitLogs || {});
                    const allHabitsDone = habitLogs.length > 0
                        ? habitLogs.every(log => log.completed || log.value > 0)
                        : true;

                    return bigThingDone && allHabitsDone;
                };

                let streak = 0;
                let d = new Date();
                d.setDate(d.getDate() - 1);

                while (true) {
                    const dStr = toDateStr(d);
                    const p = plans.find(p => p.date === dStr);
                    if (p && isFullyCompleted(p)) {
                        streak++;
                        d.setDate(d.getDate() - 1);
                    } else {
                        break;
                    }
                }

                setCurrentStreak(streak);
            });

            onCleanup(() => unsubscribe());
        });
    });

    return {
        viewDate, setViewDate,
        annualViewYear, setAnnualViewYear, resetAnnualView,
        monthlyViewYear, setMonthlyViewYear, monthlyViewMonth, setMonthlyViewMonth, resetMonthlyView,
        weeklyViewYear, setWeeklyViewYear, weeklyViewWeek, setWeeklyViewWeek, resetWeeklyView,
        prevDay, nextDay,
        prevYear, nextYear,
        prevMonth, nextMonth,
        prevWeek, nextWeek,
        todayPlan, ensureTodayPlan, updateDailyPlan, toggleHabit,
        annualPlan, ensureAnnualPlan, updateAnnualPlan,
        monthlyPlan, ensureMonthlyPlan, updateMonthlyPlan,
        weeklyPlan, ensureWeeklyPlan, updateWeeklyPlan,
        getWeekNumber,
        currentStreak
    };
}

export const plansStore = createRoot(createPlansStore);
