import express from "express";
import { body, validationResult } from "express-validator";
import Project from "../models/Project.js";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// All routes are protected
router.use(protect);

// @desc    Get all user projects
// @route   GET /api/projects
// @access  Private
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find({ owner: req.user._id })
      .select('-endpoints.response') // Don't send full response data in list
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findOne({ 
      _id: req.params.id, 
      owner: req.user._id 
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
router.post("/", [
  body('name').trim().isLength({ min: 1 }).withMessage('Project name is required'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { name, description } = req.body;

    // Check if project name already exists for this user
    const existingProject = await Project.findOne({ 
      owner: req.user._id, 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });

    if (existingProject) {
      return res.status(400).json({ error: 'Project name already exists' });
    }

    const project = await Project.create({
      name,
      description,
      owner: req.user._id,
      endpoints: []
    });

    // Add project to user's projects array
    await User.findByIdAndUpdate(req.user._id, {
      $push: { projects: project._id }
    });

    res.status(201).json({
      success: true,
      data: project,
      message: 'Project created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
router.put("/:id", [
  body('name').optional().trim().isLength({ min: 1 }).withMessage('Project name cannot be empty'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({
      success: true,
      data: project,
      message: 'Project updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
router.delete("/:id", async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ 
      _id: req.params.id, 
      owner: req.user._id 
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Remove project from user's projects array
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { projects: req.params.id }
    });

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Add endpoint to project
// @route   POST /api/projects/:projectId/endpoints
// @access  Private
router.post("/:projectId/endpoints", [
  body('method').isIn(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).withMessage('Invalid HTTP method'),
  body('path').matches(/^\//).withMessage('Path must start with /'),
  body('response').exists().withMessage('Response is required'),
  body('statusCode').optional().isInt({ min: 100, max: 599 }).withMessage('Invalid status code'),
  body('delay').optional().isInt({ min: 0, max: 10000 }).withMessage('Delay must be between 0-10000ms')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { method, path, response, statusCode = 200, delay = 0, headers } = req.body;

    const project = await Project.findOne({ 
      _id: req.params.projectId, 
      owner: req.user._id 
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check if endpoint already exists
    const existingEndpoint = project.endpoints.find(
      ep => ep.method === method.toUpperCase() && ep.path === path
    );

    if (existingEndpoint) {
      return res.status(400).json({ 
        error: `Endpoint ${method.toUpperCase()} ${path} already exists` 
      });
    }

    const newEndpoint = {
      method: method.toUpperCase(),
      path,
      response,
      statusCode,
      delay,
      headers: headers || { "Content-Type": "application/json" }
    };

    project.endpoints.push(newEndpoint);
    await project.save();

    res.status(201).json({
      success: true,
      data: project,
      message: 'Endpoint added successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Update endpoint
// @route   PUT /api/projects/:projectId/endpoints/:endpointId
// @access  Private
router.put("/:projectId/endpoints/:endpointId", [
  body('method').optional().isIn(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).withMessage('Invalid HTTP method'),
  body('path').optional().matches(/^\//).withMessage('Path must start with /'),
  body('statusCode').optional().isInt({ min: 100, max: 599 }).withMessage('Invalid status code'),
  body('delay').optional().isInt({ min: 0, max: 10000 }).withMessage('Delay must be between 0-10000ms')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const project = await Project.findOne({ 
      _id: req.params.projectId, 
      owner: req.user._id 
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const endpointIndex = project.endpoints.findIndex(
      ep => ep._id.toString() === req.params.endpointId
    );

    if (endpointIndex === -1) {
      return res.status(404).json({ error: "Endpoint not found" });
    }

    // Update endpoint
    Object.keys(req.body).forEach(key => {
      if (key === 'method') {
        project.endpoints[endpointIndex][key] = req.body[key].toUpperCase();
      } else {
        project.endpoints[endpointIndex][key] = req.body[key];
      }
    });

    await project.save();

    res.json({
      success: true,
      data: project,
      message: 'Endpoint updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Delete endpoint
// @route   DELETE /api/projects/:projectId/endpoints/:endpointId
// @access  Private
router.delete("/:projectId/endpoints/:endpointId", async (req, res) => {
  try {
    const project = await Project.findOne({ 
      _id: req.params.projectId, 
      owner: req.user._id 
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const endpointIndex = project.endpoints.findIndex(
      ep => ep._id.toString() === req.params.endpointId
    );

    if (endpointIndex === -1) {
      return res.status(404).json({ error: "Endpoint not found" });
    }

    project.endpoints.splice(endpointIndex, 1);
    await project.save();

    res.json({
      success: true,
      data: project,
      message: 'Endpoint deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;