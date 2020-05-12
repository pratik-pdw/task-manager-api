const express = require("express");
const router = express.Router();

//Importing Models
const User = require("../models/User");

//Importing Auth Middleware
const auth = require("../middleware/auth");

//Requiring SendGrid
// const { sendWelcomeEmail } = require("../src/emails/account");

/****************** USER RELATED ENDPOINTS ********************** */
/**
 * User Creation Endpoint
 * POST: Creates a new user
 */
router.post("/users", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    // sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();

    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

/**
 * User Login Endpoint
 * POST: Logs in an existing user.
 */
router.post("/users/login", async (req, res) => {
  try {
    //Calling custom reusable function created on User Schema
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.status(200).send({ user, token });
  } catch (e) {
    res.status(400).send();
  }
});

/**
 * User Logout Endpoint
 * POST: Logouts an existing user.
 */
router.post("/users/logout", auth, async (req, res) => {
  //Middleware is added to this route so that only logged in users can be logged out
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });

    await req.user.save();

    res.send();
  } catch (err) {}
});

/**
 * User Logout from all sessions
 * POST: Logouts an existing user.
 */
router.post("/users/logoutAll", auth, async (req, res) => {
  //Middleware is added to this route so that only logged in users can be logged out
  try {
    req.user.tokens = [];

    await req.user.save();

    res.status(200).send();
  } catch (e) {
    res.status(500).send();
  }
});

/**
 * Fetch all the users
 * GET: To fetch all of the users
 */
router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

/**
 * Update a user by ID
 * PATCH: To update a user by ID
 */
router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "age"];

  const isValidOperation = updates.every((update) => {
    return allowedUpdates.includes(update);
  });

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid Updates" });
  }

  try {
    updates.forEach((update) => {
      req.user[update] = req.body[update];
    });

    await req.user.save();

    return res.status(200).send(req.user);
  } catch (e) {
    return res.status(400).send(e);
  }
});

/**
 * Delete a user by ID
 * DELETE: To delete a user by ID
 */
router.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    res.send(req.user);
  } catch (e) {
    return res.status(500).send(e);
  }
});

/**
 * Upload user image as an avatar
 * POST /users/avatar/me
 */

const multer = require("multer");
const sharp = require("sharp");
const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(png|jpeg|jpg)$/)) {
      cb(new Error("Please upload a JPEG,JPG or PNG image"));
    }
    cb(undefined, true);
  },
});

router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({
        width: 250,
        height: 250,
      })
      .png()
      .toBuffer();

    req.user.avatar = buffer;
    await req.user.save();

    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

/**
 * Delete a user avatar
 * DELETE: To delete a user avatar
 */
router.delete("/users/me/avatar", auth, async (req, res) => {
  try {
    req.user.avatar = undefined;
    await req.user.save();
    res.send(req.user);
  } catch (e) {
    return res.status(500).send(e);
  }
});

/**
 * Get a user avatar
 * GET: To get a user avatar
 */
router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) {
      throw new Error();
    }

    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (e) {
    return res.status(404).send(e);
  }
});

module.exports = router;
