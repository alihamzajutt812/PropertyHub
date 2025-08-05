const Property = require('../models/Property');
const { getUserFromToken } = require('../utils/auth');

exports.createProperty = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });

    const photoUrls = req.files.map(file => file.location);
    const newProperty = new Property({ ...req.body, photos: photoUrls });
    await newProperty.save();
    res.status(201).json({ message: 'Property added', property: newProperty });
  });
};

exports.getAllProperties = async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    const properties = await Property.find({})
      .sort({ createdAt: -1 })
      .limit(100);

    res.render('properties', {
      properties,
      user,
      query: 'All Listings'
    });
  } catch (err) {
    console.error('Error fetching properties:', err);
    res.status(500).send('Internal Server Error');
  }
};

exports.getPropertyBySlug = async (req, res) => {
  try {
    const currentUser = await getUserFromToken(req);

    const property = await Property.findOne({ slug: req.params.slug }).populate('agent');

    if (!property) {
      return res.status(404).send('Property not found');
    }

    if (!property.agent || !property.agent.name || !property.agent.email) {
      property.agent = {
        name: 'Ali Hamza',
        email: 'alihamzajutt812@gmail.com',
        phone: '03404103311',
        role: 'admin'
      };
    }

    res.render('property-details', {
      pageTitle: property.title,
      user: currentUser,
      property
    });

  } catch (error) {
    console.error('🔥 Error loading property:', error);
    res.status(500).send('Internal Server Error');
  }
};