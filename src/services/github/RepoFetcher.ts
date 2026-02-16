import type { RepoInfo, FileContent, FileNode } from './types';

export class RepoFetcher {
  /**
   * Fetch raw file content from GitHub
   * Uses raw.githubusercontent.com to avoid CORS issues and rate limiting
   */
  async fetchFileContent(
    repoInfo: RepoInfo,
    filePath: string
  ): Promise<FileContent> {
    const url = `https://raw.githubusercontent.com/${repoInfo.owner}/${repoInfo.name}/${repoInfo.branch}/${filePath}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }

      const content = await response.text();

      return {
        path: filePath,
        content,
        sha: '', // SHA not available from raw fetch
        size: content.length,
      };
    } catch (error) {
      console.error(`Error fetching file ${filePath}:`, error);
      throw new Error(
        `Failed to fetch ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Fetch multiple files in parallel with concurrency limit
   */
  async fetchFiles(
    repoInfo: RepoInfo,
    files: FileNode[],
    concurrency: number = 5,
    onProgress?: (current: number, total: number) => void
  ): Promise<FileContent[]> {
    const results: FileContent[] = [];
    const total = files.length;
    let completed = 0;

    // Process files in batches
    for (let i = 0; i < files.length; i += concurrency) {
      const batch = files.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(
        batch.map(file => this.fetchFileContent(repoInfo, file.path))
      );

      for (const result of batchResults) {
        completed++;
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.warn('Failed to fetch file:', result.reason);
        }

        onProgress?.(completed, total);
      }
    }

    return results;
  }

  /**
   * Fetch file content with retry logic
   */
  async fetchFileWithRetry(
    repoInfo: RepoInfo,
    filePath: string,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<FileContent> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.fetchFileContent(repoInfo, filePath);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        if (attempt < maxRetries - 1) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
        }
      }
    }

    throw lastError || new Error('Failed to fetch file after retries');
  }
}
