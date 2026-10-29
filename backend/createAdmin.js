const bcrypt = require("bcryptjs");
const { User, sequelize } = require("./src/models");

async function createAdminUser() {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ where: { email: "admin@erp.com" } });
    
    if (existingAdmin) {
      const hashedPassword = await bcrypt.hash("Africangarden@123", 12);
      await existingAdmin.update({ password: hashedPassword, isActive: true });
      console.log("Admin user already exists (password updated)!");
      console.log("Email: admin@erp.com");
      console.log("Password: Africangarden@123");
      console.log("Role: Admin");
      await sequelize.close();
      process.exit(0);
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
    console.log("🔑 Password: Africangarden@123");
    console.log("👤 Role: Admin");
    console.log("📱 Phone: +254700000000");
    console.log("📍 Address: Nairobi, Kenya");
    console.log("✅ Status: Active");
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);
    console.error("Stack trace:", error.stack);
    await sequelize.close();
    process.exit(1);
  }
}

// Run the script
createAdminUser(); 