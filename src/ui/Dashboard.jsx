import React, { useContext, useMemo } from 'react'
import { AppContext } from './App'
import '../../styles.css';

export default function Dashboard({ setTab }) {
  const { state, dispatch } = useContext(AppContext)

  const totals = useMemo(() => {
    const totalBudget = state.teams.reduce((s, t) => s + (Number(t.budget) || 0), 0)
    const spentByTeam = Object.fromEntries(state.teams.map(t => [t.id, 0]))
    for (const p of state.players) {
      if (p.status === 'sold' && p.teamId && p.price) {
        spentByTeam[p.teamId] = (spentByTeam[p.teamId] || 0) + Number(p.price)
      }
    }
    const remaining = state.teams.map(t => (Number(t.budget) || 0) - (spentByTeam[t.id] || 0))
    return {
      totalBudget,
      totalPlayers: state.players.length,
      remainingTotal: remaining.reduce((a, b) => a + b, 0)
    }
  }, [state])

  const soldPlayersByTeam = useMemo(() => {
    const out = {}
    for (const t of state.teams) out[t.id] = []
    for (const p of state.players) {
      if (p.status === 'sold' && p.teamId) {
        out[p.teamId]?.push(p)
      }
    }
    return out
  }, [state.players, state.teams])

  function handleReset() {
    if (window.confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      dispatch({ type: 'RESET_ALL' })
    }
  }

  return (
    <section className="panel dashboard-panel" style={{ background: "#f3f6fc", minHeight: "100vh", paddingBottom: 60 }}>
      <div className="panel-head" style={{ textAlign: "center", paddingTop: 48, marginBottom: 18 }}>
        <h2 className="panel-title" style={{ fontSize: 48, fontWeight: 900, color: "#2563eb", letterSpacing: 2, marginBottom: 0 }}>Overview</h2>
      </div>
      <div className="panel-body" style={{ maxWidth: "100vw", margin: "0 auto", padding: "0 32px" }}>
        <div className="dashboard-stats" style={{ display: "flex", gap: 48, justifyContent: "center", marginBottom: 48 }}>
          <Stat label="Teams" value={state.teams.length} />
          <Stat label="Players" value={state.players.length} />
          <Stat label="Combined Budget" value={totals.totalBudget.toLocaleString()} />
        </div>
        <div className="form-actions dashboard-actions" style={{ display: "flex", gap: 18, justifyContent: "center", marginBottom: 32 }}>
          <button onClick={() => setTab('auction')}>Go to Auction</button>
          <button className="danger" onClick={handleReset}>Reset All Data</button>
        </div>
        <div className="dashboard-teams-section" style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, color: "#222" }}>Teams & Sold Players</h3>
          <div style={{ overflowX: "auto", background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px #e0e7ef", padding: 24 }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 18px" }}>
              <thead>
                <tr>
                  <th style={{ fontSize: 18, fontWeight: 700, color: "#2563eb", paddingBottom: 12, textAlign: "left", borderBottom: "2px solid #e0e7ef" }}>Team</th>
                  <th style={{ fontSize: 18, fontWeight: 700, color: "#2563eb", paddingBottom: 12, textAlign: "left", borderBottom: "2px solid #e0e7ef" }}>Sold Players</th>
                </tr>
              </thead>
              <tbody>
                {state.teams.map(team => (
                  <tr key={team.id} style={{ background: "#f8fafc", borderRadius: 12 }}>
                    <td style={{ verticalAlign: "top", padding: "18px 18px 18px 0", borderRadius: "12px 0 0 12px", width: 220 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                        <div
                          className="dashboard-avatar team-avatar"
                          style={{
                            width: 54,
                            height: 54,
                            borderRadius: "50%",
                            overflow: "hidden",
                            background: "#f3f6fc",
                            boxShadow: "0 2px 8px #e0e7ef",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 22,
                            fontWeight: 700,
                            color: "#2563eb",
                          }}
                        >
                          {team.imageData
                            ? <img src={team.imageData} alt={team.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                            : (team.name || '?').slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 18, color: "#222" }}>{team.name}</span>
                      </div>
                    </td>
                    <td style={{ verticalAlign: "top", padding: "18px 0 18px 0", borderRadius: "0 12px 12px 0" }}>
                      {soldPlayersByTeam[team.id].length === 0 ? (
                        <div style={{
                          background: "#fff",
                          color: "#94a3b8",
                          borderRadius: 10,
                          padding: "10px 18px",
                          textAlign: "center",
                          fontStyle: "italic",
                          fontWeight: 500,
                          fontSize: 15,
                          border: "1px dashed #dbeafe",
                          display: "inline-block",
                        }}>
                          No players sold yet.
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 18 }}>
                          {soldPlayersByTeam[team.id].map(player => (
                            <div
                              key={player.id}
                              style={{
                                background: "linear-gradient(90deg, #e0e7ef 0%, #f3f6fc 100%)",
                                borderRadius: 12,
                                boxShadow: "0 2px 8px #e0e7ef",
                                padding: "12px 18px",
                                minWidth: 180,
                                maxWidth: 220,
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                border: "1px solid #dbeafe",
                              }}
                            >
                              <div
                                className="dashboard-avatar player-avatar"
                                style={{
                                  width: 38,
                                  height: 38,
                                  borderRadius: "50%",
                                  overflow: "hidden",
                                  background: "#fff",
                                  boxShadow: "0 2px 8px #e0e7ef",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 15,
                                  fontWeight: 700,
                                  color: "#2563eb",
                                  flexShrink: 0,
                                }}
                              >
                                {player.imageData
                                  ? <img src={player.imageData} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                                  : (player.name || '?').slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 15, color: "#222", marginBottom: 2 }}>{player.name}</div>
                                <div style={{ fontSize: 13, color: "#2563eb", fontWeight: 600 }}>
                                  Roles: {player.positions.join(', ') || '-'}
                                </div>
                                <div style={{ fontSize: 13, color: "#be123c", fontWeight: 600 }}>
                                  Price: {Number(player.price || 0).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

function Stat({ label, value }) {
  return (
    <div className="stat dashboard-stat" style={{
      background: "#fff",
      borderRadius: 24,
      boxShadow: "0 4px 24px #e0e7ef",
      padding: "32px 48px",
      minWidth: 220,
      textAlign: "center",
      fontWeight: 700,
      fontSize: 22,
      color: "#2563eb"
    }}>
      <div className="stat-label" style={{ fontSize: 22, color: "#555", fontWeight: 700, marginBottom: 10 }}>{label}</div>
      <div className="stat-value" style={{ fontSize: 32, color: "#2563eb", fontWeight: 900 }}>{value}</div>
    </div>
  )
}