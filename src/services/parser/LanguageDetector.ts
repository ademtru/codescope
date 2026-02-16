import type { Language } from '../../models/CodeEntity';

export class LanguageDetector {
  private static extensionMap: Record<string, Language> = {
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.mjs': 'javascript',
    '.cjs': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.mts': 'typescript',
    '.cts': 'typescript',
    '.java': 'java',
    '.py': 'python',
    '.pyw': 'python',
  };

  /**
   * Detect language from file path
   */
  static detectLanguage(filePath: string): Language | null {
    const extension = this.getFileExtension(filePath);
    return this.extensionMap[extension] || null;
  }

  /**
   * Get file extension from path
   */
  private static getFileExtension(filePath: string): string {
    const match = filePath.match(/\.[^.]+$/);
    return match ? match[0].toLowerCase() : '';
  }

  /**
   * Check if file is supported
   */
  static isSupported(filePath: string): boolean {
    return this.detectLanguage(filePath) !== null;
  }

  /**
   * Get grammar name for Tree-sitter
   */
  static getGrammarName(language: Language): string {
    const grammarMap: Record<Language, string> = {
      javascript: 'javascript',
      typescript: 'typescript',
      java: 'java',
      python: 'python',
    };
    return grammarMap[language];
  }

  /**
   * Get WASM file path for language
   */
  static getWasmPath(language: Language): string {
    // Handle TypeScript specially - check if file is TSX
    const grammarName = this.getGrammarName(language);
    return `/grammars/tree-sitter-${grammarName}.wasm`;
  }

  /**
   * Get WASM path for specific file (handles .tsx specially)
   */
  static getWasmPathForFile(filePath: string): string | null {
    const language = this.detectLanguage(filePath);
    if (!language) return null;

    // Use TSX grammar for .tsx files
    if (filePath.endsWith('.tsx')) {
      return '/grammars/tree-sitter-tsx.wasm';
    }

    return this.getWasmPath(language);
  }
}
