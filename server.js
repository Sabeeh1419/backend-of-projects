require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Load environment variables
const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 5000;
// || 'mongodb+srv://<username>:<password>@cluster0.j2hy4.mongodb.net/crud_operation?retryWrites=true&w=majority';
// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection with error handling
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
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

app.post('/api/projects', async (req, res) => {
  try {
    const project = new Project(req.body);
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Project name already exists' });
    }
    res.status(500).json({ error: 'Failed to create project' });
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