const db = require("../config/db");

// GET
exports.getRobots = (req, res) => {
    const sql = "SELECT * FROM Projects ORDER BY Area_Responsavel";

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
};

// POST
exports.createRobot = (req, res) => {
    const { Nome, Descricao, SiglaDB, DevResp, AreaResponsavel, Agenda, Ambiente, Qtd_Robos,
        Identificador, Diretor, Key_User, Objetivo, Data_Criacao, Sistemas_Utilizados, Tecnologias_Utilizadas
     } = req.body;

    const sql = `
        INSERT INTO Projects 
        (Nome, Descricao, Sigla_DB, Dev_Responsavel, Area_Responsavel, Agenda, Ambiente, Status_Exec,
        Qtd_Robos, Identificacao, Diretor, Key_User, Objetivo, Data_Criacao, Sistemas_Utilizados, Tecnologias_Utilizadas)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE(?), ?, ?)
    `;

    const values = [
        Nome, Descricao, SiglaDB, DevResp,
        AreaResponsavel, Agenda, Ambiente,
        "Waiting", Qtd_Robos, Identificador,
        Diretor, Key_User, Objetivo, Data_Criacao,
        Sistemas_Utilizados, Tecnologias_Utilizadas
    ];

    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.status(201).json({ id: result.insertId, message: "Robô criado!" });
    });
};

// DELETE
exports.deleteRobot = (req, res) => {
    const { id } = req.params;

    const sql = `DELETE FROM Projects WHERE ID = ?`;

    db.query(sql, [parseInt(id)], (err, result) => {
        if (err) {
            console.error("Erro no banco:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Robô não encontrado" });
        }
        
        res.json({ 
            message: "Robô deletado com sucesso!",
            affectedRows: result.affectedRows 
        });
    });
};

//GET
exports.getListaInicial = (req, res) => {
    const { robotName } = req.params;

    // segurança mínima — permitir apenas letras, números e _
    if (!/^[A-Za-z0-9_]+$/.test(robotName)) {
        return res.status(400).json({ error: "Nome de robô inválido" });
    }

    const tableName = `${robotName}_ListaInicial`;
    // const sql = `SELECT * FROM \`${tableName}\``; // usa crase para identificar tabela
    const sql = `SELECT * FROM RPA.\`${tableName}\` WHERE Status_Processo IS NULL`; // RESCISÕES

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
};

//GET
exports.getLogExec = (req, res) => {
    const { robotName } = req.params;
    const { Status_Processo } = req.query;

    // segurança mínima
    if (!/^[A-Za-z0-9_]+$/.test(robotName)) {
        return res.status(400).json({ error: "Nome de robô inválido" });
    }

    const tableName = `${robotName}_logexec`;

    let sql = `
        SELECT * 
        FROM RPA.\`${tableName}\`
        WHERE Data_Processo >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;

    // Filtro: Status = 1
    if (Status_Processo == "1") {
        sql += ` AND Status_Processo = '1'`;
    }

    // Filtro: Todos os Status em ordem DESC
    if (Status_Processo == "0") {
        sql += ` ORDER BY Data_Processo DESC`;
    }

    // Filtro: Status diferente de 0 e 1
    if (Status_Processo == "-1") {
        sql += ` AND Status_Processo NOT IN ('0','1')`;
    }

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
};

//GET
exports.getAlerts = (req, res) => {
    const sql = "SELECT * FROM AlertsRobots ORDER BY Tipo_Alerta";

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
};