import type { RepoInfo, RepoMetadata, FileContent } from '../services/github/types';
import type { CodeEntity } from './CodeEntity';
import type { Relationship } from './Relationship';

export interface RecentRepo {
  id: string;              // "owner/name"
  repoInfo: RepoInfo;
  metadata: RepoMetadata;
  fetchedFiles: FileContent[];
  entities: CodeEntity[];
  relationships: Relationship[];
  savedAt: number;         // Date.now()
}
