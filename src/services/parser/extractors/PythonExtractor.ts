import { BaseExtractor } from './BaseExtractor';
import { createCodeEntity, type CodeEntity } from '../../../models/CodeEntity';

type SyntaxNode = any;
type Tree = any;

export class PythonExtractor extends BaseExtractor {
  extractEntities(tree: Tree): CodeEntity[] {
    const entities: CodeEntity[] = [];
    const rootNode = tree.rootNode;

    this.traverse(rootNode, (node) => {
      // Extract top-level functions
      if (node.type === 'function_definition') {
        // Skip methods (handled inside class extraction)
        if (node.parent?.type === 'block' && node.parent.parent?.type === 'class_definition') {
          return true;
        }
        const entity = this.extractFunction(node);
        if (entity) entities.push(entity);
      }

      // Extract classes
      if (node.type === 'class_definition') {
        const entity = this.extractClass(node);
        if (entity) {
          entities.push(entity);
          const methods = this.extractClassMethods(node, entity.id);
          entities.push(...methods);
        }
      }

      return true;
    });

    return entities;
  }

  private extractFunction(node: SyntaxNode): CodeEntity | null {
    const nameNode = this.findChildByField(node, 'name');
    if (!nameNode) return null;

    const name = this.getNodeText(nameNode);
    const paramsNode = this.findChildByField(node, 'parameters');
    const parameters = this.extractParameters(paramsNode);

    // Check for decorators
    const decorators = this.extractDecorators(node);

    // Check for async
    const isAsync = node.type === 'async_function_definition' ||
      (node.previousSibling?.type === 'async');

    return createCodeEntity(
      name,
      'function',
      this.language,
      this.filePath,
      this.getLocation(node),
      {
        parameters: parameters.filter((p) => p.name !== 'self' && p.name !== 'cls'),
        isAsync,
        decorators,
      }
    );
  }

  private extractClass(node: SyntaxNode): CodeEntity | null {
    const nameNode = this.findChildByField(node, 'name');
    if (!nameNode) return null;

    const name = this.getNodeText(nameNode);

    // Check for base classes
    const argsNode = this.findChildByField(node, 'superclasses');
    let extendsFrom: string | undefined;
    if (argsNode) {
      // First argument is the superclass
      const firstArg = this.findChild(argsNode, 'identifier');
      if (firstArg) {
        extendsFrom = this.getNodeText(firstArg);
        // Skip 'object' as it's implicit
        if (extendsFrom === 'object') extendsFrom = undefined;
      }
    }

    const decorators = this.extractDecorators(node);

    return createCodeEntity(
      name,
      'class',
      this.language,
      this.filePath,
      this.getLocation(node),
      {
        extendsFrom,
        decorators,
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

      if (child.type === 'function_definition') {
        const method = this.extractMethod(child, parentId);
        if (method) methods.push(method);
      }

      // Handle decorated methods
      if (child.type === 'decorated_definition') {
        const funcDef = this.findChild(child, 'function_definition');
        if (funcDef) {
          const method = this.extractMethod(funcDef, parentId);
          if (method) methods.push(method);
        }
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

    const decorators = this.extractDecorators(node);
    const isStatic = decorators?.includes('staticmethod') || false;
    const isClassMethod = decorators?.includes('classmethod') || false;
    const isAsync = node.type === 'async_function_definition';

    // Determine visibility from name convention
    const visibility = name.startsWith('__') && !name.endsWith('__')
      ? 'private' as const
      : name.startsWith('_')
      ? 'protected' as const
      : 'public' as const;

    return createCodeEntity(
      name,
      'method',
      this.language,
      this.filePath,
      this.getLocation(node),
      {
        parameters: parameters.filter(
          (p) => p.name !== 'self' && p.name !== 'cls'
        ),
        isStatic: isStatic || isClassMethod,
        isAsync,
        visibility,
        decorators,
      },
      parentId
    );
  }

  private extractDecorators(node: SyntaxNode): string[] | undefined {
    const decorators: string[] = [];

    // Check for decorated_definition parent
    const parent = node.parent;
    if (parent?.type === 'decorated_definition') {
      for (let i = 0; i < parent.childCount; i++) {
        const child = parent.child(i);
        if (child?.type === 'decorator') {
          const text = this.getNodeText(child).replace('@', '').trim();
          decorators.push(text);
        }
      }
    }

    // Check for inline decorators (preceding siblings)
    let sibling = node.previousSibling;
    while (sibling?.type === 'decorator') {
      const text = this.getNodeText(sibling).replace('@', '').trim();
      decorators.unshift(text);
      sibling = sibling.previousSibling;
    }

    return decorators.length > 0 ? decorators : undefined;
  }

  protected override extractParameterName(node: SyntaxNode): string | null {
    if (node.type === 'identifier') {
      return this.getNodeText(node);
    }
    if (
      node.type === 'default_parameter' ||
      node.type === 'typed_parameter' ||
      node.type === 'typed_default_parameter'
    ) {
      const nameNode = this.findChild(node, 'identifier');
      return nameNode ? this.getNodeText(nameNode) : null;
    }
    if (node.type === 'list_splat_pattern' || node.type === 'dictionary_splat_pattern') {
      const nameNode = this.findChild(node, 'identifier');
      return nameNode ? `*${this.getNodeText(nameNode)}` : null;
    }
    return null;
  }
}
