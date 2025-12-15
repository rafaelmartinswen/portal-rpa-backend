const db = require("../config/db");

// LOGIN REAL
exports.login = (req, res) => {
    let { user, pass } = req.body;

    if (!user || !pass) {
        return res.status(400).json({ message: "Usuário e senha são obrigatórios" });
    }

    user = user.toLowerCase();

    const sql = `
        SELECT *
        FROM Usuarios_Web
        WHERE LOWER(Username) = ? AND Password = ?
        LIMIT 1
    `;

    db.query(sql, [user, pass], (err, results) => {
        if (err) {
            console.error("Erro no banco:", err);
            return res.status(500).json({ message: "Erro interno do servidor" });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: "Usuário ou senha incorretos" });
        }

        const usuario = results[0];

        return res.json({
            id: usuario.ID,
            name: usuario.Nome,
            role: usuario.RoleType,
            email: usuario.Email,
            area_resp: usuario.Area_resp
        });
    });
};
