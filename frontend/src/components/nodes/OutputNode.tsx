import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

export default function OutputNode({ data, selected }: NodeProps) {
  const certeza   = data.certeza   as number  | undefined;
  const esGanador = data.esGanador as boolean | undefined;

  const pct = certeza !== undefined ? Math.round(certeza * 100) : undefined;

  const col = esGanador ? '#a5b4fc'
    : pct !== undefined
      ? pct >= 70 ? '#f87171' : pct >= 40 ? '#fbbf24' : '#4fffb0'
      : 'rgba(255,255,255,0.15)';

  const rgbMap: Record<string, string> = {
    '#a5b4fc': '165,180,252',
    '#f87171': '248,113,113',
    '#fbbf24': '251,191,36',
    '#4fffb0': '79,255,176',
  };
  const rgb = rgbMap[col] ?? '165,180,252';

  return (
    <div style={{
      background: '#0e1117',
      border: `${esGanador ? 2 : 1.5}px solid ${
        selected ? col
        : pct !== undefined ? `rgba(${rgb},${esGanador ? '0.6' : '0.3'})`
        : 'rgba(255,255,255,0.08)'
      }`,
      borderRadius: 16,
      padding: '14px 18px',
      minWidth: 230,
      maxWidth: 270,
      boxShadow: esGanador
        ? `0 0 32px rgba(${rgb},0.3), 0 0 12px rgba(${rgb},0.15), inset 0 1px 0 rgba(${rgb},0.1)`
        : pct !== undefined
          ? `0 0 16px rgba(${rgb},0.12), 0 4px 20px rgba(0,0,0,0.4)`
          : '0 4px 20px rgba(0,0,0,0.35)',
      transition: 'all 0.5s ease',
    }}>

      {/* Badge */}
      <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 8,
                    color: pct !== undefined ? col : 'rgba(255,255,255,0.25)' }}>
        {esGanador ? '🏆 Resultado ganador' : '🎯 Resultado'}
      </div>

      {/* Label — siempre blanco */}
      <div style={{
        fontSize: 13,
        fontWeight: 800,
        color: pct !== undefined ? '#f1f5f9' : 'rgba(255,255,255,0.4)',
        lineHeight: 1.4,
        wordBreak: 'break-word',
        marginBottom: pct !== undefined ? 12 : 0,
      }}>
        {data.label as string}
      </div>

      {/* Certeza */}
      {pct !== undefined && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              certeza
            </span>
            <span style={{
              fontSize: esGanador ? 22 : 15,
              fontWeight: 900,
              color: col,
              fontFamily: 'DM Mono, monospace',
              lineHeight: 1,
              textShadow: esGanador ? `0 0 12px rgba(${rgb},0.6)` : 'none',
            }}>
              {pct}%
            </span>
          </div>
          <div style={{ height: esGanador ? 7 : 4, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              background: `linear-gradient(90deg, rgba(${rgb},0.5), ${col})`,
              borderRadius: 99,
              width: `${pct}%`,
              transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
            }} />
          </div>
        </>
      )}

      <Handle type="target" position={Position.Left}
        style={{ background: col, borderColor: col, width: 10, height: 10 }} />
    </div>
  );
}
