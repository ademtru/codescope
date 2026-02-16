import { useCallback, useState } from 'react';
import { RepoInput } from './components/RepoInput';
import { GraphVisualization } from './components/GraphVisualization';
import { CodePreviewPanel } from './components/CodePreviewPanel';
import { RecentRepos } from './components/RecentRepos';
import { RecentReposDropdown } from './components/RecentReposDropdown';
import { useRepoStore } from './store/useRepoStore';
import { useGraphStore } from './store/useGraphStore';
import type { CodeEntity } from './models/CodeEntity';
import type { RecentRepo } from './models/RecentRepo';

// SVG icons (GitHub-style octicons)
const RepoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" />
  </svg>
);

const GraphIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M1.5 1.75V13.5h13.75a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75V1.75a.75.75 0 0 1 1.5 0Zm14.28 2.53-5.25 5.25a.75.75 0 0 1-1.06 0L7 7.06 4.28 9.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.25-3.25a.75.75 0 0 1 1.06 0L10 7.94l4.72-4.72a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z" />
  </svg>
);

const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M2 2h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Zm4.655 8.595a.75.75 0 0 1 0 1.06L4.03 14.28a.75.75 0 0 1-1.06 0l-1.5-1.5a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018l.97.97 2.095-2.095a.75.75 0 0 1 1.06 0ZM9.75 2.5h5.5a.75.75 0 0 1 0 1.5h-5.5a.75.75 0 0 1 0-1.5Zm0 5h5.5a.75.75 0 0 1 0 1.5h-5.5a.75.75 0 0 1 0-1.5Zm0 5h5.5a.75.75 0 0 1 0 1.5h-5.5a.75.75 0 0 1 0-1.5Z" />
  </svg>
);

const BranchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" />
  </svg>
);

const FileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z" />
  </svg>
);

// Entity type badges with GitHub label colors
const ENTITY_LABEL_STYLES: Record<string, string> = {
  class: 'bg-[rgba(56,139,253,0.15)] text-[#58a6ff] border-[rgba(56,139,253,0.4)]',
  function: 'bg-[rgba(46,160,67,0.15)] text-[#3fb950] border-[rgba(46,160,67,0.4)]',
  method: 'bg-[rgba(187,128,9,0.15)] text-[#d29922] border-[rgba(187,128,9,0.4)]',
  interface: 'bg-[rgba(163,113,247,0.15)] text-[#a371f7] border-[rgba(163,113,247,0.4)]',
};

