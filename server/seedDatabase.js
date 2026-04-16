require('dotenv').config();
const mongoose = require('mongoose');

const Project = require('./models/project');
const Task = require('./models/Task');
const TaskHistory = require('./models/TaskHistory');

const seedDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    // 1. Wipe Old Data
    console.log('Clearing old data...');
    await Project.deleteMany({});
    await Task.deleteMany({});
    await TaskHistory.deleteMany({});

    // 2. Create Default Project
    console.log('Creating Default Project...');
    const project = await Project.create({
      name: "Demo Project",
      description: "For presentation",
      isDefault: true
    });

    // 3. Create Task & History Flow builder
    const createTaskWithHistory = async (title, stage_id, assigned_to, daysAgo, durationDays, isActive, priority="medium") => {
      // Setup the base task
      const task = await Task.create({
        title,
        project_id: project._id,
        stage_id,
        assigned_to,
        priority,
        stage_entered_at: isActive ? new Date(Date.now() - (daysAgo - durationDays) * 24 * 60 * 60 * 1000) : new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
      });

      // Always create the history block. 
      // If it's active, it's currently stuck based on how many days ago it entered this phase vs duration.
      await TaskHistory.create({
        task_id: task._id,
        stage_id,
        user_id: assigned_to,
        start_time: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
        end_time: isActive
          ? null
          : new Date(Date.now() - (daysAgo - durationDays) * 24 * 60 * 60 * 1000)
      });

      // If it is in Done, or advanced stages, we can optionally fake earlier histories.
      if (stage_id === 'In Testing' || stage_id === 'Done') {
        const earlierStart = new Date(Date.now() - (daysAgo + 5) * 24 * 60 * 60 * 1000);
        const earlierEnd = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        
        await TaskHistory.create({
          task_id: task._id,
          stage_id: "In Development", // Mocking previous flow step
          user_id: assigned_to,
          start_time: earlierStart,
          end_time: earlierEnd
        });
      }

      console.log(`- Created task: ${title} [${stage_id}]`);
    };

    console.log('Generating Tasks & Histories...');

    // DISTRIBUTION:
    // --- 2 tasks → To Do (active, barely started) ---
    await createTaskWithHistory("Design UI", "To Do", "Sarah", 1, 0, true, "high");
    await createTaskWithHistory("Gather Requirements", "To Do", "John", 3, 0, true, "low");

    // --- 3 tasks → In Dev (active, realistic variance) ---
    await createTaskWithHistory("Setup Backend", "In Development", "Sarah", 4, 0, true, "high"); // 4 days active (might alert)
    await createTaskWithHistory("API Integration", "In Development", "John", 1, 0, true);
    await createTaskWithHistory("OAuth Implementation", "In Development", "Alex", 6, 0, true, "high"); // 6 days stuck

    // --- 2 tasks → Testing (delayed / long past durations) ---
    await createTaskWithHistory("Write Test Cases", "In Testing", "Sarah", 9, 3, true); // Active in testing for 6 days
    await createTaskWithHistory("Fix Dashboard Bugs", "In Testing", "John", 14, 5, true, "high");

    // --- 2 tasks → Done (completed, mapping full duration metrics) ---
    await createTaskWithHistory("Deploy Database", "Done", "Alex", 10, 8, false); // Took 8 days
    await createTaskWithHistory("CI/CD Pipeline setup", "Done", "Sarah", 6, 2, false); // Took 2 days

    console.log('✅ Seed complete. Dashboard should now have highly realistic demo metrics.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed DB:', err);
    process.exit(1);
  }
};

seedDB();
