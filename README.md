# SmartHome360 — Complete IoT Dashboard Project

SmartHome360 is a full-stack Smart Home IoT dashboard for controlling and monitoring home devices from a single interface.

Media Control (Spotify) is treated as a normal smart device, not a layout change.

---

## Features

- JWT based authentication
- Family members and role-based access
- Room-based device organization
- Electricity consumption analytics
- Activity and system logs
- Spotify media control
- Dark / light themes using CSS variables

---

## Tech Stack

### Frontend
- React 18 (Vite)
- Context API
- Tailwind CSS
- Axios

### Backend
- Node.js
- Express
- MongoDB + Mongoose
- JWT
- Spotify Web API (OAuth)

---

## Media Control (Spotify)

- Per-user Spotify OAuth login
- Current track and album art
- Play / Pause / Next / Previous
- Backend token storage and refresh
- Safe fallback when Spotify is not linked

Spotify Premium is required.  
Tokens are never exposed to the frontend.

---

## Project Structure
```
SmartIOTDashboard/
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
 ```


---

## Setup

### Prerequisites

<pre>Node.js v14+
MongoDB
npm</pre>


---

## Install Dependencies

### Backend



<pre>cd backend
npm install</pre>


### Frontend



<pre>cd frontend
npm install</pre>


---

## Environment Variables

### Backend (`backend/.env`)

<pre>PORT=5000
MONGO_URI=mongodb://localhost:27017/smarthome360
JWT_SECRET=your_secure_jwt_secret

SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:5000/api/spotify/callback</pre>


Do not use `localhost` for Spotify redirect URI.

### Frontend (`frontend/.env`)

<pre>VITE_API_URL=http://localhost:5000/api</pre>


---

## Run

### Start MongoDB

<pre>mongod</pre>

### Start Backend

<pre>cd backend
npm run dev</pre>

### Start Frontend

<pre>cd frontend
npm run dev</pre>

Frontend runs at:

<pre>http://localhost:5173</pre>

---

## API Overview

### Auth

<pre>POST /api/auth/register
POST /api/auth/login</pre>

### Devices

<pre>GET /api/devices
POST /api/devices
PUT /api/devices/:id</pre>

### Rooms

<pre>GET /api/rooms
POST /api/rooms</pre>

### Logs

<pre>GET /api/logs</pre>

### Spotify

<pre>GET /api/spotify/login
GET /api/spotify/callback
GET /api/spotify/player</pre>

---

## UI / UX Rules

- Dashboard layout must not change
- Media Control is an add-on only
- No hardcoded colors
- No Spotify iframes
- Theme switching must not break layout

---

## Deployment

### Backend

- Use MongoDB Atlas
- Set environment variables
- Configure CORS

### Frontend

<pre>npm run build</pre>

Deploy the `dist` folder and update `VITE_API_URL`.

---

## License

ISC
