import React, { useContext } from "react";
import { AppContext } from "./App";

const POOLS = [
  { key: "A", title: "Group-A" },
  { key: "B", title: "Group-B" },
  { key: "C", title: "Group-C" },
  { key: "D", title: "Group-D" },
];

export default function Pool() {
  const { state, dispatch } = useContext(AppContext);

  function handleMovePool(playerId, newPool) {
    dispatch({ type: "PLAYER_MOVE_POOL", payload: { playerId, newPool } });
  }

  return (
    <div style={{ maxWidth: 1400, margin: "40px auto" }}>
      <h2 style={{ marginBottom: 40, textAlign: "center", fontSize: 28 }}>
        Players by Group
      </h2>
      <div
        style={{
          display: "flex",
          gap: 48,
          alignItems: "flex-start",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {POOLS.map((pool) => {
          // Get players in this group, preserving order
          const groupPlayers = state.players.filter((p) => p.pool === pool.key);
          return (
            <div
              key={pool.key}
              style={{
                flex: "1 1 340px",
                minWidth: 360,
                maxWidth: 440,
                background: "#fff",
                borderRadius: 24,
                boxShadow: "0 4px 18px #e0e0e0",
                padding: 48,
                marginBottom: 40,
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                height: 540,
              }}
            >
              <h3 style={{ marginBottom: 24, textAlign: "center", fontSize: 24 }}>
                {pool.title}
              </h3>
              <div style={{ flex: 1, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr
                      style={{
                        background: "#f7f7f7",
                        position: "sticky",
                        top: 0,
                      }}
                    >
                      <th style={{ textAlign: "left", padding: "10px 6px", fontSize: 16 }}>
                        Name
                      </th>
                      <th style={{ textAlign: "center", padding: "10px 6px", fontSize: 16 }}>
                        Status
                      </th>
                      <th style={{ textAlign: "center", padding: "10px 6px", fontSize: 16 }}>
                        Move Group
                      </th>
                      <th style={{ textAlign: "center", padding: "10px 6px", fontSize: 16 }}>
                        Order
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupPlayers.map((player, i) => (
                      <tr key={player.id}>
                        <td style={{ padding: "10px 6px", fontSize: 15 }}>{player.name}</td>
                        <td style={{ padding: "10px 6px", textAlign: "center", fontSize: 15 }}>
                          {player.status}
                        </td>
                        <td style={{ padding: "10px 6px", textAlign: "center" }}>
                          {player.status === "unsold" ? (
                            <select
                              style={{ minWidth: 120, fontSize: 15, padding: "4px 8px" }}
                              value=""
                              onChange={(e) =>
                                handleMovePool(player.id, e.target.value)
                              }
                            >
                              <option value="">Move to...</option>
                              {POOLS.filter((p) => p.key !== player.pool).map(
                                (p) => (
                                  <option key={p.key} value={p.key}>
                                    {p.title}
                                  </option>
                                )
                              )}
                            </select>
                          ) : (
                            <span style={{ color: "#aaa" }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: "10px 6px", textAlign: "center" }}>
                          <div style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 4, // reduced gap for better alignment
                          }}>
                            <button
                              disabled={i === 0}
                              onClick={() =>
                                dispatch({
                                  type: "PLAYER_MOVE_UP",
                                  payload: { playerId: player.id },
                                })
                              }
                              style={{
                                width: 32,
                                height: 32,
                                cursor: i === 0 ? "not-allowed" : "pointer",
                                fontSize: 18,
                                padding: 0,
                                borderRadius: 4,
                                border: "1px solid #ccc",
                                background: i === 0 ? "#f3f3f3" : "#e0e7ef",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              title="Move Up"
                            >
                              ▲
                            </button>
                            <button
                              disabled={i === groupPlayers.length - 1}
                              onClick={() =>
                                dispatch({
                                  type: "PLAYER_MOVE_DOWN",
                                  payload: { playerId: player.id },
                                })
                              }
                              style={{
                                width: 32,
                                height: 32,
                                cursor:
                                  i === groupPlayers.length - 1
                                    ? "not-allowed"
                                    : "pointer",
                                fontSize: 18,
                                padding: 0,
                                borderRadius: 4,
                                border: "1px solid #ccc",
                                background:
                                  i === groupPlayers.length - 1
                                    ? "#f3f3f3"
                                    : "#e0e7ef",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              title="Move Down"
                            >
                              ▼
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {groupPlayers.length === 0 && (
                  <div
                    style={{ color: "#888", marginTop: 20, textAlign: "center", fontSize: 16 }}
                  >
                    No players in this group.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}