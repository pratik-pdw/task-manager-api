const express = require("express");
const router = express.Router();

//Importing Models
const Task = require("../models/Task");
const User = require("../models/User");
//Importing Auth Middleware
const auth = require("../middleware/auth");

/****************** TASK RELATED ENDPOINTS ********************** */

/**
 * Task Creation Endpoint
 * POST: Creates a new task
 */
router.post("/tasks", auth, async (req, res) => {
  // const task = new Task(req.body);
  const task = new Task({
    ...req.body,
    owner: req.user._id
  });

  try {
    const savedTask = await task.save();
    res.status(201).send(savedTask);
  } catch (e) {
    res.status(400).send(e);
  }
});

/**
 * Fetch all the tasks
 * GET: To fetch all of the tasks
 * GET /tasks?completed=false
 * GET /tasks?limit=10&skip=0
 * GET /tasks?sortBy=createdAt:asc
 */
router.get("/tasks", auth, async (req, res) => {
  const match = {};

  const sort = {};

  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }

  try {
    // 1. Below would work
    // const tasks = await Task.find({ owner: req.user._id });

    // 2.Below approach would also work by populating the user tasks
    await req.user
      .populate({
        path: "tasks",
        match,
        options: {
          limit: parseInt(req.query.limit, 10),
          skip: parseInt(req.query.skip, 10),
          sort
        }
      })
      .execPopulate();
    res.status(200).send(req.user.tasks);
  } catch (e) {
    res.status(500).send(e);
  }
});

/**
 * Fetch a task by ID
 * GET: To fetch a task by ID
 */
router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const fetchedTask = await Task.findOne({ _id, owner: req.user._id });
    if (!fetchedTask) {
      return res.status(404).send();
    }
    return res.status(200).send(fetchedTask);
  } catch (e) {
    return res.status(500).send(e);
  }
});

/**
 * Update a task by ID
 * PATCH: To update a task by ID
 */
router.patch("/tasks/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["description", "completed"];

  const isValidOperation = updates.every(update => {
    return allowedUpdates.includes(update);
  });

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid Updates" });
  }

  const _id = req.params.id;

  try {
    const task = await Task.findOne({ _id, owner: req.user._id });

    if (!task) {
      return res.status(404).send();
    }
    updates.forEach(update => {
      task[update] = req.body[update];
    });

    await task.save();
    return res.status(200).send(task);
  } catch (e) {
    return res.status(400).send(e);
  }
});

/**
 * Delete a task by ID
 * DELETE: To delete a task by ID
 */
router.delete("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const task = await Task.findOneAndDelete({ _id, owner: req.user._id });
    if (!task) {
      return res.status(404).send();
    }
    return res.status(200).send(task);
  } catch (e) {
    return res.status(500).send(e);
  }
});

module.exports = router;
