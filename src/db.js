// db.js
import mysql from "mysql2";
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root",
  database: "dbmanage",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}).promise();
module.exports = db;
