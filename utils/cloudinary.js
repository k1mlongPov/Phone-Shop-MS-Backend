const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function deleteImage(url) {
    try {
        // Extract PUBLIC ID properly for Cloudinary
        const parts = url.split('/');
        const folder = parts[parts.length - 2];
        const filename = parts[parts.length - 1].split('.')[0];
        const publicId = `${folder}/${filename}`;

        await cloudinary.uploader.destroy(publicId);
    } catch (err) {
        console.error('Cloudinary delete error:', err);
    }
}

module.exports = cloudinary;
module.exports.deleteImage = deleteImage;
