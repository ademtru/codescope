import type { CodeEntity } from '../../models/CodeEntity';
import type { Relationship } from '../../models/Relationship';
import { createRelationship } from '../../models/Relationship';
import type { FileContent } from '../github/types';

interface ImportInfo {
  source: string; // module path
  specifiers: string[]; // imported names
  filePath: string; // file that contains the import
}

export class RelationshipResolver {
  private entityMap: Map<string, CodeEntity> = new Map();
  private entityByName: Map<string, CodeEntity[]> = new Map();
  private fileEntities: Map<string, CodeEntity[]> = new Map();

  /**
   * Resolve all relationships between entities
   */
  resolve(entities: CodeEntity[], files: FileContent[]): Relationship[] {
    this.buildIndices(entities);

    const relationships: Relationship[] = [];

    // 1. Ownership: methods belong to their parent class
    relationships.push(...this.resolveOwnership(entities));

    // 2. Inheritance: class extends another class
    relationships.push(...this.resolveInheritance(entities));

    // 3. Imports: import statements connecting files
    relationships.push(...this.resolveImports(entities, files));

    // 4. Function calls: entity calls another entity
    relationships.push(...this.resolveCalls(entities, files));

    // Deduplicate
    const seen = new Set<string>();
    return relationships.filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  }

  private buildIndices(entities: CodeEntity[]): void {
    this.entityMap.clear();
    this.entityByName.clear();
    this.fileEntities.clear();

    for (const entity of entities) {
      this.entityMap.set(entity.id, entity);

      // Index by name (multiple entities can have the same name)
      const nameList = this.entityByName.get(entity.name) || [];
      nameList.push(entity);
      this.entityByName.set(entity.name, nameList);

      // Index by file
      const fileList = this.fileEntities.get(entity.filePath) || [];
      fileList.push(entity);
      this.fileEntities.set(entity.filePath, fileList);
    }
  }

  /**
   * Resolve ownership: methods → parent class
   */
  private resolveOwnership(entities: CodeEntity[]): Relationship[] {
    const relationships: Relationship[] = [];

    for (const entity of entities) {
      if (entity.parentId && this.entityMap.has(entity.parentId)) {
        relationships.push(
          createRelationship('ownership', entity.parentId, entity.id, 1.0, {
            context: `${entity.name} is a member of its parent`,
          })
        );
      }
    }

    return relationships;
  }

  /**
   * Resolve inheritance: class extends/implements another
   */
  private resolveInheritance(entities: CodeEntity[]): Relationship[] {
    const relationships: Relationship[] = [];

    for (const entity of entities) {
      if (entity.type !== 'class' && entity.type !== 'interface') continue;

      // Handle extends
      if (entity.metadata.extendsFrom) {
        const targets = this.entityByName.get(entity.metadata.extendsFrom);
        if (targets) {
          // Find the best match (prefer same file, then same language)
          const target = this.findBestMatch(entity, targets);
          if (target) {
            relationships.push(
              createRelationship('inheritance', entity.id, target.id, 0.9, {
                context: `${entity.name} extends ${target.name}`,
              })
            );
          }
        }
      }

      // Handle implements
      if (entity.metadata.implements) {
        for (const implName of entity.metadata.implements) {
          const targets = this.entityByName.get(implName);
          if (targets) {
            const target = this.findBestMatch(entity, targets);
            if (target) {
              relationships.push(
                createRelationship('implements', entity.id, target.id, 0.9, {
                  context: `${entity.name} implements ${target.name}`,
                })
              );
            }
          }
        }
      }
    }

    return relationships;
  }

  /**
   * Resolve imports between files
   */
  private resolveImports(
    entities: CodeEntity[],
    files: FileContent[]
  ): Relationship[] {
    const relationships: Relationship[] = [];

    for (const file of files) {
      const imports = this.parseImports(file);
      const sourceEntities = this.fileEntities.get(file.path) || [];

      for (const imp of imports) {
        // Try to resolve the import target to an entity
        for (const specifier of imp.specifiers) {
          const targets = this.entityByName.get(specifier);
          if (!targets) continue;

          // Find target that matches the import path
          const target = this.findImportTarget(imp.source, targets, file.path);
          if (!target) continue;

          // Create import relationship from a source entity in this file
          // Use the first top-level entity as source, or create file-level relationship
          const source = sourceEntities.find(
            (e) => !e.parentId
          ) || sourceEntities[0];

          if (source) {
            relationships.push(
              createRelationship('import', source.id, target.id, 0.8, {
                context: `imports ${specifier} from '${imp.source}'`,
              })
            );
          }
        }
      }
    }

    return relationships;
  }

