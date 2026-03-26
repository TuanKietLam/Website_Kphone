const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();


let dbHost = process.env.DB_HOST || '127.0.0.1';
let dbPort = process.env.DB_PORT || 3308;

if (dbHost.includes(':')) {
  const parts = dbHost.split(':');
  dbHost = parts[0];
  dbPort = parseInt(parts[1]) || dbPort;
} else {
  dbPort = parseInt(dbPort) || 3308;
}

const pool = mysql.createPool({
  host: dbHost,
  port: dbPort,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'k_phone',
  waitForConnections: true,
  connectionLimit: 10, 
  queueLimit: 0
});


const promisePool = pool.promise();


const query = async (query, params) => {
  try {
    const [results] = await promisePool.execute(query, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

const getConnection = (callback) => {
  pool.getConnection(callback);
};

module.exports = {
  query,
  getConnection,
  pool: promisePool
};

