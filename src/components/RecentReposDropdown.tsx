import { useState, useEffect, useRef } from 'react';
import type { RecentRepo } from '../models/RecentRepo';
import { getRecentRepos } from '../services/storage/RecentReposStorage';

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface RecentReposDropdownProps {
  currentRepoId?: string;
  onRestore: (repo: RecentRepo) => void;
}

export function RecentReposDropdown({ currentRepoId, onRestore }: RecentReposDropdownProps) {
  const [open, setOpen] = useState(false);
  const [repos, setRepos] = useState<RecentRepo[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setRepos(getRecentRepos());
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const otherRepos = repos.filter((r) => r.id !== currentRepoId);
  if (otherRepos.length === 0 && !open) {
    // Check if there are any repos at all
    const all = getRecentRepos();
    if (all.filter((r) => r.id !== currentRepoId).length === 0) return null;
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium rounded-gh cursor-pointer transition-colors"
        style={{
          backgroundColor: open ? '#30363d' : '#21262d',
          border: '1px solid #30363d',
          color: '#e6edf3',
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.backgroundColor = '#30363d'; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.backgroundColor = '#21262d'; }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M1.643 3.143.427 1.927A.25.25 0 0 1 .604 1.5H2.75c.138 0 .25.112.25.25v2.146a.25.25 0 0 1-.427.177l-.708-.708a7.5 7.5 0 1 0 3.878-2.283.75.75 0 1 1-.372-1.453 9 9 0 1 1-4.656 2.727.75.75 0 0 1 .006 1.287ZM8 4a.75.75 0 0 1 .75.75v3.69l2.78 2.78a.751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018l-3-3A.75.75 0 0 1 7.25 9V4.75A.75.75 0 0 1 8 4Z" />
        </svg>
        Recent
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.7 }}>
          <path d="m4.427 7.427 3.396 3.396a.25.25 0 0 0 .354 0l3.396-3.396A.25.25 0 0 0 11.396 7H4.604a.25.25 0 0 0-.177.427Z" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-[320px] rounded-gh overflow-hidden z-50"
          style={{
            backgroundColor: '#161b22',
            border: '1px solid #30363d',
            boxShadow: '0 8px 24px rgba(1,4,9,0.75)',
          }}
        >
          <div
            className="px-3 py-2 text-[11px] font-semibold border-b"
            style={{ color: '#8b949e', borderColor: '#30363d' }}
          >
            Switch repository
          </div>
          {otherRepos.length === 0 ? (
            <div className="px-3 py-4 text-[12px] text-center" style={{ color: '#6e7681' }}>
              No other recent repos
            </div>
          ) : (
            otherRepos.map((repo) => (
              <button
                key={repo.id}
                onClick={() => { onRestore(repo); setOpen(false); }}
                className="w-full text-left px-3 py-2.5 flex items-center gap-2.5 cursor-pointer transition-colors"
                style={{ color: '#e6edf3' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#21262d'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="#8b949e" className="flex-shrink-0">
                  <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold font-mono truncate" style={{ color: '#58a6ff' }}>
                    {repo.repoInfo.fullName}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px]" style={{ color: '#6e7681' }}>
                    <span>{repo.entities.length} entities</span>
                    <span>{timeAgo(repo.savedAt)}</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
