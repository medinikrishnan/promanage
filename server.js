import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
import path from "path";
const __dirname = path.dirname(__filename);
import dotenv from "dotenv";
dotenv.config();
import express, { json } from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { Sequelize, DataTypes, Op } from "sequelize";


// Setup Express Server
const app = express();
app.use(cors());
app.use(json());

const sequelize = new Sequelize("dbmanage", "root", "root", {
  host: "localhost",
  dialect: "mysql",
});


// Define Task Model (Ensuring correct table and column names)
const Task = sequelize.define(
  "Task",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    project_id: { type: DataTypes.INTEGER, allowNull: false }, // Ensure INTEGER type if referencing another table
    status: { type: DataTypes.INTEGER, defaultValue: 0 },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: "tasks", timestamps: true } // Ensuring table name is correct
);

const BadgeConfig = sequelize.define(
  "BadgeConfig",
  {
    badge_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    category: {                // ← new column
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
  },
  {
    tableName: "badge_config",
    timestamps: false,
  }
);


// Define SubTask Model (Foreign Key linking to Task)
const SubTask = sequelize.define(
  "SubTask",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    task_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: "tasks", key: "id" } },
    status: { type: DataTypes.INTEGER, defaultValue: 0 }, // <-- Added status field
  },
  { tableName: "subtasks", timestamps: true }
);

// Define Milestone Model (Foreign Key linking to SubTask)
const Milestone = sequelize.define(
  "Milestone",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    subtask_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: "subtasks", key: "id" } },
    status: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  { tableName: "milestones", timestamps: true }
);

// Define Assignment Model (Connecting employees to subtasks)
const Assignment = sequelize.define(
  "Assignment",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    subtask_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: "subtasks", key: "id" } },
    employee_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: "employee_details", key: "employee_id" } },
    status: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  { tableName: "assignments", timestamps: true }
);

// Define EmployeeDetails Model
const EmployeeDetails = sequelize.define(
  "EmployeeDetails",
  {
    employee_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    domains: { type: DataTypes.TEXT, allowNull: false },
    skills: { type: DataTypes.TEXT, allowNull: false },
  },
  { tableName: "employee_details", timestamps: false }
);


const KanbanTask = sequelize.define(
  "KanbanTask",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    content: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("todo", "inProgress", "done"),
      allowNull: false,
      defaultValue: "todo",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW, // ✅ Ensures timestamps are handled correctly
    },
  },
  {
    tableName: "kanban_tasks",
    timestamps: false, // ✅ Disable automatic timestamps
  }
);

const ProjectManager = sequelize.define("ProjectManager", {
  manager_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: "project_manager",
  timestamps: true, // Sequelize will automatically handle createdAt and updatedAt fields
});

// Project model (required for foreign key references)
const Project = sequelize.define(
  "Project",
  {
    project_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    project_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    project_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  },
  {
    tableName: "projects",
    timestamps: true,
  }
);

// ProjectAssignment model with foreign key on project_id referencing the Project model.
const ProjectAssignment = sequelize.define(
  "ProjectAssignment",
  {
    employee_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: EmployeeDetails,
        key: "employee_id",
      },
    },
    project_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: Project,
        key: "project_id",
      },
    },
  },
  { tableName: "project_assignment", timestamps: false }
);


const Feedback = sequelize.define("Feedback", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employee_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  feedback_message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  score: {  // New column
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  }
}, {
  tableName: "feedback",
  timestamps: false // We only need createdAt, so no updatedAt field here
});

const TeammateRating = sequelize.define("TeammateRating", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  rater_employee_email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  rated_employee_email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  rating: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "teammate_rating",
  timestamps: false,
});


// Define Relationships
Task.hasMany(SubTask, { foreignKey: "task_id" });
SubTask.belongsTo(Task, { foreignKey: "task_id" });

SubTask.hasMany(Milestone, { foreignKey: "subtask_id" });
Milestone.belongsTo(SubTask, { foreignKey: "subtask_id" });

SubTask.belongsToMany(EmployeeDetails, { through: Assignment, foreignKey: "subtask_id" });
EmployeeDetails.belongsToMany(SubTask, { through: Assignment, foreignKey: "employee_id" });

// Define association: Assignment belongs to SubTask
Assignment.belongsTo(SubTask, { foreignKey: 'subtask_id' });

// Optionally, you can also define a reverse association if needed:
SubTask.hasMany(Assignment, { foreignKey: 'subtask_id' });

// Sync models with database
sequelize.sync({ alter: true })
  .then(() => console.log("Database & tables synced successfully."))
  .catch((error) => console.error("Error syncing database:", error));

export { sequelize, Task, SubTask, Milestone, Assignment, EmployeeDetails, Project };
// API: Register Project Manager
app.post("/register", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    if (role === "Project Manager") {
      await ProjectManager.create({ username, email, password_hash: hashedPassword });
      return res.status(201).json({ message: "Project Manager registered successfully!" });
    }

    res.status(400).json({ error: "Invalid role" });
  } catch (err) {
    console.error("Error registering project manager:", err);
    res.status(500).json({ error: "Error registering user" });
  }
});

// API: Register Employee
app.post("/register-employee", async (req, res) => {
  try {
    const { username, email, password, domains, skills } = req.body;

    if (!username || !email || !password || !domains || !skills) {
      return res.status(400).json({ error: "Missing required fields!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await EmployeeDetails.create({
      username,
      email,
      password_hash: hashedPassword,
      domains: domains.join(","), 
      skills: skills.join(","),
    });

    res.status(201).json({ message: "Employee registered successfully!" });
  } catch (err) {
    console.error("Error inserting into employee_details:", err);
    res.status(500).json({ error: "Error registering employee" });
  }
});

// API: Login Route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if it's a Project Manager
    const manager = await ProjectManager.findOne({ where: { email } });
    if (manager) {
      const isPasswordValid = await bcrypt.compare(password, manager.password_hash);
      if (!isPasswordValid)
        return res.status(401).json({ error: "Invalid credentials" });
      return res.json({ role: "Project Manager", redirect: "/project_manager_dashboard" });
    }

    // Check if it's an Employee
    const employee = await EmployeeDetails.findOne({ where: { email } });
    if (employee) {
      // Return the employee role along with the email
      return res.json({ role: "Employee", redirect: "/employee_dashboard", email });
    }
    res.status(401).json({ error: "User not found. Please sign up." });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



// API: Get All Projects
app.get('/projects', async (req, res) => {
  try {
    const projects = await Project.findAll({
      attributes: ['project_id', 'project_name', 'project_description'] 
    });
    res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects.' });
  }
});

import { spawn } from "child_process";
import mysql from "mysql2"; // ✅ Use 'import' instead of 'require'

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root",
  database: "dbmanage",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}).promise(); // ✅ Directly use .promise() here

export default db; // ✅ Use 'export default' instead of 'module.exports'