function App() {
  const { error, metadata, fetchedFiles, setRepoInfo, setMetadata, setFetchedFiles } = useRepoStore();
  const { entities, relationships, error: parsingError, setEntities, setRelationships } = useGraphStore();
  const [activeTab, setActiveTab] = useState<'graph' | 'details'>('graph');
  const [selectedEntity, setSelectedEntity] = useState<CodeEntity | null>(null);

  const restoreRepo = useCallback((repo: RecentRepo) => {
    setRepoInfo(repo.repoInfo);
    setMetadata(repo.metadata);
    setFetchedFiles(repo.fetchedFiles);
    setEntities(repo.entities);
    setRelationships(repo.relationships);
    setSelectedEntity(null);
    setActiveTab('graph');
  }, [setRepoInfo, setMetadata, setFetchedFiles, setEntities, setRelationships]);

  const classCt = entities.filter(e => e.type === 'class').length;
  const fnCt = entities.filter(e => e.type === 'function').length;
  const methodCt = entities.filter(e => e.type === 'method').length;
  const ifaceCt = entities.filter(e => e.type === 'interface').length;

  return (
    <div className="min-h-screen bg-gh-canvas">
      {/* GitHub-style header */}
      <header className="bg-gh-header border-b border-gh-border">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-6 h-16 flex items-center">
          <div className="flex items-center gap-3">
            <svg width="32" height="32" viewBox="0 0 16 16" className="text-gh-fg-onEmphasis" fill="currentColor">
              <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
            </svg>
            <h1 className="text-gh-lg font-semibold text-gh-fg-onEmphasis">
              Code Visualizer
            </h1>
          </div>
          <span className="ml-4 text-gh-sm text-gh-fg-muted hidden sm:inline">
            Visualize code structure and relationships
          </span>
          {entities.length > 0 && (
            <div className="ml-auto">
              <RecentReposDropdown
                currentRepoId={metadata?.info.fullName}
                onRestore={restoreRepo}
              />
            </div>
          )}
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6">
        <RepoInput />

        {/* Recent repos - shown when no repo is loaded */}
        {entities.length === 0 && (
          <RecentRepos onRestore={restoreRepo} />
        )}

        {/* Error banners - GitHub flash style */}
        {error && (
          <div className="mt-4 px-4 py-3 rounded-gh border border-gh-danger-muted bg-gh-danger-subtle">
            <p className="text-gh-base text-gh-danger-fg">{error}</p>
          </div>
        )}
        {parsingError && (
          <div className="mt-4 px-4 py-3 rounded-gh border border-gh-danger-muted bg-gh-danger-subtle">
            <p className="text-gh-base text-gh-danger-fg">{parsingError}</p>
          </div>
        )}

        {/* Repo metadata - GitHub repo header style */}
        {metadata && (
          <div className="mt-6 border border-gh-border rounded-gh bg-gh-canvas-subtle">
            <div className="px-4 py-3 flex items-center gap-3 border-b border-gh-border">
              <span className="text-gh-fg-muted"><RepoIcon /></span>
              <h2 className="text-gh-lg font-semibold text-gh-accent-fg">
                {metadata.info.fullName}
              </h2>
            </div>
            {metadata.description && (
              <div className="px-4 py-3 border-b border-gh-border">
                <p className="text-gh-base text-gh-fg-muted">{metadata.description}</p>
              </div>
            )}
            <div className="px-4 py-3 flex flex-wrap gap-6 text-gh-sm text-gh-fg-muted">
              <span className="flex items-center gap-1.5">
                <BranchIcon />
                {metadata.defaultBranch}
              </span>
              <span className="flex items-center gap-1.5">
                <FileIcon />
                {metadata.files.length} files
              </span>
              <span className="flex items-center gap-1.5">
                <FileIcon />
                {fetchedFiles.length} supported
              </span>
            </div>
          </div>
        )}

        {/* Results section */}
        {entities.length > 0 && (
          <div className="mt-6">
            {/* GitHub underline tab nav */}
            <div className="border-b border-gh-border">
              <nav className="flex gap-0 -mb-px">
                <button
                  onClick={() => setActiveTab('graph')}
                  className={`flex items-center gap-2 px-4 py-3 text-gh-base font-medium border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'graph'
                      ? 'text-gh-fg border-[#f78166]'
                      : 'text-gh-fg-muted border-transparent hover:text-gh-fg hover:border-gh-border-muted'
                  }`}
                >
                  <GraphIcon />
                  Graph
                  <span className="inline-flex items-center justify-center min-w-[20px] px-[6px] text-gh-sm font-medium bg-gh-btn-bg rounded-full text-gh-fg-muted">
                    {entities.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('details')}
                  className={`flex items-center gap-2 px-4 py-3 text-gh-base font-medium border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'details'
                      ? 'text-gh-fg border-[#f78166]'
                      : 'text-gh-fg-muted border-transparent hover:text-gh-fg hover:border-gh-border-muted'
                  }`}
                >
                  <ListIcon />
                  Details
                  <span className="inline-flex items-center justify-center min-w-[20px] px-[6px] text-gh-sm font-medium bg-gh-btn-bg rounded-full text-gh-fg-muted">
                    {relationships.length}
                  </span>
                </button>
              </nav>
            </div>

            {/* Summary stats bar */}
            <div className="flex flex-wrap items-center gap-3 py-3 text-gh-sm">
              <span className="flex items-center gap-1.5 text-gh-fg-muted">
                <span className="w-2 h-2 rounded-full bg-[#58a6ff]" />
                {classCt} classes
              </span>
              <span className="flex items-center gap-1.5 text-gh-fg-muted">
                <span className="w-2 h-2 rounded-full bg-[#3fb950]" />
                {fnCt} functions
              </span>
              <span className="flex items-center gap-1.5 text-gh-fg-muted">
                <span className="w-2 h-2 rounded-full bg-[#d29922]" />
                {methodCt} methods
              </span>
              <span className="flex items-center gap-1.5 text-gh-fg-muted">
                <span className="w-2 h-2 rounded-full bg-[#a371f7]" />
                {ifaceCt} interfaces
              </span>
            </div>

            {/* Graph View */}
            {activeTab === 'graph' && (
              <div className="flex gap-3">
                <div className={selectedEntity ? 'flex-1 min-w-0' : 'w-full'}>
                  <GraphVisualization
                    entities={entities}
                    relationships={relationships}
                    onEntitySelect={setSelectedEntity}
                  />
                </div>
                {selectedEntity && (
                  <div className="flex-shrink-0">
                    <CodePreviewPanel
                      entity={selectedEntity}
                      files={fetchedFiles}
                      onClose={() => setSelectedEntity(null)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Details View */}
            {activeTab === 'details' && (
              <div className="border border-gh-border rounded-gh overflow-hidden">
                {/* Relationship summary header */}
                {relationships.length > 0 && (
                  <div className="px-4 py-3 bg-gh-canvas-subtle border-b border-gh-border flex flex-wrap gap-4 text-gh-sm">
                    <span className="text-gh-fg-muted">
                      <span className="text-gh-fg font-medium">{relationships.filter(r => r.type === 'call').length}</span> calls
                    </span>
                    <span className="text-gh-fg-muted">
                      <span className="text-gh-fg font-medium">{relationships.filter(r => r.type === 'inheritance').length}</span> inheritance
                    </span>
                    <span className="text-gh-fg-muted">
                      <span className="text-gh-fg font-medium">{relationships.filter(r => r.type === 'import').length}</span> imports
                    </span>
                    <span className="text-gh-fg-muted">
                      <span className="text-gh-fg font-medium">{relationships.filter(r => r.type === 'ownership').length}</span> ownership
                    </span>
                    <span className="text-gh-fg-muted">
                      <span className="text-gh-fg font-medium">{relationships.filter(r => r.type === 'implements').length}</span> implements
                    </span>
                  </div>
                )}

                {/* Entity list - GitHub file list style */}
                <div className="max-h-[500px] overflow-y-auto divide-y divide-gh-border">
                  {entities.slice(0, 150).map((entity) => (
                    <div
                      key={entity.id}
                      className="px-4 py-2.5 flex items-center gap-3 hover:bg-gh-canvas-subtle transition-colors cursor-pointer"
                      onClick={() => { setSelectedEntity(entity); setActiveTab('graph'); }}
                    >
                      <span className={`inline-flex items-center px-2 py-0.5 text-gh-sm font-medium rounded-full border ${ENTITY_LABEL_STYLES[entity.type] || ''}`}>
                        {entity.type}
                      </span>
                      <span className="font-mono text-gh-base text-gh-fg truncate">
                        {entity.name}
                      </span>
                      <span className="ml-auto text-gh-sm text-gh-fg-subtle font-mono whitespace-nowrap">
                        {entity.filePath.split('/').slice(-2).join('/')}:{entity.location.start.line}
                      </span>
                    </div>
                  ))}
                  {entities.length > 150 && (
                    <div className="px-4 py-3 text-gh-sm text-gh-fg-muted text-center bg-gh-canvas-subtle">
                      ... and {entities.length - 150} more entities
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
