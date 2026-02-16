import { useMemo } from 'react';
import type { CodeEntity } from '../models/CodeEntity';
import type { FileContent } from '../services/github/types';

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  class: { bg: 'rgba(56,139,253,0.15)', text: '#58a6ff' },
  function: { bg: 'rgba(46,160,67,0.15)', text: '#3fb950' },
  method: { bg: 'rgba(187,128,9,0.15)', text: '#d29922' },
  interface: { bg: 'rgba(163,113,247,0.15)', text: '#a371f7' },
};

interface CodePreviewPanelProps {
  entity: CodeEntity;
  files: FileContent[];
  onClose: () => void;
}

export function CodePreviewPanel({ entity, files, onClose }: CodePreviewPanelProps) {
  const { codeLines, startLine } = useMemo(() => {
    const file = files.find((f) => f.path === entity.filePath);
    if (!file) return { codeLines: null, startLine: 1 };

    const allLines = file.content.split('\n');
    const contextBefore = 3;
    const contextAfter = 3;
    const start = Math.max(0, entity.location.start.line - 1 - contextBefore);
    const end = Math.min(allLines.length, entity.location.end.line + contextAfter);
    return {
      codeLines: allLines.slice(start, end),
      startLine: start + 1,
    };
  }, [entity, files]);

  const colors = TYPE_COLORS[entity.type] || TYPE_COLORS.function;
  const shortPath = entity.filePath;

  return (
    <div
      className="h-[700px] flex flex-col rounded-gh overflow-hidden"
      style={{
        width: 420,
        backgroundColor: '#0d1117',
        border: '1px solid #30363d',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 border-b flex-shrink-0"
        style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}
      >
        <span
          className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded"
          style={{ backgroundColor: colors.bg, color: colors.text }}
        >
          {entity.type}
        </span>
        <span className="text-[13px] font-semibold font-mono truncate flex-1" style={{ color: '#e6edf3' }}>
          {entity.name}
        </span>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded cursor-pointer transition-colors flex-shrink-0"
          style={{ color: '#8b949e' }}
          onMouseEnter={(e) => { (e.currentTarget).style.backgroundColor = '#21262d'; }}
          onMouseLeave={(e) => { (e.currentTarget).style.backgroundColor = 'transparent'; }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
          </svg>
        </button>
      </div>

      {/* File path */}
      <div
        className="px-4 py-1.5 text-[11px] font-mono border-b flex items-center gap-1.5 flex-shrink-0"
        style={{ color: '#8b949e', borderColor: '#30363d', backgroundColor: '#161b22' }}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z" />
        </svg>
        <span className="truncate">{shortPath}</span>
        <span style={{ color: '#6e7681' }}>
          :{entity.location.start.line}
        </span>
      </div>

      {/* Entity metadata */}
      <div
        className="px-4 py-2 border-b flex-shrink-0 space-y-1"
        style={{ borderColor: '#30363d', backgroundColor: '#0d1117' }}
      >
        {entity.metadata.parameters && entity.metadata.parameters.length > 0 && (
          <div className="text-[11px] font-mono" style={{ color: '#8b949e' }}>
            <span style={{ color: '#6e7681' }}>params: </span>
            {entity.metadata.parameters.map((p) => (
              <span key={p.name}>
                <span style={{ color: '#e6edf3' }}>{p.name}</span>
                {p.type && <span style={{ color: '#6e7681' }}>: {p.type}</span>}
              </span>
            )).reduce<React.ReactNode[]>((acc, el, i) => {
              if (i > 0) acc.push(<span key={`sep-${i}`} style={{ color: '#6e7681' }}>, </span>);
              acc.push(el);
              return acc;
            }, [])}
          </div>
        )}
        {entity.metadata.extendsFrom && (
          <div className="text-[11px]" style={{ color: '#8b949e' }}>
            <span style={{ color: '#6e7681' }}>extends </span>
            <span className="font-mono" style={{ color: '#58a6ff' }}>{entity.metadata.extendsFrom}</span>
          </div>
        )}
        {entity.metadata.implements && entity.metadata.implements.length > 0 && (
          <div className="text-[11px]" style={{ color: '#8b949e' }}>
            <span style={{ color: '#6e7681' }}>implements </span>
            <span className="font-mono" style={{ color: '#a371f7' }}>{entity.metadata.implements.join(', ')}</span>
          </div>
        )}
        {entity.metadata.visibility && (
          <div className="text-[11px]" style={{ color: '#6e7681' }}>
            {entity.metadata.visibility}
            {entity.metadata.isStatic ? ' static' : ''}
            {entity.metadata.isAsync ? ' async' : ''}
          </div>
        )}
      </div>

      {/* Code block */}
      <div className="flex-1 overflow-auto min-h-0">
        {codeLines ? (
          <table className="w-full text-[12px] font-mono leading-[1.6]" style={{ borderSpacing: 0 }}>
            <tbody>
              {codeLines.map((line, i) => {
                const lineNum = startLine + i;
                const isEntityLine =
                  lineNum >= entity.location.start.line && lineNum <= entity.location.end.line;
                return (
                  <tr
                    key={lineNum}
                    style={{
                      backgroundColor: isEntityLine ? 'rgba(56,139,253,0.1)' : 'transparent',
                    }}
                  >
                    <td
                      className="select-none text-right pr-3 pl-3 align-top"
                      style={{
                        color: isEntityLine ? '#58a6ff' : '#6e7681',
                        minWidth: 44,
                        userSelect: 'none',
                        borderRight: isEntityLine
                          ? '2px solid #58a6ff'
                          : '2px solid transparent',
                      }}
                    >
                      {lineNum}
                    </td>
                    <td
                      className="pr-4 whitespace-pre"
                      style={{ color: '#e6edf3', tabSize: 2 }}
                    >
                      {line}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="flex items-center justify-center h-full text-[12px]" style={{ color: '#6e7681' }}>
            Source code not available for this file
          </div>
        )}
      </div>
    </div>
  );
}
