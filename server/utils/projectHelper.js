const Project = require('../models/project');

const getDefaultProject = async () => {
  let project = await Project.findOne({ isDefault: true });

  if (!project) {
    // Fallback to name match just in case
    project = await Project.findOne({ name: "Default Project" });
  }

  if (!project) {
    project = await Project.create({
      name: "Default Project",
      description: "Auto-created project",
      isDefault: true
    });
  } else if (!project.isDefault) {
    project.isDefault = true;
    await project.save();
  }

  return project;
};

module.exports = { getDefaultProject };
