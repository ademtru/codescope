import { create } from 'zustand';
import type { EntityType, Language } from '../models/CodeEntity';
import type { RelationshipType } from '../models/Relationship';

export type LayoutDirection = 'TB' | 'LR' | 'BT' | 'RL';

interface UIState {
  // Filters
  selectedEntityTypes: Set<EntityType>;
  selectedLanguages: Set<Language>;
  selectedRelationshipTypes: Set<RelationshipType>;
  searchQuery: string;
  selectedNodeId: string | null;

  // Layout
  layoutDirection: LayoutDirection;
  nodeSpacing: number;

  // View options
  showFileLabels: boolean;
  showParameters: boolean;
  focusMode: boolean;

  // Actions
  toggleEntityType: (type: EntityType) => void;
  toggleLanguage: (language: Language) => void;
  toggleRelationshipType: (type: RelationshipType) => void;
  setSearchQuery: (query: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  setLayoutDirection: (direction: LayoutDirection) => void;
  setNodeSpacing: (spacing: number) => void;
  toggleShowFileLabels: () => void;
  toggleShowParameters: () => void;
  toggleFocusMode: () => void;
  reset: () => void;
}

const initialState = {
  selectedEntityTypes: new Set<EntityType>(['class', 'function', 'method', 'interface']),
  selectedLanguages: new Set<Language>(['javascript', 'typescript', 'java', 'python']),
  selectedRelationshipTypes: new Set<RelationshipType>(['call', 'inheritance', 'import', 'ownership', 'implements']),
  searchQuery: '',
  selectedNodeId: null,
  layoutDirection: 'TB' as LayoutDirection,
  nodeSpacing: 100,
  showFileLabels: true,
  showParameters: false,
  focusMode: false,
};

export const useUIStore = create<UIState>((set) => ({
  ...initialState,

  toggleEntityType: (type) =>
    set((state) => {
      const newSet = new Set(state.selectedEntityTypes);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return { selectedEntityTypes: newSet };
    }),

  toggleLanguage: (language) =>
    set((state) => {
      const newSet = new Set(state.selectedLanguages);
      if (newSet.has(language)) {
        newSet.delete(language);
      } else {
        newSet.add(language);
      }
      return { selectedLanguages: newSet };
    }),

  toggleRelationshipType: (type) =>
    set((state) => {
      const newSet = new Set(state.selectedRelationshipTypes);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return { selectedRelationshipTypes: newSet };
    }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  setLayoutDirection: (direction) => set({ layoutDirection: direction }),

  setNodeSpacing: (spacing) => set({ nodeSpacing: spacing }),

  toggleShowFileLabels: () =>
    set((state) => ({ showFileLabels: !state.showFileLabels })),

  toggleShowParameters: () =>
    set((state) => ({ showParameters: !state.showParameters })),

  toggleFocusMode: () =>
    set((state) => ({ focusMode: !state.focusMode })),

  reset: () => set(initialState),
}));
