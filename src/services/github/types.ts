export interface RepoInfo {
  owner: string;
  name: string;
  branch: string;
  fullName: string;
}

export interface FileNode {
  path: string;
  name: string;
  type: 'file' | 'dir';
  size?: number;
  sha: string;
}

export interface FileContent {
  path: string;
  content: string;
  sha: string;
  size: number;
}

export interface RepoMetadata {
  info: RepoInfo;
  files: FileNode[];
  defaultBranch: string;
  description?: string;
}
