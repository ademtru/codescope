import { JavaScriptExtractor } from './JavaScriptExtractor';
import { createCodeEntity, type CodeEntity } from '../../../models/CodeEntity';

type SyntaxNode = any;
type Tree = any;

export class TypeScriptExtractor extends JavaScriptExtractor {
  extractEntities(tree: Tree): CodeEntity[] {
    // Get all JS entities first
    const entities = super.extractEntities(tree);
    const rootNode = tree.rootNode;

    // Additionally extract TypeScript-specific constructs
    this.traverse(rootNode, (node) => {
      // Extract interfaces
      if (node.type === 'interface_declaration') {
        const entity = this.extractInterface(node);
        if (entity) {
          entities.push(entity);
          const methods = this.extractInterfaceMethods(node, entity.id);
          entities.push(...methods);
        }
      }

      // Extract type aliases that look like object types (with methods)
      if (node.type === 'type_alias_declaration') {
        const entity = this.extractTypeAlias(node);
        if (entity) entities.push(entity);
      }

      // Extract enums
      if (node.type === 'enum_declaration') {
        const entity = this.extractEnum(node);
        if (entity) entities.push(entity);
      }

      return true;
    });

    return entities;
  }

  private extractInterface(node: SyntaxNode): CodeEntity | null {
    const nameNode = this.findChildByField(node, 'name');
    if (!nameNode) return null;

    const name = this.getNodeText(nameNode);

    // Check for extends
    let extendsFrom: string | undefined;
    const extendsClause = this.findChild(node, 'extends_type_clause');
    if (extendsClause) {
      const typeId = this.findChild(extendsClause, 'type_identifier');
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

  private extractInterfaceMethods(
    interfaceNode: SyntaxNode,
    parentId: string
  ): CodeEntity[] {
    const methods: CodeEntity[] = [];
    const bodyNode = this.findChildByField(interfaceNode, 'body');
    if (!bodyNode) return methods;

    for (let i = 0; i < bodyNode.childCount; i++) {
      const child = bodyNode.child(i);
      if (!child) continue;

      if (
        child.type === 'method_signature' ||
        child.type === 'property_signature'
      ) {
        const nameNode = this.findChildByField(child, 'name');
        if (!nameNode) continue;

        const name = this.getNodeText(nameNode);
        const paramsNode = this.findChildByField(child, 'parameters');
        const parameters = this.extractParameters(paramsNode);

        methods.push(
          createCodeEntity(
            name,
            'method',
            this.language,
            this.filePath,
            this.getLocation(child),
            { parameters },
            parentId
          )
        );
      }
    }

    return methods;
  }

  private extractTypeAlias(node: SyntaxNode): CodeEntity | null {
    const nameNode = this.findChildByField(node, 'name');
    if (!nameNode) return null;

    const name = this.getNodeText(nameNode);

    return createCodeEntity(
      name,
      'interface', // Treat type aliases as interfaces for visualization
      this.language,
      this.filePath,
      this.getLocation(node),
      {}
    );
  }

  private extractEnum(node: SyntaxNode): CodeEntity | null {
    const nameNode = this.findChildByField(node, 'name');
    if (!nameNode) return null;

    const name = this.getNodeText(nameNode);

    return createCodeEntity(
      name,
      'class', // Treat enums as classes for visualization
      this.language,
      this.filePath,
      this.getLocation(node),
      {}
    );
  }
}