  /**
   * Resolve function/method calls
   */
  private resolveCalls(
    entities: CodeEntity[],
    files: FileContent[]
  ): Relationship[] {
    const relationships: Relationship[] = [];
    const fileContentMap = new Map<string, string>();

    for (const file of files) {
      fileContentMap.set(file.path, file.content);
    }

    // Build a set of known entity names for quick lookup
    const knownNames = new Set<string>();
    for (const entity of entities) {
      if (entity.name.length > 1) {
        knownNames.add(entity.name);
      }
    }

    for (const entity of entities) {
      if (entity.type !== 'function' && entity.type !== 'method') continue;

      const content = fileContentMap.get(entity.filePath);
      if (!content) continue;

      // Get the entity's body text
      const bodyText = this.getEntityBody(content, entity);
      if (!bodyText) continue;

      // Scan for calls to known entities
      for (const targetName of knownNames) {
        if (targetName === entity.name) continue; // Skip self-references

        // Match function calls: name( or name.
        const callPattern = new RegExp(
          `\\b${this.escapeRegex(targetName)}\\s*\\(`,
          'g'
        );
        const newPattern = new RegExp(
          `\\bnew\\s+${this.escapeRegex(targetName)}\\s*\\(`,
          'g'
        );

        if (callPattern.test(bodyText) || newPattern.test(bodyText)) {
          const targets = this.entityByName.get(targetName)!;
          const target = this.findBestMatch(entity, targets);

          if (target && target.id !== entity.id) {
            // Don't create call relationships for ownership (method calling itself via this.method)
            if (target.parentId === entity.parentId && target.id === entity.id)
              continue;

            relationships.push(
              createRelationship('call', entity.id, target.id, 0.7, {
                context: `${entity.name} calls ${target.name}`,
              })
            );
          }
        }
      }
    }

    return relationships;
  }

  /**
   * Parse import statements from file content
   */
  private parseImports(file: FileContent): ImportInfo[] {
    const imports: ImportInfo[] = [];
    const content = file.content;
    const lang = this.detectLanguage(file.path);

    if (lang === 'python') {
      // Python: import X, from X import Y
      const fromImportRegex =
        /from\s+(\S+)\s+import\s+([^;\n]+)/g;
      const importRegex = /^import\s+(\S+)/gm;

      let match;
      while ((match = fromImportRegex.exec(content)) !== null) {
        const source = match[1];
        const specifiers = match[2]
          .split(',')
          .map((s) => s.trim().split(/\s+as\s+/)[0].trim())
          .filter(Boolean);
        imports.push({ source, specifiers, filePath: file.path });
      }

      while ((match = importRegex.exec(content)) !== null) {
        const parts = match[1].split('.');
        imports.push({
          source: match[1],
          specifiers: [parts[parts.length - 1]],
          filePath: file.path,
        });
      }
    } else if (lang === 'java') {
      // Java: import package.Class;
      const javaImportRegex = /import\s+(?:static\s+)?([^;]+);/g;
      let match;
      while ((match = javaImportRegex.exec(content)) !== null) {
        const fullPath = match[1].trim();
        const parts = fullPath.split('.');
        const className = parts[parts.length - 1];
        imports.push({
          source: fullPath,
          specifiers: [className],
          filePath: file.path,
        });
      }
    } else {
      // JavaScript/TypeScript: import { X } from 'Y'
      const esImportRegex =
        /import\s+(?:(?:\{([^}]+)\})|(?:(\w+)(?:\s*,\s*\{([^}]+)\})?))\s+from\s+['"]([^'"]+)['"]/g;
      let match;
      while ((match = esImportRegex.exec(content)) !== null) {
        const namedImports = match[1] || match[3] || '';
        const defaultImport = match[2] || '';
        const source = match[4];

        const specifiers: string[] = [];
        if (defaultImport) specifiers.push(defaultImport);
        if (namedImports) {
          specifiers.push(
            ...namedImports
              .split(',')
              .map((s) => s.trim().split(/\s+as\s+/)[0].trim())
              .filter(Boolean)
          );
        }

        imports.push({ source, specifiers, filePath: file.path });
      }

