import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// 🔑 COLE SEU ACCESS TOKEN AQUI
const ACCESS_TOKEN = "TEST-437428606299351-041416-be77e2975f63212889d92e6afd6ed9b5-1356138240
";

// 🔗 COLE SUA URL DO RAILWAY AQUI
const WEBHOOK_URL = "https://webhook-agroconecta-production-bf29.up.railway.app/webhook";

// 🚀 ROTA TESTE
app.get("/", (req, res) => {
  res.send("Servidor AgroConecta rodando 🚀");
});

// 💰 CRIAR PAGAMENTO PIX
app.post("/criar-pagamento", async (req, res) => {
  try {
    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        transaction_amount: 50,
        description: "Compra no AgroConecta",
        payment_method_id: "pix",
        notification_url: WEBHOOK_URL,
        payer: {
          email: "teste@email.com",
        },
      }),
    });

    const data = await response.json();

    res.json({
      status: data.status,
      qr_code: data.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: data.point_of_interaction?.transaction_data?.qr_code_base64,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar pagamento" });
  }
});

// 🔔 WEBHOOK (RECEBE CONFIRMAÇÃO DE PAGAMENTO)
app.post("/webhook", async (req, res) => {
  try {
    console.log("🔔 Notificação recebida:", req.body);

    const paymentId = req.body.data?.id;

    if (!paymentId) {
      return res.sendStatus(200);
    }

    // 🔎 CONSULTAR STATUS DO PAGAMENTO
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      }
    );

    const payment = await response.json();

    console.log("💰 Status do pagamento:", payment.status);

    if (payment.status === "approved") {
      console.log("✅ PAGAMENTO APROVADO! Liberar produto.");

      // 👉 AQUI você pode:
      // salvar no banco
      // liberar pedido
      // enviar produto pro cliente
    }

    res.sendStatus(200);

  } catch (error) {
    console.error("Erro no webhook:", error);
    res.sendStatus(500);
  }
});

// 🚀 INICIAR SERVIDOR
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
