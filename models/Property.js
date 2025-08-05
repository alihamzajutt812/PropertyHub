const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: String,
  location: String,
  state: String,
  city: String,
  areaName: String,
  latitude: String,
  longitude: String,
  type: { type: String, enum: ['house', 'apartment', 'plot', 'commercial'], required: true },
  price: Number,
  bedrooms: Number,
  bathrooms: Number,
  area: Number,
  localArea: String,
  amenities: [{
    type: String,
    enum: [ 
      // Main Features
      "Newly Built", "Parking Spaces", "Double Glazed Windows", "Central Air Conditioning", "Central Heating", "Electricity Backup", "Waste Disposal", "Tiled Flooring",
      // Rooms
      "Servant Quarters", "Drawing Room", "Dining Room", "Kitchens", "Study Room", "Prayer Room", "Powder Room", "Store Room", "Steam Room", "Lounge or Sitting Room", "Laundry Room",
      // Business and Communication
      "Broadband Internet", "Cable TV Ready", "Intercom",
      // Community Features
      "Community Garden", "Community Swimming Pool", "Community Gym", "Medical Centre", "Day Care Centre", "Kids Play Area", "Barbecue Area", "Mosque", "Community Centre",
      // Recreational / Health
      "Private Lawn", "Private Swimming Pool", "Sauna", "Jacuzzi",
      // Nearby Facilities
      "Nearby Schools", "Nearby Hospitals", "Nearby Shopping Malls", "Nearby Restaurants", "Nearby Public Transport", "Near Airport",
      // Other Facilities
      "Maintenance Staff", "Security Staff", "Disabled Access"
    ]
  }],
  status: { type: String, default: 'active' },
  description: String,
  imageUrls: [String],
  agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  slug: { type: String, unique: true },
  propertyPurpose: { type: String, enum: ['For Sale', 'For Rent'], required: true }
});

// ✅ Correct middleware reference
propertySchema.pre('save', function (next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dashes
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
  }
  next();
});

module.exports = mongoose.model('Property', propertySchema);