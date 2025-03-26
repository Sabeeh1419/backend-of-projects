// require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Load environment variables
const MONGODB_URI="mongodb+srv://sabeehhassanfarooqui:sabeeh1419@cluster0.j2hy4.mongodb.net/crud_operation?retryWrites=true&w=majority&appName=Cluster0";
const PORT=5000;
// Middleware
app.use(cors());
app.use(express.json());
// MongoDB Connection with error handling
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Successfully connected to MongoDB Atlas'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1); // Exit if DB connection fails
});

// Project Schema with validation
const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    minlength: [3, 'Project name must be at least 3 characters'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add case-insensitive index for name
projectSchema.index({ name: 1 }, { collation: { locale: 'en', strength: 2 } });

const Project = mongoose.model('Project', projectSchema);

// API Routes
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});
app.get("/", async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
    res.send("My all projects are here");
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  });

app.get('/api/projects/count', async (req, res) => {
    try {
      const count = await Project.countDocuments({});
      res.json({ 
        status: 'success',
        count 
      });
    } catch (err) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to get project count',
        error: err.message
      });
    }
  });

  app.post('/api/projects', async (req, res) => {
    try {
      const { name, description } = req.body;
  
      // Check for existing project (case-insensitive)
      const existingProject = await Project.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') }
      });
  
      if (existingProject) {
        return res.status(400).json({
          status: 'error',
          message: 'Project name already exists'
        });
      }
  
      // Create new project
      const newProject = await Project.create({ name, description });
      
      res.status(201).json({
        status: 'success',
        data: {
          project: newProject
        }
      });
  
    } catch (err) {
      // Handle validation errors
      if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({
          status: 'error',
          message: messages.join(', ')
        });
      }
      
      res.status(500).json({
        status: 'error',
        message: 'Server error'
      });
    }
  });

  // PUT endpoint for updating a project
app.put('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Find the existing project
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    // Check if name is being changed
    if (name && name !== project.name) {
      // Check for existing project with new name (case-insensitive)
      const existingProject = await Project.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id } // Exclude current project
      });

      if (existingProject) {
        return res.status(400).json({
          status: 'error',
          message: 'Project name already exists'
        });
      }
      project.name = name;
    }

    // Update description if provided
    if (description) project.description = description;

    // Save the updated project
    const updatedProject = await project.save();

    res.json({
      status: 'success',
      data: {
        project: updatedProject
      }
    });

  } catch (err) {
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        status: 'error',
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});
  
  // DELETE endpoint
  app.delete('/api/projects/:id', async (req, res) => {
    try {
      const project = await Project.findByIdAndDelete(req.params.id);
  
      if (!project) {
        return res.status(404).json({
          status: 'error',
          message: 'Project not found'
        });
      }
  
      res.status(204).json({
        status: 'success',
        data: null
      });
  
    } catch (err) {
      res.status(500).json({
        status: 'error',
        message: 'Server error'
      });
    }
  });

// Add other CRUD endpoints (GET by ID, PUT, DELETE)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`MongoDB connected to: ${mongoose.connection.host}`);
});