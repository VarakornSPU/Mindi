# Mindi - Frontend Only Mode

Mindi is a React + Vite chat UI that runs without a local backend.

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Run (Single Port)

Both commands run the same dev server on `http://localhost:5173`.

```bash
npm run dev
```

```bash
npm start
```

## Local Authentication and Chat Memory

- Register/login works in browser `localStorage`
- Chat history is stored in `localStorage`
- Chat memory is global (not tied to user)

## Optional RAG Endpoint

If your teammate has a RAG API ready, set this in `.env`:

```bash
VITE_RAG_API_URL=https://your-rag-endpoint.example.com
```

The app will call this endpoint with `POST` body:

```json
{ "query": "user message" }
```

Expected response fields (one of these):

```json
{ "reply": "..." }
```

or

```json
{ "message": "..." }
```

If `VITE_RAG_API_URL` is not set or request fails, the app uses a built-in fallback reply.

## Scripts

- `npm run dev` - Vite dev server on port 5173
- `npm start` - Same as `npm run dev` (single-port behavior)
- `npm run build` - Build frontend
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
