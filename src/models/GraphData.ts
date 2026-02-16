import type { CodeEntity } from './CodeEntity';
import type { Relationship } from './Relationship';
import type { RepoInfo } from '../services/github/types';

export interface GraphStats {
  totalFiles: number;
  totalEntities: number;
  totalRelationships: number;
  byType: Record<string, number>;
  byLanguage: Record<string, number>;
}

export interface GraphMetadata {
  repository: RepoInfo & {
    commit?: string;
  };
  stats: GraphStats;
  parsedAt: string;
}

export interface GraphData {
  entities: CodeEntity[];
  relationships: Relationship[];
  metadata: GraphMetadata;
}

export function createEmptyGraphData(repoInfo: RepoInfo): GraphData {
  return {
    entities: [],
    relationships: [],
    metadata: {
      repository: repoInfo,
      stats: {
        totalFiles: 0,
        totalEntities: 0,
        totalRelationships: 0,
        byType: {},
        byLanguage: {},
      },
      parsedAt: new Date().toISOString(),
    },
  };
}

export function calculateGraphStats(
  entities: CodeEntity[],
  relationships: Relationship[],
  totalFiles: number
): GraphStats {
  const byType: Record<string, number> = {};
  const byLanguage: Record<string, number> = {};

  for (const entity of entities) {
    byType[entity.type] = (byType[entity.type] || 0) + 1;
    byLanguage[entity.language] = (byLanguage[entity.language] || 0) + 1;
  }

  return {
    totalFiles,
    totalEntities: entities.length,
    totalRelationships: relationships.length,
    byType,
    byLanguage,
  };
}
