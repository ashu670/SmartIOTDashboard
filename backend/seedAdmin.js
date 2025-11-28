require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

async function createAdmin() {
  try {
    await connectDB();

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@smarthome.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || 'Admin User';
    const adminHouseName = process.env.ADMIN_HOUSE_NAME || 'MyHouse';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    // Check if admin already exists for this house
    const existingHouseAdmin = await User.findOne({ houseName: adminHouseName, role: 'admin' });
    if (existingHouseAdmin && existingHouseAdmin.email !== adminEmail) {
      console.log('⚠️  An admin already exists for house:', adminHouseName);
      console.log('   Existing admin:', existingHouseAdmin.email);
      console.log('   Use a different house name or update the existing admin');
      process.exit(1);
    }
    
    if (existingAdmin) {
      // Update existing user to admin
      existingAdmin.role = 'admin';
      existingAdmin.password = await bcrypt.hash(adminPassword, 10);
      existingAdmin.name = adminName;
      existingAdmin.houseName = adminHouseName;
      existingAdmin.authorized = true;
      await existingAdmin.save();
      console.log('✅ Existing user updated to admin:', {
        email: existingAdmin.email,
        name: existingAdmin.name,
        role: existingAdmin.role,
        houseName: existingAdmin.houseName
      });
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const admin = await User.create({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        houseName: adminHouseName,
        authorized: true
      });
      console.log('✅ Admin user created:', {
        email: admin.email,
        name: admin.name,
        role: admin.role,
        houseName: admin.houseName
      });
    }

    console.log('\n📧 Admin Credentials:');
    console.log('   Email:', adminEmail);
    console.log('   Password:', adminPassword);
    console.log('   House Name:', adminHouseName);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('   Login with: Role=admin, House Name=' + adminHouseName);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();

