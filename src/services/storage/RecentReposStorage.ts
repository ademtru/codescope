import type { RecentRepo } from '../../models/RecentRepo';

const STORAGE_KEY = 'recentRepos';
const MAX_REPOS = 3;

export function getRecentRepos(): RecentRepo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentRepo[];
  } catch {
    return [];
  }
}

export function saveRepo(repo: RecentRepo): void {
  try {
    const existing = getRecentRepos();
    const filtered = existing.filter((r) => r.id !== repo.id);
    const updated = [repo, ...filtered].slice(0, MAX_REPOS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

export function deleteRepo(id: string): void {
  try {
    const existing = getRecentRepos();
    const updated = existing.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // silently fail
  }
}