app.get("/api/employees/unassigned", async (req, res) => {
  try {
    console.log("📢 Fetching unassigned employees...");

    const [unassignedEmployees] = await db.execute(`
      SELECT e.employee_id, e.email
      FROM employee_details e
      LEFT JOIN project_assignment pa ON e.employee_id = pa.employee_id
      WHERE pa.employee_id IS NULL;

    `);

    console.log("✅ Fetched Employees:", unassignedEmployees);
    res.status(200).json(unassignedEmployees);
  } catch (error) {
    console.error("❌ Error fetching unassigned employees:", error);
    res.status(500).json({ error: "Failed to fetch unassigned employees." });
  }
});


app.post("/add-project", (req, res) => {
  const { project_id, project_name, project_description, deadline } = req.body;

  if (!project_id || !project_name || !project_description) {
    return res.status(400).json({ error: "Project ID, Name, and Description are required." });
  }

  const query = "INSERT INTO projects (project_id, project_name, project_description, deadline, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())";
  db.query(query, [project_id, project_name, project_description, deadline], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.status(201).json({ message: "Project added successfully!", project_id });
  });
});

async function saveEmployeeAssignment(employee_id, project_id) {
  // Assuming you're using a database like MySQL or PostgreSQL
  const query = "INSERT INTO project_assignment (employee_id, project_id) VALUES (?, ?)";
  
  try {
    await db.query(query, [employee_id, project_id]);  // Replace `db.query` with your actual database call
    console.log(`🎉 Successfully assigned Employee ${employee_id} to Project ${project_id}`);
  } catch (error) {
    console.error(`❌ Database Error assigning Employee ${employee_id} to Project ${project_id}:`, error);
  }
}

  // the system allows the users (teachers, hods) to make their schedules, view their schedule, apply for leave, the system shall store all the student information and teacher information.

  app.post("/api/assign-employees", async (req, res) => {
    try {
      const { assignments } = req.body;
      
      console.log(" Received Assignments:", assignments);
  
      if (!Array.isArray(assignments)) {
        return res.status(400).json({ error: "Invalid assignments format. Expected an array." });
      }
  
      // Process each assignment properly
      for (const assignment of assignments) {
        const { employee_id, project_id } = assignment;
  
        if (!employee_id || !project_id) {
          console.error(" Missing employee_id or project_id:", assignment);
          continue;
        }
  
        console.log(` Assigning Employee ${employee_id} to Project ${project_id}`);
  
        // Assuming you have a database function to save assignments, e.g.:
        await saveEmployeeAssignment(employee_id, project_id);
      }
  
      res.json({ message: "Employees assigned successfully!" });
    } catch (error) {
      console.error(" Error assigning employees:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  

app.post("/generate-tasks", async (req, res) => {
  const { project_id } = req.body;
  if (!project_id) {
    return res.status(400).json({ error: "Project ID is required" });
  }

  // Check if tasks already exist for the project.
  try {
    const [rows] = await db.query("SELECT * FROM tasks WHERE project_id = ?", [project_id]);
    if (rows.length > 0) {
      console.log("Tasks already exist for project:", project_id);
      return res.json({
        message: "Tasks already generated",
        tasks: rows,
      });
    }
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ error: "Error checking existing tasks" });
  }

  // Spawn the task generator Python script.
  const generateTasksProcess = spawn("python", ["task_generator.py", project_id]);
  let tasksOutput = "";
  generateTasksProcess.stdout.on("data", (data) => {
    tasksOutput += data.toString();
  });
  generateTasksProcess.stderr.on("data", (data) => {
    console.error("Task Generator Python error:", data.toString());
  });

  generateTasksProcess.on("close", (code) => {
    try {
      const generateResult = JSON.parse(tasksOutput.trim());
      if (generateResult.error) {
        return res.status(500).json({ error: generateResult.error });
      }
      console.log("Task generation result:", generateResult);

      // Now spawn the task assigner Python script.
      const assignTasksProcess = spawn("python", ["task_assigner.py", project_id]);
      let assignOutput = "";
      assignTasksProcess.stdout.on("data", (data) => {
        assignOutput += data.toString();
        console.log("Task Assigner Python output:", data.toString());
      });
      assignTasksProcess.stderr.on("data", (data) => {
        console.error("Task Assigner Python error:", data.toString());
      });

      assignTasksProcess.on("close", (assignCode) => {
        try {
          const assignResult = JSON.parse(assignOutput.trim());
          if (assignResult.error) {
            return res.status(500).json({ error: assignResult.error });
          }
          return res.json({
            message: "Tasks generated and assigned successfully",
            assignments: assignResult.assignments,
          });
        } catch (err) {
          console.error("Error parsing task assignment result:", err);
          return res.status(500).json({ error: "Failed to process task assignment" });
        }
      });
    } catch (err) {
      console.error("Error parsing generated tasks result:", err);
      return res.status(500).json({ error: "Failed to process generated tasks" });
    }
  });
});

app.get('/api/project_details/:projectId', async (req, res) => {
  const { projectId } = req.params;

  try {
    const tasks = await Task.findAll({
      where: { project_id: projectId },
      include: [
        {
          model: SubTask,
          as: "SubTasks", // Must match the alias defined above
          include: [
            {
              model: Milestone,
              as: "Milestones" // Must match the alias defined above
            }
          ]
        }
      ]
    });

    console.log("Fetched Tasks from DB:", JSON.stringify(tasks, null, 2));

    if (!tasks.length) {
      return res.status(200).json({ tasks: [] });
    }

    const formattedResponse = tasks.map((task) => ({
      id: task.id,
      name: task.name,
      subtasks: task.SubTasks?.map((subtask) => ({
        id: subtask.id,
        name: subtask.name,
        milestones: subtask.Milestones?.map((milestone) => ({
          id: milestone.id,
          name: milestone.name,
          status: milestone.status
        })) ?? []
      })) ?? []
    }));

    res.status(200).json({ tasks: formattedResponse });
  } catch (error) {
    console.error("Error fetching project details:", error);
    return res.status(500).json({ error: "Failed to fetch project details." });
  }
});



app.get("/api/projects", async (req, res) => {
  try {
    const [projects] = await db.query("SELECT * FROM projects");
    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Database error" });
  }
});



app.get("/get-tasks/:project_id", async (req, res) => {
  const { project_id } = req.params;
  console.log(`Fetching tasks for project ID: ${project_id}`);

  try {
    const tasks = await Task.findAll({
      where: { project_id },
      include: [
        {
          model: SubTask,
          as: "subtasks",
          include: [
            {
              model: Milestone,
              as: "milestones"
            }
          ]
        }
      ]
    });
    

    if (!tasks.length) {
      return res.json({ tasks: [] }); // Return empty list if no tasks
    }

    const tasksWithDetails = tasks.map((task) => ({
      id: task.id,
      name: task.name,
      subtasks: task.SubTasks.map((subtask) => ({
        id: subtask.id,
        name: subtask.name,
        milestones: subtask.Milestones.map((m) => ({
          id: m.id,
          name: m.name,
          status: m.status,
        }))
      }))
    }));

    res.json({ tasks: tasksWithDetails });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks." });
  }
});


// --------------------------EMPLOYEE API'S------------------------------------------------

app.get("/api/employee-data", async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }
  try {
    console.log(`🔍 Fetching data for email: ${email}`);
    // 1. Fetch employee ID using email.
    const [employeeRows] = await db.query(
      "SELECT employee_id FROM employee_details WHERE email = ?",
      [email]
    );
    if (!employeeRows.length) {
      console.log("❌ No employee found.");
      return res.json({ projects: [] });
    }
    const employeeId = employeeRows[0].employee_id;
    console.log(`✅ Employee found. ID: ${employeeId}`);

    // 2. Fetch projects where this employee has assignments (completed and in-progress).
    const [projectRows] = await db.query(
      `SELECT DISTINCT p.project_id, p.project_name 
       FROM projects p 
       JOIN tasks t ON p.project_id = t.project_id 
       JOIN subtasks st ON st.task_id = t.id
       JOIN assignments a ON st.id = a.subtask_id 
       WHERE a.employee_id = ?`,
      [employeeId]
    );
    console.log("📌 Projects Found:", projectRows);

    const projects = [];
    for (const project of projectRows) {
      // 3. Fetch tasks in this project assigned to the employee.
      const [taskRows] = await db.query(
        `SELECT DISTINCT t.id AS task_id, t.name AS task_name 
         FROM tasks t 
         JOIN subtasks st ON st.task_id = t.id
         JOIN assignments a ON st.id = a.subtask_id 
         WHERE t.project_id = ? AND a.employee_id = ?`,
        [project.project_id, employeeId]
      );
      console.log(`📌 Tasks for Project ${project.project_id}:`, taskRows);

      const tasks = [];
      for (const task of taskRows) {
        // 4. Fetch subtasks for this task assigned to the employee.
        // Notice: We include all subtasks regardless of status.
        const [subtaskRows] = await db.query(
          `SELECT DISTINCT st.id AS subtask_id, 
                           st.name AS subtask_name,
                           a.status AS assignment_status
           FROM subtasks st 
           JOIN assignments a ON st.id = a.subtask_id
           WHERE st.task_id = ? AND a.employee_id = ?`,
          [task.task_id, employeeId]
        );
        console.log(`📌 Subtasks for Task ${task.task_id}:`, subtaskRows);

        const subtasks = [];
        for (const subtask of subtaskRows) {
          // 5. Fetch milestones for this subtask.
          const [milestoneRows] = await db.query(
            `SELECT id AS milestone_id, name AS milestone_name, status
             FROM milestones 
             WHERE subtask_id = ?`,
            [subtask.subtask_id]
          );
          console.log(`📌 Milestones for Subtask ${subtask.subtask_id}:`, milestoneRows);

          subtasks.push({
            subtask_id: subtask.subtask_id,
            subtask_name: subtask.subtask_name,
            assignment_status: subtask.assignment_status, // 0 for in-progress, 1 for completed
            milestones: milestoneRows,
          });
        }
        tasks.push({
          task_id: task.task_id,
          task_name: task.task_name,
          subtasks: subtasks,
        });
      }
      projects.push({
        project_id: project.project_id,
        project_name: project.project_name,
        tasks: tasks,
      });
    }
    console.log("✅ Final Response:", JSON.stringify({ projects }, null, 2));
    res.json({ projects });
  } catch (err) {
    console.error("❌ Error fetching employee tasks:", err);
    res.status(500).json({ error: "Failed to fetch employee tasks." });
  }
});


