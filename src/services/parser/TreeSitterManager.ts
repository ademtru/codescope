import type { Language } from '../../models/CodeEntity';
import { LanguageDetector } from './LanguageDetector';

// Dynamic import for web-tree-sitter
let Parser: any = null;
let TreeSitterLanguage: any = null;

export class TreeSitterManager {
  private static instance: TreeSitterManager;
  private parser: any = null;
  private languages: Map<string, any> = new Map();
  private initialized = false;

  private constructor() {}

  static getInstance(): TreeSitterManager {
    if (!TreeSitterManager.instance) {
      TreeSitterManager.instance = new TreeSitterManager();
    }
    return TreeSitterManager.instance;
  }

  /**
   * Initialize Tree-sitter
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Dynamically import web-tree-sitter
      if (!Parser) {
        const TreeSitter = await import('web-tree-sitter');
        // Get the Parser and Language classes from named exports
        Parser = TreeSitter.Parser;
        TreeSitterLanguage = TreeSitter.Language;
      }

      // Initialize Tree-sitter with the WASM file
      await Parser.init({
        locateFile() {
          return `/tree-sitter.wasm`;
        },
      });

      this.parser = new Parser();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Tree-sitter:', error);
      throw new Error('Failed to initialize Tree-sitter');
    }
  }

  /**
   * Load a language grammar
   */
  async loadLanguage(language: Language, wasmPath?: string): Promise<any> {
    if (!this.initialized || !this.parser) {
      await this.initialize();
    }

    // Check if already loaded
    const grammarName = LanguageDetector.getGrammarName(language);
    if (this.languages.has(grammarName)) {
      return this.languages.get(grammarName)!;
    }

    try {
      // Load the language grammar
      const path = wasmPath || LanguageDetector.getWasmPath(language);
      const lang = await TreeSitterLanguage.load(path);
      this.languages.set(grammarName, lang);
      return lang;
    } catch (error) {
      console.error(`Failed to load ${language} grammar:`, error);
      throw new Error(`Failed to load ${language} grammar`);
    }
  }

  /**
   * Load grammar for specific file (handles .tsx specially)
   */
  async loadLanguageForFile(filePath: string): Promise<any | null> {
    const wasmPath = LanguageDetector.getWasmPathForFile(filePath);
    if (!wasmPath) return null;

    const language = LanguageDetector.detectLanguage(filePath);
    if (!language) return null;

    // For .tsx files, use a special key
    const cacheKey = filePath.endsWith('.tsx') ? 'tsx' : LanguageDetector.getGrammarName(language);

    if (this.languages.has(cacheKey)) {
      return this.languages.get(cacheKey)!;
    }

    try {
      const lang = await TreeSitterLanguage.load(wasmPath);
      this.languages.set(cacheKey, lang);
      return lang;
    } catch (error) {
      console.error(`Failed to load grammar for ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Parse source code
   */
  async parse(code: string, language: Language, filePath?: string): Promise<any> {
    if (!this.initialized || !this.parser) {
      await this.initialize();
    }

    try {
      // Load the appropriate language grammar
      let lang: any;
      if (filePath) {
        const loadedLang = await this.loadLanguageForFile(filePath);
        if (!loadedLang) {
          throw new Error(`Unsupported file: ${filePath}`);
        }
        lang = loadedLang;
      } else {
        lang = await this.loadLanguage(language);
      }

      // Set the language and parse
      this.parser.setLanguage(lang);
      const tree = this.parser.parse(code);
      return tree;
    } catch (error) {
      console.error('Failed to parse code:', error);
      throw error;
    }
  }

  /**
   * Parse file content
   */
  async parseFile(filePath: string, content: string): Promise<any | null> {
    const language = LanguageDetector.detectLanguage(filePath);
    if (!language) {
      console.warn(`Unsupported file type: ${filePath}`);
      return null;
    }

    try {
      return await this.parse(content, language, filePath);
    } catch (error) {
      console.error(`Failed to parse file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.languages.clear();
    this.parser = null;
    this.initialized = false;
  }
}
