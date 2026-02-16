import { BaseExtractor } from './BaseExtractor';
import { createCodeEntity, type CodeEntity } from '../../../models/CodeEntity';

// Use any for Tree-sitter types
type SyntaxNode = any;
type Tree = any;

export class JavaScriptExtractor extends BaseExtractor {
  extractEntities(tree: Tree): CodeEntity[] {
    const entities: CodeEntity[] = [];
    const rootNode = tree.rootNode;

    this.traverse(rootNode, (node) => {
      // Extract functions
      if (node.type === 'function_declaration' || node.type === 'function') {
        const entity = this.extractFunction(node);
        if (entity) entities.push(entity);
      }

      // Extract arrow functions assigned to variables
      if (node.type === 'lexical_declaration' || node.type === 'variable_declaration') {
        const entity = this.extractVariableFunction(node);
        if (entity) entities.push(entity);
      }

      // Extract classes
      if (node.type === 'class_declaration' || node.type === 'class') {
        const entity = this.extractClass(node);
        if (entity) {
          entities.push(entity);
          // Extract methods from the class
          const methods = this.extractClassMethods(node, entity.id);
          entities.push(...methods);
        }
      }

      return true; // Continue traversal
    });

    return entities;
  }

  private extractFunction(node: SyntaxNode): CodeEntity | null {
    const nameNode = this.findChildByField(node, 'name');
    if (!nameNode) return null;

    const name = this.getNodeText(nameNode);
    const paramsNode = this.findChildByField(node, 'parameters');
    const parameters = this.extractParameters(paramsNode);

    return createCodeEntity(
      name,
      'function',
      this.language,
      this.filePath,
      this.getLocation(node),
      {
        parameters,
        isAsync: node.type === 'async_function' || this.getNodeText(node).startsWith('async'),
      }
    );
  }

  private extractVariableFunction(node: SyntaxNode): CodeEntity | null {
    // Look for arrow functions or function expressions assigned to variables
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child?.type === 'variable_declarator') {
        const nameNode = this.findChildByField(child, 'name');
        const valueNode = this.findChildByField(child, 'value');

        if (nameNode && valueNode) {
          const isFunction =
            valueNode.type === 'arrow_function' ||
            valueNode.type === 'function' ||
            valueNode.type === 'function_expression';

          if (isFunction) {
            const name = this.getNodeText(nameNode);
            const paramsNode = this.findChildByField(valueNode, 'parameters');
            const parameters = this.extractParameters(paramsNode);

            return createCodeEntity(
              name,
              'function',
              this.language,
              this.filePath,
              this.getLocation(child),
              {
                parameters,
                isAsync: this.getNodeText(valueNode).startsWith('async'),
              }
            );
          }
        }
      }
    }
    return null;
  }

  private extractClass(node: SyntaxNode): CodeEntity | null {
    const nameNode = this.findChildByField(node, 'name');
    if (!nameNode) return null;

    const name = this.getNodeText(nameNode);
    const heritageNode = this.findChildByField(node, 'heritage');

    let extendsFrom: string | undefined;
    if (heritageNode) {
      const extendsClause = this.findChild(heritageNode, 'extends_clause');
      if (extendsClause) {
        const superClass = this.findChild(extendsClause, 'identifier');
        if (superClass) {
          extendsFrom = this.getNodeText(superClass);
        }
      }
    }

    return createCodeEntity(
      name,
      'class',
      this.language,
      this.filePath,
      this.getLocation(node),
      {
        extendsFrom,
      }
    );
  }

  private extractClassMethods(classNode: SyntaxNode, parentId: string): CodeEntity[] {
    const methods: CodeEntity[] = [];
    const bodyNode = this.findChildByField(classNode, 'body');
    if (!bodyNode) return methods;

    for (let i = 0; i < bodyNode.childCount; i++) {
      const child = bodyNode.child(i);
      if (!child) continue;

      if (child.type === 'method_definition') {
        const method = this.extractMethod(child, parentId);
        if (method) methods.push(method);
      }
    }

    return methods;
  }

  private extractMethod(node: SyntaxNode, parentId: string): CodeEntity | null {
    const nameNode = this.findChildByField(node, 'name');
    if (!nameNode) return null;

    const name = this.getNodeText(nameNode);
    const paramsNode = this.findChildByField(node, 'parameters');
    const parameters = this.extractParameters(paramsNode);

    // Check if static
    const isStatic = this.getNodeText(node).startsWith('static');

    return createCodeEntity(
      name,
      'method',
      this.language,
      this.filePath,
      this.getLocation(node),
      {
        parameters,
        isStatic,
        isAsync: this.getNodeText(node).includes('async'),
      },
      parentId
    );
  }

  protected override extractParameterName(node: SyntaxNode): string | null {
    if (node.type === 'identifier') {
      return this.getNodeText(node);
    }
    if (node.type === 'required_parameter' || node.type === 'optional_parameter') {
      const pattern = this.findChild(node, 'identifier');
      if (pattern) return this.getNodeText(pattern);
    }
    return null;
  }
}
