const QRCode = require('qrcode');
const { Client } = require('whatsapp-web.js');
const pool = require('./src/database/db');
require('dotenv').config();

// Estados de usuários (mapa de state machines)
const userStates = {};

// Fila de mensagens
const messageQueue = {
    jobs: [],
    isProcessing: false,
    add: async (job, options = {}) => {
        messageQueue.jobs.push({ ...job, delay: options.delay || 0 });
        if (!messageQueue.isProcessing) {
            messageQueue.process();
        }
    },
    process: async () => {
        if (messageQueue.isProcessing) return;
        // Se não estiver conectado, não iniciar processamento (mantém filas para depois)
        if (!global.chatbotStatus.connected) {
            console.log('messageQueue: cliente não conectado, aguardando conexão para processar a fila.');
            return;
        }
        messageQueue.isProcessing = true;
        while (messageQueue.jobs.length > 0) {
            const job = messageQueue.jobs.shift();
            if (job.delay) {
                await new Promise(resolve => setTimeout(resolve, job.delay));
            }
            try {
                if (!client) throw new Error('Cliente WhatsApp não inicializado.');
                await client.sendMessage(job.chatId, job.message);
                global.chatbotStatus.messagesSentToday++;
                if (global.chatbotStatus.messagesSentToday % 100 === 0) {
                    await updateStatus();
                }
            } catch (error) {
                console.error(`Erro ao enviar mensagem para ${job.chatId}:`, error.message);
                // Em caso de falha por desconexão, re-enfileirar e sair para evitar desgaste
                if (!global.chatbotStatus.connected) {
                    // re-enfileira o job no início
                    messageQueue.jobs.unshift(job);
                    break;
                }
            }
        }
        messageQueue.isProcessing = false;
    }
};

// Mapeamento de grupos
const groupMapping = {
    1: '120363417941205146@g.us', // Módulo 6
    2: '120363419605122416@g.us', // Módulo 7
    // ... (outros mapeamentos)
};
const TECHNICIANS_GROUP = '120363401603739472@g.us';

// Cache e status
global.modulos = [];
global.professores = [];
let lastCacheUpdate = 0;
global.chatbotStatus = { connected: false, messagesSentToday: 0, messagesReceivedToday: 0 };

// Cache de configurações
let configCache = {
    notifications_enabled: '0',
    auto_replies_enabled: '0',
    menu_enabled: '0',
    lastUpdated: 0
};
const CONFIG_CACHE_DURATION = 60000; // 1 minuto

// Interval IDs para cleanup
let notificationInterval = null;
let cacheInterval = null;
let statusInterval = null;

// Funções de configuração e cache
async function getConfig(setting) {
    const now = Date.now();
    if (now - configCache.lastUpdated < CONFIG_CACHE_DURATION) {
        if (!setting) return { ...configCache };
        return configCache[setting] || '0';
    }
    try {
        const result = await pool.query(
            'SELECT setting, value FROM chatbot_config WHERE setting IN ($1, $2, $3)',
            ['notifications_enabled', 'auto_replies_enabled', 'menu_enabled']
        );
        result.rows.forEach(row => {
            configCache[row.setting] = row.value;
        });
        configCache.lastUpdated = now;
        console.log('Configurações atualizadas no cache:', configCache);
        if (!setting) return { ...configCache };
        return configCache[setting] || '0';
    } catch (error) {
        console.error('Erro ao obter configuração:', error.message);
        if (!setting) return { ...configCache };
        return configCache[setting] || '0';
    }
}