// ✅ Add a new Kanban task
app.post("/api/kanban-add-task", async (req, res) => {
  const { content } = req.body;

  if (!content || content.trim() === "") {
    return res.status(400).json({ error: "Task content is required." });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO kanban_tasks (content, status, createdAt) VALUES (?, ?, NOW())",
      [content, "todo"]
    );

    console.log("✅ Task added:", { taskId: result.insertId, content, status: "todo" });
    res.status(201).json({ message: "Task added successfully", taskId: result.insertId });
  } catch (err) {
    console.error("❌ Error inserting task:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get all Kanban tasks
app.get("/api/kanban-tasks", async (req, res) => {
  try {
    // Clear old tasks before fetching (Alternative approach to auto-deletion)
    await db.query("DELETE FROM kanban_tasks WHERE createdAt < NOW() - INTERVAL 3 MINUTE");

    const [results] = await db.query("SELECT id, content, status FROM kanban_tasks");

    // ✅ Correctly structure tasks into "todo", "inProgress", "done"
    const tasks = {
      todo: results.filter((task) => task.status === "todo"),
      inProgress: results.filter((task) => task.status === "inProgress"),
      done: results.filter((task) => task.status === "done"),
    };

    res.json(tasks);
  } catch (err) {
    console.error("❌ Error fetching tasks:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update Kanban task status
app.put("/api/kanban-update-task", async (req, res) => {
  const { taskId, status } = req.body;

  try {
    await db.query("UPDATE kanban_tasks SET status = ? WHERE id = ?", [status, taskId]);

    res.json({ message: "Task updated successfully" });
  } catch (err) {
    console.error("❌ Error updating task:", err);
    res.status(500).json({ error: err.message });
  }
});
// ✅ Clear only "Done" tasks older than 3 minutes
app.delete("/api/kanban-clear-tasks", async (req, res) => {
  try {
    const deleteQuery = `
      DELETE FROM kanban_tasks
      WHERE status = 'done' AND createdAt <= (NOW() - INTERVAL 3 MINUTE)
    `;

    const [result] = await db.query(deleteQuery);

    if (result.affectedRows > 0) {
      console.log(`🗑️ Deleted ${result.affectedRows} completed tasks older than 3 minutes.`);
    } else {
      console.log("✅ No old completed tasks to delete.");
    }

    res.json({ message: "Old completed tasks cleared", deletedCount: result.affectedRows });
  } catch (err) {
    console.error("❌ Error clearing completed tasks:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Automatically delete "Done" tasks older than 3 minutes every 1 minute
setInterval(async () => {
  try {
    const deleteQuery = `
      DELETE FROM kanban_tasks
      WHERE status = 'done' AND createdAt <= (NOW() - INTERVAL 3 MINUTE)
    `;

    const [result] = await db.query(deleteQuery);

    if (result.affectedRows > 0) {
      console.log(`🗑️ Auto-deleted ${result.affectedRows} completed tasks older than 3 minutes.`);
    }
  } catch (err) {
    console.error("❌ Error in auto-delete task cleanup:", err);
  }
}, 60000); // Runs every 60 seconds (1 minute)

app.post("/api/log-milestone", async (req, res) => {
  const { employee_id, milestone_id, message } = req.body;
  if (!employee_id || !milestone_id || !message) {
    return res.status(400).json({ error: "Employee ID, milestone ID, and message are required." });
  }

  try {
    // 1. Log the milestone completion in assignmentlogs.
    await db.query(
      "INSERT INTO assignmentlogs (employee_id, log_message, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())",
      [employee_id, message]
    );

    // 2. Retrieve the subtask_id for the given milestone.
    const [subtaskRows] = await db.query(
      "SELECT subtask_id FROM milestones WHERE id = ?",
      [milestone_id]
    );
    if (subtaskRows.length === 0) {
      return res.status(404).json({ error: "Milestone not found." });
    }
    const subtask_id = subtaskRows[0].subtask_id;

    // 3. Immediately update the milestone's status to 1.
    await db.query("UPDATE milestones SET status = 1 WHERE id = ?", [milestone_id]);

    // 4. Count how many milestones in this subtask have status = 1.
    const [completedMilestones] = await db.query(
      "SELECT COUNT(*) AS completed_count FROM milestones WHERE subtask_id = ? AND status = 1",
      [subtask_id]
    );
    const completedCount = completedMilestones[0].completed_count;
    console.log(`Employee ${employee_id} - subtask ${subtask_id}: ${completedCount} milestones completed.`);

    // 5. If all 5 milestones are completed, update statuses and assign a new subtask.
    if (completedCount >= 5) {
      console.log(`Subtask ${subtask_id} completed! Updating statuses.`);
      
      // Mark the assignment for this subtask as complete.
      await db.query(
        "UPDATE assignments SET status = 1 WHERE subtask_id = ? AND employee_id = ?",
        [subtask_id, employee_id]
      );
      // Mark the subtask itself as complete.
      await db.query(
        "UPDATE subtasks SET status = 1 WHERE id = ?",
        [subtask_id]
      );

      // 5.a Retrieve the project ID from the subtask's parent task.
      const [subtaskInfo] = await db.query(
        "SELECT task_id FROM subtasks WHERE id = ?",
        [subtask_id]
      );
      if (!subtaskInfo.length) {
        return res.status(404).json({ error: "Subtask information not found." });
      }
      const task_id = subtaskInfo[0].task_id;
      const [taskInfo] = await db.query(
        "SELECT project_id FROM tasks WHERE id = ?",
        [task_id]
      );
      if (!taskInfo.length) {
        return res.status(404).json({ error: "Task information not found." });
      }
      const project_id = taskInfo[0].project_id;

      // 5.b Retrieve the employee's skills and domains.
      const [employeeRows] = await db.query(
        "SELECT skills, domains FROM employee_details WHERE employee_id = ?",
        [employee_id]
      );
      let criteria = [];
      if (employeeRows.length > 0) {
        if (employeeRows[0].skills) {
          criteria = criteria.concat(employeeRows[0].skills.split(",").map(s => s.trim().toLowerCase()));
        }
        if (employeeRows[0].domains) {
          criteria = criteria.concat(employeeRows[0].domains.split(",").map(d => d.trim().toLowerCase()));
        }
      }

      // 5.c Retrieve available subtasks from the same project that are not actively assigned (status = 0).
      const [availableSubtasks] = await db.query(
        `
        SELECT st.id AS subtask_id, st.name AS subtask_name, t.project_id
        FROM subtasks st
        JOIN tasks t ON st.task_id = t.id
        WHERE t.project_id = ? 
          AND st.status = 0
          AND st.id NOT IN (
            SELECT subtask_id FROM assignments WHERE status = 0
          )
        `,
        [project_id]
      );

      // 5.d Calculate a match score for each available subtask based on combined criteria.
      function matchScore(subtaskName) {
        let score = 0;
        const keywords = subtaskName.toLowerCase().split(" ");
        for (const crit of criteria) {
          if (keywords.includes(crit)) score++;
        }
        return score;
      }

      let bestSubtask = null;
      let bestScore = 0;
      for (const subtask of availableSubtasks) {
        const score = matchScore(subtask.subtask_name);
        if (score > bestScore) {
          bestScore = score;
          bestSubtask = subtask;
        }
      }
      // Fallback: if no best match found, assign the first available subtask.
      if (!bestSubtask && availableSubtasks.length > 0) {
        bestSubtask = availableSubtasks[0];
      }

      if (bestSubtask) {
        // Insert new assignment for the selected subtask, including timestamps.
        await db.query(
          "INSERT INTO assignments (employee_id, subtask_id, status, createdAt, updatedAt) VALUES (?, ?, 0, NOW(), NOW())",
          [employee_id, bestSubtask.subtask_id]
        );
        console.log(`Assigned new subtask ${bestSubtask.subtask_id} to employee ${employee_id}`);
        return res.json({ message: "Subtask completed, new subtask assigned.", subtask: bestSubtask });
      } else {
        return res.json({ message: "Subtask completed. No new subtask available based on skills and domains." });
      }
    }

    // 6. If not all milestones are complete, simply return success.
    res.json({ success: true, message: "Milestone logged successfully." });
    
  } catch (err) {
    console.error("Error logging milestone:", err);
    res.status(500).json({ error: "Database query failed." });
  }
});


app.get("/api/project-employees/:projectId", async (req, res) => {
  const { projectId } = req.params;
  try {
    // For example, if you store assignments in a table like `project_assignment`,
    // you can join with `employee_details` to get the assigned employees:
    const [rows] = await db.query(`
      SELECT e.employee_id, e.email
      FROM employee_details e
      JOIN project_assignment pa ON e.employee_id = pa.employee_id
      WHERE pa.project_id = ?
    `, [projectId]);

    // If no employees found, return an empty array
    return res.json({ employees: rows || [] });
  } catch (error) {
    console.error("Error fetching project employees:", error);
    return res.status(500).json({ error: "Failed to fetch project employees." });
  }
});


app.get("/api/get-employee-id", async (req, res) => {
  const { email } = req.query;
  
  if (!email) {
      return res.status(400).json({ error: "Email is required." });
  }

  try {
      const [rows] = await db.query(
          "SELECT employee_id FROM employee_details WHERE email = ?",
          [email]
      );

      if (rows.length === 0) {
          return res.status(404).json({ error: "Employee not found." });
      }

      res.json({ employee_id: rows[0].employee_id });
  } catch (err) {
      console.error("❌ Error fetching employee ID:", err);
      res.status(500).json({ error: "Database query failed." });
  }
});

app.post("/api/assign-new-subtask", async (req, res) => {
  const { employee_id } = req.body;

  if (!employee_id) {
      return res.status(400).json({ error: "Employee ID is required." });
  }

  try {
      // ✅ Find employee's skills
      const [skillRows] = await db.query(
          "SELECT skills FROM employee_details WHERE employee_id = ?",
          [employee_id]
      );

      if (!skillRows.length) {
          return res.status(404).json({ error: "Employee skills not found." });
      }

      const employeeSkills = skillRows[0].skills.split(",");

      // ✅ Find available subtasks that match employee's skills
      const [availableSubtasks] = await db.query(`
          SELECT st.id, st.name, st.task_id, t.project_id
          FROM subtasks st
          JOIN tasks t ON st.task_id = t.id
          WHERE NOT EXISTS (
              SELECT 1 FROM assignments a
              WHERE a.subtask_id = st.id AND a.employee_id = ?
          )
          ORDER BY t.project_id ASC, st.id ASC
          LIMIT 1
      `, [employee_id]);

      if (!availableSubtasks.length) {
          return res.json({ message: "No new subtasks available.", subtask: null });
      }

      const newSubtask = availableSubtasks[0];

      // ✅ Assign the new subtask to the employee
      await db.query(
        "INSERT INTO assignments (employee_id, subtask_id, status, createdAt, updatedAt) VALUES (?, ?, 0, NOW(), NOW())",
        [employee_id, bestSubtask.subtask_id]
      );
      

      console.log(`✅ Assigned Subtask ${newSubtask.id} to Employee ${employee_id}`);
      res.json({ message: "New subtask assigned.", subtask: newSubtask });
  } catch (err) {
      console.error("❌ Error assigning new subtask:", err);
      res.status(500).json({ error: "Failed to assign new subtask." });
  }
});

app.put("/api/mark-subtask-complete", async (req, res) => {
  const { subtask_id, employee_id } = req.body;

  if (!subtask_id || !employee_id) {
    return res.status(400).json({ error: "Subtask ID and Employee ID are required." });
  }

  try {
    // ✅ Update the status of the subtask in the assignments table
    const [result] = await db.query(
      "UPDATE assignments SET status = 1 WHERE subtask_id = ? AND employee_id = ?",
      [subtask_id, employee_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Assignment not found or already completed." });
    }

    console.log(`✅ Subtask ${subtask_id} marked as completed for employee ${employee_id}`);

    // ✅ Assign a new subtask if available
    const [newSubtask] = await db.query(`
      SELECT st.id AS subtask_id, st.name AS subtask_name
      FROM subtasks st
      JOIN projects p ON st.project_id = p.project_id
      WHERE st.id NOT IN (SELECT subtask_id FROM assignments WHERE employee_id = ? AND status = 1)
      ORDER BY RAND() LIMIT 1
    `, [employee_id]);

    if (newSubtask.length > 0) {
      // ✅ Assign the new subtask to the employee
      await db.query(
        "INSERT INTO assignments (employee_id, subtask_id, status, createdAt, updatedAt) VALUES (?, ?, 0, NOW(), NOW())",
        [employee_id, bestSubtask.subtask_id]
      );
      
      console.log(`✅ Assigned new subtask ${newSubtask[0].subtask_id} to employee ${employee_id}`);
      res.json({ message: "Subtask completed, new subtask assigned.", subtask: newSubtask[0] });
    } else {
      res.json({ message: "Subtask completed. No new subtask available at the moment." });
    }
  } catch (err) {
    console.error("❌ Error updating assignment status:", err);
    res.status(500).json({ error: "Database update failed." });
  }
});

app.get("/api/project-progress/:projectId", async (req, res) => {
  const { projectId } = req.params;
  try {
    // 1. Fetch project details (deadline, project_name)
    const [projectRows] = await db.query(
      "SELECT project_id, deadline, project_name, createdAt FROM projects WHERE project_id = ?",
      [projectId]
    );
    if (!projectRows.length) {
      return res.status(404).json({ error: "Project not found" });
    }
    const project = projectRows[0];

    // 2. Count total tasks in this project.
    const [taskRows] = await db.query(
      "SELECT COUNT(*) AS tasksCount FROM tasks WHERE project_id = ?",
      [projectId]
    );
    const tasksCount = taskRows[0].tasksCount;

    // 3. Count available (open) subtasks for this project.
    const [availSubtaskRows] = await db.query(
      `SELECT COUNT(*) AS availableSubtasks 
       FROM subtasks st 
       JOIN tasks t ON st.task_id = t.id 
       WHERE t.project_id = ? AND st.status = 0`,
      [projectId]
    );
    const availableSubtasks = availSubtaskRows[0].availableSubtasks;

    // 4. Count completed subtasks for this project.
    const [compSubtaskRows] = await db.query(
      `SELECT COUNT(*) AS completedSubtasks 
       FROM subtasks st 
       JOIN tasks t ON st.task_id = t.id 
       WHERE t.project_id = ? AND st.status = 1`,
      [projectId]
    );
    const completedSubtasks = compSubtaskRows[0].completedSubtasks;

    // 5. Count total subtasks in the project.
    const [totalSubtaskRows] = await db.query(
      `SELECT COUNT(*) AS totalSubtasks 
       FROM subtasks st 
       JOIN tasks t ON st.task_id = t.id 
       WHERE t.project_id = ?`,
      [projectId]
    );
    const totalSubtasks = totalSubtaskRows[0].totalSubtasks;
    const remainingSubtasks = totalSubtasks - completedSubtasks;

    // 6. Count employees assigned to the project (based on assignments)
    const [assignedEmpRows] = await db.query(
      `
      SELECT COUNT(DISTINCT a.employee_id) AS employeesAssigned 
      FROM assignments a 
      JOIN subtasks st ON a.subtask_id = st.id 
      JOIN tasks t ON st.task_id = t.id 
      WHERE t.project_id = ?
      `,
      [projectId]
    );
    const employeesAssigned = assignedEmpRows[0].employeesAssigned;

    // 7. Count employees working on the project from project_assignment table.
    const [workingEmpRows] = await db.query(
      `
      SELECT COUNT(DISTINCT pa.employee_id) AS employeesWorking
      FROM project_assignment pa
      WHERE pa.project_id = ?
      `,
      [projectId]
    );
    const employeesWorking = workingEmpRows[0].employeesWorking;

    // 8. Free employees: those working minus those assigned tasks.
    const freeEmployees = employeesWorking - employeesAssigned;

    // 9. Calculate expected weeks to complete.
    // Here we calculate based on the difference between deadline and current date.
    const now = new Date();
    const deadline = new Date(project.deadline);
    let expectedWeeks = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24 * 7));
    // If deadline has passed, set expectedWeeks to 0.
    if (expectedWeeks < 0) expectedWeeks = 0;

    return res.json({
      employeesWorking,
      employeesAssigned,
      freeEmployees,
      tasksCount,
      availableSubtasks,
      completedSubtasks,
      remainingSubtasks,
      deadline: project.deadline,
      expectedWeeks,
      project_name: project.project_name,
    });
  } catch (error) {
    console.error("Error fetching project progress:", error);
    return res.status(500).json({ error: "Failed to fetch project progress data" });
  }
});

app.post("/api/send-feedback", async (req, res) => {
  const { project_id, employee_ids, feedback ,score} = req.body;
  
  if (!project_id || !employee_ids || !feedback) {
    return res.status(400).json({ error: "Project ID, employee IDs, and feedback are required." });
  }

  try {
    // Loop over each employee ID and insert a feedback row
    for (const employee_id of employee_ids) {
      await db.query(
        "INSERT INTO feedback (employee_id, project_id, feedback_message, score, createdAt) VALUES (?, ?, ?, ?, NOW())",
      [employee_id, project_id, feedback, score]
      );
    }
    res.json({ message: "Feedback sent successfully." });
  } catch (error) {
    console.error("Error sending feedback:", error);
    res.status(500).json({ error: "Failed to send feedback." });
  }
});

app.get("/api/employee-feedback", async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    // 1. Retrieve employee_id using the provided email.
    const [empRows] = await db.query(
      "SELECT employee_id FROM employee_details WHERE email = ?",
      [email]
    );
    if (empRows.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }
    const employee_id = empRows[0].employee_id;

    // 2. Retrieve feedback records joined with project name.
    const [feedbackRows] = await db.query(
      `
      SELECT f.id, f.feedback_message, f.createdAt, p.project_name
      FROM feedback f
      JOIN projects p ON f.project_id = p.project_id
      WHERE f.employee_id = ?
      ORDER BY f.createdAt DESC
      `,
      [employee_id]
    );

    return res.json({ feedback: feedbackRows });
  } catch (error) {
    console.error("Error fetching employee feedback:", error);
    return res.status(500).json({ error: "Failed to fetch employee feedback" });
  }
});


// Endpoint: GET /api/employee-assigned-projects?email=...
app.get("/api/employee-assigned-projects", async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }
  try {
    // Get the employee_id from employee_details
    const [employeeRows] = await db.query(
      "SELECT employee_id FROM employee_details WHERE email = ?",
      [email]
    );
    if (!employeeRows.length) {
      return res.status(404).json({ error: "Employee not found." });
    }
    const employee_id = employeeRows[0].employee_id;
    
    // Get projects assigned to this employee via project_assignment
    const [projectRows] = await db.query(
      `SELECT p.project_id, p.project_name, p.deadline, p.project_description
       FROM project_assignment pa
       JOIN projects p ON pa.project_id = p.project_id
       WHERE pa.employee_id = ?`,
      [employee_id]
    );
    
    res.json({ projects: projectRows });
  } catch (error) {
    console.error("Error fetching assigned projects:", error);
    res.status(500).json({ error: "Failed to fetch assigned projects." });
  }
});

// Endpoint: GET /api/project-assignment/:project_id
app.get("/api/project-assignment/:project_id", async (req, res) => {
  const { project_id } = req.params;
  try {
    // Join project_assignment with employee_details to get team members
    const [rows] = await db.query(
      `
      SELECT ed.employee_id, ed.email, ed.domains, ed.skills
      FROM project_assignment pa
      JOIN employee_details ed ON pa.employee_id = ed.employee_id
      WHERE pa.project_id = ?
      `,
      [project_id]
    );
    res.json({ employees: rows });
  } catch (error) {
    console.error("Error fetching project assignments:", error);
    res.status(500).json({ error: "Failed to fetch project assignments." });
  }
});

// Endpoint: POST /api/teammate-rating
app.post("/api/teammate-rating", async (req, res) => {
  console.log("Received body:", req.body); // Debug log
  const { rater_employee_email, rated_employee_email, project_id, rating } = req.body;
  
  if (!rater_employee_email || !rated_employee_email || !project_id || rating === undefined) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    await db.query(
      "INSERT INTO teammate_rating (rater_employee_email, rated_employee_email, project_id, rating, createdAt) VALUES (?, ?, ?, ?, NOW())",
      [rater_employee_email, rated_employee_email, project_id, rating]
    );
    res.json({ message: "Rating submitted successfully." });
  } catch (error) {
    console.error("Error submitting rating:", error);
    res.status(500).json({ error: "Failed to submit rating." });
  }
});

// Example: server.js or routes.js
app.get("/api/project-burnt-scores", async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) {
    return res.status(400).json({ error: "projectId is required" });
  }

  try {
    // 1) Get all employees assigned to this project
    const [employeeRows] = await db.query(`
      SELECT ed.employee_id, ed.email
      FROM project_assignment pa
      JOIN employee_details ed ON pa.employee_id = ed.employee_id
      WHERE pa.project_id = ?
    `, [projectId]);

    if (!employeeRows.length) {
      return res.json({ teamScores: [], teamAverage: 0 });
    }

    const teamScores = [];

    // Weights for each drive
    const wComprehend = 0.25;
    const wAcquire    = 0.25;
    const wBond       = 0.25;
    const wDefend     = 0.25;

    for (const emp of employeeRows) {
      const employeeId   = emp.employee_id;
      const employeeEmail= emp.email;

      // -----------------------------------
      // 1) Comprehend Drive (# completed tasks / total tasks) * 100
      let comprehendScore = 0;
      {
        // total assigned tasks (or milestones) for this employee in the project
        const [totalRows] = await db.query(`
          SELECT COUNT(*) AS total
          FROM assignments a
          JOIN subtasks st ON a.subtask_id = st.id
          JOIN tasks t ON st.task_id = t.id
          WHERE a.employee_id = ?
            AND t.project_id = ?
        `, [employeeId, projectId]);

        // completed tasks
        const [completedRows] = await db.query(`
          SELECT COUNT(*) AS completed
          FROM assignments a
          JOIN subtasks st ON a.subtask_id = st.id
          JOIN tasks t ON st.task_id = t.id
          WHERE a.employee_id = ?
            AND t.project_id = ?
            AND a.status = 1  -- or whatever indicates "completed"
        `, [employeeId, projectId]);

        const total     = totalRows[0].total     || 0;
        const completed = completedRows[0].completed || 0;

        if (total > 0) {
          comprehendScore = (completed / total) * 100;
        } else {
          comprehendScore = 0; // or 100 if no tasks assigned
        }
      }

      // -----------------------------------
      // 2) Acquire Drive: count # of feedback entries => scale 0..100
      let acquireScore = 0;
      {
        // e.g. simply count how many feedback rows exist for that employee in this project
        const [feedbackRows] = await db.query(`
          SELECT COUNT(*) AS feedCount
          FROM feedback
          WHERE employee_id = ?
            AND project_id = ?
        `, [employeeId, projectId]);

        const feedCount = feedbackRows[0].feedCount || 0;
        // Suppose each feedback entry is worth 10 points, capping at 100
        acquireScore = Math.min(feedCount * 10, 100);
      }

      // -----------------------------------
      // 3) Bond Drive: average rating from teammate_rating for "rated_employee_email"
      let bondScore = 0;
      {
        const [bondRows] = await db.query(`
          SELECT AVG(rating) AS avgRating
          FROM teammate_rating
          WHERE rated_employee_email = ?
            AND project_id = ?
        `, [employeeEmail, projectId]);

        const avgRating = bondRows[0].avgRating || 0;
        // If rating is 1..10, bondScore = (avgRating / 10) * 100
        bondScore = (avgRating / 10) * 100;
      }

      // -----------------------------------
      // 4) Defend Drive: same logic as Acquire or different
      // e.g. "score >= 5" in feedback means some "defend" praise
      let defendScore = 0;
      {
        const [defRows] = await db.query(`
          SELECT COUNT(*) AS defCount
          FROM feedback
          WHERE employee_id = ?
            AND project_id = ?
            AND score >= 5
        `, [employeeId, projectId]);

        const defCount = defRows[0].defCount || 0;
        // scale similarly as Acquire
        defendScore = Math.min(defCount * 10, 100);
      }

      // Weighted sum => final Burnt Score for this employee
      const burntScore =
        wComprehend * comprehendScore +
        wAcquire    * acquireScore    +
        wBond       * bondScore       +
        wDefend     * defendScore;

      teamScores.push({
        employee_email: employeeEmail,
        comprehend: Math.round(comprehendScore),
        acquire:    Math.round(acquireScore),
        bond:       Math.round(bondScore),
        defend:     Math.round(defendScore),
        burntScore: burntScore // or Math.round(burntScore)
      });
    }

    // 5) Team average
    let teamAverage = 0;
    if (teamScores.length > 0) {
      const sum = teamScores.reduce((acc, mem) => acc + mem.burntScore, 0);
      teamAverage = sum / teamScores.length;
    }

    // Return final JSON
    res.json({
      teamScores,
      teamAverage
    });
  } catch (error) {
    console.error("Error computing burnt scores:", error);
    res.status(500).json({ error: "Failed to compute burnt scores" });
  }
});


app.post("/api/add-skills", async (req, res) => {
  const { employee_email, skills } = req.body;

  if (!employee_email || !skills) {
    return res.status(400).json({ error: "Missing employee_email or skills" });
  }

  try {

    await db.query(
      "UPDATE employee_details SET skills = CONCAT(skills, ',', ?) WHERE email = ?",
      [skills, employee_email]
    );

    res.json({ message: "Skills updated successfully" });
  } catch (err) {
    console.error("Error updating skills:", err);
    res.status(500).json({ error: "Failed to update skills." });
  }
});

//api for model ai agents
import axios from "axios";
// Prediction route that forwards the request to the model service
app.post("/api/predict", async (req, res) => {
  try {
    const features = req.body; // Expect JSON features
    console.log("Received features:", features);

    // Forward the request to the Flask model service on port 5001
    const response = await axios.post("http://localhost:5001/api/predict", features, {
      headers: { "Content-Type": "application/json" },
    });

    console.log("Model service response:", response.data);
    res.status(200).json(response.data); // Return the prediction result to the client
  } catch (error) {
    console.error("Error getting prediction:", error.message);
    res.status(500).json({ error: "Failed to get prediction" });
  }
});

app.get("/api/generate-tasks-preview", async (req, res) => {
  try {
    const { project_id, feedback } = req.query;
    if (!project_id) {
      return res.status(400).json({ error: "project_id is required" });
    }

    // Retrieve the project description from the database
    const project = await Project.findOne({ where: { project_id } });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Construct the prompt for the OpenAI API
    const prompt = `
You are an AI-powered project manager. Given the following project description and optional manager feedback, generate realistic tasks, subtasks, and milestones needed to complete the project.

### Project Description:
${project.project_description}

${feedback ? "Manager Feedback: " + feedback : ""}

### Rules for Task Generation:
- List tasks as categories (e.g., Backend, Frontend, etc.).
- Each category must include at least 2–3 tasks.
- Every task must include a "subtasks" key.
- Each subtask must include exactly 5 milestones.
- Milestones should represent small, clear steps toward completing the subtask.
- Return only a valid JSON object in the following format (no additional text):

{
  "tasks": [
    {
      "category": "Category Name",
      "tasks": [
        {
          "task": "Task Name",
          "subtasks": [
            {
              "name": "Subtask Name",
              "milestones": [
                {"name": "Milestone 1"},
                {"name": "Milestone 2"},
                {"name": "Milestone 3"},
                {"name": "Milestone 4"},
                {"name": "Milestone 5"}
              ]
            }
          ]
        }
      ]
    }
  ]
}
    `;

    // Call the OpenAI API (using your API key stored in your environment variables)
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const openaiUrl = "https://api.openai.com/v1/chat/completions";

    const openaiResponse = await axios.post(
      openaiUrl,
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a project management assistant." },
          { role: "user", content: prompt },
        ],
        max_tokens: 800,
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
      }
    );

    const responseContent = openaiResponse.data.choices[0].message.content.trim();

    // Attempt to parse the response as JSON
    try {
      const previewData = JSON.parse(responseContent);
      return res.status(200).json(previewData);
    } catch (jsonError) {
      console.error("JSON Parse Error:", jsonError, "Raw response:", responseContent);
      return res
        .status(500)
        .json({ error: "Invalid JSON response from OpenAI", raw_response: responseContent });
    }
  } catch (error) {
    console.error("Error in /api/generate-tasks-preview:", error);
    return res.status(500).json({ error: "Failed to generate tasks preview" });
  }
});


app.post("/api/confirm-tasks", async (req, res) => {
  try {
    const { project_id, tasks: tasksPreview } = req.body;
    if (!project_id || !tasksPreview) {
      return res.status(400).json({ error: "project_id and tasks preview are required" });
    }

    // Check if tasks have already been confirmed for this project.
    const existingTask = await Task.findOne({ where: { project_id } });
    if (existingTask) {
      return res.status(400).json({ error: "Tasks have already been confirmed for this project." });
    }

    // Insert tasks, subtasks, and milestones from the preview into the database.
    for (const category of tasksPreview.tasks || []) {
      for (const taskData of category.tasks || []) {
        const taskRecord = await Task.create({
          name: taskData.task || "Unnamed Task",
          project_id,
          status: 0,
        });

        if (Array.isArray(taskData.subtasks) && taskData.subtasks.length > 0) {
          for (const subtaskData of taskData.subtasks) {
            const subtaskRecord = await SubTask.create({
              name: subtaskData.name || "Unnamed Subtask",
              task_id: taskRecord.id,
            });

            if (Array.isArray(subtaskData.milestones) && subtaskData.milestones.length === 5) {
              for (const milestoneData of subtaskData.milestones) {
                await Milestone.create({
                  name: milestoneData.name || "Unnamed Milestone",
                  subtask_id: subtaskRecord.id,
                  status: 0,
                });
              }
            } else {
              // If milestones are missing or not exactly 5, create 5 default milestones.
              for (let i = 1; i <= 5; i++) {
                await Milestone.create({
                  name: `Default Milestone ${i}`,
                  subtask_id: subtaskRecord.id,
                  status: 0,
                });
              }
            }
          }
        } else {
          // If no subtasks are provided, create one default subtask with 5 default milestones.
          const defaultSubtask = await SubTask.create({
            name: "Default Subtask",
            task_id: taskRecord.id,
          });
          for (let i = 1; i <= 5; i++) {
            await Milestone.create({
              name: `Default Milestone ${i}`,
              subtask_id: defaultSubtask.id,
              status: 0,
            });
          }
        }
      }
    }
    
    // Now call task_assigner.py to assign the tasks.
    const assignTasks = spawn("python", ["task_assigner.py", project_id]);

    let assignOutput = "";
    assignTasks.stdout.on("data", (data) => {
      assignOutput += data.toString();
      console.log("Python Output (Assignment):", data.toString());
    });
    assignTasks.stderr.on("data", (data) => {
      console.error("Python Error (Assignment):", data.toString());
    });
    assignTasks.on("close", async (assignCode) => {
      try {
        const assignResponse = JSON.parse(assignOutput.trim());
        if (assignResponse.error) {
          return res.status(500).json({ error: assignResponse.error });
        }
        return res.json({
          message: "Tasks confirmed and assigned successfully",
          assignments: assignResponse.assignments,
        });
      } catch (error) {
        return res.status(500).json({ error: "Failed to process task assignment" });
      }
    });
  } catch (error) {
    console.error("Error in /api/confirm-tasks:", error);
    return res.status(500).json({ error: "Failed to confirm tasks" });
  }
});



// --- NEW: GET /api/employee-milestones ---
// This endpoint returns milestones for the given employee with status = 0 (incomplete)
app.get("/api/employee-milestones", async (req, res) => {
  const { employee_id } = req.query;
  if (!employee_id) {
    return res.status(400).json({ error: "Employee ID is required." });
  }
  try {
    // This query joins assignments, subtasks, and milestones so that we get only the milestones (with m.status=0)
    const [milestoneRows] = await db.query(`
      SELECT m.id AS milestone_id, m.name AS milestone_name, m.status,
             st.id AS subtask_id, st.name AS subtask_name
      FROM milestones m
      JOIN subtasks st ON m.subtask_id = st.id
      JOIN assignments a ON st.id = a.subtask_id
      WHERE a.employee_id = ? AND m.status = 0
    `, [employee_id]);

    res.json({ milestones: milestoneRows });
  } catch (error) {
    console.error("Error fetching employee milestones:", error);
    res.status(500).json({ error: "Failed to fetch employee milestones." });
  }
});

import fs from "fs";

app.post("/api/ai-check-all-new", async (req, res) => {
  try {
    // Now only employee_email is required from the frontend.
    const { employee_email } = req.body;

    // Validate required field
    if (!employee_email) {
      return res.status(400).json({ error: "employee_email is required." });
    }

    // Look up the employee by email
    const employee = await EmployeeDetails.findOne({ where: { email: employee_email } });
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    const employee_id = employee.employee_id;

    // Fetch assignments (with related SubTask, Task, and Milestones)
    const assignments = await Assignment.findAll({
      where: { employee_id },
      include: [
        {
          model: SubTask,
          include: [
            { model: Task },
            { model: Milestone, as: "Milestones" }
          ]
        }
      ]
    });

    if (!assignments || assignments.length === 0) {
      return res.status(404).json({ error: "No tasks/milestones found for this employee." });
    }

    // Build aggregated text and collect task names
    let aggregatedText = "";
    const tasksSet = new Set(); // To compute the domain from task names

    assignments.forEach((assignment) => {
      const subtask = assignment.SubTask;
      if (!subtask) return;

      const task = subtask.Task;
      if (task) {
        tasksSet.add(task.name);
      }

      // Use the alias "Milestones" if it is defined in your association (adjust if needed)
      const milestones = subtask.Milestones || [];
      if (milestones.length === 0) {
        aggregatedText += `Task: ${task ? task.name : "Unknown"} - Milestone: None\n`;
      } else {
        milestones.forEach((milestone) => {
          aggregatedText += `Task: ${task ? task.name : "Unknown"} - Milestone: ${milestone.name}\n`;
        });
      }
    });

    if (!aggregatedText.trim()) {
      return res.status(404).json({ error: "No milestones available to check for this employee." });
    }

    // Use the unique task names as the domain (or task name). If multiple tasks exist, they are joined with a comma.
    const domain = [...tasksSet].join(", ");

    // Define a temporary file path for the aggregated text
    const tempFilePath = path.join(__dirname, "temp_aggregated.txt");

    // Write the aggregated text to the file
    fs.writeFileSync(tempFilePath, aggregatedText, { encoding: "utf-8" });
    console.log("Aggregated milestones written to:", tempFilePath);

    // Spawn the ai_agent.py process with both arguments (aggregated file and domain/task name)
    console.log(`Spawning AI Agent with arguments: [${tempFilePath}, ${domain}]`);
    const child = spawn("python", ["ai_agent.py", tempFilePath, domain, employee_email]);

    let output = "";
    child.stdout.on("data", (data) => {
      output += data.toString();
    });
    child.stderr.on("data", (data) => {
      console.error("AI Agent stderr:", data.toString());
    });
    child.on("close", (code) => {
      console.log("AI Agent process exited with code", code);
      return res.json({ message: "AI check completed", output });
    });
  } catch (error) {
    console.error("Error in /api/ai-check-all-new:", error);
    return res.status(500).json({ error: "Failed to run AI Agent" });
  }
});

app.post("/api/save-badge-config", async (req, res) => {
  const badgeConfigs = req.body.badgeConfigs;
  const values = Object.entries(badgeConfigs).map(([id, cfg]) => [
    parseInt(id),
    cfg.category,
    cfg.name,
    cfg.icon,
    parseInt(cfg.count),
  ]);
  const sql = `
    INSERT INTO badge_config (badge_id, category, name, icon, \`count\`)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      category = VALUES(category),
      name     = VALUES(name),
      icon     = VALUES(icon),
      \`count\` = VALUES(\`count\`)
  `;
  try {
    await db.query(sql, [values]);
    res.json({ message: "Badge configuration saved successfully" });
  } catch (err) {
    console.error("DB error saving badges:", err);
    res.status(500).json({ error: "Failed to save badge configuration" });
  }
});

app.get("/api/get-badge-config", async (req, res) => {
  const sql = "SELECT badge_id, category, name, icon, `count` FROM badge_config";
  try {
    const [results] = await db.query(sql);  // promise style
    const badgeConfigs = {};
    results.forEach(row => {
      badgeConfigs[row.badge_id] = {
        category: row.category,
        name:     row.name,
        icon:     row.icon,
        count:    row.count
      };
    });
    res.json({ badgeConfigs });
  } catch (err) {
    console.error("DB error fetching badges:", err);
    res.status(500).json({ error: "Failed to fetch badge configuration" });
  }
});



// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));