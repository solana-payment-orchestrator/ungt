const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ КОНФИГУРАЦИЯ ============
const PORT = process.env.PORT || 3000;

// Твой API-ключ из скриншота
const API_KEY = 'pmg_live_da77102c-3f02-41db-a8e3-6aca70d40c41';
const API_SECRET = 'F-4a7GPnPMRWPPVnz1__rXslx0yNRFM0ChopD8TevuM';

// Твой мастер-кошелек (куда будут приходить USDC)
const MASTER_WALLET = '2t7rkti6YeUDD32bAgTMS1G4TEpzsMStxYZrLi92zqeM';

// ============ СОЗДАНИЕ ПЛАТЕЖА ============
app.post('/api/create-payment', async (req, res) => {
    try {
        const { amount, currency, customerEmail } = req.body;

        if (!amount || !currency) {
            return res.status(400).json({ error: 'Missing amount or currency' });
        }

        // PayMeGate API endpoint
        const url = 'https://api.paymegate.com/v1/invoice';

        // Данные для платежа
        const payload = {
            amount: parseFloat(amount),
            currency: currency.toUpperCase(), // USD, EUR, GBP
            description: 'Payment for goods/services',
            customer_email: customerEmail || 'customer@example.com',
            success_url: 'https://your-site.com/success',
            cancel_url: 'https://your-site.com/cancel',
            webhook_url: 'https://your-server.com/api/webhook/paymegate',
            // Куда отправлять USDC после оплаты
            settlement_address: MASTER_WALLET,
            settlement_currency: 'USDC',
            settlement_network: 'SOLANA'
        };

        // Генерация подписи (как указано в документации PayMeGate)
        const timestamp = Date.now();
        const signature = crypto
            .createHmac('sha256', API_SECRET)
            .update(JSON.stringify(payload) + timestamp)
            .digest('hex');

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY,
                'X-Timestamp': timestamp.toString(),
                'X-Signature': signature
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Payment creation failed');
        }

        res.json({
            success: true,
            payment_url: data.payment_url,
            invoice_id: data.invoice_id,
            amount: data.amount,
            currency: data.currency
        });

    } catch (error) {
        console.error('❌ Error creating payment:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ============ ВЕБХУК (PayMeGate уведомляет о платеже) ============
app.post('/api/webhook/paymegate', async (req, res) => {
    try {
        const webhookData = req.body;
        console.log('📥 Webhook received:', webhookData);

        // Проверка подписи вебхука (если PayMeGate поддерживает)
        // ...

        // Проверяем статус платежа
        if (webhookData.status === 'paid') {
            const { amount, currency, settlement_address, transaction_id } = webhookData;

            console.log(`✅ Payment received: ${amount} ${currency}`);
            console.log(`💰 Sent to: ${settlement_address}`);
            console.log(`🔗 Transaction: ${transaction_id}`);

            // Здесь можно:
            // 1. Отгрузить товар
            // 2. Отправить уведомление клиенту
            // 3. Записать в базу данных

            // Пример ответа клиенту (для вебхука всегда 200 OK)
            res.status(200).json({ status: 'ok' });
        } else {
            console.log(`⚠️ Payment status: ${webhookData.status}`);
            res.status(200).json({ status: 'received' });
        }

    } catch (error) {
        console.error('❌ Webhook error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ============ ПРОВЕРКА СТАТУСА ПЛАТЕЖА ============
app.get('/api/payment-status/:invoiceId', async (req, res) => {
    try {
        const { invoiceId } = req.params;

        const timestamp = Date.now();
        const signature = crypto
            .createHmac('sha256', API_SECRET)
            .update(invoiceId + timestamp)
            .digest('hex');

        const response = await fetch(`https://api.paymegate.com/v1/invoice/${invoiceId}`, {
            method: 'GET',
            headers: {
                'X-API-Key': API_KEY,
                'X-Timestamp': timestamp.toString(),
                'X-Signature': signature
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to get payment status');
        }

        res.json({
            success: true,
            status: data.status,
            amount: data.amount,
            currency: data.currency,
            paid_at: data.paid_at
        });

    } catch (error) {
        console.error('❌ Error checking status:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ============ HEALTH CHECK ============
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        provider: 'PayMeGate',
        masterWallet: MASTER_WALLET
    });
});

app.listen(PORT, () => {
    console.log(`🚀 PayMeGate gateway running on http://localhost:${PORT}`);
    console.log(`💰 Master wallet: ${MASTER_WALLET}`);
});
