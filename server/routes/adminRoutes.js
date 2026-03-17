const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const { getUsers, createUser, deleteUser } = require("../controllers/adminController");

router.use(authMiddleware, adminOnly);

router.get("/users", getUsers);
router.post("/users", createUser);
router.delete("/users/:id", deleteUser);

module.exports = router;
