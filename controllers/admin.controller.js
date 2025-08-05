// controllers/admin.controller.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Property = require('../models/Property');
const Project = require('../models/Project');
const { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } = require('../utils/cloudinary');


exports.createAdmin = async (req, res) => {
  try {
    const existing = await User.findOne({ email: 'alihamzajutt812@gmail.com' });
    if (existing) return res.send('Admin already exists');

    const user = new User({
      name: 'ali hamza',
      email: 'alihamzajutt812@gmail.com',
      phone: '03404103311',
      password: 'admin123',
      role: 'admin'
    });

    await user.save();
    res.send('✅ Admin created with password: admin123');
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).send('Error creating admin');
  }
};

exports.getAdminDashboard = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.redirect('/login');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the logged-in admin
    const user = await User.findById(decoded.id).select('-password');
    if (!user || user.role !== 'admin') {
      return res.status(403).send('Access denied. Only admins can access this page.');
    }

    // Fetch all data
    const properties = await Property.find();
    const agents = await User.find({ role: 'agent' }).select('-password');
    const users = await User.find().select('-password');
    const projects = await Project.find().populate('agency', 'name email');

    // Render admin dashboard
    res.render('admin-dashboard', {
      pageTitle: 'Admin Dashboard - PropertyHub',
      user,
      projects,
      agents,
      properties,
      users
    });

  } catch (err) {
    console.error('❌ Error in /admin/dashboard:', err.message);
    res.status(500).send('Something went wrong while loading the admin dashboard.');
  }
};

exports.getEditPropertyForm = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate('agent');
    if (!property) return res.status(404).send('Property not found');

    res.render('edit-property', {
      property,
      pageTitle: 'Edit Property (Admin)',
      currentPage: 'edit-property',
      user: req.user,
      editAction: `/admin/properties/edit/${property._id}`,
      cancelUrl: '/admin/dashboard'
    });
  } catch (error) {
    console.error('Error loading admin edit form:', error);
    res.status(500).send('Error loading edit form');
  }
};

exports.updatePropertyByAdmin = async (req, res) => {
  try {
    const {
      title, state, city, areaName,
      latitude, longitude, type, price,
      bedrooms, bathrooms, area,
      status, description, localArea, amenities,
      slug, propertyPurpose
    } = req.body;

    const updateData = {
      title,
      location: `${state}, ${city}, ${areaName}`,
      state,
      city,
      areaName,
      latitude: parseFloat(latitude) || 0,
      longitude: parseFloat(longitude) || 0,
      coordinates: {
        lat: parseFloat(latitude) || 0,
        lng: parseFloat(longitude) || 0
      },
      type,
      price: parseFloat(price) || 0,
      bedrooms: parseInt(bedrooms) || 0,
      bathrooms: parseInt(bathrooms) || 0,
      area: parseFloat(area) || 0,
      status: status || 'active',
      description,
      localArea,
      amenities: Array.isArray(amenities) ? amenities : amenities ? [amenities] : [],
      slug: slug
        ? slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        : undefined,
      propertyPurpose
    };

    // ✅ Handle image upload
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file =>
        uploadToCloudinary(file.buffer, 'properties')
      );
      const imageUrls = await Promise.all(uploadPromises);
      updateData.imageUrls = imageUrls;
    }

    // ✅ Update in DB
    await Property.findByIdAndUpdate(req.params.id, updateData);

    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Admin error updating property:', error);
    res.status(500).send('Error updating property');
  }
};

exports.getAdminAgentsPage = async (req, res) => {
  try {
    const agents = await User.find({ role: 'agent' });
    res.render('admin-agents', {
      pageTitle: 'Manage Agents',
      currentPage: 'admin',
      user: req.user,
      agents
    });
  } catch (error) {
    console.error('Error loading agents:', error);
    res.status(500).send('Error loading agents');
  }
};

exports.createAgent = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const agents = await User.find({ role: 'agent' });
      return res.render('admin-agents', {
        error: 'Email already exists',
        pageTitle: 'Manage Agents',
        currentPage: 'admin',
        user: req.user,
        agents
      });
    }

    const agent = new User({
      name,
      email,
      phone,
      password,
      role: 'agent'
    });

    await agent.save();
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).send('Error creating agent');
  }
};

exports.deleteAgent = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error deleting agent:', error);
    res.status(500).send('Error deleting agent');
  }
};

