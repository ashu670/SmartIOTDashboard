# 🚀 How to Start SmartHome360 Project

## Quick Start Guide

### Step 1: Make Sure MongoDB is Running

**Option A: Local MongoDB**
- Make sure MongoDB service is running on your computer
- Default connection: `mongodb://localhost:27017/smarthome`

**Option B: MongoDB Atlas (Cloud)**
- Get your connection string from MongoDB Atlas
- Update `MONGO_URI` in `backend/.env`

### Step 2: Install Dependencies (if not done)

From the root directory (`C:\smartiot`):

```bash
npm run install-all
```

This installs dependencies for:
- Root project
- Backend
- Frontend

### Step 3: Set Up Environment Variables

**Backend** (`backend/.env`):
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/smarthome
JWT_SECRET=your_super_secret_jwt_key_change_this
```

**Frontend** (`frontend/.env`):
```
VITE_API_URL=http://localhost:5000/api
```

> **Note:** If `.env` files don't exist, copy from `.env.example` files in each directory.

### Step 4: Start the Project

From the root directory (`C:\smartiot`):

```bash
npm run dev
```

This starts both servers:
- **Backend:** `http://localhost:5000`
- **Frontend:** `http://localhost:5173`

### Step 5: Open in Browser

Go to: **http://localhost:5173**

---

## Alternative: Start Servers Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## First Time Setup Checklist

- [ ] MongoDB is running (local or Atlas)
- [ ] Dependencies installed (`npm run install-all`)
- [ ] `backend/.env` file exists with correct values
- [ ] `frontend/.env` file exists with correct values
- [ ] Backend server starts without errors
- [ ] Frontend server starts without errors
- [ ] Can access `http://localhost:5173` in browser

---

## Troubleshooting

### MongoDB Connection Error
```
MongoDB connection error: ...
```
**Solution:** Make sure MongoDB is running or update `MONGO_URI` in `backend/.env`

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:** Change `PORT` in `backend/.env` or stop the process using that port

### Dependencies Missing
```
'nodemon' is not recognized...
'vite' is not recognized...
```
**Solution:** Run `npm run install-all` from root directory

### CORS Errors
**Solution:** Check `VITE_API_URL` in `frontend/.env` matches backend URL

---

## What to Do After Starting

1. **Register a new account**
   - Choose "Admin" or "User" role during registration
   - Admin can approve devices
   - User can add and control devices

2. **Add devices** (as User)
   - Devices start as "pending approval"
   - Wait for admin to approve

3. **Approve devices** (as Admin)
   - Go to Admin Panel
   - Click "Approve" on pending devices

4. **Control devices**
   - Toggle lights/alarms on/off
   - Adjust thermostat temperature
   - View real-time updates

---

## Available Commands

From root directory:
- `npm run dev` - Start both servers
- `npm run server` - Start only backend
- `npm run client` - Start only frontend
- `npm run install-all` - Install all dependencies

From backend directory:
- `npm run dev` - Start backend with nodemon
- `npm run seed:admin` - Create admin user

From frontend directory:
- `npm run dev` - Start frontend with Vite
- `npm run build` - Build for production

---

**Need help?** Check the main `README.md` for detailed documentation.

