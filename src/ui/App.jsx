import React, { useEffect, useMemo, useReducer, useState } from "react";
import Dashboard from "./Dashboard";
import Teams from "./Teams";
import Players from "./Players";
import Auction from "./Auction";
import Pool from "./Pool";

const initialState = {
  teams: [],
  players: [],
  auction: { active: false, paused: false, currentId: null, queue: [] },
};

function uid(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function reducer(state, action) {
  switch (action.type) {
    case "LOAD":
      return {
        ...initialState,
        ...action.payload,
        auction: {
          ...initialState.auction,
          ...(action.payload.auction || {}),
        },
      };
    case "RESET":
      return initialState;
    case "AUCTION_RESET": {
      const players = state.players.map((p) =>
        p.status === "sold"
          ? { ...p, status: "pending", price: 0, teamId: null }
          : p
      );
      return {
        ...state,
        players,
        auction: { active: false, paused: false, currentId: null, queue: [] },
      };
    }
    case "RESET_ALL":
      fetch("http://localhost:4000/api/reset", { method: "POST" });
      return {
        ...state,
        teams: [],
        players: [],
        auction: { active: false, paused: false, currentId: null, queue: [] },
      };
    case "UPSERT_TEAM": {
      const next = [...state.teams];
      const idx = next.findIndex((t) => t.id === action.payload.id);
      if (idx >= 0) next[idx] = action.payload;
      else next.push(action.payload);
      return { ...state, teams: next };
    }
    case "DELETE_TEAM": {
      const id = action.payload;
      const teams = state.teams.filter((t) => t.id !== id);
      const players = state.players.map((p) =>
        p.teamId === id
          ? { ...p, teamId: null, status: "pending", price: 0 }
          : p
      );
      return { ...state, teams, players };
    }
    case "UPSERT_PLAYER": {
      const next = [...state.players];
      const idx = next.findIndex((p) => p.id === action.payload.id);
      if (idx >= 0) next[idx] = action.payload;
      else next.push(action.payload);
      return { ...state, players: next };
    }
    case "DELETE_PLAYER":
      return {
        ...state,
        players: state.players.filter((p) => p.id !== action.payload),
      };
    case "AUCTION_ENQUEUE": {
      const ids = action.payload;
      // Only add new ids to the end of the queue
      const unique = Array.from(new Set([...state.auction.queue, ...ids]));
      return { ...state, auction: { ...state.auction, queue: unique } };
    }
    case "AUCTION_CLEAR_QUEUE":
      return {
        ...state,
        auction: {
          ...state.auction,
          queue: [],
          currentId: null,
          active: false,
          paused: false,
        },
      };
    case "AUCTION_START": {
      const [first, ...rest] = state.auction.queue;
      return {
        ...state,
        auction: {
          ...state.auction,
          active: true,
          paused: false,
          currentId: first ?? null,
          queue: [first, ...rest].filter(Boolean),
        },
      };
    }
    case "AUCTION_NEXT": {
      const q = state.auction.queue;
      if (!q.length)
        return {
          ...state,
          auction: { ...state.auction, currentId: null, active: false },
        };
      const [, ...rest] = q;
      const nextId = rest[0] ?? null;
      return {
        ...state,
        auction: { ...state.auction, currentId: nextId, queue: rest },
      };
    }
    case "AUCTION_SET_CURRENT":
      return {
        ...state,
        auction: { ...state.auction, currentId: action.payload, active: true },
      };
    case "PLAYER_SOLD": {
      const { playerId, teamId, price } = action.payload;
      const players = state.players.map((p) =>
        p.id === playerId ? { ...p, teamId, price, status: "sold" } : p
      );
      return { ...state, players };
    }
    case "PLAYER_UNSOLD": {
      const playerId = action.payload;
      const players = state.players.map((p) =>
        p.id === playerId
          ? { ...p, teamId: null, price: 0, status: "unsold" }
          : p
      );
      return { ...state, players };
    }
    case "PLAYER_MOVE_POOL": {
      const { playerId, newPool } = action.payload;
      const groupBasePrices = {
        A: 5000000,
        B: 4000000,
        C: 3000000,
        D: 1000000,
      };
      // Remove player from queue if present
      let newQueue = state.auction.queue.filter((id) => id !== playerId);
      // Add to end if player is pending
      const movedPlayer = state.players.find((p) => p.id === playerId);
      if (movedPlayer && movedPlayer.status === "pending") {
        newQueue = [...newQueue, playerId];
      }
      // Move player to end of players array
      const others = state.players.filter((p) => p.id !== playerId);
      const updatedPlayer = movedPlayer
        ? {
            ...movedPlayer,
            pool: newPool,
            basePrice: groupBasePrices[newPool],
            status: "pending",
          }
        : null;
      return {
        ...state,
        players: updatedPlayer ? [...others, updatedPlayer] : state.players,
        auction: {
          ...state.auction,
          queue: newQueue,
        },
      };
    }
    default:
      return state;
  }
}

function useNodeState() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [loaded, setLoaded] = useState(false);

  // Load state from Node.js backend on mount
  useEffect(() => {
    fetch("http://localhost:4000/api/data")
      .then((res) => res.json())
      .then((saved) => {
        if (saved && (saved.teams?.length || saved.players?.length)) {
          dispatch({ type: "LOAD", payload: saved });
        }
        setLoaded(true);
      })
      .catch((err) =>
        console.error("Failed to load state from Node.js backend:", err)
      );
  }, []);

  // Save state to Node.js backend only after initial load
  useEffect(() => {
    if (!loaded) return; // Don't save until loaded
    if (state.teams.length === 0 && state.players.length === 0) return; // Don't save empty state
    fetch("http://localhost:4000/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teams: state.teams,
        players: state.players,
        auction: state.auction,
      }),
    }).catch((err) =>
      console.error("Failed to save state to Node.js backend:", err)
    );
  }, [state, loaded]);

  return [state, dispatch];
}