// Show edit agent form
exports.getEditAgentForm = async (req, res) => {
  try {
    const agent = await User.findById(req.params.id);
    if (!agent || agent.role !== 'agent') {
      return res.status(404).send('Agent not found');
    }

    res.render('edit-agent', {
      pageTitle: 'Edit Agent (Admin)',
      currentPage: 'edit-agent',
      user: req.user,
      agent,
      editAction: `/admin/agents/edit/${agent._id}`, // form action URL
      cancelUrl: '/admin/dashboard'                  // back button
    });
  } catch (error) {
    console.error('Error loading edit agent form:', error);
    res.status(500).send('Error loading edit form');
  }
};

// Handle agent update
exports.updateAgent = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    await User.findByIdAndUpdate(req.params.id, { name, email, phone });
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error updating agent:', error);
    res.status(500).send('Error updating agent');
  }
};

exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);
    if (!property) {
      return res.status(404).send('Property not found');
    }

    // Optional: Delete images from Cloudinary
    if (property.imageUrls && property.imageUrls.length > 0) {
      const deletePromises = property.imageUrls.map(url => {
        const publicId = getPublicIdFromUrl(url); // assuming this helper exists
        return deleteFromCloudinary(publicId);
      });
      await Promise.all(deletePromises);
    }

    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error deleting property (admin):', error);
    res.status(500).send('Error deleting property');
  }
};

exports.getEditProjectForm = async (req, res) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug });
    if (!project) return res.status(404).send('Project not found');

    res.render('edit-project', {
      project,
      pageTitle: 'Edit Project (Admin)',
      currentPage: 'edit-project',
      user: req.user,
      editAction: `/admin/projects/edit/${project.slug}`,
      cancelUrl: '/admin/dashboard'
    });
  } catch (error) {
    console.error('Error loading admin edit form:', error);
    res.status(500).send('Error loading edit form');
  }
};

// Handle project update
exports.updateProject = async (req, res) => {
  try {
    const {
      title,
      slug,
      description,
      location,
      state,
      city,
      areaName,
      type,
      launchDate,
      completionDate,
      priceMin,
      priceMax,
      amenities,
      status
    } = req.body;

    const project = await Project.findOne({ slug: req.params.slug });
    if (!project) return res.status(404).send('Project not found');

    const normalizedSlug = slug?.toLowerCase().trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    const existing = await Project.findOne({
      slug: normalizedSlug,
      _id: { $ne: project._id }
    });

    if (existing) {
      return res.status(400).send('Slug already exists. Please choose another one.');
    }

    const updateData = {
      title,
      slug: normalizedSlug,
      description,
      location,
      state,
      city,
      areaName,
      type,
      launchDate: launchDate ? new Date(launchDate) : undefined,
      completionDate: completionDate ? new Date(completionDate) : undefined,
      priceRange: {
        min: parseFloat(priceMin) || 0,
        max: parseFloat(priceMax) || 0
      },
      amenities: Array.isArray(amenities) ? amenities : amenities ? [amenities] : [],
      status: status || 'active'
    };

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      // Delete old images
      if (project.imageUrls && project.imageUrls.length > 0) {
        const deletePromises = project.imageUrls.map(url => {
          const publicId = getPublicIdFromUrl(url);
          return deleteFromCloudinary(publicId);
        });
        await Promise.all(deletePromises);
      }

      const uploadPromises = req.files.map(file =>
        uploadToCloudinary(file.buffer, 'projects')
      );
      const imageUrls = await Promise.all(uploadPromises);
      updateData.imageUrls = imageUrls;
    }

    await Project.findByIdAndUpdate(project._id, updateData, { new: true });

    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error updating project (admin):', error);
    res.status(500).send('Error updating project');
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug });
    if (!project) {
      return res.status(404).send('Project not found');
    }

    // Delete all associated images from Cloudinary
    if (project.imageUrls && project.imageUrls.length > 0) {
      const deletePromises = project.imageUrls.map(url => {
        const publicId = getPublicIdFromUrl(url);
        return deleteFromCloudinary(publicId);
      });
      await Promise.all(deletePromises);
    }

    // Remove the project from the database
    await project.deleteOne();

    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error deleting project (admin):', error);
    res.status(500).send('Error deleting project');
  }
};