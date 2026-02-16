import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

interface CodeEntityData {
  label: string;
  entityType: 'class' | 'function' | 'method' | 'interface';
  language: string;
  filePath: string;
  line: number;
  methodCount?: number;
  parameters?: { name: string; type?: string }[];
  extendsFrom?: string;
  colors: { bg: string; border: string; accent: string; text: string };
}

const TYPE_ICONS: Record<string, string> = {
  class: 'C',
  function: 'f',
  method: 'm',
  interface: 'I',
};

const LANG_LABELS: Record<string, string> = {
  javascript: 'JS',
  typescript: 'TS',
  java: 'Java',
  python: 'Py',
};

function CodeEntityNode({ data }: NodeProps) {
  const d = data as unknown as CodeEntityData;
  const { label, entityType, language, filePath, line, methodCount, parameters, extendsFrom, colors } = d;

  const shortPath = filePath.split('/').slice(-2).join('/');

  return (
    <div
      className="rounded-gh min-w-[200px] max-w-[280px]"
      style={{
        backgroundColor: colors.bg,
        border: `1px solid #30363d`,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#30363d', border: '1px solid #484f58', width: 8, height: 8 }}
      />

      {/* Header bar */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-t-gh border-b"
        style={{
          backgroundColor: colors.accent,
          borderColor: '#30363d',
        }}
      >
        <span
          className="w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold"
          style={{
            backgroundColor: colors.border,
            color: '#ffffff',
          }}
        >
          {TYPE_ICONS[entityType]}
        </span>
        <span
          className="text-[13px] font-semibold truncate flex-1 font-mono"
          style={{ color: colors.text }}
        >
          {label}
        </span>
        <span className="text-[10px] font-mono" style={{ color: '#8b949e' }}>
          {LANG_LABELS[language] || language}
        </span>
      </div>

      {/* Body */}
      <div className="px-3 py-1.5 space-y-0.5">
        {extendsFrom && (
          <div className="text-[11px]" style={{ color: '#8b949e' }}>
            extends <span className="font-mono" style={{ color: '#58a6ff' }}>{extendsFrom}</span>
          </div>
        )}

        {parameters && parameters.length > 0 && (
          <div className="text-[11px] font-mono truncate" style={{ color: '#8b949e' }}>
            ({parameters.map((p) => p.name).join(', ')})
          </div>
        )}

        {methodCount !== undefined && methodCount > 0 && (
          <div className="text-[11px]" style={{ color: '#6e7681' }}>
            {methodCount} method{methodCount > 1 ? 's' : ''}
          </div>
        )}

        <div className="text-[10px] font-mono truncate" style={{ color: '#6e7681' }}>
          {shortPath}:{line}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#30363d', border: '1px solid #484f58', width: 8, height: 8 }}
      />
    </div>
  );
}

export default memo(CodeEntityNode);
