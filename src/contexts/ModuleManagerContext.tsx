import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { MODULES, CORE_MODULE_IDS, ModuleDefinition } from '../config/modules';
import { supabase } from '../lib/supabase';

interface ModuleManagerContextType {
  modules: ModuleDefinition[];
  enabledModules: Set<string>;
  isModuleEnabled: (moduleId: string) => boolean;
  toggleModule: (moduleId: string) => Promise<void>;
  loading: boolean;
}

const ModuleManagerContext = createContext<ModuleManagerContextType | undefined>(undefined);

const STORAGE_KEY = 'gmu_enabled_modules';

function loadFromStorage(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const arr = JSON.parse(stored) as string[];
      const ids = new Set(arr);
      CORE_MODULE_IDS.forEach((id) => ids.add(id));
      return ids;
    }
  } catch {
    // fall through to default
  }
  return new Set(MODULES.map((m) => m.id));
}

function saveToStorage(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // ignore
  }
}

export function ModuleManagerProvider({ children }: { children: ReactNode }) {
  const [enabledModules, setEnabledModules] = useState<Set<string>>(loadFromStorage);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchFromDB = async () => {
      try {
        const { data, error } = await supabase
          .from('module_settings')
          .select('module_id, is_enabled');

        if (error) throw error;

        if (!cancelled && data && data.length > 0) {
          const ids = new Set<string>();
          CORE_MODULE_IDS.forEach((id) => ids.add(id));
          data.forEach((row: { module_id: string; is_enabled: boolean }) => {
            if (row.is_enabled) ids.add(row.module_id);
          });
          setEnabledModules(ids);
          saveToStorage(ids);
        }
      } catch {
        // table may not exist yet; use localStorage defaults
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchFromDB();
    return () => {
      cancelled = true;
    };
  }, []);

  const isModuleEnabled = useCallback(
    (moduleId: string) => enabledModules.has(moduleId),
    [enabledModules],
  );

  const toggleModule = useCallback(
    async (moduleId: string) => {
      if (CORE_MODULE_IDS.includes(moduleId)) return;

      const newSet = new Set(enabledModules);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      setEnabledModules(newSet);
      saveToStorage(newSet);

      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;

        await supabase.from('module_settings').upsert(
          {
            module_id: moduleId,
            is_enabled: newSet.has(moduleId),
            updated_by: userId || null,
          },
          { onConflict: 'module_id' },
        );
      } catch {
        // table may not exist; localStorage is the fallback
      }
    },
    [enabledModules],
  );

  return (
    <ModuleManagerContext.Provider
      value={{ modules: MODULES, enabledModules, isModuleEnabled, toggleModule, loading }}
    >
      {children}
    </ModuleManagerContext.Provider>
  );
}

export function useModuleManager() {
  const ctx = useContext(ModuleManagerContext);
  if (!ctx) {
    throw new Error('useModuleManager must be used within ModuleManagerProvider');
  }
  return ctx;
}
