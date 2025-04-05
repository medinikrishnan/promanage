import { sequelize, EmployeeDetails, Task, Subtask, Milestone, Assignment, AssignmentLog } from '../server.js';

export const getModels = () => ({
    sequelize,
    EmployeeDetails,
    Task,
    Subtask,
    Milestone,
    Assignment,
    AssignmentLog
});
