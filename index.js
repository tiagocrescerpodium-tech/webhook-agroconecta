const express = require('express');
const app = express();

// Permite receber JSON
app.use(express.json());

// Rota principal (teste)
app.get('/', (req, res) => {
  res.send('Servidor rodando 🚀');
});

// 🔥 WEBHOOK DO MERCADO PAGO
app.post('/webhook', (req, res) => {
  console.log('==============================');
  console.log('📩 Webhook recebido!');
  console.log('Dados:', JSON.stringify(req.body, null, 2));
  console.log('==============================');

  // Sempre responder 200 para o Mercado Pago
  res.sendStatus(200);
});

// Porta (Railway usa variável automática)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
