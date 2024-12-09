const { Pool } = require('pg');
 
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: process.env.PGPORT,
  database: process.env.POSTGRES_DATABASE,
  ssl: {
    rejectUnauthorized: false,
  },
});


// module.exports = client;
module.exports = pool;
// module.exports = {
//   query: (text, params) => pool.query(text, params),
// };