const Property = require('../models/Property');
const Project = require('../models/Project');
const { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } = require('../utils/cloudinary');
const { upload } = require('../utils/multer');
const User = require('../models/User')

exports.getAgencyDashboard = async (req, res) => {
  try {
    const agencyUserId = req.user.id;

    const properties = await Property.find({ agent: agencyUserId });
    const projects = await Project.find({ agency: agencyUserId });

    res.render('agency-dashboard', {
      pageTitle: 'Agency Dashboard',
      user: req.user,
      properties,
      projects,
    });
  } catch (err) {
    console.error('❌ Error loading agency dashboard:', err);
    res.status(500).send('Internal Server Error');
  }
};

// Show add property form (GET)
exports.getAddAgencyPropertyForm = (req, res) => {
  res.render('add-property', {
    pageTitle: 'Add Property',
    currentPage: 'add-property',
    user: req.user
  });
};

// Handle add property submission (POST)
exports.postAddAgencyProperty = async (req, res) => {
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
    res.redirect('/agency/dashboard');
  } catch (error) {
    console.error('❌ Error creating property (agency):', error.message);
    res.status(500).render('add-property', {
      pageTitle: 'Add Property',
      user: req.user,
      error: 'Something went wrong while creating the property'
    });
  }
};

// Show edit property form (GET)
exports.getEditAgencyPropertyForm = async (req, res) => {
  try {
    const property = await Property.findOne({ _id: req.params.id, agent: req.user._id });

    if (!property) return res.status(404).send('Property not found or access denied');

    res.render('edit-property', {
      property,
      pageTitle: 'Edit Property',
      currentPage: 'edit-property',
      user: req.user,
      editAction: `/agency/properties/edit/${property._id}`,
      cancelUrl: '/agency/dashboard'
    });
  } catch (error) {
    console.error('❌ Error loading agency property edit form:', error.message);
    res.status(500).send('Error loading edit form');
  }
};

// Handle edit property submission (POST)
exports.postEditAgencyProperty = async (req, res) => {
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

    const property = await Property.findOne({ _id: req.params.id, agent: req.user._id });
    if (!property) return res.status(404).send('Property not found or unauthorized');

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

    // Replace old images if new ones are uploaded
    if (req.files && req.files.length > 0) {
      if (property.imageUrls && property.imageUrls.length > 0) {
        const deletePromises = property.imageUrls.map(url => {
          const publicId = getPublicIdFromUrl(url);
          return deleteFromCloudinary(publicId);
        });
        await Promise.all(deletePromises);
      }

      const uploadPromises = req.files.map(file =>
        uploadToCloudinary(file.buffer, 'properties')
      );
      const imageUrls = await Promise.all(uploadPromises);
      updateData.imageUrls = imageUrls;
    }

    await Property.findByIdAndUpdate(req.params.id, updateData, { new: true });

    res.redirect('/agency/dashboard');
  } catch (error) {
    console.error('❌ Error updating agency property:', error.message);
    res.status(500).send('Error updating property');
  }
};

// Show “Add Project” form (GET /agency/projects/new)
exports.getAddAgencyProjectForm = (req, res) => {
  res.render('add-project', {
    pageTitle: 'Add Project',
    user: req.user
  });
};

// Handle project creation (POST /agency/projects)
exports.postAddAgencyProject = async (req, res) => {
  try {
    const {
      title,
      slug, // from form, optional
      location,
      description,
      amenities,
      type,
      launchDate,
      completionDate,
      priceMin,
      priceMax,
      state,
      city,
      areaName,
      status
    } = req.body;

    let imageUrls = [];
    if (req.files && req.files.length) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer, 'projects');
        imageUrls.push(url);
      }
    }

    const project = new Project({
      title,
      slug,
      location,
      description,
      imageUrls,
      amenities: Array.isArray(amenities) ? amenities : amenities ? [amenities] : [],
      type: type || 'residential',
      launchDate: launchDate ? new Date(launchDate) : null,
      completionDate: completionDate ? new Date(completionDate) : null,
      priceRange: {
        min: priceMin ? Number(priceMin) : undefined,
        max: priceMax ? Number(priceMax) : undefined
      },
      state,
      city,
      areaName,
      status: status || 'active',
      agency: req.user._id
    });

    await project.save();
    res.redirect('/agency/dashboard');
  } catch (error) {
    console.error('❌ Error creating project:', error.message);
    res.status(500).render('add-project', {
      pageTitle: 'Add Project',
      user: req.user,
      error: 'Something went wrong while saving the project'
    });
  }
};

