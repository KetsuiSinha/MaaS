import protect from "../middleware/authMiddleware.js"

// Create project (requires login)
router.post("/", protect, async (req, res) => {
  const project = await Project.create({ 
    name: req.body.name, 
    user: req.user._id, 
    endpoints: [] 
  })
  res.json(project)
})

// Add endpoint (requires login + ownership)
router.post("/:projectId/endpoints", protect, async (req, res) => {
  const project = await Project.findById(req.params.projectId)
  if (!project) return res.status(404).json({ error: "Project not found" })
  if (project.user.toString() !== req.user._id.toString())
    return res.status(403).json({ error: "Not your project" })

  const { method, path, response, statusCode, delay } = req.body
  project.endpoints.push({ method, path, response, statusCode, delay })
  await project.save()
  res.json(project)
})
