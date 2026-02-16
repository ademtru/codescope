import { BaseExtractor } from './BaseExtractor';
import { createCodeEntity, type CodeEntity } from '../../../models/CodeEntity';

type SyntaxNode = any;
type Tree = any;

export class JavaExtractor extends BaseExtractor {
  extractEntities(tree: Tree): CodeEntity[] {
    const entities: CodeEntity[] = [];
    const rootNode = tree.rootNode;

    this.traverse(rootNode, (node) => {
      // Extract classes
      if (node.type === 'class_declaration') {
        const entity = this.extractClass(node);
        if (entity) {
          entities.push(entity);
          const methods = this.extractMethods(node, entity.id);
          entities.push(...methods);
        }
      }

      // Extract interfaces
      if (node.type === 'interface_declaration') {
        const entity = this.extractInterface(node);
        if (entity) {
          entities.push(entity);
          const methods = this.extractInterfaceMethods(node, entity.id);
          entities.push(...methods);
        }
      }

      return true;
    });

    return entities;
  }

  private extractClass(node: SyntaxNode): CodeEntity | null {
    const nameNode = this.findChildByField(node, 'name');
    if (!nameNode) return null;

    const name = this.getNodeText(nameNode);

    // Check for extends
    const superclassNode = this.findChildByField(node, 'superclass');
    let extendsFrom: string | undefined;
    if (superclassNode) {
      extendsFrom = this.getNodeText(superclassNode);
    }

    // Check for implements
    const interfacesNode = this.findChildByField(node, 'interfaces');
    let implementsList: string[] | undefined;
    if (interfacesNode) {
      implementsList = [];
      this.traverse(interfacesNode, (child) => {
        if (child.type === 'type_identifier') {
          implementsList!.push(this.getNodeText(child));
        }
        return true;
      });
    }

    // Check modifiers
    const modifiersNode = this.findChild(node, 'modifiers');
    const modText = modifiersNode ? this.getNodeText(modifiersNode) : '';
    const isAbstract = modText.includes('abstract');
    const visibility = modText.includes('private')
      ? 'private' as const
      : modText.includes('protected')
      ? 'protected' as const
      : 'public' as const;

    return createCodeEntity(
      name,
      'class',
      this.language,
      this.filePath,
      this.getLocation(node),
      {
        extendsFrom,
        implements: implementsList,
        isAbstract,
        visibility,
      }
    );
  }

  private extractInterface(node: SyntaxNode): CodeEntity | null {
    const nameNode = this.findChildByField(node, 'name');
    if (!nameNode) return null;

    const name = this.getNodeText(nameNode);

    // Check for extends
    const extendsNode = this.findChildByField(node, 'extends_interfaces');
    let extendsFrom: string | undefined;
    if (extendsNode) {
      const typeId = this.findChild(extendsNode, 'type_identifier');
      if (typeId) extendsFrom = this.getNodeText(typeId);
    }

    return createCodeEntity(
      name,
      'interface',
      this.language,
      this.filePath,
      this.getLocation(node),
      { extendsFrom }
    );
  }

  private extractMethods(classNode: SyntaxNode, parentId: string): CodeEntity[] {
    const methods: CodeEntity[] = [];
    const bodyNode = this.findChildByField(classNode, 'body');
    if (!bodyNode) return methods;

    for (let i = 0; i < bodyNode.childCount; i++) {
      const child = bodyNode.child(i);
      if (!child) continue;

      if (child.type === 'method_declaration' || child.type === 'constructor_declaration') {
        const method = this.extractMethod(child, parentId);
        if (method) methods.push(method);
      }
    }

    return methods;
  }

  private extractInterfaceMethods(interfaceNode: SyntaxNode, parentId: string): CodeEntity[] {
    const methods: CodeEntity[] = [];
    const bodyNode = this.findChildByField(interfaceNode, 'body');
    if (!bodyNode) return methods;

    for (let i = 0; i < bodyNode.childCount; i++) {
      const child = bodyNode.child(i);
      if (!child) continue;

      if (child.type === 'method_declaration') {
        const method = this.extractMethod(child, parentId);
        if (method) methods.push(method);
      }
    }

    return methods;
  }

  private extractMethod(node: SyntaxNode, parentId: string): CodeEntity | null {
    const nameNode = this.findChildByField(node, 'name');
    const name = nameNode
      ? this.getNodeText(nameNode)
      : node.type === 'constructor_declaration'
      ? 'constructor'
      : null;

    if (!name) return null;

    const paramsNode = this.findChildByField(node, 'parameters');
    const parameters = this.extractParameters(paramsNode);

    // Check modifiers
    const modifiersNode = this.findChild(node, 'modifiers');
    const modText = modifiersNode ? this.getNodeText(modifiersNode) : '';
    const isStatic = modText.includes('static');
    const isAbstract = modText.includes('abstract');
    const visibility = modText.includes('private')
      ? 'private' as const
      : modText.includes('protected')
      ? 'protected' as const
      : 'public' as const;

    // Return type
    const typeNode = this.findChildByField(node, 'type');
    const returnType = typeNode ? this.getNodeText(typeNode) : undefined;

    return createCodeEntity(
      name,
      'method',
      this.language,
      this.filePath,
      this.getLocation(node),
      {
        parameters,
        isStatic,
        isAbstract,
        visibility,
        returnType,
      },
      parentId
    );
  }

  protected override extractParameterName(node: SyntaxNode): string | null {
    if (node.type === 'formal_parameter' || node.type === 'spread_parameter') {
      const nameNode = this.findChildByField(node, 'name');
      return nameNode ? this.getNodeText(nameNode) : null;
    }
    if (node.type === 'identifier') {
      return this.getNodeText(node);
    }
    return null;
  }
}
