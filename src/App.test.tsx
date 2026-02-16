import { RepoInput } from './components/RepoInput';
import { useRepoStore } from './store/useRepoStore';
import { useGraphStore } from './store/useGraphStore';

function App() {
  const { error, metadata, fetchedFiles } = useRepoStore();
  const { entities, error: parsingError } = useGraphStore();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Code Visualizer
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Visualize code structure and relationships from GitHub repositories
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        <RepoInput />

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {parsingError && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{parsingError}</p>
          </div>
        )}

        {metadata && (
          <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {metadata.info.fullName}
            </h2>
            {metadata.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {metadata.description}
              </p>
            )}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Branch:
                </span>{' '}
                <span className="text-gray-600 dark:text-gray-400">
                  {metadata.defaultBranch}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Total Files:
                </span>{' '}
                <span className="text-gray-600 dark:text-gray-400">
                  {metadata.files.length}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Supported Files:
                </span>{' '}
                <span className="text-gray-600 dark:text-gray-400">
                  {fetchedFiles.length}
                </span>
              </div>
            </div>
          </div>
        )}

        {entities.length > 0 && (
          <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Parsed Entities ({entities.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Classes:
                </span>{' '}
                <span className="text-gray-600 dark:text-gray-400">
                  {entities.filter((e) => e.type === 'class').length}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Functions:
                </span>{' '}
                <span className="text-gray-600 dark:text-gray-400">
                  {entities.filter((e) => e.type === 'function').length}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Methods:
                </span>{' '}
                <span className="text-gray-600 dark:text-gray-400">
                  {entities.filter((e) => e.type === 'method').length}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Interfaces:
                </span>{' '}
                <span className="text-gray-600 dark:text-gray-400">
                  {entities.filter((e) => e.type === 'interface').length}
                </span>
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {entities.slice(0, 50).map((entity) => (
                <div
                  key={entity.id}
                  className="text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      {entity.type}
                    </span>
                    <span className="font-mono text-gray-900 dark:text-gray-100">
                      {entity.name}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      {entity.filePath}:{entity.location.start.line}
                    </span>
                  </div>
                </div>
              ))}
              {entities.length > 50 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  ... and {entities.length - 50} more
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
