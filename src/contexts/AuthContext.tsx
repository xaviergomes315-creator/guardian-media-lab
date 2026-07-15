import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile, UserRole, ROLE_PERMISSIONS } from '../types';
import { activityLogsService } from '../services/api';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  profileLoaded: boolean;
  error: string | null;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, role?: UserRole) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Memoize fetchProfile to avoid stale closures
  const fetchProfileWithSignal = async (userId: string, signal?: AbortSignal) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (signal?.aborted) return;

      if (error) {
        console.error('Error fetching profile:', error);
        setProfileLoaded(true);
        return;
      }

      if (data) {
        setProfile(data);
      } else {
        // Create profile if it doesn't exist
        const { data: { user } } = await supabase.auth.getUser();
        if (user && !signal?.aborted) {
          const newProfile = {
            user_id: userId,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || null,
            role: user.user_metadata?.role || 'client',
          };
          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .maybeSingle();

          if (createError) {
            console.error('Error creating profile:', createError);
          } else if (createdProfile && !signal?.aborted) {
            setProfile(createdProfile);
          }
        }
      }
      if (!signal?.aborted) {
        setProfileLoaded(true);
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      if (!signal?.aborted) {
        setProfileLoaded(true);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && !controller.signal.aborted) {
          setSession(session);
          setUser(session.user);
          await fetchProfileWithSignal(session.user.id, controller.signal);
        } else if (!controller.signal.aborted) {
          setProfileLoaded(true);
        }
      } catch (err) {
        console.error('Session check error:', err);
        if (!controller.signal.aborted) {
          setProfileLoaded(true);
        }
      }
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (controller.signal.aborted) return;

      // Run async work in immediately invoked async block to avoid deadlock
      (async () => {
        if (session) {
          setSession(session);
          setUser(session.user);
          setProfileLoaded(false);
          await fetchProfileWithSignal(session.user.id, controller.signal);

          // Update last login and log activity
          if (event === 'SIGNED_IN' && !controller.signal.aborted) {
            await supabase
              .from('profiles')
              .update({ last_login: new Date().toISOString() })
              .eq('user_id', session.user.id);

            // Fetch profile to get user name for activity log
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name, role')
              .eq('user_id', session.user.id)
              .maybeSingle();

            if (profileData && !controller.signal.aborted) {
              await activityLogsService.log({
                userId: session.user.id,
                userName: profileData.full_name || 'User',
                userRole: profileData.role,
                module: 'auth',
                action: 'User Login',
              });
            }
          }
        } else if (!controller.signal.aborted) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setProfileLoaded(true);
        }
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      })();
    });

    return () => {
      controller.abort();
      subscription.unsubscribe();
    };
  }, []);

  // Session timeout handling
  useEffect(() => {
    const timeoutRef = { current: undefined as ReturnType<typeof setTimeout> | undefined };

    const clearSession = async () => {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
    };

    const resetTimeout = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (session) {
        timeoutRef.current = setTimeout(clearSession, SESSION_TIMEOUT);
      }
    };

    const handleActivity = () => {
      resetTimeout();
    };

    if (session) {
      resetTimeout();
      window.addEventListener('mousemove', handleActivity);
      window.addEventListener('keypress', handleActivity);
      window.addEventListener('click', handleActivity);
      window.addEventListener('scroll', handleActivity);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [session]);

  const signIn = async (email: string, password: string, rememberMe?: boolean) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (rememberMe) {
        localStorage.setItem('rememberEmail', email);
      } else {
        localStorage.removeItem('rememberEmail');
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: UserRole = 'client') => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          },
        },
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    // Log logout activity before signing out
    if (user && profile) {
      await activityLogsService.log({
        userId: user.id,
        userName: profile.full_name || 'User',
        userRole: profile.role,
        module: 'auth',
        action: 'User Logout',
      });
    }

    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setProfileLoaded(false);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return { error: new Error('No profile found') };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...profile, ...updates });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!profile) return false;
    const permissions = ROLE_PERMISSIONS[profile.role];
    return permissions.includes('all') || permissions.includes(permission);
  };

  const value = {
    user,
    profile,
    session,
    loading,
    profileLoaded,
    error,
    signIn,
    signUp,
    signOut,
    updateProfile,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