async function updateStatus() {
    try {
        await pool.query(
            `INSERT INTO chatbot_config (setting, value) VALUES ($1, $2)
             ON CONFLICT (setting) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
            ['connection_status', global.chatbotStatus.connected ? '1' : '0']
        );
        await pool.query(
            `INSERT INTO chatbot_config (setting, value) VALUES ($1, $2)
             ON CONFLICT (setting) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
            ['messages_sent_today', global.chatbotStatus.messagesSentToday.toString()]
        );
        await pool.query(
            `INSERT INTO chatbot_config (setting, value) VALUES ($1, $2)
             ON CONFLICT (setting) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
            ['messages_received_today', global.chatbotStatus.messagesReceivedToday.toString()]
        );
    } catch (error) {
        console.error('Erro ao atualizar status:', error.message);
    }
}

async function updateCache() {
    const now = Date.now();
    if (now - lastCacheUpdate < 3600000) return;
    try {
        const modulosResult = await pool.query('SELECT id, nome FROM modulo');
        const professoresResult = await pool.query('SELECT id, nome FROM professor');
        global.modulos = modulosResult.rows;
        global.professores = professoresResult.rows;
        lastCacheUpdate = now;
        console.log('Cache atualizado: módulos e professores.');
    } catch (error) {
        console.error('Erro ao atualizar cache:', error.message);
    }
}

// Funções de formatação
function formatDate(isoDate) {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

function formatTime(timeStr) {
    if (!timeStr) return '';
    return timeStr.split(':').slice(0, 2).join(':');
}

function isValidDate(dateStr) {
    const regex = /^(\d{2})-(\d{2})-(\d{4})$/;
    if (!regex.test(dateStr)) return false;
    const [day, month, year] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
}

function formatAvaliacoes(rows) {
    if (!rows || rows.length === 0) {
        return 'Nenhuma avaliação encontrada. Deseja tentar outra consulta ou voltar ao menu? (Digite "menu" para o menu principal)';
    }
    let response = 'Avaliações encontradas:\n\n';
    rows.forEach(row => {
        response += `Data: ${formatDate(row.data)}\nDisciplina: ${row.disciplina_nome || 'Sem disciplina'}\nHorário: ${formatTime(row.horario_ini)} - ${formatTime(row.horario_fim)}\nLocal: ${row.laboratorios || 'Sem laboratórios'}\n\n`;
    });
    response += '\nDeseja fazer outra consulta ou voltar ao menu? (Digite "menu" para o menu principal)';
    return response;
}

async function addOrUpdateUser(phoneNumber) {
    try {
        await pool.query(
            `INSERT INTO chatbot_users (phone_number, subscribed) VALUES ($1, true)
             ON CONFLICT (phone_number) DO UPDATE SET subscribed = true`,
            [phoneNumber]
        );
        console.log(`Usuário ${phoneNumber} adicionado/atualizado em chatbot_users.`);
    } catch (error) {
        console.error('Erro ao adicionar/atualizar usuário:', error.message);
    }
}

async function manageSubscription(phoneNumber, subscribe) {
    try {
        await pool.query(
            `INSERT INTO chatbot_users (phone_number, subscribed) VALUES ($1, $2)
             ON CONFLICT (phone_number) DO UPDATE SET subscribed = $2`,
            [phoneNumber, subscribe]
        );
        console.log(`Assinatura do usuário ${phoneNumber} atualizada: ${subscribe ? 'ativada' : 'desativada'}.`);
        return `Notificações ${subscribe ? 'ativadas' : 'desativadas'}. Digite "${subscribe ? 'parar' : 'ativar'}" para ${subscribe ? 'desativar' : 'reativar'}.`;
    } catch (error) {
        console.error('Erro ao gerenciar assinatura:', error.message);
        return 'Erro ao gerenciar notificações. Tente novamente mais tarde.';
    }
}

// Inicializar cliente WhatsApp
let client = null;

function initializeChatbot() {
    if (client && global.chatbotStatus.connected) {
        return { client, alreadyConnected: true };
    }

    client = new Client({
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    // Evento QR code
    client.on('qr', async qr => {
        try {
            const qrDataUrl = await QRCode.toDataURL(qr);
            wsClients.forEach(ws => {
                if (ws.isOpen) {
                    ws.send(JSON.stringify({ type: 'qr', data: qrDataUrl }));
                }
            });
            console.log('QR code gerado e enviado via WebSocket.');
        } catch (error) {
            console.error('Erro ao gerar QR code:', error.message);
            wsClients.forEach(ws => {
                if (ws.isOpen) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Erro ao gerar QR code.' }));
                }
            });
        }
    });

    client.on('auth_failure', msg => {
        console.error('Falha de autenticação do WhatsApp:', msg);
        global.chatbotStatus.connected = false;
        wsClients.forEach(ws => {
            if (ws.isOpen) ws.send(JSON.stringify({ type: 'error', message: 'Falha de autenticação. Refaça o login via QR.' }));
        });
    });

    // Conexão confirmada
    client.on('ready', async () => {
        try {
            console.log('Tudo certo! WhatsApp conectado.');
            global.chatbotStatus.connected = true;
            await updateStatus();
            await updateCache();
            await getConfig(); // Inicializa o cache de configurações
            startNotificationRoutine();
            // dispara processamento da fila pendente ao conectar
            messageQueue.process();
            wsClients.forEach(ws => {
                if (ws.isOpen) {
                    ws.send(JSON.stringify({ type: 'connected', message: 'Chatbot conectado!' }));
                }
            });
            try {
                const chats = await client.getChats();
                const groups = chats.filter(c => c.isGroup).map(c => ({ id: c.id._serialized, name: c.name }));
                console.log('Grupos encontrados:', groups);
            } catch (error) {
                console.error('Erro ao obter grupos:', error.message);
            }
        } catch (err) {
            console.error('Erro no evento ready:', err.message);
        }
    });

    // Desconexão
    client.on('disconnected', async reason => {
        console.log('Cliente desconectado:', reason);
        global.chatbotStatus.connected = false;
        await updateStatus();
        client = null;
        wsClients.forEach(ws => {
            if (ws.isOpen) {
                ws.send(JSON.stringify({ type: 'disconnected', message: 'Chatbot desconectado.' }));
            }
        });
    });

    // Manipulação de mensagens
    client.on('message', async msg => {
        if (!msg.from.endsWith('@c.us')) return;

        global.chatbotStatus.messagesReceivedToday++;
        if (global.chatbotStatus.messagesReceivedToday % 100 === 0) {
            await updateStatus();
        }

        const autoRepliesEnabled = await getConfig('auto_replies_enabled');
        if (autoRepliesEnabled !== '1') {
            console.log(`Respostas automáticas desativadas para ${msg.from}`);
            return;
        }

        const chat = await msg.getChat();
        const contact = await msg.getContact();
        const name = (contact && contact.pushname) ? contact.pushname : 'Aluno';
        const userId = msg.from;

        await addOrUpdateUser(userId);

        if (!userStates[userId]) {
            userStates[userId] = { state: 'IDLE' };
        }

        const userState = userStates[userId];

        const body = (msg.body || '').trim();

        // Comandos de assinatura
        if (body.toLowerCase() === 'parar') {
            const response = await manageSubscription(userId, false);
            await messageQueue.add({ chatId: msg.from, message: response });
            userState.state = 'IDLE';
            return;
        }
        if (body.toLowerCase() === 'ativar') {
            const response = await manageSubscription(userId, true);
            await messageQueue.add({ chatId: msg.from, message: response });
            userState.state = 'IDLE';
            return;
        }

        // Comando de menu
        if (body.toLowerCase() === 'menu') {
            userState.state = 'IDLE';
            await showMainMenu(msg, name);
            return;
        }

        // Verificar opções de menu
        const menuEnabled = await getConfig('menu_enabled');
        if (menuEnabled !== '1' && ['1', '2', '3', '4'].includes(body)) {
            await messageQueue.add({ chatId: msg.from, message: 'Consultas por menu estão desativadas. Digite "menu" para voltar.' });
            return;
        }

        switch (userState.state) {
            case 'IDLE':
                if (body.match(/^(oi|ol[áa]|ola|ola|ola|hello)\b/i)) {
                    await showMainMenu(msg, name);
                    return;
                }

                const option = body;
                if (['1', '2', '3', '4'].includes(option)) {
                    await chat.sendStateTyping();
                    await new Promise(res => setTimeout(res, 2000));
                    switch (option) {
                        case '1':
                            try {
                                await updateCache();
                                if (global.modulos.length === 0) {
                                    await messageQueue.add({ chatId: msg.from, message: 'Nenhum módulo encontrado. Tente novamente mais tarde ou digite "menu" para voltar.' });
                                    userState.state = 'IDLE';
                                    return;
                                }
                                let response = 'Escolha um módulo (digite o número):\n\n';
                                global.modulos.forEach(mod => {
                                    response += `${mod.id} - ${mod.nome}\n`;
                                });
                                await messageQueue.add({ chatId: msg.from, message: response });
                                userState.state = 'AWAITING_MODULO_ID';
                            } catch (error) {
                                console.error('Erro ao listar módulos:', error.message);
                                await messageQueue.add({ chatId: msg.from, message: 'Erro ao listar módulos. Tente novamente mais tarde ou digite "menu" para voltar.' });
                                userState.state = 'IDLE';
                            }
                            break;

                        case '2':
                            await messageQueue.add({ chatId: msg.from, message: 'Por favor, informe a data no formato dd-mm-aaaa (ex.: 25-02-2025).' });
                            userState.state = 'AWAITING_DATE';
                            break;

                        case '3':
                            await messageQueue.add({ chatId: msg.from, message: 'Por favor, informe o ID da avaliação (ex.: 123).' });
                            userState.state = 'AWAITING_AVALIACAO_ID';
                            break;

                        case '4':
                            try {
                                await updateCache();
                                if (global.professores.length === 0) {
                                    await messageQueue.add({ chatId: msg.from, message: 'Nenhum professor encontrado. Tente novamente mais tarde ou digite "menu" para voltar.' });
                                    userState.state = 'IDLE';
                                    return;
                                }
                                let response = 'Escolha um professor (digite o número):\n\n';
                                global.professores.forEach(prof => {
                                    response += `${prof.id} - ${prof.nome}\n`;
                                });
                                await messageQueue.add({ chatId: msg.from, message: response });
                                userState.state = 'AWAITING_PROFESSOR_ID';
                            } catch (error) {
                                console.error('Erro ao listar professores:', error.message);
                                await messageQueue.add({ chatId: msg.from, message: 'Erro ao listar professores. Tente novamente mais tarde ou digite "menu" para voltar.' });
                                userState.state = 'IDLE';
                            }
                            break;
                    }
                } else {
                    await messageQueue.add({ chatId: msg.from, message: 'Opção inválida. Digite 1, 2, 3 ou 4, ou "menu" para ver as opções.' });
                }
                break;

            case 'AWAITING_MODULO_ID':
                {
                    const moduloId = parseInt(body);
                    if (isNaN(moduloId)) {
                        await messageQueue.add({ chatId: msg.from, message: 'Por favor, digite um número válido para o módulo ou "menu" para voltar.' });
                        return;
                    }
                    try {
                        const result = await pool.query(`
                            SELECT a.data, a.horario_ini, a.horario_fim, STRING_AGG(lc.nome, ', ') as laboratorios, d.descricao as disciplina_nome
                            FROM avaliacao a
                            LEFT JOIN avaliacao_laboratorio al ON a.id = al.avaliacao_id
                            LEFT JOIN laboratorio_conjuntos lc ON al.conjunto_id = lc.id
                            LEFT JOIN disciplina d ON a.disciplina_id = d.id
                            WHERE a.modulo_id = $1 AND a.visivel = TRUE AND a.delete_logico = FALSE
                            GROUP BY a.id, a.data, a.horario_ini, a.horario_fim, d.descricao
                            ORDER BY a.data ASC, a.horario_ini ASC
                        `, [moduloId]);
                        await messageQueue.add({ chatId: msg.from, message: formatAvaliacoes(result.rows) });
                        userState.state = 'IDLE';
                    } catch (error) {
                        console.error('Erro ao consultar avaliações por módulo:', error.message);
                        await messageQueue.add({ chatId: msg.from, message: 'Erro ao consultar avaliações. Tente novamente mais tarde ou digite "menu" para voltar.' });
                        userState.state = 'IDLE';
                    }
                }
                break;

            case 'AWAITING_DATE':
                {
                    const dateStr = body;
                    if (!isValidDate(dateStr)) {
                        await messageQueue.add({ chatId: msg.from, message: 'Formato de data inválido. Use dd-mm-aaaa (ex.: 25-02-2025) ou digite "menu" para voltar.' });
                        return;
                    }
                    const [day, month, year] = dateStr.split('-');
                    const dbDate = `${year}-${month}-${day}`;
                    try {
                        const result = await pool.query(`
                            SELECT a.data, a.horario_ini, a.horario_fim, STRING_AGG(lc.nome, ', ') as laboratorios, d.descricao as disciplina_nome
                            FROM avaliacao a
                            LEFT JOIN avaliacao_laboratorio al ON a.id = al.avaliacao_id
                            LEFT JOIN laboratorio_conjuntos lc ON al.conjunto_id = lc.id
                            LEFT JOIN disciplina d ON a.disciplina_id = d.id
                            WHERE a.data = $1 AND a.visivel = TRUE AND a.delete_logico = FALSE
                            GROUP BY a.id, a.data, a.horario_ini, a.horario_fim, d.descricao
                            ORDER BY a.data ASC, a.horario_ini ASC
                        `, [dbDate]);
                        await messageQueue.add({ chatId: msg.from, message: formatAvaliacoes(result.rows) });
                        userState.state = 'IDLE';
                    } catch (error) {
                        console.error('Erro ao consultar avaliações por data:', error.message);
                        await messageQueue.add({ chatId: msg.from, message: 'Erro ao consultar avaliações. Tente novamente mais tarde ou digite "menu" para voltar.' });
                        userState.state = 'IDLE';
                    }
                }
                break;

            case 'AWAITING_AVALIACAO_ID':
                {
                    const avaliacaoId = parseInt(body);
                    if (isNaN(avaliacaoId) || avaliacaoId <= 0) {
                        await messageQueue.add({ chatId: msg.from, message: 'Por favor, digite um número válido para o ID da avaliação ou "menu" para voltar.' });
                        return;
                    }
                    try {
                        const result = await pool.query(`
                            SELECT a.data, a.horario_ini, a.horario_fim, STRING_AGG(lc.nome, ', ') as laboratorios, d.descricao as disciplina_nome
                            FROM avaliacao a
                            LEFT JOIN avaliacao_laboratorio al ON a.id = al.avaliacao_id
                            LEFT JOIN laboratorio_conjuntos lc ON al.conjunto_id = lc.id
                            LEFT JOIN disciplina d ON a.disciplina_id = d.id
                            WHERE a.id = $1 AND a.visivel = TRUE AND a.delete_logico = FALSE
                            GROUP BY a.id, a.data, a.horario_ini, a.horario_fim, d.descricao
                        `, [avaliacaoId]);
                        await messageQueue.add({ chatId: msg.from, message: formatAvaliacoes(result.rows) });
                        userState.state = 'IDLE';
                    } catch (error) {
                        console.error('Erro ao consultar avaliação por ID:', error.message);
                        await messageQueue.add({ chatId: msg.from, message: 'Erro ao consultar avaliação. Tente novamente mais tarde ou digite "menu" para voltar.' });
                        userState.state = 'IDLE';
                    }
                }
                break;

            case 'AWAITING_PROFESSOR_ID':
                {
                    const professorId = parseInt(body);
                    if (isNaN(professorId)) {
                        await messageQueue.add({ chatId: msg.from, message: 'Por favor, digite um número válido para o professor ou "menu" para voltar.' });
                        return;
                    }
                    try {
                        const result = await pool.query(`
                            SELECT a.data, a.horario_ini, a.horario_fim, STRING_AGG(lc.nome, ', ') as laboratorios, d.descricao as disciplina_nome
                            FROM avaliacao a
                            LEFT JOIN avaliacao_laboratorio al ON a.id = al.avaliacao_id
                            LEFT JOIN laboratorio_conjuntos lc ON al.conjunto_id = lc.id
                            LEFT JOIN disciplina d ON a.disciplina_id = d.id
                            WHERE a.professor_id = $1 AND a.visivel = TRUE AND a.delete_logico = FALSE
                            GROUP BY a.id, a.data, a.horario_ini, a.horario_fim, d.descricao
                            ORDER BY a.data ASC, a.horario_ini ASC
                        `, [professorId]);
                        await messageQueue.add({ chatId: msg.from, message: formatAvaliacoes(result.rows) });
                        userState.state = 'IDLE';
                    } catch (error) {
                        console.error('Erro ao consultar avaliações por professor:', error.message);
                        await messageQueue.add({ chatId: msg.from, message: 'Erro ao consultar avaliações. Tente novamente mais tarde ou digite "menu" para voltar.' });
                        userState.state = 'IDLE';
                    }
                }
                break;
        }
    });

    return { client, alreadyConnected: false };
}

// Funções de notificação
async function sendNotifications() {
    const notificationsEnabled = await getConfig('notifications_enabled');
    if (notificationsEnabled !== '1') {
        console.log('Notificações desativadas via painel.');
        return;
    }
    try {
        const result = await pool.query(`
            SELECT n.*, a.disciplina_id, a.data, d.descricao AS disciplina_nome, a.modulo_id
            FROM notificacoes_avaliacao n
            LEFT JOIN avaliacao a ON n.avaliacao_id = a.id
            LEFT JOIN disciplina d ON a.disciplina_id = d.id
            WHERE n.enviada = false AND n.created_at >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
                AND a.visivel = TRUE AND a.delete_logico = FALSE
        `);
        const notifications = result.rows;

        if (!notifications || notifications.length === 0) {
            return;
        }

        for (const notification of notifications) {
            let message;
            switch (notification.tipo_alteracao) {
                case 'CREATE':
                    message = `Nova avaliação adicionada: ${notification.disciplina_nome || 'Disciplina ' + notification.disciplina_id} em ${formatDate(notification.data)}. Consulte detalhes digitando 'menu'.`;
                    break;
                case 'UPDATE':
                    message = `Avaliação ${notification.avaliacao_id} atualizada: ${notification.disciplina_nome || 'Disciplina ' + notification.disciplina_id} em ${formatDate(notification.data)}. Consulte digitando 'menu'.`;
                    break;
                case 'DELETE':
                    message = `Avaliação ${notification.avaliacao_id} cancelada. Consulte o menu para mais informações.`;
                    break;
                default:
                    message = `Alteração na avaliação ${notification.avaliacao_id}. Consulte o menu para mais informações.`;
                    break;
            }

            const targetGroups = [TECHNICIANS_GROUP];
            const groupId = groupMapping[notification.modulo_id];
            if (groupId) {
                targetGroups.push(groupId);
            } else {
                console.warn(`Módulo ID ${notification.modulo_id} não mapeado. Enviando apenas para Técnicos.`);
            }

            for (const group of targetGroups) {
                await messageQueue.add({ chatId: group, message }, { delay: 1000 });
            }

            await pool.query(
                `UPDATE notificacoes_avaliacao SET enviada = true WHERE id = $1`,
                [notification.id]
            );
        }

        console.log(`Processadas ${notifications.length} notificações.`);
    } catch (error) {
        console.error('Erro ao enviar notificações:', error.message);
    }
}

function startNotificationRoutine() {
    // limpa timers existentes antes de iniciar novos
    if (notificationInterval) clearInterval(notificationInterval);
    if (cacheInterval) clearInterval(cacheInterval);
    if (statusInterval) clearInterval(statusInterval);

    notificationInterval = setInterval(sendNotifications, 60000); // 1 minuto (ajustar conforme necessidade)
    cacheInterval = setInterval(updateCache, 3600000); // Atualiza cache a cada hora
    statusInterval = setInterval(updateStatus, 60000); // Persiste status a cada minuto
    // envio imediato
    sendNotifications();
}

async function showMainMenu(msg, name) {
    const menuEnabled = await getConfig('menu_enabled');
    if (menuEnabled !== '1') {
        console.log(`Menu desativado para ${msg.from}`);
        await messageQueue.add({ chatId: msg.from, message: 'O menu está desativado. Tente novamente mais tarde ou contate o suporte.' });
        return;
    }
    await messageQueue.add({
        chatId: msg.from,
        message: `Olá, ${name.split(' ')[0]}! Sou o assistente virtual do FOA Med. Como posso ajudar hoje? Escolha uma opção:\n\n1 - Consultar Avaliações por Módulo ou Período\n2 - Consultar Avaliações por Data\n3 - Consultar Avaliação por ID\n4 - Consultar Avaliações por Professor\n\nDigite "menu" a qualquer momento para voltar aqui.\nDigite "parar" para não receber notificações ou "ativar" para recebê-las.`
    });
}

async function sendBroadcastMessage(message, groupIds = []) {
    if (!global.chatbotStatus.connected) {
        throw new Error('Chatbot não está conectado ao WhatsApp.');
    }

    const autoRepliesEnabled = await getConfig('auto_replies_enabled');
    if (autoRepliesEnabled !== '1') {
        console.log('Broadcast bloqueado: respostas automáticas desativadas.');
        throw new Error('Respostas automáticas desativadas. Ative no painel para enviar mensagens.');
    }

    const groupChatIds = {
        technicians: TECHNICIANS_GROUP,
        module6: groupMapping[1],
        module7: groupMapping[2],
        // ... (outros mapeamentos se necessário)
    };

    // groupIds pode ser array de chaves (ex: ['technicians','module6']) ou array de chatIds diretos
    const normalized = groupIds.map(g => (groupChatIds[g] ? groupChatIds[g] : g)).filter(Boolean);
    if (normalized.length === 0) {
        throw new Error('Nenhum grupo válido selecionado.');
    }

    for (const groupId of normalized) {
        await messageQueue.add({
            chatId: groupId,
            message
        }, { delay: 1000 });
    }
}

async function sendMessage(chatId, message) {
    if (!global.chatbotStatus.connected) {
        throw new Error('Chatbot não está conectado ao WhatsApp.');
    }
    const autoRepliesEnabled = await getConfig('auto_replies_enabled');
    if (autoRepliesEnabled !== '1') {
        console.log(`Mensagem bloqueada para ${chatId}: respostas automáticas desativadas.`);
        throw new Error('Respostas automáticas desativadas.');
    }
    await messageQueue.add({ chatId, message }, { delay: 1000 });
    console.log(`Mensagem enfileirada para ${chatId}: ${message}`);
}

// Registrar cliente WebSocket
let wsClients = new Set();
function registerWebSocket(ws) {
    ws.isOpen = true;
    wsClients.add(ws);
    ws.on('close', () => {
        ws.isOpen = false;
        wsClients.delete(ws);
    });
    ws.send(JSON.stringify({
        type: 'status',
        connected: global.chatbotStatus.connected,
        message: global.chatbotStatus.connected ? 'Chatbot já conectado.' : 'Chatbot desconectado. Inicie para gerar QR code.'
    }));
}

// Iniciar chatbot
async function startChatbot() {
    try {
        const { client: initializedClient, alreadyConnected } = initializeChatbot();
        if (!alreadyConnected) {
            await initializedClient.initialize();
        }
        return { alreadyConnected };
    } catch (error) {
        console.error('Erro ao iniciar chatbot:', error.message);
        throw error;
    }
}

// Recarregar configurações
async function reloadConfig() {
    console.log('Recarregando configurações do chatbot...');
    configCache.lastUpdated = 0; // Força atualização do cache
    await getConfig(); // Atualiza imediatamente
    await sendNotifications(); // Força verificação imediata de notificações
}

// Parar chatbot
async function stopChatbot() {
    console.log('Parando o chatbot...');
    try {
        if (client && global.chatbotStatus.connected) {
            await client.destroy();
            client = null;
            global.chatbotStatus.connected = false;
            await updateStatus();

            // limpa timers
            if (notificationInterval) clearInterval(notificationInterval);
            if (cacheInterval) clearInterval(cacheInterval);
            if (statusInterval) clearInterval(statusInterval);
            notificationInterval = cacheInterval = statusInterval = null;

            wsClients.forEach(ws => {
                if (ws.isOpen) {
                    ws.send(JSON.stringify({ type: 'disconnected', message: 'Chatbot parado com sucesso.' }));
                }
            });
            console.log('Chatbot parado com sucesso.');
            return { message: 'Chatbot parado com sucesso.' };
        } else {
            console.log('Chatbot já está desconectado.');
            return { message: 'Chatbot já está desconectado.' };
        }
    } catch (error) {
        console.error('Erro ao parar chatbot:', error.message);
        throw new Error(`Erro ao parar chatbot: ${error.message}`);
    }
}

module.exports = {
    startChatbot,
    notifyChange: sendNotifications,
    sendBroadcastMessage,
    sendMessage,
    registerWebSocket,
    reloadConfig,
    stopChatbot
};
