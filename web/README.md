# 📈 Stock Market Club — React Dashboard (full-stack)

A modern **React + TypeScript + Tailwind** dashboard backed by a **FastAPI**
service that reuses the project's existing Python analysis code
(`recommender.py`, `utils.py`, `logos.py`). Same educational stock analysis as
the Streamlit app, rebuilt as a polished single-page app — and the kind of
codebase the **21st.dev Magic MCP** can generate components for.

> ⚠️ **Educational use only — not financial advice.**

```
web/
├── backend/
│   ├── api.py            # FastAPI: /api/analyze/{ticker}, /api/compare
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.tsx        # page shell + Analyze / Compare views
    │   ├── api.ts         # fetch client (Vite proxies /api -> :8000)
    │   ├── format.ts      # number formatting (ported from utils.py)
    │   ├── types.ts
    │   ├── lib/cn.ts          # class-merge helper (from a Magic component)
    │   └── components/        # StatCard (Magic-based), charts, tables, etc.
    ├── package.json
    └── vite.config.ts
```

## Prerequisites
- **Python 3.9+** (already used by the Streamlit app)
- **Node.js 18+** (installed earlier via winget)

## Quickest way: one process (recommended)
Build the frontend once, then FastAPI serves the whole app + API on one port:
```powershell
cd "C:\Users\shaan\SMIC Python\web\frontend"
npm install        # first time only
npm run build
cd "C:\Users\shaan\SMIC Python\web\backend"
py -m pip install -r requirements.txt   # first time only
py -m uvicorn api:app --port 8000
```
Then open **http://localhost:8000**. (Helper: just run `web\run.ps1`.)
Rebuild the frontend (`npm run build`) whenever you change frontend code.

---

## Dev mode (two processes, hot-reload)
Use this while actively editing the frontend.

### 1) Start the backend (terminal 1)
```powershell
cd "C:\Users\shaan\SMIC Python\web\backend"
py -m pip install -r requirements.txt
py -m uvicorn api:app --reload --port 8000
```
Backend runs at **http://localhost:8000** (try http://localhost:8000/api/health).

## 2) Start the frontend (terminal 2)
```powershell
cd "C:\Users\shaan\SMIC Python\web\frontend"
npm install
npm run dev
```
Open the URL it prints — **http://localhost:5173**. The dev server proxies
`/api/*` to the backend, so no CORS setup is needed.

> Tip: there are helper scripts `web\run-backend.ps1` and `web\run-frontend.ps1`
> that just run the commands above.

## How the pieces fit
- The **backend** does no new analysis — it imports your existing
  `recommender.py` / `utils.py` and returns JSON. `utils.py` was made
  Streamlit-optional so it works inside FastAPI too.
- The **frontend** renders everything: identity card (with the real brand logo
  from the Magic logo set, or a monogram), KPI stat cards, the recommendation
  badge, a score breakdown, fundamentals with explanations, technicals, and an
  interactive price/volume chart (Recharts).

## Where Magic was used
- **`logo_search`** → real brand logos (`logos.py`), shown in the header and
  comparison table.
- **`21st_magic_component_inspiration`** → the `Card` primitive + `cn` helper
  that `components/MagicStatCard.tsx` is built on.
- Magic's interactive **component builder** needs the 21st.dev browser flow, so
  the remaining components were hand-built in the same design language.

## Build for production
```powershell
cd "C:\Users\shaan\SMIC Python\web\frontend"
npm run build   # type-checks then bundles into dist/
```
