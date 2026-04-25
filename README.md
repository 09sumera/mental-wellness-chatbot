# 🧠 Serenova – AI Mental Wellness Chatbot

**Serenova** is an AI-powered mental wellness platform designed to support users through intelligent conversations, mood tracking, and personalized insights.
It provides a safe space for users to express emotions while leveraging modern AI and secure authentication.

---

## 🌐 Live Demo

* 🔗 Frontend: https://mental-wellness-chatbot-seven.vercel.app
* 🔗 Backend API: https://mental-wellness-chatbot-zsdy.onrender.com

---

## ✨ Features

### 🤖 AI Chat Support

* Real-time AI chatbot for mental wellness conversations
* Context-aware responses using LLM (Groq API)
* Chat history management

### 🔐 Authentication & Security

* OTP-based email authentication
* JWT (JSON Web Token) authorization
* Protected API routes
* Secure token handling (stored in frontend)

### 📊 Mood Tracking

* Log daily mood entries
* View mood history
* Generate summaries and insights

### 💬 Chat Management

* Create new chats
* View chat history
* Rename & delete conversations

### 📱 Fully Responsive UI

* Mobile, tablet, and desktop support
* ChatGPT-style sidebar
* Smooth and modern UI

---

## 🏗️ Tech Stack

### Frontend

* React.js (Vite)
* Tailwind CSS
* Fetch API
* Vercel (Deployment)

### Backend

* Flask (Python)
* MongoDB (Database)
* JWT Authentication
* Render (Deployment)

### AI Integration

* Groq API (Llama 3.3 70B)

---

## 🔐 Authentication Flow

1. User enters email → OTP is generated
2. OTP is verified
3. JWT token is issued
4. Token is stored in localStorage
5. All protected routes require:

```http
Authorization: Bearer <token>
```

---

## 🛡️ Security Features

* JWT-based authentication
* Protected backend routes
* Input validation on API requests
* Environment variables for sensitive data
* CORS configuration for secure communication

---

## 📡 API Overview

### Auth Routes

* `POST /api/user/request-otp`
* `POST /api/user/register`
* `POST /api/user/login`
* `GET /api/user/profile`

### Chat Routes

* `POST /api/chat/message`
* `GET /api/chat/history`
* `GET /api/chat/conversations`

### Mood Routes

* `POST /api/mood/log`
* `GET /api/mood/history`
* `GET /api/mood/summary`

---

## ⚙️ Environment Variables

### Backend (.env)

```
SECRET_KEY=
MONGO_URI=
GROQ_API_KEY=
SMTP_EMAIL=
SMTP_PASSWORD=
```

### Frontend (.env)

```
VITE_API_URL=https://mental-wellness-chatbot-zsdy.onrender.com
```

---

## 🚀 Deployment

### Frontend (Vercel)

* Connected via GitHub
* Auto-deploy on push

### Backend (Render)

* Python environment
* Gunicorn server
* Environment variables configured

---

## 🧪 Testing

* API tested using Thunder Client / Postman
* JWT validation tested on protected routes
* Cross-device UI testing (mobile/tablet/desktop)

---

## 📌 Future Improvements

* Voice-based interaction
* Sentiment analysis dashboard
* Therapist integration
* Multi-language support

---

## 👩‍💻 Author

**Sumera Anjum**

* GitHub: https://github.com/09sumera
* Project: Mental Wellness Chatbot

---

## 💡 Inspiration

Mental health accessibility is still a challenge.
Serenova aims to provide **instant, AI-driven emotional support** in a simple and accessible way.

---

## ⭐ If you like this project

Give it a star ⭐ on GitHub!

---
