const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  role: {
    type: String,
    enum: ['admin', 'agent', 'agency'],
    default: 'agent'
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    validate: {
      validator: function (value) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/.test(value);
      },
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
    }
  },

  // Optional for agency role
  agencyName: String,
  agencyAddress: String,
  agencyLogo: String
}, { timestamps: true });

// ✅ Hash the password before saving (only if it's new or modified)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ✅ Add method to compare raw password with hashed password
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);