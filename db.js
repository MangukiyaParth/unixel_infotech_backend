const { Pool } = require('pg');
 
const client = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: process.env.PGPORT,
  database: process.env.POSTGRES_DATABASE,
});


module.exports = client;