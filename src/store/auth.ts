import { createSignal, createRoot } from "solid-js";
import { signInWithPopup, signOut, onAuthStateChanged, type User } from "firebase/auth";
import { auth, googleProvider } from "../firebase";

function createAuthStore() {
    const [user, setUser] = createSignal<User | null>(null);
    const [loading, setLoading] = createSignal(true);
    const [error, setError] = createSignal<string | null>(null);

    onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false);
    });

    const login = async () => {
        setError(null);
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (e: any) {
            setError(e.message);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (e: any) {
            setError(e.message);
        }
    };

    return { user, loading, error, login, logout };
}

export const authStore = createRoot(createAuthStore);
