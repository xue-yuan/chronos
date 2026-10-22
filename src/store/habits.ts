import { createEffect, createRoot, createSignal, onCleanup } from "solid-js";
import { collection, query, where, addDoc, doc, updateDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { authStore } from "./auth";
import { reportError } from "./toast";
import { normalizeHabit, type Habit } from "../lib/model";

export type { Habit } from "../lib/model";

export type HabitInput = Omit<Habit, "id" | "uid" | "createdAt">;

function createHabitsStore() {
    const [habits, setHabits] = createSignal<Habit[] | undefined>(undefined);

    createEffect(() => {
        const uid = authStore.user()?.uid;
        setHabits(undefined);
        if (!uid) return;

        const q = query(collection(db, "habits"), where("uid", "==", uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setHabits(snapshot.docs
                .map(d => normalizeHabit(d.data(), d.id))
                .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
        }, (err) => {
            reportError("Loading habits")(err);
            setHabits([]);
        });
        onCleanup(unsubscribe);
    });

    const addHabit = (habit: HabitInput) => {
        const uid = authStore.user()?.uid;
        if (!uid) return Promise.reject(new Error("User not authenticated"));
        return addDoc(collection(db, "habits"), { ...habit, uid, createdAt: Date.now() });
    };

    const updateHabit = (id: string, data: Partial<HabitInput>) => updateDoc(doc(db, "habits", id), data);

    const removeHabit = (id: string) => deleteDoc(doc(db, "habits", id));

    return { habits, addHabit, updateHabit, removeHabit };
}

export const habitsStore = createRoot(createHabitsStore);
