const express = require("express");
const router = express.Router();
const robots = require("../controllers/robots.controller");

router.get("/", robots.getRobots);
router.get("/schedule", robots.getSchedule);
router.get("/lista-inicial/:robotName", robots.getListaInicial);
router.get("/log-exec/:robotName", robots.getLogExec);
router.get("/alertsRobots", robots.getAlerts);
router.post("/", robots.createRobot);
router.delete("/:id", robots.deleteRobot);

module.exports = router;
