import { createSignal, createRoot } from "solid-js";
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, type User } from "firebase/auth";
import { clearIndexedDbPersistence, terminate } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";

const friendlyAuthError = (code: string | undefined, fallback: string) => {
    switch (code) {
        case 'auth/network-request-failed': return 'Network error. Check your connection and try again.';
        case 'auth/too-many-requests': return 'Too many attempts. Please wait a moment and try again.';
        case 'auth/unauthorized-domain': return 'This domain is not authorized for sign-in in the Firebase console.';
        case 'auth/user-disabled': return 'This account has been disabled.';
        default: return fallback;
    }
};

function createAuthStore() {
    const [user, setUser] = createSignal<User | null>(null);
    const [loading, setLoading] = createSignal(true);
    const [error, setError] = createSignal<string | null>(null);

    onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false);
    });

    getRedirectResult(auth).catch((e) => setError(friendlyAuthError(e.code, e.message)));

    const login = async () => {
        setError(null);
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (e: any) {
            if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') return;
            if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') {
                await signInWithRedirect(auth, googleProvider).catch((re) => setError(friendlyAuthError(re.code, re.message)));
                return;
            }
            setError(friendlyAuthError(e.code, e.message));
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            await terminate(db);
            await clearIndexedDbPersistence(db).catch(() => { });
        } catch (e: any) {
            setError(e.message);
        } finally {
            window.location.replace('/login');
        }
    };

    return { user, loading, error, login, logout };
}

export const authStore = createRoot(createAuthStore);
