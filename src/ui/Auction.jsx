import React, { useContext, useMemo, useState } from "react";
import { AppContext } from "./App";

const GROUP_ORDER = [
  { key: "A", label: "Group-A" },
  { key: "B", label: "Group-B" },
  { key: "C", label: "Group-C" },
  { key: "D", label: "Group-D" },
];
const BID_INCREMENT = 250000;
const POOL_LIMITS = { A: 15000000, B: Infinity, C: Infinity, D: Infinity };

export default function Auction() {
  const { state, dispatch } = useContext(AppContext);
  const [currentBidMap, setCurrentBidMap] = useState({});
  const [selectedTeam, setSelectedTeam] = useState("");
  const [warning, setWarning] = useState("");

  // Get current player
  const current = useMemo(
    () => state.players.find((p) => p.id === state.auction.currentId) || null,
    [state]
  );

  // Get current group being auctioned
  const currentGroup = useMemo(() => {
    if (current) return current.pool;
    if (state.auction.queue.length > 0) {
      const firstQueuedPlayer = state.players.find(
        (p) => p.id === state.auction.queue[0]
      );
      return firstQueuedPlayer ? firstQueuedPlayer.pool : null;
    }
    return null;
  }, [current, state.auction.queue, state.players]);

  function handleGroupQueue(groupKey) {
    if (state.auction.queue.length === 0) {
      const ids = state.players
        .filter((p) => p.status === "pending" && p.pool === groupKey)
        .map((p) => p.id);
      if (ids.length) {
        dispatch({ type: "AUCTION_ENQUEUE", payload: ids });
        dispatch({ type: "AUCTION_START" });
        setCurrentBidMap({});
        setWarning("");
      }
    }
  }

  function next() {
    dispatch({ type: "AUCTION_NEXT" });
    setCurrentBidMap({});
    setSelectedTeam("");
    setWarning("");
  }

  function getHighestBid() {
    return Math.max(current?.basePrice || 0, ...Object.values(currentBidMap));
  }

  function getBid(teamId) {
    return getHighestBid() + BID_INCREMENT;
  }

  function getPoolLimit(pool) {
    return POOL_LIMITS[pool] || Infinity;
  }

  function handleBid(teamId) {
    if (!current) return;
    const nextBid = getBid(teamId);
    const poolLimit = getPoolLimit(current.pool);
    const remainingBudget = getTeamRemainingBudget(teamId);

    if (nextBid > poolLimit) {
      setWarning(
        `Exceeded ${current.pool} bid limit (${poolLimit.toLocaleString()})`
      );
      return;
    }
    if (nextBid > remainingBudget) {
      setWarning(
        `Available budget exceeded for ${
          state.teams.find((t) => t.id === teamId)?.name || ""
        } (${remainingBudget.toLocaleString()})`
      );
      return;
    }
    setCurrentBidMap({ ...currentBidMap, [teamId]: nextBid });
    setSelectedTeam(teamId);
    setWarning("");
  }

  function markSold() {
    if (!current || !selectedTeam) return;
    const price = currentBidMap[selectedTeam] || current.basePrice;
    dispatch({
      type: "PLAYER_SOLD",
      payload: {
        playerId: current.id,
        teamId: selectedTeam,
        price,
      },
    });
    next();
  }

  function markUnsold() {
    if (!current) return;
    dispatch({ type: "PLAYER_UNSOLD", payload: current.id });
    next();
  }

  function getTeamRemainingBudget(teamId) {
    const round = GROUP_ORDER.findIndex((g) => g.key === currentGroup) + 1;
    let budget = 15000000;
    if (round > 1) {
      budget += (round - 1) * 5000000;
    }
    const spent = state.players
      .filter(
        (p) =>
          p.status === "sold" &&
          p.teamId === teamId &&
          GROUP_ORDER.findIndex((g) => g.key === p.pool) < round
      )
      .reduce((sum, p) => sum + (p.price || 0), 0);
    return Math.max(0, budget - spent);
  }

  function isGroupEmpty(groupKey) {
    return (
      state.players.filter((p) => p.status === "pending" && p.pool === groupKey)
        .length === 0
    );
  }

  // Teams Table
  function renderTeamsTable() {
    return (
      <div
        style={{
          marginTop: 40,
          background: "#f8f9fa",
          borderRadius: 18,
          boxShadow: "0 2px 8px #e0e0e0",
          padding: 24,
          width: "100%",
          maxWidth: 900,
        }}
      >
        <h3
          style={{
            fontSize: 22,
            fontWeight: 700,
            marginBottom: 18,
            color: "#2563eb",
            textAlign: "center",
            letterSpacing: 1,
          }}
        >
          Teams & Players
        </h3>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "#fff",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 1px 4px #eee",
          }}
        >
          <thead>
            <tr style={{ background: "#e0e7ef" }}>
              <th
                style={{
                  padding: "12px 8px",
                  textAlign: "left",
                  fontWeight: 700,
                  fontSize: 16,
                  color: "#374151",
                  borderBottom: "2px solid #d1d5db",
                  minWidth: 120,
                }}
              >
                Team
              </th>
              <th
                style={{
                  padding: "12px 8px",
                  textAlign: "left",
                  fontWeight: 700,
                  fontSize: 16,
                  color: "#374151",
                  borderBottom: "2px solid #d1d5db",
                }}
              >
                Players
              </th>
            </tr>
          </thead>
          <tbody>
            {state.teams.map((team) => (
              <tr key={team.id} style={{ background: "#fff" }}>
                <td
                  style={{
                    padding: "12px 8px",
                    fontWeight: 700,
                    color: "#2563eb",
                    fontSize: 16,
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  {team.name}
                </td>
                <td
                  style={{
                    padding: "12px 8px",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  {state.players
                    .filter((p) => p.teamId === team.id && p.status === "sold")
                    .map((p) => (
                      <span
                        key={p.id}
                        style={{
                          display: "inline-block",
                          background: "#e0e7ef",
                          color: "#222",
                          borderRadius: 6,
                          padding: "4px 10px",
                          margin: "2px 6px 2px 0",
                          fontWeight: 600,
                          fontSize: 15,
                        }}
                      >
                        {p.name}
                      </span>
                    ))}
                  {state.players.filter(
                    (p) => p.teamId === team.id && p.status === "sold"
                  ).length === 0 && (
                    <span style={{ color: "#aaa", fontStyle: "italic" }}>
                      No players yet
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <section
      className="panel"
      style={{ background: "#f3f6fc", minHeight: "100vh", paddingBottom: 60 }}
    >
      <div
        className="panel-head"
        style={{ textAlign: "center", paddingTop: 32 }}
      >
        <h2
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: "#2563eb",
            letterSpacing: 2,
            marginBottom: 0,
          }}
        >
          Auction
        </h2>
      </div>
      <div className="panel-body" style={{ maxWidth: 1200, margin: "0 auto" }}>
        <p
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "#555",
            margin: "18px 0 0 0",
            textAlign: "center",
          }}
        >
          Queue: {state.auction.queue.length} player(s)
        </p>
        {!current && (
          <p
            className="empty"
            style={{
              fontSize: 20,
              color: "#aaa",
              margin: "40px 0",
              textAlign: "center",
            }}
          >
            No active player. Click a Group button to begin.
          </p>
        )}
        {current && (
          <div
            style={{
              display: "flex",
              gap: "40px",
              alignItems: "flex-start",
              marginTop: 36,
              justifyContent: "center",
            }}
          >
            {/* Player Profile Card - Square */}
            <div
              style={{
                flex: 1,
                minWidth: 400,
                maxWidth: 520,
                height: "auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: "#fff",
                borderRadius: 18,
                boxShadow: "0 4px 16px #e0e7ef",
                padding: 40,
              }}
            >
              <h3
                style={{
                  marginBottom: 18,
                  fontSize: 26,
                  fontWeight: 700,
                  letterSpacing: 1,
                  color: "#2563eb",
                }}
              >
                Player Profile
              </h3>
              <div
                className="player-card"
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-start",
                }}
              >
                <div
                  className="player-avatar"
                  style={{
                    width: 240,
                    height: 240,
                    marginBottom: 22,
                    borderRadius: 18,
                    overflow: "hidden",
                    boxShadow: "0 2px 12px #ddd",
                    background: "#f3f6fc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {current.imageData ? (
                    <img
                      alt="p"
                      src={current.imageData}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: 18,
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: 72,
                        fontWeight: 700,
                        color: "#3b82f6",
                        letterSpacing: 2,
                      }}
                    >
                      {(current.name || "?").slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div
                  className="player-main"
                  style={{
                    width: "100%",
                    textAlign: "center",
                  }}
                >
                  <div className="player-content">
                    <h3
                      className="player-name"
                      style={{
                        fontSize: 32,
                        fontWeight: 700,
                        margin: "12px 0 6px 0",
                        color: "#222",
                        letterSpacing: 1,
                      }}
                    >
                      {current.name}
                    </h3>
                    <p
                      className="player-meta"
                      style={{
                        fontSize: 20,
                        fontWeight: 500,
                        color: "#555",
                        margin: "10px 0",
                        lineHeight: 1.5,
                      }}
                    >
                      <span style={{ display: "block", marginBottom: 6 }}>
                        <strong>Position:</strong>{" "}
                        <span style={{ color: "#3b82f6" }}>
                          {current.positions.join(", ") || "-"}
                        </span>
                      </span>
                      <span style={{ display: "block", marginBottom: 6 }}>
                        <strong>Group:</strong>{" "}
                        <span style={{ color: "#16a34a" }}>{current.pool}</span>
                      </span>
                      <span style={{ display: "block" }}>
                        <strong>Base Price:</strong>{" "}
                        <span style={{ color: "#be123c" }}>
                          {Number(current.basePrice || 0).toLocaleString()}
                        </span>
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bidding Stats Card - No Scroll */}
            <div
              style={{
                flex: 2,
                minWidth: 500,
                maxWidth: 700,
                height: "auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: "#fff",
                borderRadius: 18,
                boxShadow: "0 4px 16px #e0e7ef",
                padding: 32,
              }}
            >
              <h3
                style={{
                  marginBottom: 18,
                  fontSize: 26,
                  fontWeight: 800,
                  letterSpacing: 1,
                  color: "#2563eb",
                  textAlign: "center",
                }}
              >
                Bidding Stats
              </h3>
              {warning && (
                <div
                  style={{
                    color: "#dc2626",
                    marginBottom: 10,
                    fontWeight: 600,
                    fontSize: 16,
                    border: "1px solid #fee2e2",
                    background: "#fef2f2",
                    borderRadius: 8,
                    padding: "8px 16px",
                    width: "100%",
                    textAlign: "center",
                  }}
                >
                  {warning}
                </div>
              )}
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  borderRadius: 16,
                  overflow: "hidden",
                  background: "#fff",
                  boxShadow: "0 2px 8px #e0e0e0",
                  marginBottom: 0,
                }}
              >
                <thead>
                  <tr style={{ background: "#e0e7ef" }}>
                    <th
                      style={{
                        padding: "14px 8px",
                        textAlign: "left",
                        fontWeight: 700,
                        fontSize: 17,
                        color: "#374151",
                        borderBottom: "2px solid #d1d5db",
                        minWidth: 120,
                        letterSpacing: 0.5,
                      }}
                    >
                      Team
                    </th>
                    <th
                      style={{
                        padding: "14px 8px",
                        textAlign: "center",
                        fontWeight: 700,
                        fontSize: 17,
                        color: "#374151",
                        borderBottom: "2px solid #d1d5db",
                        minWidth: 90,
                        letterSpacing: 0.5,
                      }}
                    >
                      Bid / Unbid
                    </th>
                    <th
                      style={{
                        padding: "14px 8px",
                        textAlign: "center",
                        fontWeight: 700,
                        fontSize: 17,
                        color: "#374151",
                        borderBottom: "2px solid #d1d5db",
                        minWidth: 120,
                        letterSpacing: 0.5,
                      }}
                    >
                      Current Bid
                    </th>
                    <th
                      style={{
                        padding: "14px 8px",
                        textAlign: "center",
                        fontWeight: 700,
                        fontSize: 17,
                        color: "#374151",
                        borderBottom: "2px solid #d1d5db",
                        minWidth: 140,
                        letterSpacing: 0.5,
                      }}
                    >
                      Available Budget
                    </th>
                    <th
                      style={{
                        padding: "14px 8px",
                        textAlign: "center",
                        fontWeight: 700,
                        fontSize: 17,
                        color: "#374151",
                        borderBottom: "2px solid #d1d5db",
                        minWidth: 120,
                        letterSpacing: 0.5,
                      }}
                    >
                      Base Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {state.teams.map((team, idx) => {
                    const poolLimit = getPoolLimit(current.pool);
                    const teamBid = getBid(team.id);
                    const lastBid = currentBidMap[team.id] || null;
                    const remainingBudget = getTeamRemainingBudget(team.id);
                    const bidDisabled =
                      teamBid > remainingBudget ||
                      teamBid > poolLimit ||
                      remainingBudget < current.basePrice;
                    const budgetExceeded = teamBid > remainingBudget;
                    const basePriceDisabled = current.basePrice > remainingBudget;
                    const unbidDisabled = !currentBidMap[team.id];

                    return (
                      <tr
                        key={team.id}
                        style={{
                          background: idx % 2 === 0 ? "#f8fafc" : "#fff",
                          transition: "background 0.2s",
                        }}
                      >
                        <td
                          style={{
                            padding: "14px 8px",
                            fontWeight: 700,
                            color: "#2563eb",
                            fontSize: 17,
                            borderBottom: "1px solid #e5e7eb",
                            textAlign: "left",
                            letterSpacing: 0.5,
                          }}
                        >
                          {team.name}
                        </td>
                        <td
                          style={{
                            padding: "14px 8px",
                            textAlign: "center",
                            borderBottom: "1px solid #e5e7eb",
                            display: "flex",
                            gap: 8,
                            justifyContent: "center",
                          }}
                        >
                          <button
                            className="primary"
                            style={{
                              padding: "8px 24px",
                              fontWeight: 700,
                              fontSize: 16,
                              borderRadius: 8,
                              background: bidDisabled ? "#dbeafe" : "#2563eb",
                              color: bidDisabled ? "#6b7280" : "#fff",
                              border: "none",
                              cursor: bidDisabled ? "not-allowed" : "pointer",
                              boxShadow: bidDisabled
                                ? "none"
                                : "0 2px 8px #dbeafe",
                              transition: "background 0.2s",
                            }}
                            onClick={() => {
                              if (budgetExceeded) {
                                setWarning(
                                  `Available budget exceeded for ${
                                    team.name
                                  } (${remainingBudget.toLocaleString()})`
                                );
                                return;
                              }
                              handleBid(team.id);
                            }}
                            disabled={bidDisabled}
                          >
                            Bid
                          </button>
                          <button
                            style={{
                              padding: "8px 18px",
                              fontWeight: 700,
                              fontSize: 15,
                              borderRadius: 8,
                              background: unbidDisabled ? "#f3f4f6" : "#dc2626",
                              color: unbidDisabled ? "#6b7280" : "#fff",
                              border: "none",
                              boxShadow: unbidDisabled ? "none" : "0 2px 8px #fee2e2",
                              cursor: unbidDisabled ? "not-allowed" : "pointer",
                              transition: "background 0.2s",
                            }}
                            disabled={unbidDisabled}
                            onClick={() => {
                              const updatedBidMap = { ...currentBidMap };
                              delete updatedBidMap[team.id];
                              setCurrentBidMap(updatedBidMap);
                              if (selectedTeam === team.id) setSelectedTeam("");
                              setWarning("");
                            }}
                          >
                            Unbid
                          </button>
                        </td>
                        <td
                          style={{
                            padding: "14px 8px",
                            textAlign: "center",
                            fontWeight: lastBid ? 700 : 400,
                            color: lastBid ? "#16a34a" : "#64748b",
                            fontSize: 17,
                            borderBottom: "1px solid #e5e7eb",
                            letterSpacing: 0.5,
                          }}
                        >
                          {lastBid
                            ? `${lastBid.toLocaleString()}${
                                selectedTeam === team.id ? " (Last Bid)" : ""
                              }`
                            : "-"}
                        </td>
                        <td
                          style={{
                            padding: "14px 8px",
                            textAlign: "center",
                            fontWeight: 700,
                            color:
                              remainingBudget < 1000000 ? "#dc2626" : "#222",
                            fontSize: 17,
                            borderBottom: "1px solid #e5e7eb",
                            letterSpacing: 0.5,
                          }}
                        >
                          {remainingBudget.toLocaleString()}
                        </td>
                        <td
                          style={{
                            padding: "14px 8px",
                            textAlign: "center",
                            borderBottom: "1px solid #e5e7eb",
                          }}
                        >
                          <button
                            style={{
                              padding: "5px 5px",
                              fontWeight: 400,
                              fontSize: 9,
                              borderRadius: 8,
                              background: basePriceDisabled ? "#f3f4f6" : "#2563eb",
                              color: basePriceDisabled ? "#6b7280" : "#fff",
                              border: "none",
                              boxShadow: basePriceDisabled ? "none" : "0 2px 8px #dbeafe",
                              cursor: basePriceDisabled ? "not-allowed" : "pointer",
                              transition: "background 0.2s",
                            }}
                            disabled={basePriceDisabled}
                            onClick={() => {
                              dispatch({
                                type: "PLAYER_SOLD",
                                payload: {
                                  playerId: current.id,
                                  teamId: team.id,
                                  price: current.basePrice,
                                },
                              });
                              next();
                            }}
                          >
                            Base Price
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div
                style={{
                  marginTop: 22,
                  display: "flex",
                  gap: 16,
                  justifyContent: "center",
                }}
              >
                <button
                  className="primary"
                  style={{
                    padding: "10px 36px",
                    fontWeight: 700,
                    fontSize: 18,
                    borderRadius: 10,
                    background: "#16a34a",
                    color: "#fff",
                    border: "none",
                    boxShadow: "0 2px 8px #d1fae5",
                    cursor: !selectedTeam ? "not-allowed" : "pointer",
                  }}
                  onClick={markSold}
                  disabled={!selectedTeam}
                >
                  Mark Sold
                </button>
                <button
                  style={{
                    padding: "10px 36px",
                    fontWeight: 700,
                    fontSize: 18,
                    borderRadius: 10,
                    background: "#be123c",
                    color: "#fff",
                    border: "none",
                    boxShadow: "0 2px 8px #fee2e2",
                    cursor: "pointer",
                  }}
                  onClick={markUnsold}
                >
                  Mark Unsold
                </button>
              </div>
            </div>
          </div>
        )}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 32,
            justifyContent: "center",
          }}
        >
          {GROUP_ORDER.map((group) => (
            <button
              key={group.key}
              className="primary"
              style={{
                padding: "10px 32px",
                fontWeight: 700,
                fontSize: 17,
                borderRadius: 8,
                background: "#2563eb",
                color: "#fff",
                border: "none",
                boxShadow: "0 2px 8px #dbeafe",
                cursor:
                  isGroupEmpty(group.key) || state.auction.queue.length > 0
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  isGroupEmpty(group.key) || state.auction.queue.length > 0
                    ? 0.6
                    : 1,
                transition: "background 0.2s",
              }}
              disabled={
                isGroupEmpty(group.key) || state.auction.queue.length > 0
              }
              onClick={() => handleGroupQueue(group.key)}
            >
              {group.label}
            </button>
          ))}
        </div>
        {/* Teams Table at the bottom */}
        {renderTeamsTable()}
      </div>
    </section>
  );
}