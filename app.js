 import { createClient } from
      "https://sbbrqkbiypyszqzyvbmn.supabase.co/rest/v1/TodoApp1";
    const SUPABASE_URL = "https://sbbrqkbiypyszqzyvbmn.supabase.co";
    const SUPABASE_KEY = "sb_publishable_8NvD3RwtG1DUG_bFMsAojQ_cCFeoBSN";
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );
    const taskForm = document.getElementById("taskForm");
    const taskInput = document.getElementById("taskInput");
    const taskList = document.getElementById("taskList");
    const addBtn = document.getElementById("addBtn");
    const status = document.getElementById("status");
    let tasks = [];
    function showStatus(message) {
      status.textContent = message;
    }
    function updateStats() {
      const completed = tasks.filter(
        task => task.taskCompleted
      ).length;
      document.getElementById("totalTasks").textContent =
        `Total: ${tasks.length}`;
      document.getElementById("completedTasks").textContent =
        `Completed: ${completed}`;
    }
    async function loadTasks() {
      taskList.replaceChildren();
      const loading = document.createElement("li");
      loading.className = "empty";
      loading.textContent = "Loading tasks...";
      taskList.appendChild(loading);
      const { data, error } = await supabase
        .from("tasks")
        .select("id, task, taskCompleted")
        .order("id", { ascending: false });
      if (error) {
        taskList.replaceChildren();
        showStatus("Could not load tasks: " + error.message);
        updateStats();
        return;
      }
      tasks = data;
      renderTasks();
    }
    function renderTasks() {
      taskList.replaceChildren();
      if (tasks.length === 0) {
        const empty = document.createElement("li");
        empty.className = "empty";
        empty.textContent = "No tasks yet. Add your first task! ✨";
        taskList.appendChild(empty);
      }
      tasks.forEach(task => {
        const li = document.createElement("li");
        li.className = "task-item";
        if (task.taskCompleted) {
          li.classList.add("completed");
        }
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "task-check";
        checkbox.checked = task.taskCompleted;
        checkbox.setAttribute(
          "aria-label",
          "Mark task completed"
        );
        const taskText = document.createElement("span");
        taskText.className = "task-text";
        taskText.textContent = task.task;
        const actions = document.createElement("div");
        actions.className = "actions";
        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "edit-btn";
        editBtn.textContent = "Edit";
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "Delete";
        checkbox.addEventListener("change", () => {
          toggleTask(task.id, checkbox.checked);
        });
        editBtn.addEventListener("click", () => {
          editTask(task);
        });
        deleteBtn.addEventListener("click", () => {
          deleteTask(task.id);
        });
        actions.append(editBtn, deleteBtn);
        li.append(checkbox, taskText, actions);
        taskList.appendChild(li);
      });
      updateStats();
    }
    taskForm.addEventListener("submit", async event => {
      event.preventDefault();
      const taskName = taskInput.value.trim();
      if (!taskName) {
        showStatus("Please enter a task.");
        return;
      }
      addBtn.disabled = true;
      showStatus("Saving task...");
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          task: taskName,
          taskCompleted: false
        })
        .select("id, task, taskCompleted")
        .single();
      addBtn.disabled = false;
      if (error) {
        showStatus("Could not save task: " + error.message);
        return;
      }
      tasks.unshift(data);
      renderTasks();
      taskForm.reset();
      taskInput.focus();
      showStatus("Task added successfully!");
    });
    async function editTask(task) {
      const newTask = prompt("Edit your task:", task.task);
      if (newTask === null) return;
      const updatedTask = newTask.trim();
      if (!updatedTask) {
        showStatus("Task cannot be empty.");
        return;
      }
      if (updatedTask.length > 300) {
        showStatus("Task must be 300 characters or fewer.");
        return;
      }
      showStatus("Updating task...");
      const { data, error } = await supabase
        .from("tasks")
        .update({ task: updatedTask })
        .eq("id", task.id)
        .select("id, task, taskCompleted")
        .single();
      if (error) {
        showStatus("Could not update task: " + error.message);
        return;
      }
      tasks = tasks.map(item =>
        item.id === task.id ? data : item
      );
      renderTasks();
      showStatus("Task updated successfully!");
    }
    async function deleteTask(id) {
      if (!confirm("Are you sure you want to delete this task?")) {
        return;
      }
      showStatus("Deleting task...");
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id);
      if (error) {
        showStatus("Could not delete task: " + error.message);
        return;
      }
      tasks = tasks.filter(task => task.id !== id);
      renderTasks();
      showStatus("Task deleted successfully!");
    }
    async function toggleTask(id, isCompleted) {
      const { data, error } = await supabase
        .from("tasks")
        .update({ taskCompleted: isCompleted })
        .eq("id", id)
        .select("id, task, taskCompleted")
        .single();
      if (error) {
        showStatus("Could not update status: " + error.message);
        await loadTasks();
        return;
      }
      tasks = tasks.map(task =>
        task.id === id ? data : task
      );
      renderTasks();
      showStatus(
        isCompleted
          ? "Task marked as completed!"
          : "Task marked as incomplete."
      );
    }
    loadTasks();