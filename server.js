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
  credentials: true
};
 
// CORS ÚNICO E GLOBAL
app.use(cors(corsOptions));
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
//