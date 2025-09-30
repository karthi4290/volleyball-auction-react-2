# Volleyball Auction (React)

A React + Vite conversion of your original static app. No server needed — images are stored in-browser as data URLs and all data persists in `localStorage`.

## Quick start

```bash
npm i
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## Notes

- Teams and players are managed under their tabs.
- Auction queue operates on players with `pending` status; mark them Sold/Unsold to progress.
- Remaining budget per team is computed from sold players.
- You can export your state from DevTools by copying the value of `localStorage.getItem('volleyball-auction-state-v2')`.
