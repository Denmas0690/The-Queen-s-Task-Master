const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");
const multer = require("multer");
const pool = require("./db");

const app = express();


// ======================================================
// JSON BODY SIZE
// ======================================================

app.use(express.json({
limit: "50mb"
}));


// ======================================================
// MULTER / PICTURE STORAGE
// ======================================================

const storage = multer.diskStorage({

destination: function(req, file, cb) {

cb(
null,
path.join(__dirname, "..", "uploads")
);

},

filename: function(req, file, cb) {

const extension =
path.extname(
file.originalname
).toLowerCase();

const uniqueName =
Date.now() +
"-" +
Math.round(
Math.random() * 1E9
);

cb(
null,
uniqueName + extension
);

}

});


const upload = multer({

storage: storage,

limits: {

fileSize: 20 * 1024 * 1024

}

});


// ======================================================
// SESSION
// ======================================================

app.use(

session({

secret:
"task-master-secret-change-this-later",

resave:
false,

saveUninitialized:
false,

cookie: {

httpOnly:
true,

secure:
false,

maxAge:
1000 * 60 * 60 * 8

}

})

);


// ======================================================
// STATIC FILES
// ======================================================

app.use(

express.static(

path.join(
__dirname,
".."
)

)

);


// ======================================================
// AUTHENTICATION MIDDLEWARE
// ======================================================

function requireLogin(
req,
res,
next
) {

if (!req.session.user) {

return res.status(401).json({

message:
"You must be logged in."

});

}

next();

}


// ======================================================
// ROLE MIDDLEWARE
// ======================================================

function requireRole(role) {

return function(
req,
res,
next
) {

if (!req.session.user) {

return res.status(401).json({

message:
"You must be logged in."

});

}


if (
req.session.user.role !==
role
) {

return res.status(403).json({

message:
"You do not have permission to perform this action."

});

}

next();

};

}


// ======================================================
// IMAGE UPLOAD
// ======================================================

app.post(

"/upload-image",

requireLogin,

upload.single("image"),

function(req, res) {

if (!req.file) {

return res.status(400).json({

message:
"No image uploaded."

});

}


const imageUrl =
"/uploads/" +
req.file.filename;


console.log(

"Image uploaded by:",

req.session.user.username,

"| File:",

req.file.filename

);


res.status(201).json({

message:
"Image uploaded successfully.",

imageUrl:
imageUrl

});

}

);


// ======================================================
// LOGIN
// ======================================================

app.post(

"/login",

async function(req, res) {

try {

const username =
req.body.username;

const password =
req.body.password;


const result =
await pool.query(

"SELECT id, username, password, role FROM users WHERE username = $1",

[username]

);


if (
result.rows.length === 0
) {

return res.status(401).json({

message:
"Invalid username or password."

});

}


const user =
result.rows[0];


const passwordMatches =
await bcrypt.compare(

password,

user.password

);


if (!passwordMatches) {

return res.status(401).json({

message:
"Invalid username or password."

});

}


req.session.user = {

id:
Number(user.id),

username:
user.username,

role:
user.role

};


console.log(

"User logged in:",

user.username,

"| Role:",

user.role

);


res.json({

message:
"Login successful",

user: {

id:
Number(user.id),

username:
user.username,

role:
user.role

}

});

}

catch (error) {

console.error(

"Login error:",

error

);


res.status(500).json({

message:
"Login failed."

});

}

}

);


// ======================================================
// CHECK SESSION
// ======================================================

app.get(

"/session",

function(req, res) {

if (!req.session.user) {

return res.status(401).json({

loggedIn:
false

});

}


res.json({

loggedIn:
true,

user:
req.session.user

});

}

);


// ======================================================
// LOGOUT
// ======================================================

app.post(

"/logout",

function(req, res) {

const username =
req.session.user

? req.session.user.username

: "Unknown";


req.session.destroy(

function(error) {

if (error) {

console.error(

"Logout error:",

error

);


return res.status(500).json({

message:
"Logout failed"

});

}


console.log(

"User logged out:",

username

);


res.clearCookie(
"connect.sid"
);


res.json({

message:
"Logout successful"

});

}

);

}

);


// ======================================================
// GET ALL TASKS
// ======================================================

app.get(

"/tasks",

requireLogin,

async function(req, res) {

try {

const result =
await pool.query(

"SELECT * FROM tasks ORDER BY id ASC"

);


res.json(
result.rows
);

}

catch (error) {

console.error(

"Get tasks error:",

error

);


res.status(500).json({

message:
"Failed to load tasks."

});

}

}

);


// ======================================================
// CREATE TASK
// ======================================================