// Show edit form for a specific project (GET /agency/projects/edit/:slug)
exports.getEditAgencyProjectForm = async (req, res) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug, agency: req.user._id });
    if (!project) return res.status(404).send('Project not found or access denied');

    res.render('edit-project', {
      project,
      pageTitle: 'Edit Project',
      currentPage: 'edit-project',
      user: req.user,
      editAction: `/agency/projects/edit/${project.slug}`,
      cancelUrl: '/agency/dashboard'
    });
  } catch (error) {
    console.error('Error loading edit form:', error);
    res.status(500).send('Error loading edit form');
  }
};

// Handle project update (POST /agency/projects/edit/:slug)
exports.postEditAgencyProject = async (req, res) => {
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

    const project = await Project.findOne({ slug: req.params.slug, agency: req.user._id });
    if (!project) return res.status(404).send('Project not found or unauthorized');

    // 🔠 Normalize slug
    const normalizedSlug = slug?.toLowerCase().trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    // ❗ Check duplicate slug
    const existing = await Project.findOne({
      slug: normalizedSlug,
      agency: req.user._id,
      _id: { $ne: project._id }
    });

    if (existing) {
      return res.status(400).send('Slug already in use by another project.');
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

    // 🖼 Replace images if new ones uploaded
    if (req.files && req.files.length > 0) {
      if (project.imageUrls && project.imageUrls.length > 0) {
        const deletePromises = project.imageUrls.map(url =>
          deleteFromCloudinary(getPublicIdFromUrl(url))
        );
        await Promise.all(deletePromises);
      }

      const uploadPromises = req.files.map(file =>
        uploadToCloudinary(file.buffer, 'projects')
      );
      const imageUrls = await Promise.all(uploadPromises);
      updateData.imageUrls = imageUrls;
    }

    await Project.findByIdAndUpdate(project._id, updateData, { new: true });

    res.redirect('/agency/dashboard');
  } catch (error) {
    console.error('Error updating project (agency):', error);
    res.status(500).send('Error updating project');
  }
};

exports.deleteAgencyProject = async (req, res) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug });

    if (!project || !project.agency.equals(req.user._id)) {
      return res.status(404).send('Project not found or not authorized');
    }

    if (project.imageUrls && project.imageUrls.length > 0) {
      const deletePromises = project.imageUrls.map(url =>
        deleteFromCloudinary(getPublicIdFromUrl(url))
      );
      await Promise.all(deletePromises);
    }

    await project.deleteOne();
    res.redirect('/agency/dashboard');
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).send('Error deleting project');
  }
};

exports.getEditAgencyProfile = async (req, res) => {
  try {
    const agency = await User.findById(req.user.id);
    if (!agency) return res.status(404).send('Agency not found');

    res.render('edit-agency', {
      pageTitle: 'Edit Agency Profile',
      currentPage: 'edit-agency',
      user: req.user,
      agency,
      editAction: '/agency/edit-profile',
      cancelUrl: '/agency/my-profile'
    });
  } catch (error) {
    console.error('Error loading agency profile form:', error);
    res.status(500).send('Error loading form');
  }
};

exports.updateAgencyProfile = async (req, res) => {
  try {
    const { name, email, phone, agencyName, agencyAddress } = req.body;

    const agency = await User.findById(req.user.id);
    if (!agency) return res.status(404).send('Agency not found');

    const updateFields = {
      name,
      email,
      phone,
      agencyName,
      agencyAddress
    };

    // Handle logo upload
    if (req.file) {
      if (agency.agencyLogo) {
        const publicId = getPublicIdFromUrl(agency.agencyLogo);
        await deleteFromCloudinary(publicId);
      }

      const newLogoUrl = await uploadToCloudinary(req.file.buffer, 'logos'); // You can use 'logos' instead of 'properties'
      updateFields.agencyLogo = newLogoUrl;
    }

    await User.findByIdAndUpdate(req.user.id, updateFields, { new: true });
    res.redirect('/agency/my-profile');
  } catch (error) {
    console.error('Error updating agency profile:', error);
    res.status(500).send('Error updating agency profile');
  }
};

exports.showAgencyProfile = async (req, res) => {
  try {
    res.render('agency-profile', {
      user: req.user,
      pageTitle: 'My Agency Profile'
    });
  } catch (error) {
    console.error('Error loading agency profile:', error);
    res.status(500).send('Internal Server Error');
  }
};