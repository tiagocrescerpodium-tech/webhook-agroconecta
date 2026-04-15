const express = require('express');
const app = express();

app.use(express.json());

// TESTE PRINCIPAL
app.get('/', (req, res) => {
  res.send('OK');
});

// TESTE WEBHOOK SIMPLES
app.post('/webhook', (req, res) => {
  console.log('CHEGOU WEBHOOK');
  res.status(200).send('ok');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('rodando'));