app.post(

"/tasks",

requireLogin,

async function(req, res) {

try {

const {

name,

assigned_to,

priority,

due_date,

image,

comment,

completed

} = req.body;


const result =
await pool.query(

`INSERT INTO tasks
(
name,
assigned_to,
priority,
due_date,
image,
comment,
completed
)
VALUES
(
$1,
$2,
$3,
$4,
$5,
$6,
$7
)
RETURNING *`,

[

name,

assigned_to,

priority,

due_date,

image,

comment,

completed || false

]

);


res.status(201).json(

result.rows[0]

);

}

catch (error) {

console.error(

"Create task error:",

error

);


res.status(500).json({

message:
"Failed to create task."

});

}

}

);


// ======================================================
// UPDATE TASK
// ======================================================

app.put(

"/tasks/:id",

requireLogin,

async function(req, res) {

try {

const taskId =
req.params.id;


const {

name,

assigned_to,

priority,

due_date,

image,

comment,

completed

} = req.body;


const result =
await pool.query(

`UPDATE tasks
SET
name = $1,
assigned_to = $2,
priority = $3,
due_date = $4,
image = $5,
comment = $6,
completed = $7
WHERE id = $8
RETURNING *`,

[

name,

assigned_to,

priority,

due_date,

image,

comment,

completed || false,

taskId

]

);


if (
result.rows.length === 0
) {

return res.status(404).json({

message:
"Task not found."

});

}


res.json(

result.rows[0]

);

}

catch (error) {

console.error(

"Update task error:",

error

);


res.status(500).json({

message:
"Failed to update task."

});

}

}

);


// ======================================================
// DELETE TASK
// ADMIN ONLY
// ======================================================

app.delete(

"/tasks/:id",

requireRole("admin"),

async function(req, res) {

try {

const taskId =
req.params.id;


const result =
await pool.query(

"DELETE FROM tasks WHERE id = $1 RETURNING *",

[taskId]

);


if (
result.rows.length === 0
) {

return res.status(404).json({

message:
"Task not found."

});

}


console.log(

"Task deleted by admin:",

req.session.user.username,

"| Task ID:",

taskId

);


res.json({

message:
"Task deleted successfully",

task:
result.rows[0]

});

}

catch (error) {

console.error(

"Delete task error:",

error

);


res.status(500).json({

message:
"Failed to delete task."

});

}

}

);


// ======================================================
// GET ALL USERS
// ADMIN ONLY
// ======================================================

app.get(

"/users",

requireRole("admin"),

async function(req, res) {

try {

const result =
await pool.query(

"SELECT id, username, role FROM users ORDER BY id ASC"

);


res.json(

result.rows

);

}

catch (error) {

console.error(

"Get users error:",

error

);


res.status(500).json({

message:
"Failed to load users."

});

}

}

);


// ======================================================
// CREATE USER
// ADMIN ONLY
// ======================================================

app.post(

"/users",

requireRole("admin"),

async function(req, res) {

try {

const username =
req.body.username;

const password =
req.body.password;

const role =
req.body.role;


// --------------------------------------------------
// VALIDATION
// --------------------------------------------------

if (
!username ||
!password ||
!role
) {

return res.status(400).json({

message:
"Username, password and role are required."

});

}


if (

role !== "admin" &&

role !== "employee"

) {

return res.status(400).json({

message:
"Invalid role."

});

}


if (
password.length < 4
) {

return res.status(400).json({

message:
"Password must be at least 4 characters."

});

}


// --------------------------------------------------
// CHECK EXISTING USERNAME
// --------------------------------------------------

const existingUser =
await pool.query(

"SELECT id FROM users WHERE username = $1",

[username]

);


if (
existingUser.rows.length > 0
) {

return res.status(409).json({

message:
"Username already exists."

});

}


// --------------------------------------------------
// HASH PASSWORD
// --------------------------------------------------

const hashedPassword =
await bcrypt.hash(

password,

10

);


// --------------------------------------------------
// CREATE USER
// --------------------------------------------------

const result =
await pool.query(

`INSERT INTO users
(
username,
password,
role
)
VALUES
(
$1,
$2,
$3
)
RETURNING id, username, role`,

[

username,

hashedPassword,

role

]

);


console.log(

"User created by admin:",

req.session.user.username,

"| New user:",

result.rows[0].username,

"| Role:",

result.rows[0].role

);


res.status(201).json({

message:
"User created successfully",

user:
result.rows[0]

});

}

catch (error) {

console.error(

"Create user error:",

error

);


// PostgreSQL duplicate username protection

if (
error.code === "23505"
) {

return res.status(409).json({

message:
"Username already exists."

});

}


res.status(500).json({

message:
"Failed to create user."

});

}

}

);


// ======================================================
// DATABASE CONNECTION TEST
// ======================================================

pool.query(

"SELECT 1"

)

.then(

function() {

console.log(

"PostgreSQL connection works!"

);

}

)

.catch(

function(error) {

console.error(

"PostgreSQL connection failed:",

error

);

}

);


// ======================================================
// START SERVER
// ======================================================

const PORT = 3000;

app.listen(

PORT,

function() {

console.log(

`Task Master server is on air on port ${PORT}`

);

}

);