// teamInsights.js
import db from "../db.js"; // Adjust the import path to your db module

// --------------------
// Task Allocator Agent
// --------------------
export async function getTaskAllocationInsight(projectId) {
  const [rows] = await db.query(
    `
    SELECT COUNT(*) AS taskCount
    FROM assignments a
    JOIN subtasks st ON a.subtask_id = st.id
    JOIN tasks t ON st.task_id = t.id
    WHERE t.project_id = ?
    `,
    [projectId]
  );
  const taskCount = rows[0].taskCount || 0;
  return `There are ${taskCount} tasks assigned in project ${projectId}.`;
}

// -------------------------
// Workload Optimizer Agent
// -------------------------
export async function getWorkloadOptimizationInsight(projectId) {
  const [rows] = await db.query(
    `
    SELECT a.employee_id, COUNT(*) AS taskCount
    FROM assignments a
    JOIN subtasks st ON a.subtask_id = st.id
    JOIN tasks t ON st.task_id = t.id
    WHERE t.project_id = ?
    GROUP BY a.employee_id
    `,
    [projectId]
  );

  if (!rows.length) {
    return "No tasks are assigned to any employee yet.";
  }

  let message = "Task distribution: ";
  rows.forEach((row) => {
    message += `Employee ${row.employee_id} has ${row.taskCount} tasks; `;
  });
  return message;
}

// -----------------------------
// Resource Manager Agent
// -----------------------------
export async function getResourceAvailabilityInsight(projectId) {
  // Total employees assigned to the project (from project_assignment)
  const [totalRows] = await db.query(
    `
    SELECT COUNT(*) AS total
    FROM project_assignment
    WHERE project_id = ?
    `,
    [projectId]
  );

  // Employees who have at least one assignment (i.e. working on a subtask)
  const [assignedRows] = await db.query(
    `
    SELECT COUNT(DISTINCT a.employee_id) AS assignedCount
    FROM assignments a
    JOIN subtasks st ON a.subtask_id = st.id
    JOIN tasks t ON st.task_id = t.id
    WHERE t.project_id = ?
    `,
    [projectId]
  );

  const total = totalRows[0].total || 0;
  const assigned = assignedRows[0].assignedCount || 0;
  const free = total - assigned;
  return `In project ${projectId}, ${free} out of ${total} employees are currently free.`;
}

// -------------------------
// Risk Monitor Agent
// -------------------------
export async function getRiskInsight(projectId) {
  const [rows] = await db.query(
    `
    SELECT COUNT(*) AS pendingCount
    FROM assignments a
    JOIN subtasks st ON a.subtask_id = st.id
    JOIN tasks t ON st.task_id = t.id
    WHERE t.project_id = ? AND a.status = 0
    `,
    [projectId]
  );
  const pending = rows[0].pendingCount || 0;
  return `There are ${pending} pending tasks in project ${projectId} that may indicate bottlenecks.`;
}

// -------------------------
// Progress Monitor Agent
// -------------------------
export async function getProgressInsight(projectId) {
  const [totalRows] = await db.query(
    `
    SELECT COUNT(*) AS total
    FROM assignments a
    JOIN subtasks st ON a.subtask_id = st.id
    JOIN tasks t ON st.task_id = t.id
    WHERE t.project_id = ?
    `,
    [projectId]
  );

  const [completedRows] = await db.query(
    `
    SELECT COUNT(*) AS completed
    FROM assignments a
    JOIN subtasks st ON a.subtask_id = st.id
    JOIN tasks t ON st.task_id = t.id
    WHERE t.project_id = ? AND a.status = 1
    `,
    [projectId]
  );

  const total = totalRows[0].total || 0;
  const completed = completedRows[0].completed || 0;
  const progressPercentage = total > 0 ? (completed / total) * 100 : 0;
  return `Project ${projectId} progress: ${progressPercentage.toFixed(1)}% tasks completed.`;
}

// -------------------------
// Wellbeing Monitor Agent
// -------------------------
export async function getWellbeingInsight(projectId) {
  const [rows] = await db.query(
    `
    SELECT ed.employee_id, ed.email, COUNT(f.id) AS feedbackCount
    FROM project_assignment pa
    JOIN employee_details ed ON pa.employee_id = ed.employee_id
    LEFT JOIN feedback f ON ed.employee_id = f.employee_id AND f.project_id = ?
    WHERE pa.project_id = ?
    GROUP BY ed.employee_id
    `,
    [projectId, projectId]
  );

  if (!rows.length) {
    return "No team members found to evaluate wellbeing.";
  }

  let message = "Wellbeing Overview: ";
  rows.forEach((row) => {
    message += `Employee ${row.email} received ${row.feedbackCount} feedback entries; `;
  });
  return message;
}

// -------------------------
// Master Agent: Generate Aggregated Team Insight
// -------------------------
export async function generateTeamInsight(projectId) {
  const insights = [];

  const taskInsight = await getTaskAllocationInsight(projectId);
  const workloadInsight = await getWorkloadOptimizationInsight(projectId);
  const resourceInsight = await getResourceAvailabilityInsight(projectId);
  const riskInsight = await getRiskInsight(projectId);
  const progressInsight = await getProgressInsight(projectId);
  const wellbeingInsight = await getWellbeingInsight(projectId);

  insights.push(taskInsight, workloadInsight, resourceInsight, riskInsight, progressInsight, wellbeingInsight);

  return insights.join(" ");
}
