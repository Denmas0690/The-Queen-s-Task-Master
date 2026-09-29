console.log("Task Master is connected!");

// ========================================
// TASK DATA
// ========================================

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// ========================================
// HTML ELEMENTS
// ========================================

const taskInput = document.querySelector("#taskInput");

const assignedInput = document.querySelector("#assignedInput");

const priorityInput = document.querySelector("#priorityInput");

const dueDateInput = document.querySelector("#dueDateInput");

const imageInput = document.querySelector("#imageInput");

const addTaskButton = document.querySelector("#addTaskButton");

const taskContainer = document.querySelector("#taskContainer");

const searchInput = document.querySelector("#searchInput");

const totalTasks = document.querySelector("#totalTasks");

const pendingTasks = document.querySelector("#pendingTasks");

const completedTasks = document.querySelector("#completedTasks");

// ========================================
// SAVE TASKS
// ========================================

function saveTasks() {

localStorage.setItem("tasks", JSON.stringify(tasks));

}

// ========================================
// DISPLAY TASKS
// ========================================

function displayTasks(taskArray) {

taskContainer.innerHTML = "";

taskArray.forEach(function(task) {

const taskElement = document.createElement("div");

taskElement.classList.add("task-item");

if (task.completed) {

taskElement.classList.add("completed");

}

taskElement.innerHTML = `

<div class="task-content">

<div class="task-details">

<div class="task-name">
${task.name}
</div>

<div class="task-info">
Assigned to: ${task.assignedTo}
</div>

<div class="task-info">
Priority:

<span class="priority-${task.priority.toLowerCase()}">
${task.priority}
</span>

</div>

<div class="task-info">
Due date:
${task.dueDate || "No due date"}
</div>

<div class="task-info">
Status:
${task.completed ? "Completed" : "Pending"}
</div>

<div class="task-actions">

<button
class="complete-button"
onclick="toggleTask(${task.id})"
>
${task.completed ? "Mark Pending" : "Complete"}
</button>

<button
class="delete-button"
onclick="deleteTask(${task.id})"
>
Delete
</button>

</div>

</div>

<div class="task-image">

${
task.image
? `<img src="${task.image}" alt="Task image">`
: `<div class="no-image">No image</div>`
}

</div>

</div>

`;

taskContainer.appendChild(taskElement);

});

updateSummary();

}

// ========================================
// ADD TASK
// ========================================

function addTask() {

const taskName = taskInput.value.trim();

const assignedTo = assignedInput.value.trim();

const priority = priorityInput.value;

const dueDate = dueDateInput.value;

const imageFile = imageInput.files[0];

// Check task name

if (taskName === "") {

alert("Please enter a task.");

return;

}

// Check if an image was selected

if (imageFile) {

compressImage(imageFile, function(compressedImage) {

createTask(compressedImage);

});

} else {

createTask("");

}

}

// ========================================
// COMPRESS IMAGE
// ========================================

function compressImage(file, callback) {

const reader = new FileReader();


reader.onload = function(event) {

const image = new Image();


image.onload = function() {

const canvas = document.createElement("canvas");


const maxWidth = 1000;

const maxHeight = 700;


let width = image.width;

let height = image.height;


// Resize width if necessary

if (width > maxWidth) {

height = height * (maxWidth / width);

width = maxWidth;

}

// Resize height if necessary

if (height > maxHeight) {

width = width * (maxHeight / height);

height = maxHeight;

}

canvas.width = width;

canvas.height = height;

const context = canvas.getContext("2d");

context.drawImage(
image,
0,
0,
width,
height
);

// Compress image

const compressedImage = canvas.toDataURL(
"image/jpeg",
0.7
);

callback(compressedImage);

};

image.src = event.target.result;

};

reader.readAsDataURL(file);

}

// ========================================
// CREATE TASK
// ========================================

function createTask(imageData) {

const newTask = {

id: Date.now(),

name: taskInput.value.trim(),

assignedTo: assignedInput.value.trim() || "Unassigned",

priority: priorityInput.value,

dueDate: dueDateInput.value,

image: imageData,

completed: false

};

tasks.push(newTask);

saveTasks();

displayTasks(tasks);


// Clear form

taskInput.value = "";

assignedInput.value = "";

priorityInput.value = "Medium";

dueDateInput.value = "";

imageInput.value = "";

}

// ========================================
// COMPLETE / PENDING
// ========================================

function toggleTask(taskId) {

tasks.forEach(function(task) {

if (task.id === taskId) {

task.completed = !task.completed;

}

});

saveTasks();

displayTasks(tasks);

}

// ========================================
// DELETE TASK
// ========================================

function deleteTask(taskId) {

tasks = tasks.filter(function(task) {

return task.id !== taskId;

});

saveTasks();

displayTasks(tasks);

}

// ========================================
// SEARCH TASKS
// ========================================

function searchTasks() {

const searchText = searchInput.value.toLowerCase();


const filteredTasks = tasks.filter(function(task) {

return (
task.name.toLowerCase().includes(searchText) ||
task.assignedTo.toLowerCase().includes(searchText)
);

});

displayTasks(filteredTasks);

}

// ========================================
// TASK SUMMARY
// ========================================

function updateSummary() {

totalTasks.innerHTML = tasks.length;

const completed = tasks.filter(function(task) {

return task.completed === true;

});

const pending = tasks.filter(function(task) {

return task.completed === false;

});

completedTasks.innerHTML = completed.length;

pendingTasks.innerHTML = pending.length;

}

// ========================================
// EVENTS
// ========================================

addTaskButton.addEventListener("click", addTask);

searchInput.addEventListener("input", searchTasks);

// ========================================
// INITIAL DISPLAY
// ========================================

displayTasks(tasks);