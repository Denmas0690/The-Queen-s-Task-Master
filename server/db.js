const { Pool } = require("pg");

const pool = new Pool({
user: "the_blessed_one",
host: "localhost",
database: "task_master",
port: 5432
});

module.exports = pool;