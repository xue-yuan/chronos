import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { authStore } from "./auth";
import { downloadFile } from "../lib/reminders";
import { todayKey } from "../lib/date";

const COLLECTIONS = ["habits", "daily_plans", "weekly_plans", "monthly_plans", "annual_plans"] as const;

/** Download everything the user owns as one JSON file. */
export const exportData = async () => {
    const uid = authStore.user()?.uid;
    if (!uid) throw new Error("Not signed in");
    const entries = await Promise.all(COLLECTIONS.map(async (name) => {
        const snap = await getDocs(query(collection(db, name), where("uid", "==", uid)));
        return [name, snap.docs.map(d => ({ id: d.id, ...d.data() }))] as const;
    }));
    const payload = { app: "chronos", version: 1, exportedAt: new Date().toISOString(), ...Object.fromEntries(entries) };
    downloadFile(`chronos-backup-${todayKey()}.json`, JSON.stringify(payload, null, 2), "application/json");
};
