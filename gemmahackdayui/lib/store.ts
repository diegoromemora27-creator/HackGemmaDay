import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LearnerProfile, Topic, Leccion } from './types';

interface StoreState {
  baseUrl: string;
  setBaseUrl: (url: string) => void;
  profile: LearnerProfile | null;
  setProfile: (profile: LearnerProfile | null) => void;
  topics: Topic[];
  setTopics: (topics: Topic[]) => void;
  currentLesson: Record<string, Leccion>;
  setCurrentLesson: (subtema: string, lesson: Leccion) => void;
  hasNotes: boolean;
  setHasNotes: (has: boolean) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      baseUrl: '',
      setBaseUrl: (url) => {
        set({ baseUrl: url });
        if (typeof window !== 'undefined') {
          localStorage.setItem('scq_base_url', url);
        }
      },
      profile: null,
      setProfile: (profile) => set({ profile }),
      topics: [],
      setTopics: (topics) => set({ topics }),
      currentLesson: {},
      setCurrentLesson: (subtema, lesson) =>
        set((state) => ({
          currentLesson: { ...state.currentLesson, [subtema]: lesson },
        })),
      hasNotes: false,
      setHasNotes: (has) => set({ hasNotes: has }),
    }),
    {
      name: 'study-companion-storage',
      partialize: (state) => ({ 
        profile: state.profile, 
        topics: state.topics, 
        currentLesson: state.currentLesson, 
        hasNotes: state.hasNotes 
      }), // baseUrl is handled explicitly due to legacy reason, but we can store it here too.
    }
  )
);

export type AppMode = 'student' | 'senior' | 'child' | 'default';

export const useAppMode = (): AppMode => {
  const profile = useStore((s) => s.profile);
  if (!profile) return 'default';
  
  const group = profile.grupo_etario?.toLowerCase() || '';
  const needs = profile.necesidades_especiales?.toLowerCase() || '';
  
  const isSenior = group.includes('adulto') || group.includes('adulto_mayor') || needs.includes('simple') || needs.includes('grandes');
  const isChild = group.includes('niño') || group.includes('nino') || group.includes('niña') || group.includes('infantil') || group.includes('primaria') || group.includes('pequeño') || group.includes('pequeno');
  
  if (isSenior) return 'senior';
  if (isChild) return 'child';
  return 'student';
};
