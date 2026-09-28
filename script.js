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
Due date: ${task.dueDate || "No due date"}
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

if (taskName === "") {

alert("Please enter a task.");

return;

}

const newTask = {

id: Date.now(),

name: taskName,

assignedTo: assignedTo || "Unassigned",

priority: priority,

dueDate: dueDate,

completed: false

};

tasks.push(newTask);

saveTasks();

displayTasks(tasks);

taskInput.value = "";

assignedInput.value = "";

priorityInput.value = "Medium";

dueDateInput.value = "";

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