import express from "express";
import mercadopago from "mercadopago";

const app = express();
app.use(express.json());

// 🔑 TOKEN
mercadopago.configure({
  access_token: "TEST-437428606299351-041416-be77e2975f63212889d92e6afd6ed9b5-1356138240",
});

// 💰 CRIAR PAGAMENTO PIX
app.post("/criar-pagamento", async (req, res) => {
  try {
    const payment = await mercadopago.payment.create({
      transaction_amount: 50,
      description: "Compra no AgroConecta",
      payment_method_id: "pix",
      payer: {
        email: "test_user_123456@testuser.com",
      },
    });

    res.json({
      status: payment.body.status,
      qr_code: payment.body.point_of_interaction.transaction_data.qr_code,
      qr_code_base64: payment.body.point_of_interaction.transaction_data.qr_code_base64,
    });

  } catch (error) {
    console.log("ERRO:", error);
    res.status(500).json({ error: "Erro ao criar pagamento" });
  }
});
