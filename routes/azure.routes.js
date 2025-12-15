const express = require("express");
const router = express.Router();

const { listarVMs, acaoVM } = require("../controllers/azure.controller");

router.post("/listar-vms", listarVMs);
router.post("/acao-vm", acaoVM);

module.exports = router;
