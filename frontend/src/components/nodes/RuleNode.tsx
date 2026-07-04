import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

export default function RuleNode({ data, selected }: NodeProps) {
  const condiciones = (data.condiciones as any[]) || [];
  const fired       = data.fired as boolean | undefined;
  const strength    = data.firingStrength as number | undefined;

  return (
    <div style={{
      background: '#0e1117',
      border: `1.5px solid ${fired ? 'rgba(79,255,176,0.55)' : selected ? 'rgba(167,139,250,0.55)' : 'rgba(167,139,250,0.18)'}`,
      borderRadius: 16,
      padding: '13px 17px',
      minWidth: 200,
      maxWidth: 270,
      boxShadow: fired
        ? '0 0 32px rgba(79,255,176,0.25), 0 0 12px rgba(79,255,176,0.12), inset 0 1px 0 rgba(79,255,176,0.1)'
        : '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
      transition: 'all 0.35s ease',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em',
                       color: fired ? '#4fffb0' : 'rgba(167,139,250,0.8)' }}>
          {fired ? '✓ Regla activada' : '⚡ Regla'}
        </span>
        {fired && strength !== undefined && (
          <span style={{
            fontSize: 11, fontWeight: 900, color: '#4fffb0',
            fontFamily: 'DM Mono, monospace',
            background: 'rgba(79,255,176,0.12)',
            border: '1px solid rgba(79,255,176,0.35)',
            borderRadius: 20, padding: '2px 9px',
          }}>
            {Math.round(strength * 100)}%
          </span>
        )}
      </div>

      {/* Condiciones */}
      <div style={{ fontSize: 11, lineHeight: 1.95, marginBottom: 10 }}>
        {condiciones.length === 0
          ? <span style={{ color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>Sin condiciones</span>
          : condiciones.map((c: any, i: number) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              {i > 0 && (
                <span style={{ fontSize: 8, fontWeight: 800, color: '#818cf8',
                               background: 'rgba(99,102,241,0.15)', borderRadius: 4, padding: '1px 6px' }}>
                  Y
                </span>
              )}
              <span style={{ color: '#dde1ff', fontWeight: 700 }}>{c.var}</span>
              <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10 }}>{c.op || 'ES'}</span>
              <span style={{ color: '#fde68a', fontWeight: 700 }}>{c.val ?? c.conjunto}</span>
            </div>
          ))
        }
      </div>

      {/* Conclusión */}
      <div style={{
        borderTop: `1px solid ${fired ? 'rgba(79,255,176,0.18)' : 'rgba(255,255,255,0.06)'}`,
        paddingTop: 9,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 12, fontWeight: 700,
                       color: fired ? '#4fffb0' : 'rgba(255,255,255,0.38)',
                       wordBreak: 'break-word' }}>
          → {data.conclusion as string || '...'}
        </span>
        {data.peso !== undefined && (
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
            {Math.round((data.peso as number) * 100)}%
          </span>
        )}
      </div>

      <Handle type="target" position={Position.Left}
        style={{ background: fired ? '#4fffb0' : '#a78bfa', borderColor: fired ? '#4fffb0' : '#a78bfa', width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right}
        style={{ background: fired ? '#4fffb0' : '#a78bfa', borderColor: fired ? '#4fffb0' : '#a78bfa', width: 10, height: 10 }} />
    </div>
  );
}
