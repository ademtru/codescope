import { useState } from 'react';
import { GitHubService } from '../services/github/GitHubService';
import { RepoFetcher } from '../services/github/RepoFetcher';
import { ParserService } from '../services/parser/ParserService';
import { useRepoStore } from '../store/useRepoStore';
import { useGraphStore } from '../store/useGraphStore';
import { saveRepo } from '../services/storage/RecentReposStorage';

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-gh-fg-subtle">
    <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin h-4 w-4 text-gh-fg-onEmphasis" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

export function RepoInput() {
  const [url, setUrl] = useState('');
  const [githubService] = useState(() => new GitHubService());
  const [repoFetcher] = useState(() => new RepoFetcher());
  const [parserService] = useState(() => new ParserService());

  const {
    setRepoInfo,
    setMetadata,
    setSupportedFiles,
    setFetchedFiles,
    setLoadingMetadata,
    setLoadingFiles,
    setLoadingProgress,
    setError,
    isLoadingMetadata,
    isLoadingFiles,
    loadingProgress,
  } = useRepoStore();

  const {
    setEntities,
    setRelationships,
    setIsParsing,
    setParsingProgress,
    setError: setParsingError,
  } = useGraphStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const repoInfo = githubService.parseGitHubUrl(url);
    if (!repoInfo) {
      setError('Invalid GitHub URL. Please use format: https://github.com/owner/repo');
      return;
    }

    setRepoInfo(repoInfo);

    try {
      setLoadingMetadata(true);
      const metadata = await githubService.fetchRepoMetadata(
        repoInfo.owner,
        repoInfo.name
      );
      setMetadata(metadata);
      setRepoInfo(metadata.info);

      const supported = githubService.getSupportedFiles(metadata.files);
      setSupportedFiles(supported);
      setLoadingMetadata(false);

      setLoadingFiles(true);
      const files = await repoFetcher.fetchFiles(
        metadata.info,
        supported,
        5,
        (current, total) => setLoadingProgress(current, total)
      );
      setFetchedFiles(files);
      setLoadingFiles(false);

      setIsParsing(true);
      try {
        await parserService.initialize();
        const entities = await parserService.parseFiles(
          files,
          (current, total) => setParsingProgress(current, total)
        );
        setEntities(entities);

        const relationships = parserService.resolveRelationships(entities, files);
        setRelationships(relationships);
        setIsParsing(false);

        // Persist to recent repos
        saveRepo({
          id: metadata.info.fullName,
          repoInfo: metadata.info,
          metadata,
          fetchedFiles: files,
          entities,
          relationships,
          savedAt: Date.now(),
        });
      } catch (parseError) {
        setParsingError(parseError instanceof Error ? parseError.message : 'Failed to parse files');
        setIsParsing(false);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load repository');
      setLoadingMetadata(false);
      setLoadingFiles(false);
    }
  };

  const { isParsing, parsingProgress } = useGraphStore();
  const isLoading = isLoadingMetadata || isLoadingFiles || isParsing;

  const getStatusText = () => {
    if (isLoadingMetadata) return 'Loading repository...';
    if (isLoadingFiles) return `Fetching files (${loadingProgress?.current || 0}/${loadingProgress?.total || 0})`;
    if (isParsing) return `Parsing (${parsingProgress?.current || 0}/${parsingProgress?.total || 0})`;
    return null;
  };

  const getProgress = () => {
    const current = loadingProgress?.current || parsingProgress?.current || 0;
    const total = loadingProgress?.total || parsingProgress?.total || 1;
    return (current / total) * 100;
  };

  const statusText = getStatusText();

  return (
    <div className="w-full max-w-3xl">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon />
          </div>
          <input
            id="repo-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a GitHub repository URL..."
            disabled={isLoading}
            className="w-full pl-10 pr-3 py-[5px] text-gh-base bg-gh-canvas border border-gh-border rounded-gh
                     text-gh-fg placeholder:text-gh-fg-subtle
                     focus:border-gh-accent-fg focus:outline-none focus:ring-1 focus:ring-gh-accent-fg
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors duration-150"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="inline-flex items-center gap-2 px-4 py-[5px] text-gh-base font-medium rounded-gh border border-transparent
                   bg-[#238636] text-gh-fg-onEmphasis
                   hover:bg-[#2ea043] cursor-pointer
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors duration-150"
        >
          {isLoading ? <SpinnerIcon /> : null}
          {isLoading ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>

      {/* Progress bar - GitHub style */}
      {isLoading && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-gh-sm text-gh-fg-muted">{statusText}</span>
            <span className="text-gh-sm text-gh-fg-subtle">{Math.round(getProgress())}%</span>
          </div>
          <div className="w-full h-2 bg-gh-btn-bg rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${getProgress()}%`,
                background: 'linear-gradient(90deg, #238636, #2ea043)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
