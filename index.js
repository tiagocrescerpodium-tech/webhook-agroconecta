const express = require('express');
const app = express();

// 🔥 IMPORTANTE: aceitar JSON corretamente
app.use(express.json());

// 🔥 LOG DE TODAS AS REQUISIÇÕES (AJUDA MUITO)
app.use((req, res, next) => {
  console.log('==============================');
  console.log(`📡 ${req.method} ${req.url}`);
  console.log('Body:', req.body);
  console.log('==============================');
  next();
});

// ✅ ROTA PRINCIPAL
app.get('/', (req, res) => {
  res.status(200).send('Servidor rodando 🚀');
});

// 🔥 WEBHOOK (ACEITA QUALQUER MÉTODO PRA EVITAR ERRO)
app.all('/webhook', (req, res) => {
  try {
    console.log('🔥 WEBHOOK RECEBIDO COM SUCESSO');

    // Dados enviados pelo Mercado Pago
    const data = req.body;

    console.log('📦 Dados do webhook:', JSON.stringify(data, null, 2));

    // Aqui você pode tratar pagamento depois
    // ex: data.type === 'payment'

    // 🔥 SEMPRE responder 200
    return res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    return res.status(500).send('Erro interno');
  }
});

// ❌ TRATAMENTO DE ROTAS NÃO ENCONTRADAS (evita 404 confuso)
app.use((req, res) => {
  res.status(404).send('Rota não encontrada');
});

// 🚀 PORTA (Railway usa automaticamente)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
