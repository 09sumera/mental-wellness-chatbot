# Serenity — System Architecture

> A full-stack Mental Health & Wellness Chatbot built with React, Python Flask, and a keyword + TextBlob AI pipeline.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Project Structure](#project-structure)
4. [Layer Breakdown](#layer-breakdown)
   - [Frontend (React)](#frontend-react)
   - [Backend (Flask)](#backend-flask)
   - [AI Layer](#ai-layer)
   - [Data Layer (JSON)](#data-layer-json)
5. [Request Flow](#request-flow)
6. [AI Pipeline Detail](#ai-pipeline-detail)
7. [Authentication Flow](#authentication-flow)
8. [Data Models](#data-models)
9. [Component Map](#component-map)
10. [Environment Variables](#environment-variables)
11. [Running the Project](#running-the-project)

---

## Project Overview

**Serenity** is a mental health and wellness chatbot that allows users to:
- Have empathetic AI-powered conversations
- Track their mood over time with visualisations
- Access curated mental health resources and crisis helplines
- Monitor wellness trends via a personal dashboard

The system is intentionally kept lightweight — no external databases or cloud AI APIs are required. Everything runs locally.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              React Frontend (Vite)                  │   │
│   │  Pages: Login · Register · Chat · Mood · Dashboard  │   │
│   │  Components: ChatWindow · MoodTracker · MoodChart   │   │
│   └──────────────────────┬──────────────────────────────┘   │
└──────────────────────────┼──────────────────────────────────┘
                           │  HTTP/REST  (JWT in headers)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Python Flask Backend                        │
│                                                             │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│   │ /api/user    │  │ /api/chat    │  │  /api/mood       │  │
│   │ user_routes  │  │ chat_routes  │  │  mood_routes     │  │
│   └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│          │                 │                    │            │
│          ▼                 ▼                    ▼            │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│   │  user_model  │  │  AI Pipeline │  │   db.py (JSON)   │  │
│   │  JWT / Hash  │  │  mood_pipeline│  │  Read / Write    │  │
│   └──────────────┘  └──────┬───────┘  └──────────────────┘  │
└─────────────────────────────┼───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        AI Layer                              │
│                                                             │
│   ┌──────────────────────────────────────────────────────┐  │
│   │              emotion_classifier.py                   │  │
│   │   TextBlob Sentiment · Keyword Emotion · Crisis Det. │  │
│   └──────────────────────────────────────────────────────┘  │
│   ┌──────────────────────────────────────────────────────┐  │
│   │               mood_pipeline.py                       │  │
│   │    Classify → Crisis Check → Reply Builder           │  │
│   └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│                                                             │
│        data/users.json                                       │
│        data/chat_logs.json                                   │
│        data/mood_logs.json                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
mental-wellness-chatbot/
│
├── ai/                          # AI intelligence layer
│   ├── models/
│   │   └── emotion_classifier.py   # Sentiment + emotion + crisis detection
│   ├── pipeline/
│   │   └── mood_pipeline.py        # Orchestrates AI response generation
│   └── prompts/
│       ├── coping_strategies.txt   # 20 evidence-based coping tips
│       └── therapist_prompt.txt    # Chatbot persona & ethical guidelines
│
├── backend/                     # Flask REST API
│   ├── database/
│   │   └── db.py                   # JSON read/write storage layer
│   ├── models/
│   │   └── user_model.py           # Auth: hashing, JWT, register/login
│   ├── routes/
│   │   ├── chat_routes.py          # /api/chat endpoints
│   │   ├── mood_routes.py          # /api/mood endpoints
│   │   └── user_routes.py          # /api/user endpoints
│   ├── app.py                      # Flask app factory + blueprint registry
│   └── requirements.txt            # Python dependencies
│
├── data/                        # JSON flat-file storage
│   ├── users.json
│   ├── chat_logs.json
│   └── mood_logs.json
│
├── docs/                        # Documentation
│   ├── api_documentation.md
│   └── architecture.md
│
├── frontend/                    # React SPA (Vite)
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/
│       │   ├── ChatWindow.jsx       # Full chat UI with AI response display
│       │   ├── MessageBubble.jsx    # Reusable message bubble component
│       │   ├── MoodChart.jsx        # Bar chart visualisation of mood history
│       │   ├── MoodTracker.jsx      # Mood selection + intensity slider
│       │   └── Navbar.jsx           # Sticky navigation bar
│       ├── pages/
│       │   ├── ChatPage.jsx
│       │   ├── DashboardPage.jsx    # Overview with stats + wellness tips
│       │   ├── LoginPage.jsx
│       │   ├── MoodPage.jsx
│       │   ├── ProfilePage.jsx
│       │   ├── RegisterPage.jsx
│       │   └── ResourcesPage.jsx    # Crisis lines + coping + external links
│       ├── services/
│       │   └── api.js               # Centralised fetch wrapper + token mgmt
│       ├── styles/
│       │   └── globals.css          # Design system, CSS variables, animations
│       ├── App.jsx                  # Root router + session restore
│       ├── main.jsx                 # React entry point
│       └── package.json
│
└── tests/                       # Test suite
    ├── test_chatbot.py              # Integration tests (API endpoints)
    └── test_sentiment.py           # Unit tests (AI classifier + pipeline)
```

---

## Layer Breakdown

### Frontend (React)

| Concern         | Implementation                        |
|-----------------|---------------------------------------|
| Framework       | React 18 + Vite                       |
| Routing         | React Router v6                       |
| State           | `useState` / `useEffect` (local)      |
| API comms       | `fetch` via `services/api.js`         |
| Auth storage    | `localStorage` (JWT token)            |
| Styling         | Inline styles + CSS variables         |
| Fonts           | DM Serif Display + DM Sans (Google)   |
| Theme           | Deep teal dark — `#0d1f1e` background |

**Page → Component mapping:**

```
App.jsx
 ├── LoginPage        → (public)
 ├── RegisterPage     → (public)
 ├── ChatPage         → ChatWindow → MessageBubble
 ├── MoodPage         → MoodTracker + MoodChart
 ├── DashboardPage    → StatCard + quick links
 ├── ProfilePage      → edit name, logout
 └── ResourcesPage    → CrisisCard + CopingCard + ResourceCategory
```

---

### Backend (Flask)

| Concern         | Implementation                              |
|-----------------|---------------------------------------------|
| Framework       | Flask 3.x                                   |
| CORS            | flask-cors (all `/api/*` origins allowed)   |
| Auth            | PyJWT — HS256, 24hr expiry                  |
| Password hashing| SHA-256 (hashlib — no external deps)        |
| Structure       | Application factory (`create_app()`)        |
| Blueprints      | `user_bp`, `chat_bp`, `mood_bp`             |
| Error handling  | Global 404 + 500 handlers                   |

**Route summary:**

```
/api/health              GET    — public health check
/api/user/register       POST   — public
/api/user/login          POST   — public
/api/user/profile        GET    — 🔒 protected
/api/user/profile        PUT    — 🔒 protected
/api/chat/message        POST   — 🔒 protected
/api/chat/history        GET    — 🔒 protected
/api/chat/history        DELETE — 🔒 protected
/api/mood/log            POST   — 🔒 protected
/api/mood/history        GET    — 🔒 protected
/api/mood/summary        GET    — 🔒 protected
```

---

### AI Layer

| Component               | Technology         | Purpose                                  |
|-------------------------|--------------------|------------------------------------------|
| `emotion_classifier.py` | TextBlob + keywords| Sentiment, emotion detection, crisis flag|
| `mood_pipeline.py`      | Pure Python        | Orchestrates reply generation            |
| `coping_strategies.txt` | Plain text         | 20 coping tips injected into replies     |
| `therapist_prompt.txt`  | Plain text         | Persona definition + ethical boundaries  |

**Emotion labels:** `joy · sadness · anxiety · anger · calm · disgust · surprise · neutral`

**Crisis keyword bank:** 19 phrases covering suicidal ideation and self-harm language

**Optional HuggingFace upgrade:** `emotion_classifier.py` includes a guarded block to swap in `j-hartmann/emotion-english-distilroberta-base` when `USE_TRANSFORMER = True`

---

### Data Layer (JSON)

All persistent data is stored as flat JSON files in `/data`.  
The `db.py` module provides a clean read/write API — no ORM or database server required.

| File              | Schema root   | Records               |
|-------------------|---------------|-----------------------|
| `users.json`      | `{ "users" }`      | User accounts         |
| `chat_logs.json`  | `{ "chat_logs" }`  | All chat messages     |
| `mood_logs.json`  | `{ "mood_logs" }`  | All mood entries      |

Files are auto-created with empty arrays on first run via `init_db()`.

---

## Request Flow

### Normal chat message

```
User types message
       │
       ▼
ChatWindow.jsx  →  chatAPI.sendMessage(text)
       │
       ▼
POST /api/chat/message  (+ Bearer token)
       │
       ▼
chat_routes.py → decode JWT → extract user_id
       │
       ▼
mood_pipeline.process_message(text)
       │
       ├──► emotion_classifier.classify(text)
       │         ├── TextBlob.sentiment  → polarity, score
       │         ├── keyword scoring     → emotion label
       │         └── crisis keywords     → crisis_alert bool
       │
       ├──► crisis_alert == True?
       │         └── return crisis response with helpline numbers
       │
       └──► build reply from emotion templates + coping tip
       │
       ▼
save_chat_log(user_id, "user",      message, sentiment)
save_chat_log(user_id, "assistant", reply,   {})
       │
       ▼
Return JSON: { reply, emotion, sentiment, crisis_alert }
       │
       ▼
ChatWindow renders MessageBubble with emotion tag + polarity dot
```

---

## AI Pipeline Detail

```
process_message(text)
│
├── 1. CLASSIFY
│     analyse_sentiment(text)
│       └── TextBlob → polarity ("positive"|"negative"|"neutral"), score, subjectivity
│
│     detect_emotion(text)
│       └── Score keyword hits per emotion category
│           → Return highest scoring label
│           → Fallback to TextBlob polarity if no keywords match
│
│     detect_crisis(text)
│       └── Check text against 19 crisis keyword phrases
│           → Returns True / False
│
├── 2. CRISIS OVERRIDE
│     crisis_alert == True
│       └── Return random choice from CRISIS_RESPONSES list
│           (contains Indian + international helpline numbers)
│
└── 3. REPLY BUILDER
      _build_reply(emotion, polarity, text)
        ├── Pick random template from EMOTION_TEMPLATES[emotion]
        ├── Append POSITIVE_BOOSTERS  (if polarity == positive)
        │   OR NEGATIVE_SUPPORT       (if polarity == negative)
        └── For sadness/anxiety/anger → load random coping tip
            from coping_strategies.txt and append
```

---

## Authentication Flow

```
Register                        Login
───────                         ─────
POST /api/user/register         POST /api/user/login
  │                               │
  ▼                               ▼
hash_password(SHA-256)          get_user_by_username()
  │                               │
  ▼                               ▼
create_user() → users.json      verify_password()
  │                               │
  ▼                               ▼
return user (no token)          generate_token() → JWT (24hr)
                                  │
                                  ▼
                                return { token, user }
                                  │
                                  ▼
                                Frontend: localStorage.setItem("token")

Every protected request:
  Authorization: Bearer <token>
        │
        ▼
  decode_token() → { user_id, exp }
        │
  exp expired? → 401
  invalid sig?  → 401
  valid?        → proceed with user_id
```

---

## Data Models

### User
```json
{
  "id":            "uuid-v4",
  "username":      "alice",
  "password_hash": "sha256hex",
  "name":          "Alice",
  "created_at":    "ISO-8601"
}
```

### Chat Log
```json
{
  "id":         "uuid-v4",
  "user_id":    "uuid-v4",
  "role":       "user | assistant",
  "message":    "string",
  "sentiment":  {
    "polarity":     "positive | negative | neutral",
    "score":        -1.0,
    "subjectivity": 0.0
  },
  "created_at": "ISO-8601"
}
```

### Mood Log
```json
{
  "id":         "uuid-v4",
  "user_id":    "uuid-v4",
  "mood":       "happy | sad | anxious | angry | calm | depressed | neutral | excited",
  "score":      7.5,
  "note":       "optional free text",
  "created_at": "ISO-8601"
}
```

---

## Component Map

```
frontend/src/
│
├── App.jsx                ← Root: session restore, route guards, BrowserRouter
│
├── components/
│   ├── Navbar.jsx         ← Sticky nav, active link highlight, logout
│   ├── ChatWindow.jsx     ← Chat feed, input box, typing indicator
│   ├── MessageBubble.jsx  ← Individual bubble: emotion tag, polarity dot, crisis banner
│   ├── MoodTracker.jsx    ← Mood grid (8 options), intensity slider, note, submit
│   └── MoodChart.jsx      ← Bar chart (last 14 entries) + 4 summary stat cards
│
├── pages/
│   ├── LoginPage.jsx      ← Form + glow background
│   ├── RegisterPage.jsx   ← Form + auto-login after register
│   ├── ChatPage.jsx       ← Layout wrapper for ChatWindow
│   ├── MoodPage.jsx       ← Side-by-side: MoodTracker | MoodChart
│   ├── DashboardPage.jsx  ← Greeting, tip of day, 5 stats, 3 quick actions
│   ├── ProfilePage.jsx    ← Avatar, edit name, logout
│   └── ResourcesPage.jsx  ← Crisis lines, coping techniques, resource categories
│
└── services/
    └── api.js             ← authAPI · chatAPI · moodAPI · token helpers
```

---

## Environment Variables

### Backend — `.env`
```
SECRET_KEY=your-secret-key-here
FLASK_DEBUG=true
PORT=5000
```

### Frontend — `frontend/.env`
```
VITE_API_URL=http://localhost:5000/api
```

---

## Running the Project

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
# Server starts at http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# App starts at http://localhost:5173
```

### Tests
```bash
# Unit tests (AI layer)
python -m pytest tests/test_sentiment.py -v

# Integration tests (API)
cd backend && python -m pytest ../tests/test_chatbot.py -v

# All tests
python -m pytest tests/ -v
```

---

*Serenity Mental Wellness Chatbot · Built with React + Flask + TextBlob*