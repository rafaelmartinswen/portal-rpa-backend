require("dotenv").config();

const express = require("express");
const cors = require("cors");
const robotsRoutes = require("./routes/robots.routes");
const usersRoutes = require("./routes/users.routes");
const authRoutes = require("./routes/auth.routes");
const azureRoutes = require("./routes/azure.routes");

const app = express();
const port = process.env.PORT || 3001;

const FRONT_URL = "https://calm-island-0b5e87d0f.3.azurestaticapps.net";

const corsOptions = {
  origin: FRONT_URL,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));  // ✅ ESSA LINHA JÁ RESOLVE TUDO
app.options("*", cors(corsOptions));
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", FRONT_URL);
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  return res.sendStatus(204);
});

app.use(express.json());

// rotas
app.use("/robots", robotsRoutes);
app.use("/users", usersRoutes);
app.use("/auth", authRoutes);
app.use("/azure", azureRoutes);

app.listen(port, () => {
  console.log(`Backend rodando na porta ${port}`);
  console.log("CORS liberado para:", FRONT_URL);
});
///