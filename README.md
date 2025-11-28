# SmartHome360 - Complete IoT Dashboard Project

A full-stack SmartHome IoT Dashboard built with React (Vite) frontend and Node.js/Express backend with MongoDB.

## 🚀 Features

- User authentication (Register/Login with JWT)
- Device management (Add, view, toggle devices)
- Device types: Light, Thermostat, Alarm
- Admin panel for device approval
- Real-time updates via Socket.io
- Activity logging
- Responsive UI with Tailwind CSS

## 📋 Prerequisites

- **Node.js** (v14 or higher)
- **MongoDB** (running locally or MongoDB Atlas connection string)
- **npm** (comes with Node.js)

## 🛠️ Setup Instructions

### 1. Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

#### Backend
Create a `.env` file in the `backend` directory:

```bash
cp .env.example backend/.env
```

Or manually create `backend/.env` with:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/smarthome
JWT_SECRET=your_jwt_secret_here_change_this
```

**Important:** Change `JWT_SECRET` to a secure random string!

#### Frontend
Create a `.env` file in the `frontend` directory:

```
VITE_API_URL=http://localhost:5000/api
```

### 3. Start MongoDB

Make sure MongoDB is running:

- **Windows:** Start MongoDB service or run `mongod`
- **macOS/Linux:** `sudo systemctl start mongod` or `mongod`
- **Docker:** `docker run -d -p 27017:27017 mongo`
- **MongoDB Atlas:** Use your connection string in `MONGO_URI`

### 4. Run the Application

#### Start Backend (Terminal 1)
```bash
cd backend
npm run dev
```

Backend will run on `http://localhost:5000`

#### Start Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:5173`

Open your browser to `http://localhost:5173`

## 📁 Project Structure

```
smartiot/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js  # Authentication logic
│   │   ├── deviceController.js # Device operations
│   │   └── adminController.js  # Admin operations
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication
│   │   └── admin.js           # Admin authorization
│   ├── models/
│   │   ├── User.js            # User schema
│   │   ├── Device.js          # Device schema
│   │   └── Log.js             # Activity log schema
│   ├── routes/
│   │   ├── authRoutes.js      # Auth endpoints
│   │   ├── deviceRoutes.js    # Device endpoints
│   │   └── adminRoutes.js     # Admin endpoints
│   ├── utils/
│   │   └── generateToken.js   # JWT token generation
│   ├── server.js              # Express server setup
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   └── DeviceCard.jsx  # Device display component
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Auth state management
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx   # Main dashboard
│   │   │   ├── LoginPage.jsx   # Login page
│   │   │   ├── RegisterPage.jsx # Registration page
│   │   │   └── AdminPanel.jsx  # Admin panel
│   │   ├── services/
│   │   │   └── api.js          # Axios API client
│   │   ├── App.jsx             # Main app component
│   │   └── main.jsx            # Entry point
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── .env.example
├── .gitignore
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Devices (Requires Auth)
- `GET /api/devices` - Get user's devices
- `POST /api/devices` - Add new device
- `PUT /api/devices/:id/toggle` - Toggle device status
- `PUT /api/devices/:id/thermostat` - Update thermostat value

### Admin (Requires Admin Role)
- `GET /api/admin/pending` - Get pending devices
- `PUT /api/admin/approve/:id` - Approve device

## 👤 Creating an Admin User

### Method 1: Using the Seeder Script (Recommended)

Run the admin seeder script:

```bash
cd backend
npm run seed:admin
```

This will create an admin user with:
- **Email:** `admin@smarthome.com` (default)
- **Password:** `admin123` (default)
- **Name:** `Admin User` (default)

**To customize the admin credentials**, add these to your `backend/.env`:
```
ADMIN_EMAIL=your-admin@email.com
ADMIN_PASSWORD=your-secure-password
ADMIN_NAME=Your Admin Name
```

Then run the seeder again:
```bash
cd backend
npm run seed:admin
```

### Method 2: Using MongoDB Directly

If you already have a user account, you can update it to admin:

```javascript
// In MongoDB shell or Compass
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

### Method 3: Register and Update Manually

1. Register a new user through the web interface
2. Update the user's role in MongoDB:
   ```javascript
   db.users.updateOne(
     { email: "your-registered-email@example.com" },
     { $set: { role: "admin" } }
   )
   ```
3. Logout and login again to see admin features

## 🎯 Usage Flow

1. **Register** a new user account
2. **Login** with your credentials
3. **Add devices** from the dashboard (they will be pending approval)
4. **Login as admin** and approve devices from the Admin Panel
5. **Toggle/Control** your approved devices
6. View real-time updates via Socket.io

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod` or check service status
- Verify `MONGO_URI` in `backend/.env` is correct
- Check MongoDB is accessible on port 27017

### Port Already in Use
- Change `PORT` in `backend/.env` if 5000 is taken
- Change Vite port in `frontend/vite.config.js` if 5173 is taken

### CORS Errors
- Ensure backend CORS allows frontend origin
- Check `VITE_API_URL` in `frontend/.env` matches backend URL

### Socket.io Not Working
- Ensure socket client connects to correct URL (without `/api`)
- Check backend Socket.io CORS configuration

### Dependencies Not Installing
- Delete `node_modules` folders and `package-lock.json` files
- Run `npm install` again
- Check Node.js version: `node --version` (should be v14+)

## 📦 Technologies Used

### Backend
- Express.js - Web framework
- MongoDB + Mongoose - Database
- JWT - Authentication
- Socket.io - Real-time communication
- bcryptjs - Password hashing

### Frontend
- React 18 - UI library
- Vite - Build tool
- React Router - Routing
- Axios - HTTP client
- Socket.io-client - Real-time client
- Tailwind CSS - Styling

## 🚀 Deployment Notes

### Backend Deployment
- Set environment variables on hosting platform
- Use MongoDB Atlas for cloud database
- Update CORS to allow frontend domain

### Frontend Deployment
- Build: `npm run build` in frontend directory
- Deploy `dist` folder to hosting (Vercel, Netlify, etc.)
- Update `VITE_API_URL` to production backend URL

## 📝 License

ISC

## 👨‍💻 Development

For development, both servers support hot-reload:
- Backend: `nodemon` automatically restarts on file changes
- Frontend: Vite HMR (Hot Module Replacement) updates instantly

---

**Good luck with your SmartHome360 project!** 🏠✨

