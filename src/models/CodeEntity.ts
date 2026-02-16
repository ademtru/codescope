export type EntityType = 'class' | 'function' | 'method' | 'interface';
export type Language = 'javascript' | 'typescript' | 'java' | 'python';
export type Visibility = 'public' | 'private' | 'protected';

export interface Position {
  line: number;
  column: number;
}

export interface Location {
  start: Position;
  end: Position;
}

export interface Parameter {
  name: string;
  type?: string;
  defaultValue?: string;
}

export interface CodeEntityMetadata {
  visibility?: Visibility;
  isStatic?: boolean;
  isAsync?: boolean;
  isAbstract?: boolean;
  returnType?: string;
  parameters?: Parameter[];
  decorators?: string[];
  docstring?: string;
  extendsFrom?: string;
  implements?: string[];
}

export interface CodeEntity {
  id: string;
  name: string;
  type: EntityType;
  language: Language;
  filePath: string;
  location: Location;
  metadata: CodeEntityMetadata;
  parentId?: string; // For methods (parent class/interface)
}

export function createCodeEntity(
  name: string,
  type: EntityType,
  language: Language,
  filePath: string,
  location: Location,
  metadata: CodeEntityMetadata = {},
  parentId?: string
): CodeEntity {
  const id = `${filePath}:${location.start.line}:${name}`;

  return {
    id,
    name,
    type,
    language,
    filePath,
    location,
    metadata,
    parentId,
  };
}
