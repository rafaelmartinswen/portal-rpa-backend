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
        Identificador, Diretor, Key_User, Objetivo, Data_Criacao, Sistemas_Utilizados, Tecnologias_Utilizadas,
        tt_min_exec, tt_semana, obs_agenda
     } = req.body;

    const sql = `
        INSERT INTO Projects 
        (Nome, Descricao, Sigla_DB, Dev_Responsavel, Area_Responsavel, Agenda, Ambiente, Status_Exec,
        Qtd_Robos, Identificacao, Diretor, Key_User, Objetivo, Data_Criacao, Sistemas_Utilizados, Tecnologias_Utilizadas,
        tt_min_exec, tt_semana, obs_agenda)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE(?), ?, ?, ?, ?, ?)
    `;

    const values = [
        Nome, Descricao, SiglaDB, DevResp,
        AreaResponsavel, Agenda, Ambiente,
        "Waiting", Qtd_Robos, Identificador,
        Diretor, Key_User, Objetivo, Data_Criacao,
        Sistemas_Utilizados, Tecnologias_Utilizadas,
        tt_min_exec, tt_semana, obs_agenda
    ];

    console.log("createRobot payload", req.body);
    console.log("createRobot values", values);

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

exports.getLogExecHistory = (req, res) => {
    const { robotName } = req.params;
    const { date } = req.query;

    // seguran??a m??nima
    if (!/^[A-Za-z0-9_]+$/.test(robotName)) {
        return res.status(400).json({ error: "Nome de robô inválido" });
    }

    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: "Data inválida. Use YYYY-MM-DD" });
    }

    const tableName = `${robotName}_logexec`;

    let sql = `
        SELECT * 
        FROM RPA.\`${tableName}\`
    `;

    const params = [];

    if (date) {
        sql += ` WHERE Data_Processo >= ? AND Data_Processo < DATE_ADD(?, INTERVAL 1 DAY)`;
        params.push(date, date);
    } else {
        sql += ` WHERE Data_Processo >= DATE_SUB(NOW(), INTERVAL 30 DAY)`;
    }

    sql += ` ORDER BY Data_Processo DESC`;

    db.query(sql, params, (err, results) => {
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

//GET
exports.getSchedule = (req, res) => {
    const sql = `
        WITH RECURSIVE calendario AS (
            SELECT DATE_SUB(CURDATE(), INTERVAL DAY(CURDATE()) - 1 DAY) AS data_dia
            UNION ALL
            SELECT DATE_ADD(data_dia, INTERVAL 1 DAY)
            FROM calendario
            WHERE data_dia < LAST_DAY(CURDATE())
        ),
        agenda_exec AS (
            SELECT
                p.Nome,
                p.Descricao,
                p.Area_Responsavel,
                DAY(c.data_dia) AS dia_mes,
                CASE
                    -- Diário
                    WHEN p.tt_semana = 'Diario' THEN
                        CASE
                            WHEN p.tt_min_exec < 60 THEN CONCAT(p.tt_min_exec, 'm')
                            WHEN MOD(p.tt_min_exec, 60) = 0 THEN CONCAT(FLOOR(p.tt_min_exec / 60), 'h')
                            ELSE CONCAT(
                                FLOOR(p.tt_min_exec / 60), 'h',
                                LPAD(MOD(p.tt_min_exec, 60), 2, '0')
                            )
                        END

                    -- Semanal
                    WHEN p.tt_semana = 'Semanal'
                         AND WEEKDAY(c.data_dia) + 1 = p.Agenda THEN
                        CASE
                            WHEN p.tt_min_exec < 60 THEN CONCAT(p.tt_min_exec, 'm')
                            WHEN MOD(p.tt_min_exec, 60) = 0 THEN CONCAT(FLOOR(p.tt_min_exec / 60), 'h')
                            ELSE CONCAT(
                                FLOOR(p.tt_min_exec / 60), 'h',
                                LPAD(MOD(p.tt_min_exec, 60), 2, '0')
                            )
                        END

                    -- Quinzenal
                    WHEN p.tt_semana = 'Quinzenal'
                         AND WEEKDAY(c.data_dia) + 1 = p.Agenda
                         AND FLOOR((DAY(c.data_dia) - 1) / 14) = 0 THEN
                        CASE
                            WHEN p.tt_min_exec < 60 THEN CONCAT(p.tt_min_exec, 'm')
                            WHEN MOD(p.tt_min_exec, 60) = 0 THEN CONCAT(FLOOR(p.tt_min_exec / 60), 'h')
                            ELSE CONCAT(
                                FLOOR(p.tt_min_exec / 60), 'h',
                                LPAD(MOD(p.tt_min_exec, 60), 2, '0')
                            )
                        END

                    -- Mensal
                    WHEN p.tt_semana = 'Mensal'
                         AND WEEKDAY(c.data_dia) + 1 = p.Agenda
                         AND DAY(c.data_dia) <= 7 THEN
                        CASE
                            WHEN p.tt_min_exec < 60 THEN CONCAT(p.tt_min_exec, 'm')
                            WHEN MOD(p.tt_min_exec, 60) = 0 THEN CONCAT(FLOOR(p.tt_min_exec / 60), 'h')
                            ELSE CONCAT(
                                FLOOR(p.tt_min_exec / 60), 'h',
                                LPAD(MOD(p.tt_min_exec, 60), 2, '0')
                            )
                        END
                    ELSE NULL
                END AS minutos_execucao
            FROM calendario c
            CROSS JOIN rpa_portal_prod.Projects p
        )
        SELECT
            Nome,
            Descricao,
            Area_Responsavel,

            MAX(CASE WHEN dia_mes = 1  THEN minutos_execucao END) AS \`01\`,
            MAX(CASE WHEN dia_mes = 2  THEN minutos_execucao END) AS \`02\`,
            MAX(CASE WHEN dia_mes = 3  THEN minutos_execucao END) AS \`03\`,
            MAX(CASE WHEN dia_mes = 4  THEN minutos_execucao END) AS \`04\`,
            MAX(CASE WHEN dia_mes = 5  THEN minutos_execucao END) AS \`05\`,
            MAX(CASE WHEN dia_mes = 6  THEN minutos_execucao END) AS \`06\`,
            MAX(CASE WHEN dia_mes = 7  THEN minutos_execucao END) AS \`07\`,
            MAX(CASE WHEN dia_mes = 8  THEN minutos_execucao END) AS \`08\`,
            MAX(CASE WHEN dia_mes = 9  THEN minutos_execucao END) AS \`09\`,
            MAX(CASE WHEN dia_mes = 10 THEN minutos_execucao END) AS \`10\`,
            MAX(CASE WHEN dia_mes = 11 THEN minutos_execucao END) AS \`11\`,
            MAX(CASE WHEN dia_mes = 12 THEN minutos_execucao END) AS \`12\`,
            MAX(CASE WHEN dia_mes = 13 THEN minutos_execucao END) AS \`13\`,
            MAX(CASE WHEN dia_mes = 14 THEN minutos_execucao END) AS \`14\`,
            MAX(CASE WHEN dia_mes = 15 THEN minutos_execucao END) AS \`15\`,
            MAX(CASE WHEN dia_mes = 16 THEN minutos_execucao END) AS \`16\`,
            MAX(CASE WHEN dia_mes = 17 THEN minutos_execucao END) AS \`17\`,
            MAX(CASE WHEN dia_mes = 18 THEN minutos_execucao END) AS \`18\`,
            MAX(CASE WHEN dia_mes = 19 THEN minutos_execucao END) AS \`19\`,
            MAX(CASE WHEN dia_mes = 20 THEN minutos_execucao END) AS \`20\`,
            MAX(CASE WHEN dia_mes = 21 THEN minutos_execucao END) AS \`21\`,
            MAX(CASE WHEN dia_mes = 22 THEN minutos_execucao END) AS \`22\`,
            MAX(CASE WHEN dia_mes = 23 THEN minutos_execucao END) AS \`23\`,
            MAX(CASE WHEN dia_mes = 24 THEN minutos_execucao END) AS \`24\`,
            MAX(CASE WHEN dia_mes = 25 THEN minutos_execucao END) AS \`25\`,
            MAX(CASE WHEN dia_mes = 26 THEN minutos_execucao END) AS \`26\`,
            MAX(CASE WHEN dia_mes = 27 THEN minutos_execucao END) AS \`27\`,
            MAX(CASE WHEN dia_mes = 28 THEN minutos_execucao END) AS \`28\`,
            MAX(CASE WHEN dia_mes = 29 THEN minutos_execucao END) AS \`29\`,
            MAX(CASE WHEN dia_mes = 30 THEN minutos_execucao END) AS \`30\`,
            MAX(CASE WHEN dia_mes = 31 THEN minutos_execucao END) AS \`31\`

        FROM agenda_exec
        GROUP BY Nome, Descricao, Area_Responsavel
        ORDER BY Nome;
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar agenda:', err);
            return res.status(500).json({ error: err.message });
        }

        res.status(200).json(results);
    });
};