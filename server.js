require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const path = require('path');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const jsonwebtoken = require('jsonwebtoken');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { verifyToken } = require('./config/jwt');
const jwt = require('jsonwebtoken');
const Project = require('./models/Project');
const stream = require('stream');
const { generateToken } = require('./config/jwt');
const mongoose = require('mongoose')
const projectRoutes = require('./routes/project.routes');
const propertyRoutes = require('./routes/property.routes')
const adminRoutes = require('./routes/admin.routes');
const agencyRoutes = require('./routes/agency.routes');
const userRoutes = require('./routes/user.routes');
const { getUserFromToken } = require('./utils/auth')

// Import controllers and middleware
const { login } = require('./controllers/user.controller');
const { requireAuth, requireRole } = require('./middleware/requireAuth');

// Import models
const Property = require('./models/Property');
const User = require('./models/User');
const ContactMessage = require('./models/ContactMessage');

const app = express();
app.use(cookieParser());

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/public', express.static(path.join(__dirname, 'public')));

app.use('/properties', propertyRoutes);
app.use('/projects', projectRoutes);
app.use('/admin', adminRoutes);
app.use('/agent', require('./routes/agents.routes'));
app.use('/agency', agencyRoutes);
app.use('/', userRoutes); // or mount on `/auth` or similar if desired

connectDB();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));



// Optional: Add an API endpoint for AJAX filtering (for better UX)
app.get('/api/properties', async (req, res) => {
  try {
    const { type, search, status, limit = 50 } = req.query;
    
    let filter = {};
    
    if (type && type !== 'all') {
      filter.type = type;
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { areaName: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { state: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } }
      ];
    }

    const properties = await Property.find(filter)
      .populate('agent', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Format properties for JSON response
    const formattedProperties = properties.map(property => ({
      _id: property._id,
      title: property.title || 'Untitled Property',
      location: property.location || 'Location not specified',
      type: property.type || 'home',
      price: property.price || 0,
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      area: property.area || 0,
      status: property.status || 'active',
      imageUrl: property.imageUrl || null,
      agent: property.agent ? {
        name: property.agent.name,
        email: property.agent.email,
        phone: property.agent.phone
      } : null
    }));

    res.json({
      success: true,
      properties: formattedProperties,
      count: formattedProperties.length
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching properties'
    });
  }
});

























































// GET /contact route
app.get('/contact', async (req, res) => {
    const user = await getUserFromToken(req);

    res.render('contact', {
        pageTitle: 'Contact Us - PropertyHub',
        user, // Ensure user is passed for auth checks
        header: {
            title: 'Contact Us',
            subtitle: 'Ready to find your dream property?...'
        },
        form: {
            title: 'Contact Our Team',
            subtitle: 'Fill out the form and we’ll respond ASAP.'
        },
        contactInfo: {
            address: '123 Property Lane, Real Estate City, RE 12345',
            phone: '080092633',
            phoneDisplay: '0800-propertyhub (92633)',
            email: 'alihamzajutt812@gmail.com',
            whatsappNumber: '+92 3404103311',
            whatsappUrl: 'https://wa.me/923404103311'
        },
        mapSection: {
            embedUrl: 'https://www.google.com/maps/embed?pb=...'
        },
        formData: {},
        message: null,
        messageType: null
    });
});


app.post('/contact', async (req, res) => {
  const { firstName, lastName, email, phone, message } = req.body;

  const formData = { firstName, lastName, email, phone, message };

  // Basic validation
  if (!firstName || !lastName || !email || !message) {
    return res.render('contact', {
      pageTitle: 'Contact Us - PropertyHub',
      user: req.user || null, // Ensure user is passed for auth checks
      header: {
        title: 'Contact Us',
        subtitle: 'Ready to find your dream property?...'
      },
      form: {
        title: 'Contact Our Team',
        subtitle: 'Fill out the form and we’ll respond ASAP.'
      },
      contactInfo: {
        address: '123 Property Lane, Real Estate City, RE 12345',
        phone: '080092633',
        phoneDisplay: '0800-propertyhub (92633)',
        email: 'alihamzajutt812@gmail.com',
        whatsappNumber: '+92 3404103311',
        whatsappUrl: 'https://wa.me/923404103311'
      },
      mapSection: {
        embedUrl: 'https://www.google.com/maps/embed?pb=...'
      },
      formData,
      message: 'Please fill in all required fields.',
      messageType: 'error'
    });
  }

  try {
    await ContactMessage.create(formData);

    res.render('contact', {
      pageTitle: 'Contact Us - PropertyHub',
      user: req.user || null, // Ensure user is passed for auth checks
      header: {
        title: 'Contact Us',
        subtitle: 'Ready to find your dream property?...'
      },
      form: {
        title: 'Contact Our Team',
        subtitle: 'Fill out the form and we’ll respond ASAP.'
      },
      contactInfo: {
        address: '123 Property Lane, Real Estate City, RE 12345',
        phone: '080092633',
        phoneDisplay: '0800-propertyhub (92633)',
        email: 'alihamzajutt812@gmail.com',
        whatsappNumber: '+92 3404103311',
        whatsappUrl: 'https://wa.me/923404103311'
      },
      mapSection: {
        embedUrl: 'https://www.google.com/maps/embed?pb=...'
      },
      formData: {},
      message: 'Thank you! Your message has been received.',
      messageType: 'success'
    });
  } catch (error) {
    console.error(error);
    res.render('contact', {
      pageTitle: 'Contact Us - PropertyHub',
      header: {
        title: 'Contact Us',
        subtitle: 'Ready to find your dream property?...'
      },
      form: {
        title: 'Contact Our Team',
        subtitle: 'Fill out the form and we’ll respond ASAP.'
      },
      contactInfo: {
        address: '123 Property Lane, Real Estate City, RE 12345',
        phone: '080092633',
        phoneDisplay: '0800-propertyhub (92633)',
        email: 'alihamzajutt812@gmail.com',
        whatsappNumber: '+92 3404103311',
        whatsappUrl: 'https://wa.me/923404103311'
      },
      mapSection: {
        embedUrl: 'https://www.google.com/maps/embed?pb=...'
      },
      formData,
      message: 'Something went wrong. Please try again later.',
      messageType: 'error'
    });
  }
});


// Middleware to handle 500 errors
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).send('Internal Server Error');
});
// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).send('Something went wrong!');
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('Page not found');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});