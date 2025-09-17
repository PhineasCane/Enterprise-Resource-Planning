const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config");

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role = "Staff" } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: "Missing required fields: name, email, and password are required" 
      });
    }

    // Validate role
    const validRoles = ['Admin', 'Manager', 'Staff'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ 
        message: "Invalid role. Must be one of: Admin, Manager, Staff" 
      });
    }

    // Check if user already exists
    const exists = await User.findOne({ where: { email } });
    if (exists) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = await User.create({ 
      name, 
      email, 
      password: hashedPassword,
      role,
      isActive: true
    });

    // Generate token
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return user data (without password) and token
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json({
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({ message: "Error creating user", error: error.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        message: "Email and password are required" 
      });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: "Account is deactivated" });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return user data (without password) and token
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.json({
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ message: "Error during login", error: error.message });
  }
};

// GET /api/auth/me - Get current user profile
exports.getCurrentUser = async (req, res) => {
  try {
    // User is already authenticated via middleware
    const userId = req.user.id;
    
    // Find user by ID
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] } // Don't send password
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ message: "Error fetching user profile", error: error.message });
  }
};
