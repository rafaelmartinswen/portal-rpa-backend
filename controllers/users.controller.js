const db = require("../config/db");

// GET
exports.getUsers = (req, res) => {
    const sql = "SELECT Id, Nome, RoleType, Username, Email, Area_resp FROM Usuarios_Web ORDER BY Nome";

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
};

// POST
exports.createUser = (req, res) => {
    const { Nome, Username, Email, Senha, tipoUsuario, AreaResponsavel } = req.body;

    const sql = `
        INSERT INTO Usuarios_Web 
        (Nome, Username, Email, Password, RoleType, Area_resp)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
        Nome, Username, Email, Senha,
        tipoUsuario, AreaResponsavel
    ];

    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.status(201).json({ id: result.insertId, message: "Usuário criado!" });
    });
};

// DELETE
exports.deleteUser = (req, res) => {
    const { id } = req.params;

    const sql = `DELETE FROM Usuarios_Web WHERE Id = ?`;

    db.query(sql, [parseInt(id)], (err, result) => {
        if (err) {
            console.error("Erro no banco:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Usuário não encontrado" });
        }
        
        res.json({ 
            message: "Usuário deletado com sucesso!",
            affectedRows: result.affectedRows 
        });
    });
};