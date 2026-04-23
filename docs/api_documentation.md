# Serenity — API Documentation

> **Base URL:** `http://localhost:5000/api`  
> **Format:** All requests and responses use `application/json`  
> **Auth:** Protected endpoints require a `Bearer` JWT token in the `Authorization` header

---

## Table of Contents

1. [Authentication](#authentication)
2. [User](#user)
3. [Chat](#chat)
4. [Mood](#mood)
5. [Health](#health)
6. [Error Responses](#error-responses)

---

## Authentication

Serenity uses **JWT (JSON Web Tokens)** for authentication.

- Tokens are issued on successful login via `POST /api/user/login`
- Tokens expire after **24 hours**
- Include the token in every protected request as:

```
Authorization: Bearer <your_token_here>
```

---

## User

### `POST /api/user/register`

Register a new user account.

**Request Body**

| Field      | Type   | Required | Description              |
|------------|--------|----------|--------------------------|
| `username` | string | ✅        | Unique username          |
| `password` | string | ✅        | Minimum 1 character      |
| `name`     | string | ❌        | Display name (optional)  |

**Example Request**
```json
{
  "username": "alice",
  "password": "mypassword",
  "name": "Alice"
}
```

**Response `201 Created`**
```json
{
  "message": "User registered successfully.",
  "user": {
    "id": "uuid-string",
    "username": "alice",
    "name": "Alice",
    "created_at": "2024-01-01T10:00:00"
  }
}
```

**Error Responses**

| Code | Reason                     |
|------|----------------------------|
| 400  | Missing fields             |
| 400  | Username already exists    |

---

### `POST /api/user/login`

Authenticate a user and receive a JWT token.

**Request Body**

| Field      | Type   | Required |
|------------|--------|----------|
| `username` | string | ✅        |
| `password` | string | ✅        |

**Example Request**
```json
{
  "username": "alice",
  "password": "mypassword"
}
```

**Response `200 OK`**
```json
{
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-string",
    "username": "alice",
    "name": "Alice",
    "created_at": "2024-01-01T10:00:00"
  }
}
```

**Error Responses**

| Code | Reason               |
|------|----------------------|
| 401  | User not found       |
| 401  | Incorrect password   |

---

### `GET /api/user/profile`

🔒 **Protected** — Returns the authenticated user's profile.

**Response `200 OK`**
```json
{
  "user": {
    "id": "uuid-string",
    "username": "alice",
    "name": "Alice",
    "created_at": "2024-01-01T10:00:00"
  }
}
```

---

### `PUT /api/user/profile`

🔒 **Protected** — Update the authenticated user's profile.

**Request Body**

| Field  | Type   | Required | Description        |
|--------|--------|----------|--------------------|
| `name` | string | ✅        | New display name   |

**Example Request**
```json
{
  "name": "Alice Updated"
}
```

**Response `200 OK`**
```json
{
  "message": "Profile updated.",
  "user": {
    "id": "uuid-string",
    "username": "alice",
    "name": "Alice Updated",
    "created_at": "2024-01-01T10:00:00"
  }
}
```

---

## Chat

### `POST /api/chat/message`

🔒 **Protected** — Send a message and receive an AI-generated empathetic reply.

The message is processed through the full AI pipeline:
1. Sentiment analysis (polarity + score)
2. Emotion detection (joy, sadness, anxiety, anger, calm, etc.)
3. Crisis detection (self-harm / suicidal ideation keywords)
4. Empathetic reply generation with optional coping tip

**Request Body**

| Field     | Type   | Required | Description              |
|-----------|--------|----------|--------------------------|
| `message` | string | ✅        | The user's message text  |

**Example Request**
```json
{
  "message": "I feel really anxious about my exam tomorrow."
}
```

**Response `200 OK`**
```json
{
  "reply": "Feeling anxious can be exhausting. Let's slow down for a moment — try taking three deep breaths and notice how your body feels.\n\n💡 Coping tip: Try box breathing: inhale for 4 counts, hold for 4, exhale for 4, hold for 4.",
  "emotion": "anxiety",
  "sentiment": {
    "polarity": "negative",
    "score": -0.2,
    "subjectivity": 0.6
  },
  "crisis_alert": false
}
```

**Crisis Response Example**

When crisis keywords are detected, `crisis_alert` is `true` and the reply contains helpline numbers:

```json
{
  "reply": "I'm really concerned about what you've shared. Please reach out to a crisis helpline right away — iCall (India): 9152987821 | Vandrevala Foundation: 1860-2662-345",
  "emotion": "sadness",
  "sentiment": {
    "polarity": "negative",
    "score": -0.8,
    "subjectivity": 0.9
  },
  "crisis_alert": true
}
```

**Response Fields**

| Field          | Type    | Description                                        |
|----------------|---------|----------------------------------------------------|
| `reply`        | string  | AI-generated empathetic response                   |
| `emotion`      | string  | Detected emotion label                             |
| `sentiment`    | object  | Polarity, score (−1 to +1), subjectivity (0 to 1)  |
| `crisis_alert` | boolean | `true` if crisis indicators detected               |

**Error Responses**

| Code | Reason              |
|------|---------------------|
| 400  | Empty message body  |
| 401  | Missing/invalid JWT |

---

### `GET /api/chat/history`

🔒 **Protected** — Retrieve the full chat history for the authenticated user.

**Response `200 OK`**
```json
{
  "history": [
    {
      "id": "uuid-string",
      "user_id": "uuid-string",
      "role": "user",
      "message": "I feel anxious today.",
      "sentiment": {
        "polarity": "negative",
        "score": -0.2,
        "subjectivity": 0.6
      },
      "created_at": "2024-01-01T10:05:00"
    },
    {
      "id": "uuid-string",
      "user_id": "uuid-string",
      "role": "assistant",
      "message": "Feeling anxious can be exhausting...",
      "sentiment": {},
      "created_at": "2024-01-01T10:05:01"
    }
  ]
}
```

---

### `DELETE /api/chat/history`

🔒 **Protected** — Clear the chat history for the authenticated user.

**Response `200 OK`**
```json
{
  "message": "Chat history cleared."
}
```

---

## Mood

### `POST /api/mood/log`

🔒 **Protected** — Log a mood entry.

**Request Body**

| Field   | Type   | Required | Description                          |
|---------|--------|----------|--------------------------------------|
| `mood`  | string | ✅        | One of the valid mood values below   |
| `score` | float  | ✅        | Intensity: `1.0` – `10.0`            |
| `note`  | string | ❌        | Optional free-text note              |

**Valid mood values:**
`happy` · `sad` · `anxious` · `angry` · `calm` · `depressed` · `neutral` · `excited`

**Example Request**
```json
{
  "mood": "anxious",
  "score": 6.5,
  "note": "Big presentation at work tomorrow."
}
```

**Response `201 Created`**
```json
{
  "message": "Mood logged successfully.",
  "log": {
    "id": "uuid-string",
    "user_id": "uuid-string",
    "mood": "anxious",
    "score": 6.5,
    "note": "Big presentation at work tomorrow.",
    "created_at": "2024-01-01T10:10:00"
  }
}
```

**Error Responses**

| Code | Reason                             |
|------|------------------------------------|
| 400  | Invalid mood value                 |
| 400  | Score out of range (not 1.0–10.0)  |
| 401  | Missing/invalid JWT                |

---

### `GET /api/mood/history`

🔒 **Protected** — Retrieve all mood logs for the authenticated user.

**Response `200 OK`**
```json
{
  "mood_logs": [
    {
      "id": "uuid-string",
      "user_id": "uuid-string",
      "mood": "happy",
      "score": 8.0,
      "note": "Had a great day!",
      "created_at": "2024-01-01T09:00:00"
    }
  ]
}
```

---

### `GET /api/mood/summary`

🔒 **Protected** — Get a statistical summary of the user's mood history.

**Response `200 OK`**
```json
{
  "summary": {
    "total_entries": 14,
    "average_score": 6.43,
    "top_mood": "calm",
    "mood_counts": {
      "happy": 4,
      "calm": 5,
      "anxious": 3,
      "sad": 2
    },
    "recent_avg": 7.1,
    "trend": "improving"
  }
}
```

**Summary Fields**

| Field           | Type   | Description                                              |
|-----------------|--------|----------------------------------------------------------|
| `total_entries` | int    | Total mood logs recorded                                 |
| `average_score` | float  | Overall average intensity score                          |
| `top_mood`      | string | Most frequently logged mood                              |
| `mood_counts`   | object | Count of each mood label                                 |
| `recent_avg`    | float  | Average score of the last 7 entries                      |
| `trend`         | string | `"improving"` · `"declining"` · `"stable"`               |

**No Data Response**
```json
{
  "summary": null,
  "message": "No mood data yet."
}
```

---

## Health

### `GET /api/health`

Public endpoint — check if the API server is running.

**Response `200 OK`**
```json
{
  "status": "ok",
  "message": "Mental Wellness Chatbot API is running."
}
```

---

## Error Responses

All errors follow a consistent format:

```json
{
  "error": "Human-readable error message."
}
```

| HTTP Code | Meaning                                      |
|-----------|----------------------------------------------|
| `400`     | Bad Request — invalid or missing input       |
| `401`     | Unauthorised — missing/invalid/expired JWT   |
| `404`     | Not Found — endpoint does not exist          |
| `500`     | Internal Server Error — unexpected exception |

---

## Emotion Labels Reference

| Label      | Emoji | Description                        |
|------------|-------|------------------------------------|
| `joy`      | 😊    | Happiness, excitement, gratitude   |
| `sadness`  | 😢    | Grief, loneliness, unhappiness     |
| `anxiety`  | 😰    | Worry, panic, stress, fear         |
| `anger`    | 😠    | Frustration, rage, irritation      |
| `calm`     | 😌    | Peaceful, relaxed, content         |
| `disgust`  | 😒    | Repulsion, strong discomfort       |
| `surprise` | 😲    | Shock, astonishment                |
| `neutral`  | 💬    | No dominant emotion detected       |

---

*Last updated: 2024 · Serenity Mental Wellness Chatbot*