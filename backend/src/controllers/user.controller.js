const { User } = require("../models");
const { getPagination, getPagingData } = require("../utils/pagination");
const bcrypt = require("bcryptjs");

// GET /api/users
exports.fetchUsers = async (req, res) => {
  try {
    console.log('fetchUsers controller called');
    console.log('Request query:', req.query);
    console.log('Request user:', req.user);
    
    const { page = 1, pageSize = 10, search = "" } = req.query;
    const where = search
      ? { 
          [require("sequelize").Op.or]: [
            { name: { [require("sequelize").Op.like]: `%${search}%` } },
            { email: { [require("sequelize").Op.like]: `%${search}%` } },
            { role: { [require("sequelize").Op.like]: `%${search}%` } },
            { id: search }
          ]
        }
      : {};
    const { limit, offset } = getPagination(page, pageSize);

    console.log('Database query params:', { where, limit, offset, page, pageSize });

    const data = await User.findAndCountAll({
      where,
      limit,
      offset,
      order: [["name", "ASC"]],
      attributes: { exclude: ['password'] } // Don't send passwords
    });

    console.log('Database result:', { count: data.count, rows: data.rows.length });
    console.log('Users found:', data.rows.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })));

    const response = getPagingData(data, +page, +pageSize);
    console.log('Response data:', response);

    res.json(response);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
};

// GET /api/users/:id
exports.getUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: "Error fetching user", error: error.message });
  }
};

// POST /api/users
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, address } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        message: "Missing required fields: name, email, password, and role are required" 
      });
    }

    // Validate role
    const validRoles = ['Admin', 'Manager', 'Staff'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        message: "Invalid role. Must be one of: Admin, Manager, Staff" 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      address,
      isActive: true
    });

    // Return user without password
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: "Error creating user", error: error.message });
  }
};

// PUT /api/users/:id
exports.updateUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, address, isActive } = req.body;
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['Admin', 'Manager', 'Staff'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ 
          message: "Invalid role. Must be one of: Admin, Manager, Staff" 
        });
      }
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
    }

    // Prepare update data
    const updateData = { name, email, role, phone, address, isActive };
    
    // Hash password if provided
    if (password) {
      const saltRounds = 12;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    // Remove undefined fields
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    // Update user
    await user.update(updateData);

    // Return updated user without password
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.json(userResponse);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: "Error updating user", error: error.message });
  }
};

// DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent deleting the last admin
    if (user.role === 'Admin') {
      const adminCount = await User.count({ where: { role: 'Admin' } });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          message: "Cannot delete the last admin user" 
        });
      }
    }

    // Soft delete by setting isActive to false
    await user.update({ isActive: false });
    
    res.json({ message: "User deactivated successfully" });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: "Error deleting user", error: error.message });
  }
};

// GET /api/users/roles
exports.getRoles = async (req, res) => {
  try {
    const roles = [
      { value: 'Admin', label: 'Administrator', description: 'Full system access' },
      { value: 'Manager', label: 'Manager', description: 'Business operations access' },
      { value: 'Staff', label: 'Staff', description: 'Limited access to assigned areas' }
    ];
    
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: "Error fetching roles", error: error.message });
  }
};
