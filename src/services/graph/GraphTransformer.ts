import type { Node, Edge } from '@xyflow/react';
import type { CodeEntity } from '../../models/CodeEntity';
import type { Relationship } from '../../models/Relationship';
import { LayoutEngine } from './LayoutEngine';

// GitHub dark theme colors for entity types
const TYPE_COLORS = {
  class: { bg: '#161b22', border: '#58a6ff', accent: 'rgba(56,139,253,0.15)', text: '#58a6ff' },
  function: { bg: '#161b22', border: '#3fb950', accent: 'rgba(46,160,67,0.15)', text: '#3fb950' },
  method: { bg: '#161b22', border: '#d29922', accent: 'rgba(187,128,9,0.15)', text: '#d29922' },
  interface: { bg: '#161b22', border: '#a371f7', accent: 'rgba(163,113,247,0.15)', text: '#a371f7' },
};

// GitHub dark theme edge styles
const EDGE_STYLES: Record<string, { stroke: string; strokeDasharray?: string; animated?: boolean }> = {
  call: { stroke: '#8b949e', animated: true },
  inheritance: { stroke: '#58a6ff', strokeDasharray: '5 5' },
  import: { stroke: '#3fb950', strokeDasharray: '3 3' },
  ownership: { stroke: '#a371f7' },
  implements: { stroke: '#d29922', strokeDasharray: '5 5' },
};

export class GraphTransformer {
  static transform(
    entities: CodeEntity[],
    relationships: Relationship[],
    options: { layout?: 'TB' | 'LR'; hideOwnership?: boolean } = {}
  ): { nodes: Node[]; edges: Edge[] } {
    const { layout = 'TB', hideOwnership = true } = options;

    const visibleEntities = hideOwnership
      ? entities.filter((e) => e.type !== 'method')
      : entities;

    const nodes: Node[] = visibleEntities.map((entity) => {
      const colors = TYPE_COLORS[entity.type] || TYPE_COLORS.function;
      const methodCount = hideOwnership
        ? entities.filter((e) => e.parentId === entity.id).length
        : 0;

      return {
        id: entity.id,
        type: 'codeEntity',
        data: {
          label: entity.name,
          entityType: entity.type,
          language: entity.language,
          filePath: entity.filePath,
          line: entity.location.start.line,
          methodCount,
          parameters: entity.metadata.parameters,
          extendsFrom: entity.metadata.extendsFrom,
          colors,
        },
        position: { x: 0, y: 0 },
      };
    });

    const visibleIds = new Set(visibleEntities.map((e) => e.id));
    const visibleRelationships = relationships.filter(
      (r) =>
        visibleIds.has(r.source) &&
        visibleIds.has(r.target) &&
        (hideOwnership ? r.type !== 'ownership' : true)
    );

    const edges: Edge[] = visibleRelationships.map((rel) => {
      const style = EDGE_STYLES[rel.type] || EDGE_STYLES.call;

      return {
        id: rel.id,
        source: rel.source,
        target: rel.target,
        type: 'smoothstep',
        animated: style.animated || false,
        style: {
          stroke: style.stroke,
          strokeDasharray: style.strokeDasharray,
          strokeWidth: rel.type === 'inheritance' ? 2 : 1.5,
        },
        label: rel.type,
        labelStyle: {
          fontSize: 10,
          fill: '#8b949e',
        },
        labelBgStyle: {
          fill: '#0d1117',
          fillOpacity: 0.9,
        },
      };
    });

    const layoutedNodes = LayoutEngine.applyLayout(nodes, edges, {
      direction: layout,
      nodeWidth: 250,
      nodeHeight: 80,
    });

    return { nodes: layoutedNodes, edges };
  }
}
