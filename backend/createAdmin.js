const bcrypt = require("bcryptjs");
const { User } = require("./src/models");

async function createAdminUser() {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ where: { email: "admin@erp.com" } });
    
    if (existingAdmin) {
      console.log("Admin user already exists!");
      console.log("Email: admin@erp.com");
      console.log("Password: admin123");
      console.log("Role: Admin");
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("Africangarden@123", 12);
    
    await User.create({
      name: "Admin User",
      email: "admin@erp.com",
      password: hashedPassword,
      role: "Admin",
      phone: "+254700000000",
      address: "Nairobi, Kenya",
      isActive: true
    });

    console.log("✅ Admin user created successfully!");
    console.log("📧 Email: admin@erp.com");
    console.log("🔑 Password: admin123");
    console.log("👤 Role: Admin");
    console.log("📱 Phone: +254700000000");
    console.log("📍 Address: Nairobi, Kenya");
    console.log("✅ Status: Active");
    
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

// Run the script
createAdminUser(); 