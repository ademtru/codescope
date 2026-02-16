import { create } from 'zustand';
import type { RepoInfo, RepoMetadata, FileNode, FileContent } from '../services/github/types';

interface RepoState {
  // Repository info
  repoInfo: RepoInfo | null;
  metadata: RepoMetadata | null;

  // Files
  supportedFiles: FileNode[];
  fetchedFiles: FileContent[];

  // Loading states
  isLoadingMetadata: boolean;
  isLoadingFiles: boolean;
  loadingProgress: { current: number; total: number } | null;

  // Error state
  error: string | null;

  // Actions
  setRepoInfo: (info: RepoInfo) => void;
  setMetadata: (metadata: RepoMetadata) => void;
  setSupportedFiles: (files: FileNode[]) => void;
  setFetchedFiles: (files: FileContent[]) => void;
  addFetchedFile: (file: FileContent) => void;
  setLoadingMetadata: (loading: boolean) => void;
  setLoadingFiles: (loading: boolean) => void;
  setLoadingProgress: (current: number, total: number) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  repoInfo: null,
  metadata: null,
  supportedFiles: [],
  fetchedFiles: [],
  isLoadingMetadata: false,
  isLoadingFiles: false,
  loadingProgress: null,
  error: null,
};

export const useRepoStore = create<RepoState>((set) => ({
  ...initialState,

  setRepoInfo: (info) => set({ repoInfo: info }),

  setMetadata: (metadata) => set({ metadata }),

  setSupportedFiles: (files) => set({ supportedFiles: files }),

  setFetchedFiles: (files) => set({ fetchedFiles: files }),

  addFetchedFile: (file) =>
    set((state) => ({
      fetchedFiles: [...state.fetchedFiles, file],
    })),

  setLoadingMetadata: (loading) => set({ isLoadingMetadata: loading }),

  setLoadingFiles: (loading) => set({ isLoadingFiles: loading }),

  setLoadingProgress: (current, total) =>
    set({ loadingProgress: { current, total } }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));
