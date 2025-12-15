const express = require("express");
const router = express.Router();
const users = require("../controllers/users.controller");

router.get("/", users.getUsers);
router.post("/", users.createUser);
router.delete("/:id", users.deleteUser);

module.exports = router;