import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useAuthStore = create((set, get) => ({
    user: null,
    session: null,
    loading: true,

    // Initialize Auth State (non-blocking)
    initializeAuth: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            set({ session, user: session?.user ?? null, loading: false });

            // Listen for auth changes
            supabase.auth.onAuthStateChange((_event, session) => {
                set({ session, user: session?.user ?? null });
            });
        } catch {
            set({ loading: false });
        }
    },

    // Login
    signIn: async (email, password) => {
        set({ loading: true });
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        set({ loading: false });
        return { data, error };
    },

    // Logout
    signOut: async () => {
        set({ loading: true });
        await supabase.auth.signOut();
        set({ session: null, user: null, loading: false });
    }
}));
