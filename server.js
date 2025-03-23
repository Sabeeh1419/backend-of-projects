const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const dataFilePath = './data.json';
let projects = [];

try {
  const data = fs.readFileSync(dataFilePath);
  projects = JSON.parse(data);
  console.log('Data loaded from file:', projects);
} catch (err) {
  console.error('Error reading data file:', err);
}

const saveData = () => {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(projects, null, 2));
    console.log('Data saved to file successfully.');
  } catch (err) {
    console.error('Error saving data to file:', err);
  }
};

app.get('/', (req, res) => {
  res.send('Welcome to the Project Manager API!');
});

app.get('/api/projects/count', (req, res) => {
  res.json({ count: projects.length });
});

app.get('/api/projects', (req, res) => {
  res.json(projects);
});

app.post('/api/projects', (req, res) => {
  const { name, description } = req.body;

  console.log('Received request body:', req.body); // Debugging

  if (name.length < 3) {
    return res.status(400).json({ status: 'error', message: 'Project name must be at least 3 characters' });
  }

  if (!description) {
    return res.status(400).json({ status: 'error', message: 'Project description is required' });
  }

  const isDuplicate = projects.some((project) => project.name.toLowerCase() === name.toLowerCase());
  if (isDuplicate) {
    return res.status(400).json({ status: 'error', message: 'Project name already exists' });
  }

  const newProject = { id: projects.length + 1, name, description };
  projects.push(newProject);
  saveData();
  res.status(201).json(newProject);
});

app.delete('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const projectIndex = projects.findIndex((project) => project.id === parseInt(id));

  if (projectIndex === -1) {
    return res.status(404).json({ status: 'error', message: 'Project not found' });
  }

  const deletedProject = projects.splice(projectIndex, 1)[0];
  saveData();
  res.json(deletedProject);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});