import express from "express";
import Project from "../models/Project.js";

const router = express.Router();

// Middleware to handle all mock API requests
const handleMockRequest = async (req, res) => {
  try {
    // Extract project ID from the URL path
    const pathParts = req.path.split('/').filter(part => part);
    const projectId = pathParts[0];
    
    // If no project ID, return error
    if (!projectId) {
      return res.status(400).json({ 
        error: "Missing project ID",
        usage: "/api-mocks/PROJECT_ID/ENDPOINT_PATH"
      });
    }

    // Get the endpoint path (everything after project ID)
    const endpointPathParts = pathParts.slice(1);
    const endpointPath = '/' + endpointPathParts.join('/');
    
    const method = req.method.toUpperCase();

    console.log(`🔍 Mock API Request: ${method} ${endpointPath} for project ${projectId}`);

    // Handle project info request (GET with no additional path)
    if (method === 'GET' && (endpointPath === '/' || endpointPath === '')) {
      return await handleProjectInfo(req, res, projectId);
    }

    // Find project
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ 
        error: "Project not found",
        projectId,
        hint: "Check your project ID"
      });
    }

    if (!project.isActive) {
      return res.status(503).json({
        error: "Project is inactive",
        message: "This mock API project has been deactivated"
      });
    }

    // Find matching endpoint
    const endpoint = project.endpoints.find(
      (e) => e.path === endpointPath && e.method === method
    );

    if (!endpoint) {
      // Helpful error message with available endpoints
      const availableEndpoints = project.endpoints.map(ep => 
        `${ep.method} ${ep.path}`
      );
      
      return res.status(404).json({ 
        error: "Endpoint not found",
        requested: `${method} ${endpointPath}`,
        available: availableEndpoints.length > 0 ? availableEndpoints : "No endpoints configured",
        hint: "Check your HTTP method and path",
        debug: {
          projectId,
          fullPath: req.path,
          originalUrl: req.originalUrl
        }
      });
    }

    // Set custom headers if provided
    if (endpoint.headers) {
      Object.keys(endpoint.headers).forEach(key => {
        res.set(key, endpoint.headers[key]);
      });
    }

    // Add delay if specified
    const delay = endpoint.delay || 0;
    
    console.log(`✅ Found endpoint: ${method} ${endpointPath}, status: ${endpoint.statusCode}, delay: ${delay}ms`);

    // Simulate network delay
    setTimeout(() => {
      res.status(endpoint.statusCode).json(endpoint.response);
    }, delay);

  } catch (error) {
    console.error('Mock API Error:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: "Invalid project ID format",
        hint: "Project ID should be a valid MongoDB ObjectId"
      });
    }

    res.status(500).json({ 
      error: "Internal server error",
      message: "Something went wrong processing your mock API request"
    });
  }
};

// Handle project info requests
const handleProjectInfo = async (req, res, projectId) => {
  try {
    const project = await Project.findById(projectId).select('name description endpoints.method endpoints.path endpoints.statusCode isActive createdAt');
    
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const endpointSummary = project.endpoints.map(ep => ({
      method: ep.method,
      path: ep.path,
      statusCode: ep.statusCode,
      url: `${req.protocol}://${req.get('host')}/api-mocks/${projectId}${ep.path}`
    }));

    res.json({
      project: {
        id: project._id,
        name: project.name,
        description: project.description,
        isActive: project.isActive,
        createdAt: project.createdAt
      },
      endpoints: endpointSummary,
      totalEndpoints: endpointSummary.length,
      baseUrl: `${req.protocol}://${req.get('host')}/api-mocks/${projectId}`,
      usage: {
        info: `GET ${req.protocol}://${req.get('host')}/api-mocks/${projectId}`,
        mockEndpoints: endpointSummary.map(ep => 
          `${ep.method} ${req.protocol}://${req.get('host')}/api-mocks/${projectId}${ep.path}`
        )
      }
    });

  } catch (error) {
    console.error('Project info error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: "Invalid project ID format"
      });
    }

    res.status(500).json({ error: "Internal server error" });
  }
};

// Handle all HTTP methods with a simple catch-all
router.get('*', handleMockRequest);
router.post('*', handleMockRequest);
router.put('*', handleMockRequest);
router.delete('*', handleMockRequest);
router.patch('*', handleMockRequest);
router.options('*', handleMockRequest);
router.head('*', handleMockRequest);

export default router;