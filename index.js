import express from 'express';
import cors from 'cors';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// --- CONFIGURAÇÃO FIREBASE ---
// Importante: No seu servidor real, configure a variável FIREBASE_SERVICE_ACCOUNT 
// com o conteúdo do seu arquivo JSON de conta de serviço ou aponte o Google Cloud para o projeto.
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
} else {
  // Fallback para ambiente local ou Google Cloud que já tenha auth configurada
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID
  });
}

const db = admin.firestore(process.env.FIREBASE_DATABASE_ID);

// --- CONFIGURAÇÃO MERCADO PAGO ---
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || 'APP_USR-437428606299351-041416-f04fb0a35f70105cb211c31ba6ba44b8-1356138240' 
});
const payment = new Payment(client);

const app = express();
app.use(cors());
app.use(express.json());

// Helper para gerar a URL de notificação (Webhook)
const getBaseUrl = (req) => {
  if (process.env.WEBHOOK_URL) return process.env.WEBHOOK_URL;
  const host = req.get('host');
  // Mercado Pago exige HTTPS para webhooks em produção
  return `https://${host}/api/webhook`;
};

// --- ROTAS DE PAGAMENTO ---

// Gerar PIX para Compra de Produtos
app.post("/api/generate-pix-payment", async (req, res) => {
  try {
    const { productId, buyerId, buyerEmail, amount, productName, sellerId, fee, netAmount } = req.body;

    const body = {
      transaction_amount: Number(Number(amount).toFixed(2)),
      description: `AgroConecta: ${productName}`,
      payment_method_id: 'pix',
      payer: {
        email: (buyerEmail && buyerEmail.includes('@')) ? buyerEmail : 'comprador@agroconecta.app',
        first_name: 'Comprador',
        last_name: 'AgroConecta'
      },
      notification_url: getBaseUrl(req),
    };

    const requestOptions = {
      idempotencyKey: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };

    const result = await payment.create({ body, requestOptions });

    // Criar pedido no Firestore usando Admin SDK (Super Powers)
    const orderRef = await db.collection('orders').add({
      buyerId,
      sellerId,
      productId,
      productName,
      amount,
      fee,
      netAmount,
      status: 'pending',
      paymentId: result.id.toString(),
      qrCode: result.point_of_interaction.transaction_data.qr_code,
      qrCodeBase64: result.point_of_interaction.transaction_data.qr_code_base64,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      orderId: orderRef.id,
      qr_code: result.point_of_interaction.transaction_data.qr_code,
      qr_code_base64: result.point_of_interaction.transaction_data.qr_code_base64,
    });
  } catch (error) {
    console.error('Erro Mercado Pago:', error);
    res.status(500).json({ error: 'Erro ao gerar pagamento PIX', details: error.message });
  }
});

// Gerar PIX para Destaque de Anúncio
app.post("/api/create-featured-payment", async (req, res) => {
  try {
    const { userId, userEmail, amount, productName } = req.body;

    const body = {
      transaction_amount: 9.90,
      description: `Destaque: ${productName}`,
      payment_method_id: 'pix',
      payer: {
        email: userEmail || 'anunciante@agroconecta.app',
        first_name: 'Anunciante',
        last_name: 'AgroConecta'
      },
      notification_url: getBaseUrl(req),
    };

    const requestOptions = {
      idempotencyKey: `feat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };

    const result = await payment.create({ body, requestOptions });

    const featRef = await db.collection('featured_payments').add({
      userId,
      productName,
      amount: 9.90,
      status: 'pending',
      paymentId: result.id.toString(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      featId: featRef.id,
      qrCode: result.point_of_interaction.transaction_data.qr_code,
      qrCodeBase64: result.point_of_interaction.transaction_data.qr_code_base64,
    });
  } catch (error) {
    console.error('Erro Destaque:', error);
    res.status(500).json({ error: 'Falha ao gerar pagamento do destaque' });
  }
});

// --- WEBHOOK (O CORAÇÃO DO SISTEMA) ---
app.post("/api/webhook", async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === 'payment') {
      const paymentId = data.id.toString();
      const paymentInfo = await payment.get({ id: paymentId });

      if (paymentInfo.status === 'approved') {
        // 1. Procurar pedidos normais
        const orderSnap = await db.collection('orders').where('paymentId', '==', paymentId).limit(1).get();
        if (!orderSnap.empty) {
          const orderDoc = orderSnap.docs[0];
          const orderData = orderDoc.data();
          if (orderData.status === 'pending') {
            await orderDoc.ref.update({ status: 'paid' });
            // Atualizar saldo pendente do vendedor
            await db.collection('users').doc(orderData.sellerId).update({
              pendingBalance: admin.firestore.FieldValue.increment(orderData.netAmount)
            });
          }
        }

        // 2. Procurar pagamentos de destaque
        const featSnap = await db.collection('featured_payments').where('paymentId', '==', paymentId).limit(1).get();
        if (!featSnap.empty) {
          const featDoc = featSnap.docs[0];
          if (featDoc.data().status === 'pending') {
            await featDoc.ref.update({ status: 'paid' });
          }
        }
      }
    }
    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook Error:', error);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
