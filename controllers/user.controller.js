const User = require('../models/User');
const { uploadToCloudinary } = require('../utils/cloudinary');
const stream = require('stream');
const { generateToken } = require('../config/jwt'); // adjust path if different
const { getUserFromToken } = require('../utils/auth')
const Property = require('../models/Property')
const Project = require('../models/Project');
const { title } = require('process');
const { Template } = require('ejs');
const cloudinary = require('cloudinary').v2;

exports.getRegisterForm = (req, res) => {
  res.render('register', { pageTitle: 'Register' });
};

exports.registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      confirmPassword,
      role,
      agencyName,
      agencyAddress
    } = req.body;

    const userRole = ['agent', 'agency'].includes(role) ? role : 'agent';

    if (password !== confirmPassword) {
      return res.send('Passwords do not match');
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.send('Email already exists');
    }

    if (userRole === 'agency' && req.file) {
      const bufferStream = new stream.PassThrough();
      bufferStream.end(req.file.buffer);

      const cloudinaryUpload = () =>
        new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'agency_logos' },
            (error, result) => {
              if (error) return reject(error);
              resolve(result.public_id);
            }
          );
          bufferStream.pipe(uploadStream);
        });

      const agencyLogoId = await cloudinaryUpload();

      const user = new User({
        name,
        email,
        phone,
        password,
        role: userRole,
        agencyName,
        agencyAddress,
        agencyLogo: agencyLogoId
      });

      await user.save();
      const token = generateToken(user);
      res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
      return res.redirect('/');
    }

    // Otherwise, basic registration (agent or no logo)
    const user = new User({
      name,
      email,
      phone,
      password,
      role: userRole
    });

    await user.save();
    const token = generateToken(user);
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.redirect('/');
  } catch (error) {
    console.error('Error during registration:', error);
    res.send('Registration failed. Please try again.');
  }
};

exports.showLoginForm = (req, res) => {
  res.render('login', { pageTitle: 'Login' });
};

exports.handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.render('login', { 
        error: 'Invalid email or password', 
        pageTitle: 'Login' 
      });
    }

    const token = generateToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.redirect('/');
  } catch (error) {
    console.error('Error during login:', error);
    res.render('login', { 
      error: 'Login failed. Please try again.', 
      pageTitle: 'Login' 
    });
  }
};

exports.searchProperties = async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    const query = req.query.q?.toLowerCase() || '';

    const properties = await Property.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } },
        { type: { $regex: query, $options: 'i' } }
      ]
    });

    res.render('search-results', {
      pageTitle: 'Search Results',
      user,
      query,
      properties
    });
  } catch (err) {
    console.error('❌ Error during search:', err.message);
    res.status(500).send('Server Error');
  }
};

// Logout handler
exports.logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
};

// About Us page
exports.aboutPage = async (req, res) => {
  const user = await getUserFromToken(req);

  res.render('aboutus', {
    pageTitle: 'About Us - PropertyHub',
    user,
    currentPage: 'aboutus'
  });
};

exports.home = async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    const { type, search, status, propertyPurpose } = req.query;
    let filter = {};

    if (type && type !== 'all') filter.type = type;
    if (status && status !== 'all') filter.status = status;
    if (propertyPurpose && propertyPurpose !== 'all') filter.propertyPurpose = propertyPurpose;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { areaName: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { state: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const properties = await Property.find(filter)
      .populate('agent', 'name email phone')
      .sort({ createdAt: -1 });

    const allProperties = await Property.find().populate('agent', 'name email phone');
    const agents = await User.find({ role: 'agent' });

    const totalProperties = allProperties.length;
    const totalAgents = agents.length;
    const activeListings = allProperties.filter(p => p.status === 'active').length;
    const soldProperties = allProperties.filter(p => p.status === 'sold').length;
    const pendingProperties = allProperties.filter(p => p.status === 'pending').length;

    const categoryStats = {
      house: allProperties.filter(p => p.type === 'house').length,
      apartment: allProperties.filter(p => p.type === 'apartment').length,
      plot: allProperties.filter(p => p.type === 'plot').length,
      commercial: allProperties.filter(p => p.type === 'commercial').length
    };

    const formattedProperties = properties.map(property => ({
      _id: property._id,
      title: property.title || 'Untitled Property',
      slug: property.slug || '',
      location: property.location || 'Location not specified',
      state: property.state || '',
      city: property.city || '',
      areaName: property.areaName || '',
      type: property.type || 'home',
      propertyPurpose: property.propertyPurpose || '',
      price: property.price || 0,
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      area: property.area || 0,
      status: property.status || 'active',
      description: property.description || '',
      imageUrls: property.imageUrls || [],
      agent: property.agent ? {
        _id: property.agent._id,
        name: property.agent.name,
        email: property.agent.email,
        phone: property.agent.phone
      } : null,
      latitude: property.latitude || null,
      longitude: property.longitude || null,
      createdAt: property.createdAt || new Date()
    }));

    const agencies = await User.find({ role: 'agency' }).sort({ createdAt: -1 });
    const projects = await Project.find().sort({ createdAt: -1 });

    const activities = [
      {
        type: 'new_listing',
        message: 'New property listed',
        time: new Date()
      }
    ];

    res.render('index', {
      pageTitle: 'Home - PropertyHub',
      currentPage: 'index',
      user,
      stats: {
        totalProperties,
        activeListings,
        totalAgents,
        soldProperties,
        pendingProperties,
        upcoming: 3
      },
      categoryStats,
      activities,
      properties: formattedProperties,
      agents,
      agencies,
      projects,
      currentFilters: {
        type: type || 'all',
        search: search || '',
        status: status || 'all',
        propertyPurpose: propertyPurpose || 'all'
      }
    });

  } catch (error) {
    console.error('🔥 Error loading home page:', error);
    res.status(500).render('error', {
      pageTitle: 'Error',
      error: 'Error loading home page',
      user: null
    });
  }
};