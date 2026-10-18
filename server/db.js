
require("dotenv").config();

const { Pool } = require("pg");

let pool;

if (process.env.DATABASE_URL) {
// Online database: Neon
pool = new Pool({
connectionString: process.env.DATABASE_URL
});
} else {
// Local database: your MacBook
pool = new Pool({
user: "the_blessed_one",
host: "localhost",
database: "task_master",
port: 5432
});
}

module.exports = pool;
