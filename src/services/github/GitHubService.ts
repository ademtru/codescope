import { Octokit } from '@octokit/rest';
import type { RepoInfo, RepoMetadata, FileNode } from './types';

export class GitHubService {
  private octokit: Octokit;

  constructor(token?: string) {
    this.octokit = new Octokit({
      auth: token,
    });
  }

  /**
   * Parse GitHub URL to extract owner and repo name
   */
  parseGitHubUrl(url: string): RepoInfo | null {
    const patterns = [
      /github\.com\/([^/]+)\/([^/]+)/,
      /^([^/]+)\/([^/]+)$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const owner = match[1];
        const name = match[2].replace(/\.git$/, '');
        return {
          owner,
          name,
          branch: 'main', // Will be updated when fetching repo
          fullName: `${owner}/${name}`,
        };
      }
    }

    return null;
  }

  /**
   * Fetch repository metadata including file tree
   */
  async fetchRepoMetadata(owner: string, repo: string, branch?: string): Promise<RepoMetadata> {
    try {
      // Get repository info
      const { data: repoData } = await this.octokit.repos.get({
        owner,
        repo,
      });

      const defaultBranch = branch || repoData.default_branch;

      // Get the tree
      const { data: branchData } = await this.octokit.repos.getBranch({
        owner,
        repo,
        branch: defaultBranch,
      });

      const treeSha = branchData.commit.commit.tree.sha;

      // Get the complete file tree
      const { data: treeData } = await this.octokit.git.getTree({
        owner,
        repo,
        tree_sha: treeSha,
        recursive: 'true',
      });

      // Convert tree to FileNode format
      const files: FileNode[] = (treeData.tree || [])
        .filter(item => item.type === 'blob' || item.type === 'tree')
        .map(item => ({
          path: item.path || '',
          name: item.path?.split('/').pop() || '',
          type: item.type === 'blob' ? 'file' as const : 'dir' as const,
          size: item.size,
          sha: item.sha || '',
        }));

      return {
        info: {
          owner,
          name: repo,
          branch: defaultBranch,
          fullName: `${owner}/${repo}`,
        },
        files,
        defaultBranch,
        description: repoData.description || undefined,
      };
    } catch (error) {
      console.error('Error fetching repository metadata:', error);
      throw new Error(`Failed to fetch repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if file should be parsed based on extension
   */
  isSupportedFile(filePath: string): boolean {
    const supportedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.java', '.py'];
    return supportedExtensions.some(ext => filePath.endsWith(ext));
  }

  /**
   * Get supported files from the file tree
   */
  getSupportedFiles(files: FileNode[]): FileNode[] {
    return files.filter(file =>
      file.type === 'file' && this.isSupportedFile(file.path)
    );
  }
}
