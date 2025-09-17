// src/controllers/businessProfile.controller.js

const { BusinessProfile } = require("../models");

// Get business profile
exports.getBusinessProfile = async (req, res, next) => {
  try {
    const businessProfile = await BusinessProfile.findOne();
    
    if (!businessProfile) {
      return res.status(404).json({ 
        message: "Business profile not found",
        exists: false 
      });
    }

    res.status(200).json({
      success: true,
      data: businessProfile,
      exists: true
    });
  } catch (error) {
    console.error('Error fetching business profile:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch business profile", 
      error: error.message 
    });
  }
};

// Create business profile
exports.createBusinessProfile = async (req, res, next) => {
  try {
    const { 
      name,
      company_name,
      company_address,
      company_city,
      company_country,
      company_phone,
      company_email,
      company_website,
      company_reg_number,
      currency,
      invoice_footer
    } = req.body;
    
    // Handle logo file upload
    let company_logo = null;
    let logo_type = null;
    let logo_name = null;
    
    if (req.file) {
      company_logo = req.file.buffer;
      logo_type = req.file.mimetype;
      logo_name = req.file.originalname;
    }

    // Check if business profile already exists
    const existingProfile = await BusinessProfile.findOne();
    if (existingProfile) {
      return res.status(400).json({ 
        success: false,
        message: "Business profile already exists. Use update instead.",
        exists: true
      });
    }

    // Validate required fields
    if (!name || !company_name) {
      return res.status(400).json({ 
        success: false,
        message: "Company name is required" 
      });
    }

    const businessProfile = await BusinessProfile.create({
      name,
      company_logo,
      logo_type,
      logo_name,
      company_name: company_name || name,
      company_address: company_address || "",
      company_city: company_city || "",
      company_country: company_country || "",
      company_phone: company_phone || "",
      company_email: company_email || "",
      company_website: company_website || "",
      company_reg_number: company_reg_number || "",
      currency: currency || "KSH",
      invoice_footer: invoice_footer || "Thank you for your business!"
    });

    res.status(201).json({
      success: true,
      message: "Business profile created successfully",
      data: businessProfile
    });
  } catch (error) {
    console.error('Error creating business profile:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to create business profile", 
      error: error.message 
    });
  }
};

// Update business profile
exports.updateBusinessProfile = async (req, res, next) => {
  try {
    console.log('updateBusinessProfile controller called');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    
    const { 
      name,
      company_name,
      company_address,
      company_city,
      company_country,
      company_phone,
      company_email,
      company_website,
      company_reg_number,
      currency,
      invoice_footer
    } = req.body;
    
    // Handle logo file upload
    let company_logo = null;
    let logo_type = null;
    let logo_name = null;
    
    if (req.file) {
      company_logo = req.file.buffer;
      logo_type = req.file.mimetype;
      logo_name = req.file.originalname;
      console.log('New logo file uploaded:', { logo_type, logo_name });
    }

    // Find existing business profile
    const businessProfile = await BusinessProfile.findOne();
    if (!businessProfile) {
      console.log('No existing business profile found');
      return res.status(404).json({ 
        success: false,
        message: "Business profile not found. Create one first.",
        exists: false
      });
    }

    console.log('Existing profile found:', businessProfile.id);
    console.log('Current profile data:', {
      name: businessProfile.name,
      company_name: businessProfile.company_name,
      company_address: businessProfile.company_address,
      company_city: businessProfile.company_city,
      company_country: businessProfile.company_country,
      company_phone: businessProfile.company_phone,
      company_email: businessProfile.company_email,
      company_website: businessProfile.company_website,
      company_reg_number: businessProfile.company_reg_number,
      currency: businessProfile.currency,
      invoice_footer: businessProfile.invoice_footer
    });

    // Prepare update data
    const updateData = {
      name: name !== undefined ? name : businessProfile.name,
      company_name: company_name !== undefined ? company_name : businessProfile.company_name,
      company_address: company_address !== undefined ? company_address : businessProfile.company_address,
      company_city: company_city !== undefined ? company_city : businessProfile.company_city,
      company_country: company_country !== undefined ? company_country : businessProfile.company_country,
      company_phone: company_phone !== undefined ? company_phone : businessProfile.company_phone,
      company_email: company_email !== undefined ? company_email : businessProfile.company_email,
      company_website: company_website !== undefined ? company_website : businessProfile.company_website,
      company_reg_number: company_reg_number !== undefined ? company_reg_number : businessProfile.company_reg_number,
      currency: currency !== undefined ? currency : businessProfile.currency,
      invoice_footer: invoice_footer !== undefined ? invoice_footer : businessProfile.invoice_footer
    };

    // Only update logo fields if a new file was uploaded
    if (company_logo) {
      updateData.company_logo = company_logo;
      updateData.logo_type = logo_type;
      updateData.logo_name = logo_name;
    }

    console.log('Update data:', updateData);

    const updatedProfile = await businessProfile.update(updateData);

    console.log('Profile updated successfully');
    console.log('Updated profile:', updatedProfile.toJSON());

    res.status(200).json({
      success: true,
      message: "Business profile updated successfully",
      data: updatedProfile
    });
  } catch (error) {
    console.error('Error updating business profile:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to update business profile", 
      error: error.message 
    });
  }
};

// Delete business profile (if needed)
exports.deleteBusinessProfile = async (req, res, next) => {
  try {
    const businessProfile = await BusinessProfile.findOne();
    if (!businessProfile) {
      return res.status(404).json({ 
        success: false,
        message: "Business profile not found" 
      });
    }

    await businessProfile.destroy();

    res.status(200).json({
      success: true,
      message: "Business profile deleted successfully"
    });
  } catch (error) {
    console.error('Error deleting business profile:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to delete business profile", 
      error: error.message 
    });
  }
};
