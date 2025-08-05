const Property = require('../models/Property');
const { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } = require('../utils/cloudinary');
const User = require('../models/User')

exports.getAgentDashboard = async (req, res) => {
  try {
    const myProperties = await Property.find({ agent: req.user._id });

    res.render('agent-dashboard', {
      pageTitle: 'My Properties',
      currentPage: 'agent-dashboard',
      user: req.user,
      properties: myProperties
    });
  } catch (error) {
    console.error('Error loading agent dashboard:', error);
    res.status(500).send('Error loading dashboard');
  }
};

exports.getAddPropertyForm = (req, res) => {
  res.render('add-property', {
    pageTitle: 'Add Property',
    currentPage: 'add-property',
    user: req.user
  });
};

exports.createProperty = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });

    const photoUrls = req.files.map(file => file.location);
    const newProperty = new Property({ ...req.body, photos: photoUrls });
    await newProperty.save();
    res.status(201).json({ message: 'Property added', property: newProperty });
  });
};

exports.createNewProperty = async (req, res) => {
  try {
    const {
      title, state, city, areaName,
      latitude, longitude, type, price,
      bedrooms, bathrooms, area,
      status, description, localArea, amenities,
      slug, propertyPurpose
    } = req.body;

    let imageUrls = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer, 'properties');
        imageUrls.push(url);
      }
    }

    const formattedSlug = slug
      ? slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      : title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const property = new Property({
      title,
      location: `${state}, ${city}, ${areaName}`,
      state,
      city,
      areaName,
      latitude,
      longitude,
      type,
      price: parseFloat(price) || 0,
      bedrooms: parseInt(bedrooms) || 0,
      bathrooms: parseInt(bathrooms) || 0,
      area: parseFloat(area) || 0,
      localArea,
      amenities: Array.isArray(amenities) ? amenities : amenities ? [amenities] : [],
      status: status || 'active',
      description,
      imageUrls,
      slug: formattedSlug,
      propertyPurpose,
      agent: req.user._id
    });

    await property.save();
    res.redirect('/agent/dashboard');

  } catch (error) {
    console.error('❌ Error creating property:', error.message);
    res.status(500).render('add-property', {
      pageTitle: 'Add Property',
      user: req.user,
      error: 'Something went wrong while creating the property'
    });
  }
};

exports.getEditPropertyForm = async (req, res) => {
  try {
    const property = await Property.findOne({ _id: req.params.id, agent: req.user._id });
    if (!property) return res.status(404).send('Property not found or access denied');

    res.render('edit-property', {
      property,
      pageTitle: 'Edit Property',
      currentPage: 'edit-property',
      user: req.user,
      editAction: `/agent/properties/edit/${property._id}`,
      cancelUrl: '/agent/dashboard'
    });
  } catch (error) {
    console.error('❌ Error loading edit form:', error);
    res.status(500).send('Error loading edit form');
  }
};

exports.postUpdateProperty = async (req, res) => {
  try {
    const {
      title,
      state,
      city,
      areaName,
      latitude,
      longitude,
      type,
      price,
      bedrooms,
      bathrooms,
      area,
      status,
      description,
      localArea,
      amenities,
      slug,
      propertyPurpose
    } = req.body;

    // ✅ 1. Ensure the property belongs to the agent
    const property = await Property.findOne({ _id: req.params.id, agent: req.user._id });
    if (!property) return res.status(404).send('Property not found or unauthorized');

    // ✅ 2. Prepare update fields
    const updateData = {
      title,
      state,
      city,
      areaName,
      location: `${state}, ${city}, ${areaName}`,
      latitude: parseFloat(latitude) || 0,
      longitude: parseFloat(longitude) || 0,
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
        : property.slug,
      propertyPurpose
    };

    // ✅ 3. If new images are uploaded, replace existing Cloudinary images
    if (req.files && req.files.length > 0) {
      if (property.imageUrls && property.imageUrls.length > 0) {
        const deletePromises = property.imageUrls.map(url => {
          const publicId = getPublicIdFromUrl(url);
          return deleteFromCloudinary(publicId);
        });
        await Promise.all(deletePromises);
      }

      const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer, 'properties'));
      const imageUrls = await Promise.all(uploadPromises);
      updateData.imageUrls = imageUrls;
    }

    // ✅ 4. Save updates
    await Property.findByIdAndUpdate(req.params.id, updateData, { new: true });

    res.redirect('/agent/dashboard');
  } catch (error) {
    console.error('❌ Error updating property:', error);
    res.status(500).send('Error updating property');
  }
};

exports.deleteAgentProperty = async (req, res) => {
  try {
    const property = await Property.findOneAndDelete({
      _id: req.params.id,
      agent: req.user._id
    });

    if (!property) {
      return res.status(404).send('Property not found or access denied');
    }

    // 🧹 Optional: Delete image from Cloudinary
    if (property.imageUrl) {
      const publicId = property.imageUrl.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`properties/${publicId}`);
    }

    res.redirect('/agent/dashboard');
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).send('Error deleting property');
  }
};

exports.getEditProfile = async (req, res) => {
  try {
    const agent = await User.findById(req.user.id);
    if (!agent) return res.status(404).send('Agent not found');

    res.render('edit-agent', {
      pageTitle: 'Edit Profile',
      currentPage: 'edit-agent',
      user: req.user,
      agent,
      editAction: '/agent/edit-profile',
      cancelUrl: '/agent/my-profile'
    });
  } catch (error) {
    console.error('Error loading edit form:', error);
    res.status(500).send('Error loading form');
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    // Optional: handle logo upload
    // const logoUrl = req.file ? await uploadToCloudinary(req.file.buffer, 'agents') : undefined;

    const update = { name, email, phone };

    // Optionally add logo to update:
    // if (logoUrl) update.logo = logoUrl;

    await User.findByIdAndUpdate(req.user.id, update);
    res.redirect('/agent/my-profile');
  } catch (error) {
    console.error('Error updating agent profile:', error);
    res.status(500).send('Error updating profile');
  }
};

exports.viewAgentProfile = async (req, res) => {
  try {
    const agent = await User.findById(req.user._id);
    if (!agent) {
      return res.status(404).send('Agent not found');
    }

    res.render('agent-profile', {
      pageTitle: 'My Profile',
      user: req.user,
      agent
    });
  } catch (error) {
    console.error('🔥 Error loading agent profile:', error);
    res.status(500).send('Error loading profile');
  }
};
