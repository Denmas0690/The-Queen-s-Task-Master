// ========================================

// SERVER SESSION PROTECTION

// ========================================

console.log("Checking Task Master session...");

fetch("/session", {

credentials: "include"

})

.then(function(response) {

if (!response.ok) {

throw new Error("Not logged in");

}

return response.json();

})

.then(function(sessionData) {

console.log("Active session:", sessionData);

console.log("Task Master is connected!");

// ========================================

// TASK DATA

// ========================================

let tasks = [];

let currentUserRole =

sessionData.user.role || "";

console.log(

"Current user role:",

currentUserRole

);

// ========================================

// DOM ELEMENTS

// ========================================

const taskInput =

document.querySelector("#taskInput");

const assignedInput =

document.querySelector("#assignedInput");

const priorityInput =

document.querySelector("#priorityInput");

const dueDateInput =

document.querySelector("#dueDateInput");

const imageInput =

document.querySelector("#imageInput");

const addTaskButton =

document.querySelector("#addTaskButton");

const taskContainer =

document.querySelector("#taskContainer");

const searchInput =

document.querySelector("#searchInput");

const totalTasks =

document.querySelector("#totalTasks");

const pendingTasks =

document.querySelector("#pendingTasks");

const completedTasks =

document.querySelector("#completedTasks");

// ========================================

// ACCOUNT

// ========================================

const accountButton =

document.querySelector("#accountButton");

const accountMenu =

document.querySelector("#accountMenu");

const usernameDisplay =

document.querySelector("#usernameDisplay");

const logoutButton =

document.querySelector("#logoutButton");

const username =

sessionData.user.username;

if (usernameDisplay) {

usernameDisplay.textContent =

username || "User";

}

// ========================================

// ACCOUNT MENU

// ========================================

if (

accountButton &&

accountMenu

) {

accountButton.addEventListener(

"click",

function() {

if (

accountMenu.style.display ===

"block"

) {

accountMenu.style.display =

"none";

}

else {

accountMenu.style.display =

"block";

}

}

);

}

// ========================================

// LOGOUT

// ========================================

if (logoutButton) {

logoutButton.addEventListener(

"click",

function() {

fetch(

"/logout",

{

method: "POST",

credentials: "include"

}

)

.then(

function(response) {

if (!response.ok) {

throw new Error(

"Logout failed"

);

}

return response.json();

}

)

.then(

function(data) {

console.log(

data.message

);

window.location.href =

"login.html";

}

)

.catch(

function(error) {

console.error(

"Logout error:",

error

);

alert(

"Could not log out."

);

}

);

}

);

}

// ========================================

// NORMALIZE TASK DATA

//

// PostgreSQL uses:

// assigned_to

// due_date

//

// Frontend uses:

// assignedTo

// dueDate

// ========================================

function normalizeTask(task) {

return {

...task,

id:

Number(task.id),

assignedTo:

task.assigned_to ??

task.assignedTo ??

"Unassigned",

dueDate:

task.due_date ??

task.dueDate ??

"",

completed:

Boolean(task.completed)

};

}

// ========================================

// CONVERT TASK FOR API

// ========================================

function taskToApi(task) {

return {

name:

task.name,

assigned_to:

task.assignedTo ||

"Unassigned",

priority:

task.priority,

due_date:

task.dueDate ||

"",

image:

task.image ||

"",

comment:

task.comment ||

"",

completed:

Boolean(task.completed)

};

}

// ========================================

// DISPLAY TASKS

// ========================================

function displayTasks(taskArray) {

if (!taskContainer) {

return;

}

taskContainer.innerHTML = "";

if (taskArray.length === 0) {

taskContainer.innerHTML =

"<p>No tasks found.</p>";

updateSummary();

return;

}

taskArray.forEach(

function(task) {

const taskElement =

document.createElement(

"div"

);

taskElement.className =

"task-card";

// ========================================

// ADMIN DELETE BUTTON

// ========================================

const deleteButton =

currentUserRole === "admin"

? `

<button

type="button"

onclick="deleteTask(${task.id})"

>

Delete

</button>

`

: "";

// ========================================

// IMAGE

// ========================================

const imageHTML =

task.image

? `

<img

src="${task.image}"

class="clickable-image"

onclick="openImage('${task.image}')"

alt="Task image"

>

`

: "";

// ========================================

// TASK HTML

// ========================================

taskElement.innerHTML = `

<h3>

${task.name || "Untitled task"}

</h3>

<p>

<strong>

Assigned To:

</strong>

${task.assignedTo || "Unassigned"}

</p>

<p>

<strong>

Priority:

</strong>

${task.priority || "Medium"}

</p>

<p>

<strong>

Due Date:

</strong>

${task.dueDate || "No due date"}

</p>

<p>

<strong>

Status:

</strong>

${

task.completed

? "Completed"

: "Pending"

}

</p>

${imageHTML}

<textarea

id="comment-${task.id}"

placeholder="Add a comment..."

>${task.comment || ""}</textarea>

<div class="task-buttons">

<button

type="button"

onclick="saveComment(${task.id})"

>

Save Comment

</button>

<button

type="button"

onclick="toggleTask(${task.id})"

>

${

task.completed

? "Mark Pending"

: "Mark Complete"

}

</button>

${deleteButton}

</div>

`;

taskContainer.appendChild(

taskElement

);

}

);

updateSummary();

}

// ========================================

// SAVE COMMENT

// ========================================

window.saveComment =

function(taskId) {

const commentInput =

document.querySelector(

`#comment-${taskId}`

);

if (!commentInput) {

return;

}

const task =

tasks.find(

function(item) {

return (

item.id ===

Number(taskId)

);

}

);

if (!task) {

return;

}

const updatedTask = {

...task,

comment:

commentInput.value.trim()

};

fetch(

`/tasks/${taskId}`,

{

method: "PUT",

headers: {

"Content-Type":

"application/json"

},

credentials:

"include",

body:

JSON.stringify(

taskToApi(

updatedTask

)

)

}

)

.then(

function(response) {

if (!response.ok) {

throw new Error(

"Failed to save comment."

);

}

return response.json();

}

)

.then(

function(data) {

const updated =

normalizeTask(data);

tasks =

tasks.map(

function(item) {

return (

item.id ===

updated.id

)

? updated

: item;

}

);

displayTasks(tasks);

console.log(

"Comment saved to server:",

updated

);

}

)

.catch(

function(error) {

console.error(

"Error saving comment:",

error

);

alert(

"Could not save the comment."

);

}

);

};

// ========================================

// ADD TASK

// ========================================

function addTask() {

const taskName =

taskInput.value.trim();

if (!taskName) {

alert(

"Please enter a task name."

);

return;

}

const imageFile =

imageInput.files[0];

if (imageFile) {

compressImage(

imageFile,

function(imageData) {

createTask(imageData);

}

);

}

else {

createTask("");

}

}

// ========================================

// COMPRESS IMAGE

// ========================================

function compressImage(

file,

callback

) {

const reader =

new FileReader();

reader.onload =

function(event) {

const img =

new Image();

img.onload =

function() {

const canvas =

document.createElement(

"canvas"

);

let width =

img.width;

let height =

img.height;

const maxWidth =

2000;

const maxHeight =

1500;

if (

width >

maxWidth

) {

height =

height *

(

maxWidth /

width

);

width =

maxWidth;

}

if (

height >

maxHeight

) {

width =

width *

(

maxHeight /

height

);

height =

maxHeight;

}

canvas.width =

width;

canvas.height =

height;

const context =

canvas.getContext(

"2d"

);

context.drawImage(

img,

0,

0,

width,

height

);

const compressedImage =

canvas.toDataURL(

"image/jpeg",

0.9

);

callback(

compressedImage

);

};

img.src =

event.target.result;

};

reader.readAsDataURL(file);

}

// ========================================

// UPLOAD IMAGE

// ========================================

function uploadImage(imageData) {

return fetch(imageData)

.then(function(response) {

return response.blob();

})

.then(function(blob) {

const formData =

new FormData();

formData.append(

"image",

blob,

"task-image.jpg"

);

return fetch(

"/upload-image",

{

method: "POST",

credentials:

"include",

body:

formData

}

);

})

.then(function(response) {

if (!response.ok) {

throw new Error(

"Image upload failed."

);

}

return response.json();

})

.then(function(data) {

console.log(

"Image uploaded:",

data.imageUrl

);

return data.imageUrl;

});

}

// ========================================

// CREATE TASK

// ========================================

function createTask(imageData) {

const newTask = {

name:

taskInput.value.trim(),

assignedTo:

assignedInput.value.trim()

|| "Unassigned",

priority:

priorityInput.value,

dueDate:

dueDateInput.value,

image:

"",

comment:

"",

completed:

false

};

// ========================================

// SAVE TASK

// ========================================

function saveTask(imageUrl) {

newTask.image =

imageUrl;

fetch(

"/tasks",

{

method: "POST",

headers: {

"Content-Type":

"application/json"

},

credentials:

"include",

body:

JSON.stringify(

taskToApi(newTask)

)

}

)

.then(function(response) {

if (!response.ok) {

throw new Error(

"Failed to save task."

);

}

return response.json();

})

.then(function(data) {

const createdTask =

normalizeTask(data);

tasks.push(

createdTask

);

displayTasks(

tasks

);

// Clear form

taskInput.value =

"";

assignedInput.value =

"";

priorityInput.value =

"Medium";

dueDateInput.value =

"";

imageInput.value =

"";

console.log(

"Task saved to server:",

createdTask

);

})

.catch(function(error) {

console.error(

"Error creating task:",

error

);

alert(

"Could not save the task."

);

});

}

// ========================================

// IMAGE UPLOAD

// ========================================

if (imageData) {

uploadImage(

imageData

)

.then(function(imageUrl) {

saveTask(

imageUrl

);

})

.catch(function(error) {

console.error(

"Image upload error:",

error

);

alert(

"Could not upload the image."

);

});

}

else {

// No image selected

saveTask(

""

);

}

}

// ========================================

// OPEN IMAGE

// ========================================

window.openImage =

function(imageData) {

const imageWindow =

window.open("");

if (!imageWindow) {

alert(

"Please allow pop-ups to view the image."

);

return;

}

imageWindow.document.write(`

<html>

<head>

<title>

Task Image

</title>

<style>

body {

margin: 0;

background: #111;

display: flex;

justify-content:

center;

align-items:

center;

min-height:

100vh;

}

img {

max-width:

95%;

max-height:

95vh;

object-fit:

contain;

}

</style>

</head>

<body>

<img

src="${imageData}"

alt="Full task image"

>

</body>

</html>

`);

};

// ========================================

// TOGGLE TASK

// ========================================

window.toggleTask =

function(taskId) {

const task =

tasks.find(

function(item) {

return (

item.id ===

Number(taskId)

);

}

);

if (!task) {

console.error(

"Task not found:",

taskId

);

return;

}

const updatedTask = {

...task,

completed:

!task.completed

};

fetch(

`/tasks/${taskId}`,

{

method: "PUT",

headers: {

"Content-Type":

"application/json"

},

credentials:

"include",

body:

JSON.stringify(

taskToApi(

updatedTask

)

)

}

)

.then(

function(response) {

if (!response.ok) {

throw new Error(

"Failed to update task."

);

}

return response.json();

}

)

.then(

function(data) {

const updated =

normalizeTask(data);

tasks =

tasks.map(

function(item) {

return (

item.id ===

updated.id

)

? updated

: item;

}

);

displayTasks(

tasks

);

console.log(

"Task updated on server:",

updated

);

}

)

.catch(

function(error) {

console.error(

"Error updating task:",

error

);

alert(

"Could not update the task."

);

}

);

};

// ========================================

// DELETE TASK

// ADMIN ONLY

// ========================================

window.deleteTask =

function(taskId) {

// Frontend protection

if (

currentUserRole !==

"admin"

) {

alert(

"Only administrators can delete tasks."

);

return;

}

const confirmed =

confirm(

"Are you sure you want to delete this task?"

);

if (!confirmed) {

return;

}

fetch(

`/tasks/${taskId}`,

{

method: "DELETE",

credentials:

"include"

}

)

.then(

function(response) {

if (

response.status ===

403

) {

throw new Error(

"Admin access required."

);

}

if (!response.ok) {

throw new Error(

"Failed to delete task."

);

}

return response.json();

}

)

.then(

function(data) {

const deletedId =

Number(

data.task.id

);

tasks =

tasks.filter(

function(task) {

return (

task.id !==

deletedId

);

}

);

displayTasks(

tasks

);

console.log(

"Task deleted from server:",

data

);

}

)

.catch(

function(error) {

console.error(

"Error deleting task:",

error

);

alert(

error.message

);

}

);

};

// ========================================

// SEARCH TASKS

// ========================================

function searchTasks() {

const searchText =

searchInput.value

.toLowerCase()

.trim();

const filteredTasks =

tasks.filter(

function(task) {

const taskName =

(

task.name ||

""

).toLowerCase();

const assignedTo =

(

task.assignedTo ||

""

).toLowerCase();

return (

taskName.includes(

searchText

)

||

assignedTo.includes(

searchText

)

);

}

);

displayTasks(

filteredTasks

);

}

// ========================================

// UPDATE SUMMARY

// ========================================

function updateSummary() {

const total =

tasks.length;

const completed =

tasks.filter(

function(task) {

return task.completed;

}

).length;

const pending =

total -

completed;

if (totalTasks) {

totalTasks.textContent =

total;

}

if (pendingTasks) {

pendingTasks.textContent =

pending;

}

if (completedTasks) {

completedTasks.textContent =

completed;

}

}

// ========================================

// USER MANAGEMENT

// ADMIN ONLY

// ========================================

const userManagementSection =

document.querySelector(

"#userManagementSection"

);

const userUsernameInput =

document.querySelector(

"#userUsernameInput"

);

const userPasswordInput =

document.querySelector(

"#userPasswordInput"

);

const userRoleInput =

document.querySelector(

"#userRoleInput"

);

const createUserButton =

document.querySelector(

"#createUserButton"

);

const userMessage =

document.querySelector(

"#userMessage"

);

const usersContainer =

document.querySelector(

"#usersContainer"

);

// ========================================

// SHOW USER MANAGEMENT FOR ADMIN

// ========================================

if (

currentUserRole === "admin" &&

userManagementSection

) {

userManagementSection.style.display =

"block";

}

// ========================================

// DISPLAY USERS

// ========================================

function displayUsers(users) {

if (!usersContainer) {

return;

}

usersContainer.innerHTML = "";

if (users.length === 0) {

usersContainer.innerHTML =

"<p>No users found.</p>";

return;

}

users.forEach(

function(user) {

const userRow =

document.createElement(

"div"

);

userRow.className =

"user-row";

userRow.innerHTML = `

<div class="user-name">

${user.username}

</div>

<div class="user-role">

${user.role}

</div>

`;

usersContainer.appendChild(

userRow

);

}

);

}

// ========================================

// LOAD USERS

// ========================================

function loadUsers() {

if (

currentUserRole !== "admin"

) {

return;

}

fetch(

"/users",

{

credentials: "include"

}

)

.then(

function(response) {

if (!response.ok) {

throw new Error(

"Failed to load users."

);

}

return response.json();

}

)

.then(

function(data) {

console.log(

"Users loaded:",

data

);

displayUsers(

data

);

}

)

.catch(

function(error) {

console.error(

"Error loading users:",

error

);

}

);

}

// ========================================

// CREATE USER

// ========================================

function createUser() {

const username =

userUsernameInput.value.trim();

const password =

userPasswordInput.value;

const role =

userRoleInput.value;

if (!username) {

alert(

"Please enter a username."

);

return;

}

if (!password) {

alert(

"Please enter a password."

);

return;

}

if (password.length < 4) {

alert(

"Password must be at least 4 characters."

);

return;

}

createUserButton.disabled =

true;

if (userMessage) {

userMessage.textContent =

"Creating user...";

}

fetch(

"/users",

{

method: "POST",

headers: {

"Content-Type":

"application/json"

},

credentials:

"include",

body:

JSON.stringify({

username:

username,

password:

password,

role:

role

})

}

)

.then(

async function(response) {

const data =

await response.json();

if (!response.ok) {

throw new Error(

data.message ||

"Failed to create user."

);

}

return data;

}

)

.then(

function(data) {

console.log(

"User created:",

data

);

if (userMessage) {

userMessage.textContent =

"User created successfully.";

}

userUsernameInput.value =

"";

userPasswordInput.value =

"";

userRoleInput.value =

"employee";

loadUsers();

}

)

.catch(

function(error) {

console.error(

"Create user error:",

error

);

if (userMessage) {

userMessage.textContent =

error.message;

}

}

)

.finally(

function() {

createUserButton.disabled =

false;

}

);

}

// ========================================

// USER MANAGEMENT EVENTS

// ========================================

if (

createUserButton

) {

createUserButton.addEventListener(

"click",

createUser

);

}

// Load users immediately for admins

loadUsers();

// ========================================

// EVENT LISTENERS

// ========================================

if (addTaskButton) {

addTaskButton.addEventListener(

"click",

addTask

);

}

if (searchInput) {

searchInput.addEventListener(

"input",

searchTasks

);

}

// ========================================

// LOAD TASKS FROM POSTGRESQL

// ========================================

fetch(

"/tasks",

{

credentials:

"include"

}

)

.then(

function(response) {

if (!response.ok) {

throw new Error(

"Failed to load tasks."

);

}

return response.json();

}

)

.then(

function(data) {

tasks =

data.map(

normalizeTask

);

console.log(

"Tasks loaded from PostgreSQL:",

tasks

);

displayTasks(

tasks

);

}

)

.catch(

function(error) {

console.error(

"Error loading tasks:",

error

);

}

);

})

// ========================================

// NOT LOGGED IN

// ========================================

.catch(

function(error) {

console.error(

"Session check failed:",

error

);

window.location.href =

"login.html";

}

);