export const AppContext = React.createContext(null);

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [state, dispatch] = useNodeState();
  const ctx = useMemo(() => ({ state, dispatch, uid }), [state, dispatch]);

  // Add "pool" to the navigation tabs
  const tabs = ["dashboard", "teams", "players", "auction", "pool"];

  return (
    <AppContext.Provider value={ctx}>
      <div
        className="app"
        style={{ minWidth: 0, width: "100vw", overflowX: "hidden" }}
      >
        <header
          className="app-header"
          style={{
            background: "linear-gradient(90deg, #0ea5e9 0%, #6366f1 100%)",
            boxShadow: "0 4px 24px #6366f144",
            padding: "28px 0 18px 0",
            marginBottom: 24,
            width: "100vw",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <div
            className="branding-copy"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 28,
              justifyContent: "center",
              maxWidth: 1200,
              margin: "0 auto",
              padding: "0 32px",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {/* Replace MSVL circle with logo image */}
            <img
              src="/assets/msvl-league-bg.png"
              alt="MSVL Logo"
              style={{
                width: 150,
                height: 150,
                borderRadius: "50%",
                objectFit: "cover",
                marginRight: 10,
                boxShadow: "0 4px 16px #6366f144",
                border: "4px solid #fbbf24",
                background: "#fff",
              }}
            />
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 32,
                  fontWeight: 700,
                  color: "#fbbf24",
                  letterSpacing: 1,
                  textShadow: "0 4px 12px #6366f1, 0 1px 0 #0ea5e9",
                }}
              >
                MSVL Auction 2025
              </h1>
            </div>
          </div>

          <nav
            className="tabs header-actions"
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 16,
              marginTop: 22,
              maxWidth: 1200,
              marginLeft: "auto",
              marginRight: "auto",
              padding: "0 32px",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {tabs.map((key) => (
              <button
                key={key}
                className={tab === key ? "active" : ""}
                onClick={() => setTab(key)}
                style={{
                  fontWeight: 700,
                  fontSize: 18,
                  padding: "12px 32px",
                  borderRadius: 10,
                  border:
                    tab === key ? "2.5px solid #fbbf24" : "1.5px solid #e0e7ef",
                  background: tab === key ? "#fff" : "#e0e7ef",
                  color: tab === key ? "#6366f1" : "#222",
                  boxShadow: tab === key ? "0 2px 12px #6366f144" : "none",
                  transition: "all 0.2s",
                  cursor: "pointer",
                }}
              >
                {key[0].toUpperCase() + key.slice(1)}
              </button>
            ))}
          </nav>
        </header>
        {tab === "dashboard" && <Dashboard setTab={setTab} />}
        {tab === "teams" && <Teams />}
        {tab === "players" && <Players />}
        {tab === "auction" && <Auction />}
        {tab === "pool" && <Pool />}
      </div>
    </AppContext.Provider>
  );
}
