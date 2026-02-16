import type { CodeEntity } from '../../models/CodeEntity';
import type { Relationship } from '../../models/Relationship';
import type { FileContent } from '../github/types';
import { LanguageDetector } from './LanguageDetector';
import { TreeSitterManager } from './TreeSitterManager';
import { JavaScriptExtractor } from './extractors/JavaScriptExtractor';
import { TypeScriptExtractor } from './extractors/TypeScriptExtractor';
import { JavaExtractor } from './extractors/JavaExtractor';
import { PythonExtractor } from './extractors/PythonExtractor';
import { BaseExtractor } from './extractors/BaseExtractor';
import { RelationshipResolver } from '../graph/RelationshipResolver';

export class ParserService {
  private treeSitter: TreeSitterManager;
  private relationshipResolver: RelationshipResolver;

  constructor() {
    this.treeSitter = TreeSitterManager.getInstance();
    this.relationshipResolver = new RelationshipResolver();
  }

  /**
   * Initialize the parser
   */
  async initialize(): Promise<void> {
    await this.treeSitter.initialize();
  }

  /**
   * Parse a single file
   */
  async parseFile(file: FileContent): Promise<CodeEntity[]> {
    try {
      const language = LanguageDetector.detectLanguage(file.path);
      if (!language) {
        console.warn(`Unsupported file: ${file.path}`);
        return [];
      }

      // Parse with Tree-sitter
      const tree = await this.treeSitter.parseFile(file.path, file.content);
      if (!tree) {
        console.warn(`Failed to parse: ${file.path}`);
        return [];
      }

      // Extract entities using language-specific extractor
      const extractor = this.getExtractor(file.path, language, file.content);
      const entities = extractor.extractEntities(tree);

      return entities;
    } catch (error) {
      console.error(`Error parsing file ${file.path}:`, error);
      return [];
    }
  }

  /**
   * Parse multiple files
   */
  async parseFiles(
    files: FileContent[],
    onProgress?: (current: number, total: number) => void
  ): Promise<CodeEntity[]> {
    const allEntities: CodeEntity[] = [];
    const total = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const entities = await this.parseFile(file);
      allEntities.push(...entities);

      onProgress?.(i + 1, total);
    }

    return allEntities;
  }

  /**
   * Resolve relationships between parsed entities
   */
  resolveRelationships(
    entities: CodeEntity[],
    files: FileContent[]
  ): Relationship[] {
    return this.relationshipResolver.resolve(entities, files);
  }

  /**
   * Get appropriate extractor for language
   */
  private getExtractor(filePath: string, language: string, sourceCode: string): BaseExtractor {
    switch (language) {
      case 'typescript':
        return new TypeScriptExtractor(filePath, language as any, sourceCode);
      case 'javascript':
        return new JavaScriptExtractor(filePath, language as any, sourceCode);
      case 'java':
        return new JavaExtractor(filePath, language as any, sourceCode);
      case 'python':
        return new PythonExtractor(filePath, language as any, sourceCode);
      default:
        return new JavaScriptExtractor(filePath, language as any, sourceCode);
    }
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.treeSitter.cleanup();
  }
}
