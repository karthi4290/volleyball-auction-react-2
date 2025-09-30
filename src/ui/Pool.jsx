import React, { useContext } from 'react'
import { AppContext } from './App'

const POOLS = [
  { key: 'A', title: 'Group-A' },
  { key: 'B', title: 'Group-B' },
  { key: 'C', title: 'Group-C' },
  { key: 'D', title: 'Group-D' },
]

export default function Pool() {
  const { state, dispatch } = useContext(AppContext)

  function handleMovePool(playerId, newPool) {
    dispatch({ type: 'PLAYER_MOVE_POOL', payload: { playerId, newPool } })
  }

  return (
    <div style={{ maxWidth: 1200, margin: '32px auto' }}>
      <h2 style={{ marginBottom: 32, textAlign: 'center' }}>Players by Group</h2>
      <div style={{
        display: 'flex',
        gap: 32,
        alignItems: 'flex-start',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        {POOLS.map(pool => (
          <div key={pool.key} style={{
            flex: '1 1 220px',
            minWidth: 280,
            maxWidth: 300,
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 2px 12px #eee',
            padding: 28,
            marginBottom: 24,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            height: 320
          }}>
            <h3 style={{ marginBottom: 16, textAlign: 'center' }}>{pool.title}</h3>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f7f7f7', position: 'sticky', top: 0 }}>
                    <th style={{ textAlign: 'left', padding: '8px 4px' }}>Name</th>
                    <th style={{ textAlign: 'center', padding: '8px 4px' }}>Status</th>
                    <th style={{ textAlign: 'center', padding: '8px 4px' }}>Move Group</th>
                  </tr>
                </thead>
                <tbody>
                  {state.players.filter(p => p.pool === pool.key).map(player => (
                    <tr key={player.id}>
                      <td style={{ padding: '8px 4px' }}>{player.name}</td>
                      <td style={{ padding: '8px 4px', textAlign: 'center' }}>{player.status}</td>
                      <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                        {player.status === 'unsold' ? (
                          <select
                            style={{ minWidth: 120 }}
                            value=""
                            onChange={e => handleMovePool(player.id, e.target.value)}
                          >
                            <option value="">Move to...</option>
                            {POOLS.filter(p => p.key !== player.pool).map(p => (
                              <option key={p.key} value={p.key}>{p.title}</option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ color: '#aaa' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {state.players.filter(p => p.pool === pool.key).length === 0 && (
                <div style={{ color: '#888', marginTop: 16, textAlign: 'center' }}>No players in this group.</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}