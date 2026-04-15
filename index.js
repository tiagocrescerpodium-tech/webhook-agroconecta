const express = require('express');
const app = express();
 
// ────────────────────────────────────────────────────────────
//  MIDDLEWARE GLOBAL
// ────────────────────────────────────────────────────────────
 
// Interpreta JSON em todas as requisições
app.use(express.json());
 
// Logger global: método + URL + body
app.use((req, res, next) => {
  console.log('──────────────────────────────────────');
  console.log(`📥  ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦  Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});
 
// ────────────────────────────────────────────────────────────
//  ROTA RAIZ — health check
// ────────────────────────────────────────────────────────────
 
app.get('/', (req, res) => {
  res.send('Servidor rodando 🚀');
});
 
// ────────────────────────────────────────────────────────────
//  WEBHOOK — Mercado Pago
//  • Aceita qualquer método HTTP (app.all)
//  • Sempre retorna 200 OK
//  • Nunca quebra o servidor
// ────────────────────────────────────────────────────────────
 
app.all('/webhook', (req, res) => {
  try {
    const body = req.body || {};
 
    console.log('');
    console.log('🔔  WEBHOOK RECEBIDO');
    console.log('    Método  :', req.method);
    console.log('    Headers :', JSON.stringify(req.headers, null, 2));
    console.log('    Body    :', JSON.stringify(body, null, 2));
 
    // ── Identificação do tipo de notificação ─────────────────
    const type   = body.type   || body.topic || null;
    const dataId = body.data?.id || body.id  || null;
 
    if (type === 'payment') {
      console.log('');
      console.log('💳  Notificação de PAGAMENTO detectada!');
      console.log('    Payment ID:', dataId);
 
      // TODO: chamar Mercado Pago API para confirmar o pagamento
      // Exemplo futuro:
      //   const payment = await mercadopago.payment.get(dataId);
      //   await processarPagamento(payment);
 
    } else if (type) {
      console.log(`ℹ️   Tipo de notificação: ${type} | ID: ${dataId}`);
    } else {
      console.log('⚠️   Corpo sem tipo definido — pode ser teste do MP.');
    }
 
    // Sempre responde 200 para o Mercado Pago não reenviar
    return res.status(200).json({ received: true, type, id: dataId });
 
  } catch (err) {
    // Em caso de erro inesperado, ainda responde 200
    // para evitar reenvios infinitos do Mercado Pago
    console.error('❌  Erro no webhook (mas retornando 200):', err.message);
    return res.status(200).json({ received: true, error: err.message });
  }
});
 
// ────────────────────────────────────────────────────────────
//  MIDDLEWARE DE ERRO GLOBAL — impede que o servidor caia
// ────────────────────────────────────────────────────────────
 
app.use((err, req, res, next) => {
  console.error('💥  Erro global capturado:', err.message);
  res.status(500).json({ error: 'Erro interno no servidor.' });
});
 
// ────────────────────────────────────────────────────────────
//  INICIALIZAÇÃO
// ────────────────────────────────────────────────────────────
 
const PORT = process.env.PORT || 3000;
 
app.listen(PORT, () => {
  console.log('══════════════════════════════════════');
  console.log(`🌱  AgroConecta rodando na porta ${PORT}`);
  console.log('══════════════════════════════════════');
});
 
