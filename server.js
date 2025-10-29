const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const pool = require('./src/database/db');
const { startChatbot, registerWebSocket } = require('./chatbot');
const rateLimit = require('express-rate-limit');
const { WebSocketServer } = require('ws');
const http = require('http');
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
const loginSecretoRoutes = require('./src/routes/loginRoutes'); //remover depois, feito de zuera

// utilizar npm run test:e2e (para teste liso) ou npm run test:e2e:raw (para teste detalhado)
//const app = require('./app'); // Usa o app do Express para realizar o teste, descomentar:REMOVER SE DER PROBLEMAS
require('dotenv').config();

console.log('=== Iniciando servidor ===');

const app = express();

try {
  
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = process.env.PORT || 3000; //procura a porta no .env e se não achar utiliza a 3000

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
        secure: process.env.NODE_ENV === 'production' ? true : false,
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
      },
    })
  );

  
  app.use('/api/login', loginLimiter);
  console.log('✅ Middleware configurado');

  function isAuthenticated(req, res, next) {
    console.log('Sessão atual:', {
      sessionID: req.sessionID,
      userId: req.session.userId,
      url: req.originalUrl,
      cookies: req.cookies,
    });
    if (req.session.userId) {
      console.log(`✅ Autenticado: userId=${req.session.userId}, rota=${req.originalUrl}`);
      return next();
    }
    console.log(`❌ Não autenticado: redirecionando para /login.html, rota=${req.originalUrl}`);
    res.status(401).json({ error: 'Não autenticado' });
  }

  const MAX_ATTEMPTS = 3;
  const BLOCK_DURATION = 15 * 60 * 1000;
  const MAX_BLOCKS = 3;

  async function bruteForceProtection(req, res, next) {
    const ip = process.env.NODE_ENV === 'production' ? req.headers['x-forwarded-for'] || req.ip : req.ip;
    console.log(`Verificando brute force para IP: ${ip}`);

    try {
      const result = await pool.query(
        'SELECT attempt_count, block_count, block_until, is_permanently_blocked FROM login_attempts WHERE ip = $1',
        [ip]
      );
      const attempts = result.rows;

      if (attempts.length > 0) {
        const { attempt_count, block_count, block_until, is_permanently_blocked } = attempts[0];

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
      console.error('Erro no middleware de brute force:', error.message);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }

  app.post('/api/login', bruteForceProtection, async (req, res) => {
    const { username, password } = req.body;
    const ip = process.env.NODE_ENV === 'production' ? req.headers['x-forwarded-for'] || req.ip : req.ip;
    console.log(`Tentativa de login: username=${username}, IP=${ip}`);

    try {
      const result = await pool.query('SELECT id, nome, password AS password FROM usuarios WHERE username = $1', [
        username,
      ]);
      const users = result.rows;

      let usuario_id = null;
      if (users.length > 0) {
        usuario_id = users[0].id;
      }

      let attemptsResult = await pool.query('SELECT attempt_count, block_count FROM login_attempts WHERE ip = $1', [ip]);
      let attempts = attemptsResult.rows;

      if (attempts.length === 0) {
        await pool.query(
          'INSERT INTO login_attempts (ip, usuario_id, attempt_count, block_count) VALUES ($1, $2, 0, 0)',
          [ip, usuario_id]
        );
        attempts = [{ attempt_count: 0, block_count: 0 }];
      }

      const currentAttemptCount = attempts[0].attempt_count;
      const currentBlockCount = attempts[0].block_count;

      if (users.length === 0 || !(await bcrypt.compare(password, users[0].password))) {
        const newAttemptCount = currentAttemptCount + 1;
        let newBlockCount = currentBlockCount;
        let blockUntil = null;
        let is_permanently_blocked = 0;

        if (newAttemptCount >= MAX_ATTEMPTS) {
          newBlockCount += 1;
          blockUntil = new Date(Date.now() + BLOCK_DURATION);

          if (newBlockCount >= MAX_BLOCKS) {
            is_permanently_blocked = 1;
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
          try {
            const { sendMessage } = require('./chatbot');
            await sendMessage(
              '5524999042169@c.us',
              `🚨 IP ${ip} foi bloqueado permanentemente devido a múltiplas tentativas inválidas. Verifique em http://localhost:3000/admin.html.`
            );
            console.log(`Notificação enviada ao administrador para IP ${ip}`);
          } catch (error) {
            console.error('Erro ao enviar notificação via chatbot:', error.message);
          }
          return res.status(403).json({
            error: 'Este IP foi bloqueado permanentemente devido a múltiplas tentativas inválidas.',
            blocked: true,
            permanent: true,
          });
        }

        if (newAttemptCount >= MAX_ATTEMPTS) {
          console.log(`IP ${ip} bloqueado temporariamente após ${newAttemptCount} tentativas`);
          return res.status(429).json({
            error: `Máximo de tentativas atingido. Tente novamente em 15 minutos.`,
            blocked: true,
            permanent: false,
            remainingSeconds: 15 * 60,
          });
        }

        console.log(`Login falhou: tentativa ${newAttemptCount} de ${MAX_ATTEMPTS} para IP ${ip}`);
        return res.status(401).json({
          error: `Usuário ou senha incorretos. Tentativa ${newAttemptCount} de ${MAX_ATTEMPTS}.`,
        });
      }

      await pool.query('UPDATE login_attempts SET attempt_count = 0, block_count = 0, block_until = NULL WHERE ip = $1', [
        ip,
      ]);

      req.session.userId = users[0].id;
      req.session.userName = users[0].nome;
      console.log(`Login bem-sucedido: userId=${users[0].id}, nome=${users[0].nome}, IP=${ip}`);
      res.status(200).json({ message: 'Login bem-sucedido.', nome: users[0].nome });
    } catch (error) {
      console.error('Erro ao fazer login:', error.message);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.get('/api/login-attempts', isAuthenticated, async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT la.id, la.ip, la.usuario_id, u.username AS username, la.attempt_count, la.block_count, la.block_until, la.is_permanently_blocked, la.created_at, la.updated_at ' +
          'FROM login_attempts la LEFT JOIN usuarios u ON la.usuario_id = u.id'
      );
      console.log(`Listando ${result.rows.length} tentativas de login para userId=${req.session.userId}`);
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Erro ao listar tentativas:', error.message);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

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
      console.error('Erro ao desbloquear IP:', error.message);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

  app.post('/api/start-chatbot', isAuthenticated, async (req, res) => {
    try {
      const { alreadyConnected } = await startChatbot();
      if (alreadyConnected) {
        res.json({ message: 'Chatbot já conectado.', connected: true });
      } else {
        res.json({ message: 'Iniciando chatbot. Aguarde o QR code.', connected: false });
      }
    } catch (error) {
      console.error('Erro ao iniciar chatbot:', error.message);
      res.status(500).json({ error: 'Erro ao iniciar chatbot.' });
    }
  });

  // Registrar rotas
  app.use('/api/consulta', consultaRoutes);
  app.use('/api/avaliacoes', avaliacaoRoutes);
  app.use('/api/chatbot', chatbotRoutes); // Mantém apenas uma vez
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

  app.get('/index.html', isAuthenticated, (req, res) => {
    console.log('Acessando /index.html (autenticado)');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.get('/gerenciar.html', isAuthenticated, (req, res) => {
    console.log('Acessando /gerenciar.html (autenticado)');
    res.sendFile(path.join(__dirname, 'public', 'gerenciar.html'));
  });

  app.get('/dashboard.html', isAuthenticated, (req, res) => {
    console.log('Acessando /dashboard.html (autenticado)');
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
  });

  app.get('/admin.html', isAuthenticated, (req, res) => {
    console.log('Acessando /admin.html (autenticado)');
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  });

  app.get('/consulta.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'consulta.html'));
  });

  app.get('/professor.html', isAuthenticated, (req, res) => {
    console.log('Acessando /professor.html (autenticado)');
    res.sendFile(path.join(__dirname, 'public', 'professor.html'));
  });

  app.get('/usuarios.html', isAuthenticated, (req, res) => {
    console.log('Acessando /usuarios.html (autenticado)');
    res.sendFile(path.join(__dirname, 'public', 'usuarios.html'));
  });

  app.get('/situacao_aval.html', isAuthenticated, (req, res) => {
    console.log('Acessando /situacao_aval.html (autenticado)');
    res.sendFile(path.join(__dirname, 'public', 'situacao_aval.html'));
  });

  app.get('/tipo_aval.html', isAuthenticated, (req, res) => {
    console.log('Acessando /tipo_aval.html (autenticado)');
    res.sendFile(path.join(__dirname, 'public', 'tipo_aval.html'));
  });

  app.get('/modulo.html', isAuthenticated, (req, res) => {
    console.log('Acessando /modulo.html (autenticado)');
    res.sendFile(path.join(__dirname, 'public', 'modulo.html'));
  });

  app.get('/disciplina.html', isAuthenticated, (req, res) => {
    console.log('Acessando /disciplina.html (autenticado)');
    res.sendFile(path.join(__dirname, 'public', 'disciplina.html'));
  });

  app.get('/laboratorio.html', isAuthenticated, (req, res) => {
    console.log('Acesando /laboratorio.html (autenticado)');
    res.sendFile(path.join(__dirname, 'public', 'laboratorio.html'));
  });

  app.get('/arquivo.html', isAuthenticated, (req, res) => {
    console.log('Acessando /arquivo.html (autenticado)');
    res.sendFile(path.join(__dirname, 'public', 'arquivo.html'));
  });

  app.get('/api/user', isAuthenticated, async (req, res) => {
    try {
      const result = await pool.query('SELECT nome FROM usuarios WHERE id = $1', [req.session.userId]);
      const users = result.rows;
      if (users.length === 0) {
        console.log('Usuário não encontrado na sessão');
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }
      console.log(`Dados do usuário retornados: nome=${users[0].nome}`);
      res.status(200).json({ nome: users[0].nome });
    } catch (error) {
      console.error('Erro ao obter dados do usuário:', error.message);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });

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

  app.get('/test', (req, res) => {
    console.log('Acessando rota /test');
    res.json({ message: 'Servidor funcionando corretamente' });
  });

  app.get('/debug/routes', (req, res) => {
    const routes = [];
    app._router.stack.forEach((middleware) => {
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
        middleware.handle.stack.forEach((handler) => {
          if (handler.route) {
            routes.push({
              path: `${prefix}${handler.route.path}`,
              methods: Object.keys(handler.route.methods),
            });
          }
        });
      }
    });
    console.log('Listando rotas registradas:', routes);
    res.json(routes);
  });

  wss.on('connection', ws => {
    console.log('Novo cliente WebSocket conectado.');
    registerWebSocket(ws);
  });

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


