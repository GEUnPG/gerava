//refatorada 2025-11-04
//server.js
const express = require('express');
const bodyParser = require('body-parser');
const path = require('node:path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const pool = require('./src/database/db');
const { startChatbot, registerWebSocket } = require('./chatbot/chatbot');
const rateLimit = require('express-rate-limit');
const { WebSocketServer } = require('ws');
const http = require('node:http');

// Routes imports
const professorRoutes = require('./src/routes/professorRoutes');
const usuariosRoutes = require('./src/routes/usuariosRoutes');
const situacaoAvalRoutes = require('./src/routes/situacaoAvalRoutes');
const tipoAvalRoutes = require('./src/routes/tipoAvalRoutes');
const moduloRoutes = require('./src/routes/moduloRoutes');
const disciplinaRoutes = require('./src/routes/disciplinaRoutes');
const laboratorioRoutes = require('./src/routes/laboratorioRoutes');
const consultaRoutes = require('./src/routes/consultaRoutes');
const arquivoRoutes = require('./src/routes/arquivoRoutes');
const chatbotRoutes = require('./src/routes/chatbotRoutes');
const avaliacaoRoutes = require('./src/routes/avaliacaoRoutes');
const loginSecretoRoutes = require('./src/routes/loginRoutes');

require('dotenv').config();

console.log('=== Iniciando servidor ===');

const app = express();

// ===== CONSTANTES =====

const MAX_ATTEMPTS = 3;
const BLOCK_DURATION = 15 * 60 * 1000;
const MAX_BLOCKS = 3;
const PORT = process.env.PORT || 3000;

// ===== HELPERS =====

function getClientIp(req) {
  return process.env.NODE_ENV === 'production' ? req.headers['x-forwarded-for'] || req.ip : req.ip;
}

async function sendAdminNotification(ip) {
  try {
    const { sendMessage } = require('./chatbot/chatbot');
    await sendMessage(
      '5524999999850@c.us',
      `🚨 IP ${ip} foi bloqueado permanentemente devido a múltiplas tentativas inválidas. Verifique em http://localhost:3000/admin.html.`
    );
    console.log(`Notificação enviada ao administrador para IP ${ip}`);
  } catch (error) {
    console.error('Erro ao enviar notificação via chatbot:', error.message);
  }
}

function handleError(res, error, message = 'Erro interno do servidor.', statusCode = 500) {
  console.error(`Erro: ${message}`, error.message);
  res.status(statusCode).json({ error: message });
}

function serveProtectedPage(pageName) {
  return (req, res) => {
    console.log(`Acessando /${pageName} (autenticado)`);
    res.sendFile(path.join(__dirname, 'public', pageName));
  };
}

// ===== MIDDLEWARES =====

function isAuthenticated(req, res, next) {
  console.log('Sessão atual:', {
    sessionID: req.sessionID,
    userId: req.session.userId,
    url: req.originalUrl,
  });

  if (req.session.userId) {
    console.log(`✅ Autenticado: userId=${req.session.userId}, rota=${req.originalUrl}`);
    return next();
  }

  console.log(`❌ Não autenticado: redirecionando para /login.html, rota=${req.originalUrl}`);
  res.status(401).json({ error: 'Não autenticado' });
}

async function bruteForceProtection(req, res, next) {
  const ip = getClientIp(req);
  console.log(`Verificando brute force para IP: ${ip}`);

  try {
    const result = await pool.query(
      'SELECT attempt_count, block_count, block_until, is_permanently_blocked FROM login_attempts WHERE ip = $1',
      [ip]
    );

    if (result.rows.length > 0) {
      const { attempt_count, block_count, block_until, is_permanently_blocked } = result.rows[0];

      if (is_permanently_blocked) {
        console.log(`IP ${ip} bloqueado permanentemente`);
        return res.status(403).json({
          error: 'Este IP foi bloqueado permanentemente devido a múltiplas tentativas inválidas.',
          blocked: true,
          permanent: true,
        });
      }

      if (attempt_count >= MAX_ATTEMPTS && block_until && new Date(block_until) > new Date()) {
        const remainingSeconds = Math.ceil((new Date(block_until) - new Date()) / 1000);
        console.log(`IP ${ip} bloqueado temporariamente. Restam ${remainingSeconds} segundos`);
        return res.status(429).json({
          error: `Muitas tentativas. Tente novamente em ${Math.ceil(remainingSeconds / 60)} minutos.`,
          blocked: true,
          permanent: false,
          remainingSeconds,
        });
      }

      if (attempt_count >= MAX_ATTEMPTS && block_until && new Date(block_until) <= new Date()) {
        console.log(`Bloqueio temporário expirado para IP ${ip}`);
        await pool.query('UPDATE login_attempts SET attempt_count = 0, block_until = NULL WHERE ip = $1', [ip]);
      }
    }

    next();
  } catch (error) {
    handleError(res, error, 'Erro interno do servidor.');
  }
}

// ===== LOGIN LOGIC =====

async function handleLoginAttempt(ip, username, password) {
  const userResult = await pool.query('SELECT id, nome, password AS password FROM usuarios WHERE username = $1', [
    username,
  ]);

  let usuario_id = null;
  if (userResult.rows.length > 0) {
    usuario_id = userResult.rows[0].id;
  }

  let attemptsResult = await pool.query('SELECT attempt_count, block_count FROM login_attempts WHERE ip = $1', [ip]);

  if (attemptsResult.rows.length === 0) {
    await pool.query(
      'INSERT INTO login_attempts (ip, usuario_id, attempt_count, block_count) VALUES ($1, $2, 0, 0)',
      [ip, usuario_id]
    );
    attemptsResult = await pool.query('SELECT attempt_count, block_count FROM login_attempts WHERE ip = $1', [ip]);
  }

  const currentAttemptCount = attemptsResult.rows[0].attempt_count;
  const currentBlockCount = attemptsResult.rows[0].block_count;

  // Validar credenciais
  if (userResult.rows.length === 0 || !(await bcrypt.compare(password, userResult.rows[0].password))) {
    return await handleFailedLogin(ip, usuario_id, currentAttemptCount, currentBlockCount);
  }

  // Login bem-sucedido
  await pool.query('UPDATE login_attempts SET attempt_count = 0, block_count = 0, block_until = NULL WHERE ip = $1', [
    ip,
  ]);

  return {
    success: true,
    user: userResult.rows[0],
  };
}

async function handleFailedLogin(ip, usuario_id, currentAttemptCount, currentBlockCount) {
  const newAttemptCount = currentAttemptCount + 1;
  let newBlockCount = currentBlockCount;
  let blockUntil = null;
  let is_permanently_blocked = false;

  if (newAttemptCount >= MAX_ATTEMPTS) {
    newBlockCount += 1;
    blockUntil = new Date(Date.now() + BLOCK_DURATION);

    if (newBlockCount >= MAX_BLOCKS) {
      is_permanently_blocked = true;
    }
  }

  await pool.query(
    `UPDATE login_attempts 
     SET attempt_count = $1, block_count = $2, block_until = $3, is_permanently_blocked = $4, usuario_id = $5
     WHERE ip = $6`,
    [newAttemptCount, newBlockCount, blockUntil, is_permanently_blocked, usuario_id, ip]
  );

  if (is_permanently_blocked) {
    console.log(`IP ${ip} bloqueado permanentemente após ${newBlockCount} bloqueios`);
    await sendAdminNotification(ip);
    return {
      success: false,
      statusCode: 403,
      error: 'Este IP foi bloqueado permanentemente devido a múltiplas tentativas inválidas.',
      blocked: true,
      permanent: true,
    };
  }

  if (newAttemptCount >= MAX_ATTEMPTS) {
    console.log(`IP ${ip} bloqueado temporariamente após ${newAttemptCount} tentativas`);
    return {
      success: false,
      statusCode: 429,
      error: `Máximo de tentativas atingido. Tente novamente em 15 minutos.`,
      blocked: true,
      permanent: false,
      remainingSeconds: 15 * 60,
    };
  }

  console.log(`Login falhou: tentativa ${newAttemptCount} de ${MAX_ATTEMPTS} para IP ${ip}`);
  return {
    success: false,
    statusCode: 401,
    error: `Usuário ou senha incorretos. Tentativa ${newAttemptCount} de ${MAX_ATTEMPTS}.`,
  };
}

// ===== SERVER SETUP =====

try {
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  app.set('trust proxy', 1);

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Muitas requisições. Tente novamente após 15 minutos.' },
  });

  app.use(bodyParser.json());
  app.use(express.static(path.join(__dirname, 'public')));

  app.use(
    session({
      store: new pgSession({
        pool: pool,
        tableName: 'session',
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || '948f28af4a9ccf9ab91356abcfb76f41775f010ba74ef0a3c4aab9c6895a0fc2',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
      },
    })
  );

  app.use('/api/login', loginLimiter);
  console.log('✅ Middleware configurado');

  // ===== ROUTES =====

  // Login
  app.post('/api/login', bruteForceProtection, async (req, res) => {
    const { username, password } = req.body;
    const ip = getClientIp(req);
    console.log(`Tentativa de login: username=${username}, IP=${ip}`);

    try {
      const result = await handleLoginAttempt(ip, username, password);

      if (result.success) {
        req.session.userId = result.user.id;
        req.session.userName = result.user.nome;
        console.log(`Login bem-sucedido: userId=${result.user.id}, nome=${result.user.nome}, IP=${ip}`);
        return res.status(200).json({ message: 'Login bem-sucedido.', nome: result.user.nome });
      }

      return res.status(result.statusCode).json({
        error: result.error,
        blocked: result.blocked,
        permanent: result.permanent,
        remainingSeconds: result.remainingSeconds,
      });
    } catch (error) {
      handleError(res, error, 'Erro interno do servidor.');
    }
  });

  // Login attempts
  app.get('/api/login-attempts', isAuthenticated, async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT la.id, la.ip, la.usuario_id, u.username AS username, la.attempt_count, la.block_count, la.block_until, la.is_permanently_blocked, la.created_at, la.updated_at ' +
          'FROM login_attempts la LEFT JOIN usuarios u ON la.usuario_id = u.id'
      );
      console.log(`Listando ${result.rows.length} tentativas de login para userId=${req.session.userId}`);
      res.status(200).json(result.rows);
    } catch (error) {
      handleError(res, error, 'Erro interno do servidor.');
    }
  });

  // Unblock IP
  app.post('/api/unblock-ip', isAuthenticated, async (req, res) => {
    const { ip } = req.body;
    if (!ip) {
      console.log('Tentativa de desbloqueio sem IP fornecido');
      return res.status(400).json({ error: 'IP é obrigatório.' });
    }

    try {
      const result = await pool.query(
        'UPDATE login_attempts SET is_permanently_blocked = false, attempt_count = 0, block_count = 0, block_until = NULL WHERE ip = $1',
        [ip]
      );

      if (result.rowCount > 0) {
        console.log(`IP ${ip} desbloqueado por userId=${req.session.userId}`);
        res.status(200).json({ message: `IP ${ip} desbloqueado com sucesso.` });
      } else {
        console.log(`IP ${ip} não encontrado para desbloqueio`);
        res.status(404).json({ error: `IP ${ip} não encontrado.` });
      }
    } catch (error) {
      handleError(res, error, 'Erro interno do servidor.');
    }
  });

  // Start chatbot
  app.post('/api/start-chatbot', isAuthenticated, async (req, res) => {
    try {
      const { alreadyConnected } = await startChatbot();
      if (alreadyConnected) {
        res.json({ message: 'Chatbot já conectado.', connected: true });
      } else {
        res.json({ message: 'Iniciando chatbot. Aguarde o QR code.', connected: false });
      }
    } catch (error) {
      handleError(res, error, 'Erro ao iniciar chatbot.');
    }
  });

  // API Routes
  app.use('/api/consulta', consultaRoutes);
  app.use('/api/avaliacoes', avaliacaoRoutes);
  app.use('/api/chatbot', chatbotRoutes);
  app.use('/api/professores', professorRoutes);
  app.use('/api/usuarios', usuariosRoutes);
  app.use('/api/situacao_aval', situacaoAvalRoutes);
  app.use('/api/tipo_aval', tipoAvalRoutes);
  app.use('/api/modulos', moduloRoutes);
  app.use('/api/disciplinas', disciplinaRoutes);
  app.use('/api/laboratorios', laboratorioRoutes);
  app.use('/api/arquivo', arquivoRoutes);
  app.use('/api/login-secreto', loginSecretoRoutes);
  console.log('✅ Rotas registradas');

  // Protected HTML pages
  const protectedPages = [
    'index.html',
    'gerenciar.html',
    'dashboard.html',
    'admin.html',
    'professor.html',
    'usuarios.html',
    'situacao_aval.html',
    'tipo_aval.html',
    'modulo.html',
    'disciplina.html',
    'laboratorio.html',
    'arquivo.html',
  ];

  for (const page of protectedPages) {
    app.get(`/${page}`, isAuthenticated, serveProtectedPage(page));
  }

  // Public pages
  app.get('/consulta.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'consulta.html'));
  });

  // User info
  app.get('/api/user', isAuthenticated, async (req, res) => {
    try {
      const result = await pool.query('SELECT nome FROM usuarios WHERE id = $1', [req.session.userId]);
      if (result.rows.length === 0) {
        console.log('Usuário não encontrado na sessão');
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }
      console.log(`Dados do usuário retornados: nome=${result.rows[0].nome}`);
      res.status(200).json({ nome: result.rows[0].nome });
    } catch (error) {
      handleError(res, error, 'Erro interno do servidor.');
    }
  });

  // Check auth
  app.get('/api/check-auth', (req, res) => {
    console.log('Sessão atual em /api/check-auth:', {
      sessionID: req.sessionID,
      userId: req.session.userId,
    });

    if (req.session.userId) {
      console.log('Verificação de autenticação: usuário autenticado');
      res.status(200).json({ authenticated: true });
    } else {
      console.log('Verificação de autenticação: usuário não autenticado');
      res.status(401).json({ authenticated: false });
    }
  });

  // Logout
  app.post('/api/logout', (req, res) => {
    console.log('Realizando logout');
    req.session.destroy(err => {
      if (err) {
        console.error('Erro ao fazer logout:', err.message);
        return res.status(500).json({ error: 'Erro ao fazer logout.' });
      }
      console.log('Logout bem-sucedido');
      res.status(200).json({ message: 'Logout bem-sucedido.' });
    });
  });

  // Test route
  app.get('/test', (req, res) => {
    console.log('Acessando rota /test');
    res.json({ message: 'Servidor funcionando corretamente' });
  });

  // Debug routes
  app.get('/debug/routes', (req, res) => {
    const routes = [];
    app._router.stack.forEach(middleware => {
      if (middleware.route) {
        routes.push({
          path: middleware.route.path,
          methods: Object.keys(middleware.route.methods),
        });
      } else if (middleware.name === 'router' && middleware.handle.stack) {
        const prefix = middleware.regexp.source.includes('avaliacoes')
          ? '/api/avaliacoes'
          : middleware.regexp.source.includes('chatbot')
          ? '/api/chatbot'
          : '';
        for (const handler of middleware.handle.stack) {
          if (handler.route) {
            routes.push({
              path: `${prefix}${handler.route.path}`,
              methods: Object.keys(handler.route.methods),
            });
          }
        }
      }
    });
    console.log('Listando rotas registradas:', routes);
    res.json(routes);
  });

  // WebSocket
  wss.on('connection', ws => {
    console.log('Novo cliente WebSocket conectado.');
    registerWebSocket(ws);
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error('Erro global:', err.message, err.stack);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  });

  server.listen(PORT, () => {
    console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
  });
} catch (error) {
  console.error('❌ Erro ao iniciar o servidor:', error.message, error.stack);
}
