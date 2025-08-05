const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: String,
  slug: {
    type: String,
    unique: true,
    trim: true
  },
  description: String,
  location: String,
  state: String,
  city: String,
  areaName: String,
  type: {
    type: String,
    enum: ['residential', 'commercial', 'mixed']
  },
  launchDate: Date,
  completionDate: Date,
  priceRange: {
    min: Number,
    max: Number
  },
  amenities: [String],
  imageUrls: [String],
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed'],
    default: 'active'
  },
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Must have role: 'agency'
  }
});

// Middleware to generate slug from title if not provided
projectSchema.pre('save', function (next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dashes
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);