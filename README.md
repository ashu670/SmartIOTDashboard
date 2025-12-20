SmartHome360 — Complete IOT dashboard project

SmartHome360 is a full-stack Smart Home IoT Dashboard that allows users to monitor, control, and manage all smart devices in their home from a single interface — including devices, rooms, energy usage, system logs, and a media/music system with Spotify integration.

Mental model
SmartHome360 is the product.
Media Control is just another smart device, like AC or Lights.

Key Highlights

Secure authentication using JWT

Family member and role-based access

Room-based device organization

Electricity consumption analytics

Activity and system logs

Media Control using Spotify OAuth

Dark and light themes via CSS variables

Modular frontend and backend architecture

Tech Stack
Frontend

React 18 (Vite)

Context API

Tailwind CSS

Axios

Backend

Node.js and Express

MongoDB with Mongoose

JWT authentication

Spotify Web API (OAuth)

Media Control (Spotify Integration)

The Media Control module allows users to control their home music system using Spotify.

Supported features:

Spotify OAuth login (per user)

Display current track and album art

Play, pause, next, and previous controls

Automatic access token refresh

Graceful fallback when Spotify is not connected

Notes:

Spotify Premium is required for playback control

Spotify tokens are stored only on the backend

Tokens are never exposed to the frontend

Project Structure
smartiot/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── deviceController.js
│   │   ├── familyController.js
│   │   ├── logController.js
│   │   ├── roomController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── admin.js
│   │   └── upload.js
│   ├── models/
│   │   ├── Device.js
│   │   ├── Log.js
│   │   ├── PasswordRequest.js
│   │   ├── Room.js
│   │   └── User.js
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── deviceRoutes.js
│   │   ├── familyRoutes.js
│   │   ├── logRoutes.js
│   │   ├── roomRoutes.js
│   │   ├── spotifyRoutes.js
│   │   └── userRoutes.js
│   ├── services/
│   │   └── spotifyService.js
│   ├── utils/
│   │   └── generateToken.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── DeviceCard.jsx
│   │   │   ├── ElectricityConsumption.jsx
│   │   │   ├── MediaControl.jsx
│   │   │   └── RoomItem.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── AdminPanel.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── ManageMembers.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── .env.example
├── .gitignore
└── README.md

Setup Instructions
Prerequisites

Node.js v14 or higher

MongoDB (local or Atlas)

npm

Install dependencies

Backend:

cd backend
npm install


Frontend:

cd frontend
npm install

Environment variables

Backend (backend/.env):

PORT=5000
MONGO_URI=mongodb://localhost:27017/smarthome360
JWT_SECRET=your_secure_jwt_secret

SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:5000/api/spotify/callback


Important: Spotify redirect URI must use 127.0.0.1, not localhost.

Frontend (frontend/.env):

VITE_API_URL=http://localhost:5000/api

Run the application

Start MongoDB:

mongod


Start backend:

cd backend
npm run dev


Start frontend:

cd frontend
npm run dev


Frontend runs on http://localhost:5173.

API Overview

Authentication:

POST /api/auth/register

POST /api/auth/login

Devices:

GET /api/devices

POST /api/devices

PUT /api/devices/:id

Rooms:

GET /api/rooms

POST /api/rooms

Logs:

GET /api/logs

Spotify:

GET /api/spotify/login

GET /api/spotify/callback

GET /api/spotify/player

UI / UX Constraints

Dashboard layout is locked

Media Control is an add-on, not a redesign

No hardcoded colors (CSS variables only)

Theme switching must not break layout

No Spotify iframes or embeds

Deployment Notes

Backend:

Use MongoDB Atlas in production

Configure environment variables on the server

Update CORS for frontend domain

Frontend:

npm run build


Deploy the dist folder and update VITE_API_URL.

License

ISC
