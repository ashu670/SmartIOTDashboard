# Quick Start Guide - SmartHome360

## 🚀 Get Running in 5 Minutes

### Step 1: Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### Step 2: Set Up Environment Variables

**Backend:** Copy `.env.example` to `.env` in the `backend` folder:
```bash
cd backend
copy .env.example .env
```
Then edit `.env` and set your `JWT_SECRET` (use a random string).

**Frontend:** Copy `.env.example` to `.env` in the `frontend` folder:
```bash
cd frontend
copy .env.example .env
```

### Step 3: Start MongoDB

Make sure MongoDB is running on your system:
- Windows: Check MongoDB service or run `mongod`
- Or use MongoDB Atlas (cloud) and update `MONGO_URI` in backend `.env`

### Step 4: Start the Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Server runs on `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:5173`

### Step 5: Open Browser

Navigate to `http://localhost:5173`

### Step 6: Create Admin User

1. Register a new user
2. Open MongoDB (Compass or shell)
3. Update the user's role to `admin`:
   ```javascript
   db.users.updateOne(
     { email: "your-email@example.com" },
     { $set: { role: "admin" } }
   )
   ```
4. Logout and login again
5. You'll see the "Admin Panel" button

## ✅ That's It!

You're ready to:
- Register/Login users
- Add devices
- Approve devices (as admin)
- Control devices in real-time

## 🆘 Need Help?

Check the main `README.md` for detailed troubleshooting and API documentation.

