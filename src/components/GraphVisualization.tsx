import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type ColorMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { CodeEntity } from '../models/CodeEntity';
import type { Relationship } from '../models/Relationship';
import { GraphTransformer } from '../services/graph/GraphTransformer';
import CodeEntityNode from './NodeTypes/CodeEntityNode';

const nodeTypes = {
  codeEntity: CodeEntityNode,
};

const MINIMAP_COLORS: Record<string, string> = {
  class: '#58a6ff',
  function: '#3fb950',
  method: '#d29922',
  interface: '#a371f7',
};

interface GraphVisualizationProps {
  entities: CodeEntity[];
  relationships: Relationship[];
  onEntitySelect?: (entity: CodeEntity | null) => void;
}

function GraphVisualizationInner({
  entities,
  relationships,
  onEntitySelect,
}: GraphVisualizationProps) {
  const [layout, setLayout] = useState<'TB' | 'LR'>('TB');
  const [showMethods, setShowMethods] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const { fitView } = useReactFlow();

  const filteredEntities = useMemo(() => {
    if (filterType === 'all') return entities;
    return entities.filter(
      (e) => e.type === filterType || (e.parentId && entities.find((p) => p.id === e.parentId)?.type === filterType)
    );
  }, [entities, filterType]);

  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return entities.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.filePath.toLowerCase().includes(q)
    );
  }, [entities, searchQuery]);

  const searchMatchIds = useMemo(
    () => (searchMatches ? new Set(searchMatches.map((e) => e.id)) : null),
    [searchMatches]
  );

  const { initialNodes, initialEdges } = useMemo(() => {
    const { nodes, edges } = GraphTransformer.transform(
      filteredEntities,
      relationships,
      { layout, hideOwnership: !showMethods }
    );
    // Apply search dimming
    if (searchMatchIds) {
      for (const node of nodes) {
        if (!searchMatchIds.has(node.id)) {
          node.style = { ...node.style, opacity: 0.2 };
        } else {
          node.style = { ...node.style, opacity: 1 };
        }
      }
    }
    return { initialNodes: nodes, initialEdges: edges };
  }, [filteredEntities, relationships, layout, showMethods, searchMatchIds]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const handleRelayout = useCallback(() => {
    const { nodes: newNodes, edges: newEdges } = GraphTransformer.transform(
      filteredEntities,
      relationships,
      { layout, hideOwnership: !showMethods }
    );
    setNodes(newNodes);
    setEdges(newEdges);
  }, [filteredEntities, relationships, layout, showMethods, setNodes, setEdges]);

  useMemo(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const entity = entities.find((e) => e.id === node.id);
      if (entity && onEntitySelect) {
        onEntitySelect(entity);
      }
    },
    [entities, onEntitySelect]
  );

  const jumpToEntity = useCallback(
    (entity: CodeEntity) => {
      setSearchQuery(entity.name);
      setSearchFocused(false);
      fitView({ nodes: [{ id: entity.id }], duration: 400, padding: 0.5 });
    },
    [fitView]
  );

  const nodeColor = useCallback((node: Node) => {
    const entityType = (node.data as any)?.entityType;
    return MINIMAP_COLORS[entityType] || '#6e7681';
  }, []);

  return (
    <div
      className="w-full h-[700px] rounded-gh overflow-hidden"
      style={{
        border: '1px solid #30363d',
        backgroundColor: '#0d1117',
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        colorMode={'dark' as ColorMode}
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
      >
        <Background color="#21262d" gap={20} size={1} />
        <Controls
          className="!bg-[#161b22] !border-[#30363d] !rounded-gh !shadow-none [&>button]:!bg-[#161b22] [&>button]:!border-[#30363d] [&>button]:!text-[#8b949e] [&>button:hover]:!bg-[#21262d]"
        />
        <MiniMap
          nodeColor={nodeColor}
          maskColor="rgba(1,4,9,0.7)"
          style={{
            backgroundColor: '#161b22',
            border: '1px solid #30363d',
            borderRadius: '6px',
          }}
        />

        {/* Control Panel - GitHub box style */}
        <Panel position="top-left" className="space-y-2">
          <div
            className="rounded-gh p-3 space-y-3"
            style={{
              backgroundColor: '#161b22',
              border: '1px solid #30363d',
            }}
          >
            <h4 className="text-[12px] font-semibold" style={{ color: '#e6edf3' }}>
              Controls
            </h4>

            {/* Search */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="#8b949e">
                  <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z" />
                </svg>
              </div>
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSearchFocused(true); }}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                placeholder="Search entities..."
                className="w-full pl-7 pr-6 py-1 text-[11px] rounded-gh"
                style={{
                  backgroundColor: '#0d1117',
                  border: '1px solid #30363d',
                  color: '#e6edf3',
                  outline: 'none',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setSearchFocused(false); }}
                  className="absolute inset-y-0 right-0 flex items-center pr-2 cursor-pointer"
                  style={{ color: '#8b949e' }}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
                  </svg>
                </button>
              )}
              {/* Search results dropdown */}
              {searchFocused && searchMatches && searchMatches.length > 0 && (
                <div
                  className="absolute left-0 right-0 top-full mt-1 rounded-gh overflow-hidden z-50 max-h-[200px] overflow-y-auto"
                  style={{
                    backgroundColor: '#161b22',
                    border: '1px solid #30363d',
                    boxShadow: '0 8px 24px rgba(1,4,9,0.75)',
                  }}
                >
                  {searchMatches.slice(0, 8).map((entity) => (
                    <button
                      key={entity.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => jumpToEntity(entity)}
                      className="w-full text-left px-2.5 py-1.5 flex items-center gap-2 cursor-pointer transition-colors"
                      style={{ color: '#e6edf3' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#21262d'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                    >
                      <span
                        className="text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded flex-shrink-0"
                        style={{
                          backgroundColor:
                            entity.type === 'class' ? '#58a6ff'
                              : entity.type === 'function' ? '#3fb950'
                              : entity.type === 'method' ? '#d29922'
                              : '#a371f7',
                          color: '#ffffff',
                        }}
                      >
                        {entity.type[0].toUpperCase()}
                      </span>
                      <span className="text-[11px] font-mono truncate">{entity.name}</span>
                      <span className="ml-auto text-[9px] flex-shrink-0" style={{ color: '#6e7681' }}>
                        {entity.filePath.split('/').pop()}
                      </span>
                    </button>
                  ))}
                  {searchMatches.length > 8 && (
                    <div className="px-2.5 py-1 text-[10px] text-center" style={{ color: '#6e7681' }}>
                      +{searchMatches.length - 8} more
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Layout direction - segmented button */}
            <div className="flex rounded-gh overflow-hidden" style={{ border: '1px solid #30363d' }}>
              <button
                onClick={() => { setLayout('TB'); }}
                className="flex-1 px-2 py-1 text-[11px] font-medium cursor-pointer transition-colors"
                style={{
                  backgroundColor: layout === 'TB' ? '#1f6feb' : '#21262d',
                  color: layout === 'TB' ? '#ffffff' : '#8b949e',
                  borderRight: '1px solid #30363d',
                }}
              >
                Top-Down
              </button>
              <button
                onClick={() => { setLayout('LR'); }}
                className="flex-1 px-2 py-1 text-[11px] font-medium cursor-pointer transition-colors"
                style={{
                  backgroundColor: layout === 'LR' ? '#1f6feb' : '#21262d',
                  color: layout === 'LR' ? '#ffffff' : '#8b949e',
                }}
              >
                Left-Right
              </button>
            </div>

            {/* Checkbox */}
            <label className="flex items-center gap-2 text-[12px] cursor-pointer" style={{ color: '#8b949e' }}>
              <input
                type="checkbox"
                checked={showMethods}
                onChange={(e) => setShowMethods(e.target.checked)}
                className="rounded accent-[#1f6feb]"
              />
              Show methods
            </label>

            {/* Filter select */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full text-[12px] px-2 py-1 rounded-gh cursor-pointer"
              style={{
                backgroundColor: '#0d1117',
                border: '1px solid #30363d',
                color: '#e6edf3',
              }}
            >
              <option value="all">All types</option>
              <option value="class">Classes only</option>
              <option value="function">Functions only</option>
              <option value="interface">Interfaces only</option>
            </select>

            {/* Re-layout */}
            <button
              onClick={handleRelayout}
              className="w-full px-2 py-1 text-[12px] font-medium rounded-gh cursor-pointer transition-colors"
              style={{
                backgroundColor: '#21262d',
                border: '1px solid #30363d',
                color: '#e6edf3',
              }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.backgroundColor = '#30363d'; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.backgroundColor = '#21262d'; }}
            >
              Re-layout
            </button>
          </div>
        </Panel>

        {/* Legend */}
        <Panel position="top-right">
          <div
            className="rounded-gh p-3"
            style={{
              backgroundColor: '#161b22',
              border: '1px solid #30363d',
            }}
          >
            <h4 className="text-[11px] font-semibold mb-2" style={{ color: '#e6edf3' }}>
              Legend
            </h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#58a6ff' }} />
                <span className="text-[11px]" style={{ color: '#8b949e' }}>Class</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#3fb950' }} />
                <span className="text-[11px]" style={{ color: '#8b949e' }}>Function</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#d29922' }} />
                <span className="text-[11px]" style={{ color: '#8b949e' }}>Method</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#a371f7' }} />
                <span className="text-[11px]" style={{ color: '#8b949e' }}>Interface</span>
              </div>
              <div className="my-1" style={{ borderTop: '1px solid #21262d' }} />
              <div className="flex items-center gap-2">
                <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke="#8b949e" strokeWidth="1.5" /></svg>
                <span className="text-[11px]" style={{ color: '#8b949e' }}>Call</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke="#58a6ff" strokeWidth="1.5" strokeDasharray="3 2" /></svg>
                <span className="text-[11px]" style={{ color: '#8b949e' }}>Inheritance</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke="#3fb950" strokeWidth="1.5" strokeDasharray="3 2" /></svg>
                <span className="text-[11px]" style={{ color: '#8b949e' }}>Import</span>
              </div>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function GraphVisualization(props: GraphVisualizationProps) {
  return (
    <ReactFlowProvider>
      <GraphVisualizationInner {...props} />
    </ReactFlowProvider>
  );
}
