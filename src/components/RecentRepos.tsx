import { useState, useEffect } from 'react';
import type { RecentRepo } from '../models/RecentRepo';
import { getRecentRepos, deleteRepo } from '../services/storage/RecentReposStorage';

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

interface RecentReposProps {
  onRestore: (repo: RecentRepo) => void;
}

export function RecentRepos({ onRestore }: RecentReposProps) {
  const [repos, setRepos] = useState<RecentRepo[]>([]);

  useEffect(() => {
    setRepos(getRecentRepos());
  }, []);

  if (repos.length === 0) return null;

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteRepo(id);
    setRepos(getRecentRepos());
  };

  return (
    <div className="mt-4 border border-gh-border rounded-gh overflow-hidden">
      <div
        className="px-4 py-2.5 flex items-center gap-2 border-b"
        style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="#8b949e">
          <path d="M1.643 3.143.427 1.927A.25.25 0 0 1 .604 1.5H2.75c.138 0 .25.112.25.25v2.146a.25.25 0 0 1-.427.177l-.708-.708a7.5 7.5 0 1 0 3.878-2.283.75.75 0 1 1-.372-1.453 9 9 0 1 1-4.656 2.727.75.75 0 0 1 .006 1.287ZM8 4a.75.75 0 0 1 .75.75v3.69l2.78 2.78a.751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018l-3-3A.75.75 0 0 1 7.25 9V4.75A.75.75 0 0 1 8 4Z" />
        </svg>
        <span className="text-[12px] font-semibold" style={{ color: '#e6edf3' }}>
          Recent
        </span>
        <span className="inline-flex items-center justify-center min-w-[18px] px-[5px] text-[11px] font-medium bg-gh-btn-bg rounded-full text-gh-fg-muted">
          {repos.length}
        </span>
      </div>
      <div className="divide-y divide-gh-border">
        {repos.map((repo) => (
          <div
            key={repo.id}
            onClick={() => onRestore(repo)}
            className="px-4 py-2.5 flex items-center gap-3 cursor-pointer transition-colors hover:bg-gh-canvas-subtle"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="#8b949e" className="flex-shrink-0">
              <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" />
            </svg>
            <div className="flex-1 min-w-0">
              <span className="text-[13px] font-semibold font-mono" style={{ color: '#58a6ff' }}>
                {repo.repoInfo.fullName}
              </span>
              <div className="flex items-center gap-3 mt-0.5 text-[11px]" style={{ color: '#6e7681' }}>
                <span>{repo.entities.length} entities</span>
                <span>{repo.relationships.length} relationships</span>
                <span>{timeAgo(repo.savedAt)}</span>
              </div>
            </div>
            <button
              onClick={(e) => handleDelete(e, repo.id)}
              className="w-6 h-6 flex items-center justify-center rounded cursor-pointer transition-colors flex-shrink-0"
              style={{ color: '#8b949e' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#21262d'; e.currentTarget.style.color = '#f85149'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8b949e'; }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
