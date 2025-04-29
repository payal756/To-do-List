const API_URL = "http://localhost:8080/api/tasks";
let token = "";

const taskList = document.getElementById("task-list");
const taskInput = document.getElementById("task-input");
const addBtn = document.getElementById("add-btn");

// Login elements
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  loginBtn.addEventListener("click", login);
  addBtn.addEventListener("click", createTask);
  document.getElementById("filter-category").addEventListener("change", fetchTasks);
  document.getElementById("filter-priority").addEventListener("change", fetchTasks);
});

async function login() {
  const username = usernameInput.value;
  const password = passwordInput.value;

  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  if (!res.ok) return alert("Login failed");

  const data = await res.json();
  token = data.token;

  document.getElementById("auth-section").style.display = "none";
  document.getElementById("task-section").style.display = "block";

  fetchTasks();
}

async function fetchTasks() {
  const categoryFilter = document.getElementById("filter-category").value;
  const priorityFilter = document.getElementById("filter-priority").value;

  const res = await fetch(API_URL, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const tasks = await res.json();
  taskList.innerHTML = "";

  tasks
    .filter(task => {
      const [category, priority] = task.description.split('|');
      return (!categoryFilter || category === categoryFilter) &&
             (!priorityFilter || priority === priorityFilter);
    })
    .forEach(task => addTaskToDOM(task));
}

async function createTask() {
  const title = taskInput.value.trim();
  const category = document.getElementById("category-select").value;
  const priority = document.getElementById("priority-select").value;

  if (!title) return;

  const newTask = {
    title: title,
    description: `${category}|${priority}`,
    completed: false
  };

  await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(newTask)
  });

  taskInput.value = "";
  fetchTasks();
}

function addTaskToDOM(task) {
  const [category, priority] = task.description.split('|');

  const li = document.createElement("li");
  li.classList.add("task-item");
  if (task.completed) li.classList.add("completed");

  const text = document.createElement("span");
  text.textContent = `${task.title} - [${category}] - Priority: ${priority}`;
  li.appendChild(text);

  const editBtn = document.createElement("button");
  editBtn.textContent = "Edit";
  editBtn.style.backgroundColor = "#ffc107";
  editBtn.addEventListener("click", () => editTask(task, li));
  li.appendChild(editBtn);

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    await fetch(`${API_URL}/${task.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchTasks();
  });
  li.appendChild(deleteBtn);

  li.addEventListener("click", async (event) => {
    if (event.target.tagName === 'BUTTON') return;
    task.completed = !task.completed;
    await fetch(`${API_URL}/${task.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(task)
    });
    fetchTasks();
  });

  taskList.appendChild(li);
}

function editTask(task, li) {
  li.innerHTML = '';

  const [category, priority] = task.description.split('|');

  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.value = task.title;

  const categorySelect = document.createElement("select");
  ["Work", "Personal", "Shopping", "Other"].forEach(option => {
    const opt = document.createElement("option");
    opt.value = opt.text = option;
    if (option === category) opt.selected = true;
    categorySelect.appendChild(opt);
  });

  const prioritySelect = document.createElement("select");
  ["High", "Medium", "Low"].forEach(option => {
    const opt = document.createElement("option");
    opt.value = opt.text = option;
    if (option === priority) opt.selected = true;
    prioritySelect.appendChild(opt);
  });

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Save";
  saveBtn.style.backgroundColor = "#28a745";
  saveBtn.addEventListener("click", async () => {
    const updatedTask = {
      ...task,
      title: titleInput.value,
      description: `${categorySelect.value}|${prioritySelect.value}`
    };

    await fetch(`${API_URL}/${task.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(updatedTask)
    });
    fetchTasks();
  });

  li.appendChild(titleInput);
  li.appendChild(categorySelect);
  li.appendChild(prioritySelect);
  li.appendChild(saveBtn);
}
