import { create } from 'zustand';
import type { GraphData } from '../models/GraphData';
import type { CodeEntity } from '../models/CodeEntity';
import type { Relationship } from '../models/Relationship';

interface GraphState {
  // Graph data
  graphData: GraphData | null;

  // Parsed entities and relationships
  entities: CodeEntity[];
  relationships: Relationship[];

  // Loading state
  isParsing: boolean;
  parsingProgress: { current: number; total: number } | null;

  // Error state
  error: string | null;

  // Actions
  setGraphData: (data: GraphData) => void;
  setEntities: (entities: CodeEntity[]) => void;
  setRelationships: (relationships: Relationship[]) => void;
  addEntity: (entity: CodeEntity) => void;
  addRelationship: (relationship: Relationship) => void;
  setIsParsing: (parsing: boolean) => void;
  setParsingProgress: (current: number, total: number) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  graphData: null,
  entities: [],
  relationships: [],
  isParsing: false,
  parsingProgress: null,
  error: null,
};

export const useGraphStore = create<GraphState>((set) => ({
  ...initialState,

  setGraphData: (data) => set({ graphData: data }),

  setEntities: (entities) => set({ entities }),

  setRelationships: (relationships) => set({ relationships }),

  addEntity: (entity) =>
    set((state) => ({
      entities: [...state.entities, entity],
    })),

  addRelationship: (relationship) =>
    set((state) => ({
      relationships: [...state.relationships, relationship],
    })),

  setIsParsing: (parsing) => set({ isParsing: parsing }),

  setParsingProgress: (current, total) =>
    set({ parsingProgress: { current, total } }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));
