require("dotenv").config();
const axios = require("axios");

async function obterStatusVM(vmName, token) {
    const url = `https://management.azure.com/subscriptions/${process.env.AZURE_SUBSCRIPTION_ID}/resourceGroups/${process.env.AZURE_RESOURCE_GROUP}/providers/Microsoft.Compute/virtualMachines/${vmName}/instanceView?api-version=2023-03-01`;

    const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
    });

    const statuses = response.data.statuses;
    const powerState = statuses?.find(s => s.code.startsWith("PowerState/"))?.code;

    return powerState || "Unknown";
}

async function gerarTokenAzure() {
    const url = `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`;

    const params = new URLSearchParams();
    params.append("client_id", process.env.AZURE_CLIENT_ID);
    params.append("client_secret", process.env.AZURE_CLIENT_SECRET);
    params.append("scope", "https://management.azure.com/.default");
    params.append("grant_type", "client_credentials");

    const response = await axios.post(url, params);
    return response.data.access_token;
}

async function listarVMs(req, res) {
    try {
        const token = await gerarTokenAzure();

        // pega lista básica
        const url = `https://management.azure.com/subscriptions/${process.env.AZURE_SUBSCRIPTION_ID}/resourceGroups/${process.env.AZURE_RESOURCE_GROUP}/providers/Microsoft.Compute/virtualMachines?api-version=2023-03-01`;

        const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });

        const listaVMs = response.data.value;

        // consultar status de cada VM
        const vmsComStatus = await Promise.all(
            listaVMs.map(async (vm) => ({
                name: vm.name,
                size: vm.properties.hardwareProfile.vmSize,
                location: vm.location,
                vmId: vm.properties.vmId,
                status: await obterStatusVM(vm.name, token)
            }))
        );

        res.json(vmsComStatus);

    } catch (error) {
        // Loga variáveis de ambiente relevantes para diagnosticar valores vazios
        console.error("Erro ao listar VMs", {
            AZURE_SUBSCRIPTION_ID: process.env.AZURE_SUBSCRIPTION_ID,
            AZURE_RESOURCE_GROUP: process.env.AZURE_RESOURCE_GROUP,
            AZURE_TENANT_ID: process.env.AZURE_TENANT_ID,
            AZURE_CLIENT_ID: process.env.AZURE_CLIENT_ID,
            AZURE_CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET ? "(definida)" : "(vazia/indefinida)"
        });
        console.error(error);
        res.status(500).json({
            error: "Falha ao listar VMs",
            detalhe: error.response?.data || error.message,
        });
    }
}

async function executarAcaoVM(acao, vmName, token) {
    const url = `https://management.azure.com/subscriptions/${process.env.AZURE_SUBSCRIPTION_ID}/resourceGroups/${process.env.AZURE_RESOURCE_GROUP}/providers/Microsoft.Compute/virtualMachines/${vmName}/${acao}?api-version=2023-03-01`;

    try {
        const response = await axios.post(url, {}, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        return {
            ok: true,
            status: response.status,
            message: `Ação '${acao}' enviada para a VM '${vmName}'.`
        };

    } catch (err) {
        return {
            ok: false,
            status: err.response?.status,
            error: err.response?.data || err.message
        };
    }
}

async function acaoVM(req, res) {
    try {
        const { vmName, acao } = req.body;

        if (!vmName || !acao)
            return res.status(400).json({ error: "vmName e acao são obrigatórios" });

        const acoesPermitidas = ["start", "powerOff", "restart"];

        if (!acoesPermitidas.includes(acao))
            return res.status(400).json({
                error: `Ação inválida. Use: ${acoesPermitidas.join(", ")}`
            });

        const token = await gerarTokenAzure();

        const resultado = await executarAcaoVM(acao, vmName, token);

        if (!resultado.ok)
            return res.status(500).json(resultado);

        return res.json(resultado);

    } catch (error) {
        res.status(500).json({
            error: "Falha ao executar ação na VM",
            detalhe: error.message
        });
    }
}

module.exports = { listarVMs, executarAcaoVM, acaoVM };