      // Also handle require()
      const requireRegex =
        /(?:const|let|var)\s+(?:\{([^}]+)\}|(\w+))\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      while ((match = requireRegex.exec(content)) !== null) {
        const namedImports = match[1] || '';
        const defaultImport = match[2] || '';
        const source = match[3];

        const specifiers: string[] = [];
        if (defaultImport) specifiers.push(defaultImport);
        if (namedImports) {
          specifiers.push(
            ...namedImports.split(',').map((s) => s.trim()).filter(Boolean)
          );
        }

        imports.push({ source, specifiers, filePath: file.path });
      }
    }

    return imports;
  }

  /**
   * Get the body of an entity from the source code
   */
  private getEntityBody(content: string, entity: CodeEntity): string | null {
    const lines = content.split('\n');
    const start = entity.location.start.line - 1;
    const end = Math.min(entity.location.end.line, lines.length);

    if (start < 0 || start >= lines.length) return null;

    return lines.slice(start, end).join('\n');
  }

  /**
   * Find the best matching entity
   */
  private findBestMatch(
    source: CodeEntity,
    candidates: CodeEntity[]
  ): CodeEntity | null {
    if (candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];

    // Prefer same file
    const sameFile = candidates.find((c) => c.filePath === source.filePath);
    if (sameFile) return sameFile;

    // Prefer same language
    const sameLang = candidates.find((c) => c.language === source.language);
    if (sameLang) return sameLang;

    // Prefer top-level entities (classes, functions) over methods
    const topLevel = candidates.find((c) => !c.parentId);
    if (topLevel) return topLevel;

    return candidates[0];
  }

  /**
   * Find the import target that matches the module path
   */
  private findImportTarget(
    importSource: string,
    candidates: CodeEntity[],
    fromFile: string
  ): CodeEntity | null {
    // For relative imports, try to match the file path
    if (importSource.startsWith('.')) {
      const resolvedPath = this.resolveRelativePath(fromFile, importSource);
      const match = candidates.find((c) =>
        this.pathMatches(c.filePath, resolvedPath)
      );
      if (match) return match;
    }

    // Fallback: return first non-method candidate
    return candidates.find((c) => !c.parentId) || candidates[0] || null;
  }

  /**
   * Resolve a relative import path
   */
  private resolveRelativePath(fromFile: string, importPath: string): string {
    const fromDir = fromFile.substring(0, fromFile.lastIndexOf('/'));
    const parts = fromDir.split('/');

    for (const segment of importPath.split('/')) {
      if (segment === '.') continue;
      if (segment === '..') {
        parts.pop();
      } else {
        parts.push(segment);
      }
    }

    return parts.join('/');
  }

  /**
   * Check if a file path matches a resolved import path
   */
  private pathMatches(filePath: string, resolvedPath: string): boolean {
    // Strip extensions for comparison
    const stripExt = (p: string) =>
      p.replace(/\.(ts|tsx|js|jsx|java|py)$/, '');

    return (
      stripExt(filePath) === stripExt(resolvedPath) ||
      filePath.includes(resolvedPath) ||
      stripExt(filePath).endsWith(stripExt(resolvedPath))
    );
  }

  private detectLanguage(
    filePath: string
  ): 'javascript' | 'typescript' | 'java' | 'python' | null {
    const ext = filePath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
      case 'mjs':
      case 'cjs':
        return 'javascript';
      case 'ts':
      case 'tsx':
      case 'mts':
      case 'cts':
        return 'typescript';
      case 'java':
        return 'java';
      case 'py':
      case 'pyw':
        return 'python';
      default:
        return null;
    }
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
