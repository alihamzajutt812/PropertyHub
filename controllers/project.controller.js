const { getUserFromToken } = require('../utils/auth'); // ✅ If not already imported
const User = require('../models/User')
const Project = require('../models/Project')
const jwt = require('jsonwebtoken');

// View project details
exports.viewProjectDetails = async (req, res) => {
  try {
    const user = await getUserFromToken(req); // ✅ Auth utility

    const project = await Project.findOne({ slug: req.params.slug })
      .populate('agency')
      .lean();

    if (!project) {
      return res.status(404).render('404', {
        message: 'Project not found',
        user
      });
    }

    res.render('project-details', {
      pageTitle: project.title || 'Project Details',
      project,
      user
    });

  } catch (error) {
    console.error('❌ Error loading project:', error.message);
    res.status(500).render('500', {
      message: 'Something went wrong',
      user: null
    });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    const token = req.cookies.token;
    let user = null;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      user = await User.findById(decoded.id);
    }

    const projects = await Project.find({});
    res.render('project-list', { projects, user });
  } catch (err) {
    console.error('Unhandled error:', err);
    res.status(500).send('Internal Server Error');
  }
};

