// tests/e2e/usuariosController.test.js
const { test } = require("poku");
const assert = require("assert");
const request = require("supertest");
const app = require("../../app"); // app.js do projeto
const cliProgress = require("cli-progress");

let createdUserId;

test("🎯 E2E: CRUD de usuários - Barra de Progresso Visual", async () => {
  console.info("\n==========================================");
  console.info("🟢 Iniciando testes E2E: CRUD de usuários");
  console.info("==========================================\n");

  // Criar barra de progresso
  const progressBar = new cliProgress.SingleBar({
    format: '⏳ {bar} | {step} | {value}/{total}',
    barCompleteChar: '█',
    barIncompleteChar: '░',
    hideCursor: true
  });

  const steps = [
    { step: "📌 Criando usuário (POST)", fn: async () => {
      const res = await request(app)
        .post("/api/usuarios")
        .send({ nome: "E2E Test", username: "e2e_user", password: "123456" });
      assert.equal(res.status, 201);
      assert.equal(res.body.username, "e2e_user");
      createdUserId = res.body.id;
      return res.body;
    }},
    { step: "📌 Buscando usuário (GET)", fn: async () => {
      const res = await request(app).get(`/api/usuarios/${createdUserId}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.username, "e2e_user");
      return res.body;
    }},
    { step: "📌 Atualizando usuário (PUT)", fn: async () => {
      const res = await request(app)
        .put(`/api/usuarios/${createdUserId}`)
        .send({ nome: "E2E Atualizado", username: "e2e_user", password: "novaSenha" });
      assert.equal(res.status, 200);
      assert.equal(res.body.nome, "E2E Atualizado");
      return res.body;
    }},
    { step: "📌 Excluindo usuário (DELETE)", fn: async () => {
      const res = await request(app).delete(`/api/usuarios/${createdUserId}`);
      assert.equal(res.status, 200);
      return res.body;
    }},
  ];

  progressBar.start(steps.length, 0, { step: "Iniciando..." });

  for (let i = 0; i < steps.length; i++) {
    const { step, fn } = steps[i];

    // Atualiza o texto da barra antes do log
    progressBar.update(i, { step });

    // Pausar a barra para imprimir logs sem sobrepor
    progressBar.stop();

    console.info(`\n🔹 ${step}...`);
    const result = await fn();
    console.info("📤 Resultado:", result);

    // Retomar a barra
    progressBar.start(steps.length, i + 1, { step });
  }

  progressBar.stop();

  console.info("\n==================================================");
  console.info("🏁 Testes E2E de usuários concluídos com sucesso!");
  console.info("==================================================\n");
});


