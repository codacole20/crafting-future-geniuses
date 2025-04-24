
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { getUserPassions, saveUserPassions } from '@/utils/openai';

export interface GuestUser {
  id: string;
  isGuest: true;
  email?: string;
  displayName?: string;
  passions: string[];
}

export interface AuthUser {
  id: string;
  isGuest: false;
  email: string;
  displayName: string | null;
  passions: string[];
}

export type User = GuestUser | AuthUser | null;

interface GuestUserContextType {
  user: User;
  isLoading: boolean;
  updateUserPassions: (passions: string[]) => Promise<void>;
}

const GuestUserContext = createContext<GuestUserContextType>({
  user: null,
  isLoading: true,
  updateUserPassions: async () => {}
});

export function GuestUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up authentication listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoading(true);
      if (session?.user) {
        // Authenticated user
        const passions = await getUserPassions(session.user.id);
        setUser({
          id: session.user.id,
          isGuest: false,
          email: session.user.email || '',
          displayName: session.user.user_metadata?.display_name || null,
          passions
        });
      } else {
        // Guest user
        let guestId = localStorage.getItem('guestId');
        if (!guestId) {
          guestId = uuidv4();
          localStorage.setItem('guestId', guestId);
        }
        const passions = await getUserPassions(null);
        setUser({
          id: guestId,
          isGuest: true,
          email: 'guest@example.com',
          displayName: 'Guest User',
          passions
        });
      }
      setIsLoading(false);
    });

    // Check current session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Authenticated user
        const passions = await getUserPassions(session.user.id);
        setUser({
          id: session.user.id,
          isGuest: false,
          email: session.user.email || '',
          displayName: session.user.user_metadata?.display_name || null,
          passions
        });
      } else {
        // Guest user
        let guestId = localStorage.getItem('guestId');
        if (!guestId) {
          guestId = uuidv4();
          localStorage.setItem('guestId', guestId);
        }
        const passions = await getUserPassions(null);
        setUser({
          id: guestId,
          isGuest: true,
          email: 'guest@example.com',
          displayName: 'Guest User',
          passions
        });
      }
      setIsLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const updateUserPassions = async (passions: string[]) => {
    if (!user) return;

    // Update local state
    setUser(prevUser => {
      if (!prevUser) return null;
      return { ...prevUser, passions };
    });

    // Save to storage/database
    await saveUserPassions(passions, user.isGuest ? null : user.id);
  };

  return (
    <GuestUserContext.Provider value={{ user, isLoading, updateUserPassions }}>
      {children}
    </GuestUserContext.Provider>
  );
}

export const useGuestUser = () => useContext(GuestUserContext);
