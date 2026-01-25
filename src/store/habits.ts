import { createResource, createRoot } from "solid-js";
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { authStore } from "./auth";

export interface Habit {
    id: string;
    uid: string;
    name: string;
    frequency?: number[];
    mode: 'checkbox' | 'quantifiable';
    dailyTarget?: number | null;
    increment?: number;
    unit?: string;
    description?: string;
    color?: string;
    timeOfDay?: string;
    createdAt: number;
}

function createHabitsStore() {
    const [habits, { mutate }] = createResource(
        () => authStore.user()?.uid,
        async (uid) => {
            if (!uid) return [];
            const q = query(collection(db, "habits"), where("uid", "==", uid));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ ...d.data(), id: d.id })) as Habit[];
        }
    );

    let unsubscribe: (() => void) | null = null;

    import("solid-js").then(({ createEffect, onCleanup }) => {
        createEffect(() => {
            const uid = authStore.user()?.uid;
            if (unsubscribe) {
                unsubscribe();
                unsubscribe = null;
            }

            if (uid) {
                const q = query(collection(db, "habits"), where("uid", "==", uid));
                unsubscribe = onSnapshot(q, (snapshot) => {
                    const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as Habit[];
                    mutate(data);
                });
            } else {
                mutate([]);
            }
        });

        onCleanup(() => {
            if (unsubscribe) unsubscribe();
        });
    });

    const addHabit = async (habit: Omit<Habit, "id" | "uid" | "createdAt">) => {
        const uid = authStore.user()?.uid;
        if (!uid) throw new Error("User not authenticated");

        await addDoc(collection(db, "habits"), {
            ...habit,
            uid,
            createdAt: Date.now()
        });
    };

    const updateHabit = async (id: string, data: Partial<Habit>) => {
        await updateDoc(doc(db, "habits", id), data);
    };

    const removeHabit = async (id: string) => {
        await deleteDoc(doc(db, "habits", id));
    };

    return { habits, addHabit, updateHabit, removeHabit };
}

export const habitsStore = createRoot(createHabitsStore);
