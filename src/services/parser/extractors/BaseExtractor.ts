import type { CodeEntity, Language } from '../../../models/CodeEntity';

// Use any for Tree-sitter types to avoid complex type issues
type SyntaxNode = any;
type Tree = any;
type Point = any;

export abstract class BaseExtractor {
  protected filePath: string;
  protected language: Language;
  protected sourceCode: string;

  constructor(filePath: string, language: Language, sourceCode: string) {
    this.filePath = filePath;
    this.language = language;
    this.sourceCode = sourceCode;
  }

  /**
   * Extract entities from AST
   */
  abstract extractEntities(tree: Tree): CodeEntity[];

  /**
   * Get text of a node
   */
  protected getNodeText(node: SyntaxNode): string {
    return this.sourceCode.substring(node.startIndex, node.endIndex);
  }

  /**
   * Get position from Tree-sitter point
   */
  protected getPosition(point: Point): { line: number; column: number } {
    return {
      line: point.row + 1, // Tree-sitter uses 0-based rows
      column: point.column,
    };
  }

  /**
   * Get location from Tree-sitter node
   */
  protected getLocation(node: SyntaxNode) {
    return {
      start: this.getPosition(node.startPosition),
      end: this.getPosition(node.endPosition),
    };
  }

  /**
   * Find child node by type
   */
  protected findChild(node: SyntaxNode, type: string): SyntaxNode | null {
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child?.type === type) {
        return child;
      }
    }
    return null;
  }

  /**
   * Find all children by type
   */
  protected findChildren(node: SyntaxNode, type: string): SyntaxNode[] {
    const children: SyntaxNode[] = [];
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child?.type === type) {
        children.push(child);
      }
    }
    return children;
  }

  /**
   * Find child by field name
   */
  protected findChildByField(node: SyntaxNode, fieldName: string): SyntaxNode | null {
    return node.childForFieldName(fieldName);
  }

  /**
   * Traverse tree with visitor pattern
   */
  protected traverse(
    node: SyntaxNode,
    visitor: (node: SyntaxNode) => void | boolean
  ): void {
    const shouldContinue = visitor(node);
    if (shouldContinue === false) return;

    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        this.traverse(child, visitor);
      }
    }
  }

  /**
   * Check if node is exported
   */
  protected isExported(node: SyntaxNode): boolean {
    let current: SyntaxNode | null = node;
    while (current) {
      if (current.type === 'export_statement' || current.type === 'export_declaration') {
        return true;
      }
      current = current.parent;
    }
    return false;
  }

  /**
   * Extract parameter information
   */
  protected extractParameters(paramsNode: SyntaxNode | null): Array<{ name: string; type?: string }> {
    if (!paramsNode) return [];

    const params: Array<{ name: string; type?: string }> = [];

    for (let i = 0; i < paramsNode.childCount; i++) {
      const child = paramsNode.child(i);
      if (!child) continue;

      const paramName = this.extractParameterName(child);
      const paramType = this.extractParameterType(child);

      if (paramName) {
        params.push({
          name: paramName,
          type: paramType,
        });
      }
    }

    return params;
  }

  /**
   * Extract parameter name (to be overridden by language-specific extractors)
   */
  protected extractParameterName(node: SyntaxNode): string | null {
    if (node.type === 'identifier') {
      return this.getNodeText(node);
    }
    return null;
  }

  /**
   * Extract parameter type (to be overridden by language-specific extractors)
   */
  protected extractParameterType(_node: SyntaxNode): string | undefined {
    return undefined;
  }
}
