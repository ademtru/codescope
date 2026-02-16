export type RelationshipType = 'call' | 'inheritance' | 'import' | 'ownership' | 'implements';

export interface RelationshipMetadata {
  location?: {
    line: number;
    column: number;
  };
  context?: string; // Code snippet
  isExternal?: boolean; // Target is external library
}

export interface Relationship {
  id: string;
  type: RelationshipType;
  source: string; // Entity ID
  target: string; // Entity ID
  confidence: number; // 0-1 score
  metadata: RelationshipMetadata;
}

export function createRelationship(
  type: RelationshipType,
  source: string,
  target: string,
  confidence: number = 1,
  metadata: RelationshipMetadata = {}
): Relationship {
  const id = `${type}:${source}:${target}`;

  return {
    id,
    type,
    source,
    target,
    confidence,
    metadata,
  };
}
