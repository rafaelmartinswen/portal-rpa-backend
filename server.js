require("dotenv").config();

const express = require("express");
const cors = require("cors");
const robotsRoutes = require("./routes/robots.routes");
const usersRoutes = require("./routes/users.routes");
const authRoutes = require("./routes/auth.routes");
const azureRoutes = require("./routes/azure.routes");

const app = express();
const port = process.env.PORT || 3001;

// 🔥 Domínio do seu FRONTEND hospedado no Static Web App
const FRONT_URL = "https://calm-island-0b5e87d0f.3.azurestaticapps.net";

// 🔧 Configuração correta de CORS
const corsOptions = {
  origin: FRONT_URL,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // 🔥 Faz o preflight responder corretamente

app.use(express.json());

// --- ROTAS ---
app.use("/robots", robotsRoutes);
app.use("/users", usersRoutes);
app.use("/auth", authRoutes);
app.use("/azure", azureRoutes);

// --- SERVIDOR ---
app.listen(port, () => {
  console.log(`Backend rodando em http://localhost:${port}`);
  console.log(`CORS liberado para: ${FRONT_URL}`);
});
