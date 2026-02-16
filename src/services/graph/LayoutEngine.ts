import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';

export interface LayoutOptions {
  direction: 'TB' | 'LR' | 'BT' | 'RL';
  nodeWidth: number;
  nodeHeight: number;
  rankSep: number;
  nodeSep: number;
}

const DEFAULT_OPTIONS: LayoutOptions = {
  direction: 'TB',
  nodeWidth: 250,
  nodeHeight: 80,
  rankSep: 80,
  nodeSep: 40,
};

export class LayoutEngine {
  /**
   * Apply Dagre layout to nodes and edges
   */
  static applyLayout(
    nodes: Node[],
    edges: Edge[],
    options: Partial<LayoutOptions> = {}
  ): Node[] {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({
      rankdir: opts.direction,
      ranksep: opts.rankSep,
      nodesep: opts.nodeSep,
    });

    // Add nodes to the graph
    for (const node of nodes) {
      g.setNode(node.id, {
        width: opts.nodeWidth,
        height: opts.nodeHeight,
      });
    }

    // Add edges to the graph
    for (const edge of edges) {
      g.setEdge(edge.source, edge.target);
    }

    // Run the layout
    dagre.layout(g);

    // Apply the layout positions back to React Flow nodes
    return nodes.map((node) => {
      const nodeWithPosition = g.node(node.id);
      if (!nodeWithPosition) return node;

      return {
        ...node,
        position: {
          x: nodeWithPosition.x - opts.nodeWidth / 2,
          y: nodeWithPosition.y - opts.nodeHeight / 2,
        },
      };
    });
  }
}
