const cloudinary = require('cloudinary').v2;

function getPublicIdFromUrl(url) {
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  const [publicId] = filename.split('.');
  return `properties/${publicId}`;
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET
});

// Function to upload image to Cloudinary
const uploadToCloudinary = (buffer, folder = 'properties') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'image',
        transformation: [
          { width: 800, height: 600, crop: 'limit' },
          { quality: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    ).end(buffer);
  });
};

const deleteFromCloudinary = (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

module.exports = {
  cloudinary,             // <== So you can use cloudinary directly in other files if needed
  uploadToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl
};