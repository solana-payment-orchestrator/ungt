const express = require('express');
const cors = require('cors');
const { Connection, PublicKey, Transaction } = require('@solana/web3.js');
const { getAssociatedTokenAddress, createTransferInstruction } = require('@solana/spl-token');
const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');
const xml2js = require('xml2js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ type: 'application/xml', limit: '10mb' }));

const PORT = process.env.PORT || 3000;
const connection = new Connection(process.env.SOLANA_RPC_URL, 'confirmed');
const USDC_MINT = new PublicKey(process.env.USDC_MINT);

// МАСТЕР-КОШЕЛЕК
const privateKeyBytes = bs58.decode(process.env.PRIVATE_KEY);
const masterWallet = Keypair.fromSecretKey(privateKeyBytes);
console.log(`💰 Master wallet: ${masterWallet.publicKey.toBase58()}`);

// ПАРСЕР SWIFT
async function parsePacs008(xml) {
  try {
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(xml);
    const doc = result['Document'];
    const pmtInf = doc['FIToFICstmrCdtTrf']['CdtTrfTxInf'][0] || doc['FIToFICstmrCdtTrf']['CdtTrfTxInf'];
    const amount = parseFloat(pmtInf['Amt']['InstdAmt']['_'] || pmtInf['Amt']['InstdAmt']);
    const currency = pmtInf['Amt']['InstdAmt']['$']['Ccy'] || 'USD';
    const reference = pmtInf['PmtId']['EndToEndId'] || 'N/A';
    const creditorAddress = pmtInf['CdtrAcct']?.['Id']?.['Othr']?.['Id'] || null;
    return { amount, currency, reference, creditorAddress };
  } catch (error) {
    throw new Error(`Invalid ISO 20022: ${error.message}`);
  }
}

// ОТПРАВКА USDC
async function sendUSDC(toAddress, amount) {
  try {
    const toPubkey = new PublicKey(toAddress);
    const fromTokenAccount = await getAssociatedTokenAddress(USDC_MINT, masterWallet.publicKey);
    const toTokenAccount = await getAssociatedTokenAddress(USDC_MINT, toPubkey);
    const amountLamports = Math.floor(amount * 1_000_000);
    const transferInstruction = createTransferInstruction(
      fromTokenAccount, toTokenAccount, masterWallet.publicKey, amountLamports, []
    );
    const transaction = new Transaction().add(transferInstruction);
    transaction.feePayer = masterWallet.publicKey;
    const signature = await connection.sendTransaction(transaction, [masterWallet]);
    await connection.confirmTransaction(signature, 'confirmed');
    return signature;
  } catch (error) {
    throw new Error(`Solana error: ${error.message}`);
  }
}

// ГЛАВНЫЙ ЭНДПОИНТ
app.post('/api/swift', async (req, res) => {
  try {
    const xml = req.body;
    if (!xml || typeof xml !== 'string') {
      return res.status(400).json({ error: 'Invalid XML payload' });
    }
    const parsed = await parsePacs008(xml);
    console.log('📥 SWIFT received:', parsed);
    if (!parsed.creditorAddress) {
      return res.status(400).json({
        error: 'Missing Solana address in SWIFT',
        hint: 'Add <CdtrAcct><Id><Othr><Id>SOLANA_ADDRESS</Id></Othr></Id></CdtrAcct>'
      });
    }
    const fee = parsed.amount * 0.01;
    const sendAmount = parsed.amount - fee;
    const signature = await sendUSDC(parsed.creditorAddress, sendAmount);
    res.status(200).json({
      status: 'ACCEPTED',
      transactionId: signature,
      from: masterWallet.publicKey.toBase58(),
      to: parsed.creditorAddress,
      amount: sendAmount,
      fee: fee,
      currency: 'USDC',
      reference: parsed.reference,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ТЕСТ (без SWIFT)
app.post('/api/send-test', async (req, res) => {
  const { to, amount } = req.body;
  if (!to || !amount) {
    return res.status(400).json({ error: 'Missing to or amount' });
  }
  try {
    const signature = await sendUSDC(to, parseFloat(amount));
    res.json({ success: true, signature });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ПРОВЕРКА
app.get('/health', (req, res) => {
  res.json({ status: 'ok', masterWallet: masterWallet.publicKey.toBase58() });
});

app.listen(PORT, () => {
  console.log(`🚀 Gateway running on http://localhost:${PORT}`);
  console.log(`💰 Master wallet: ${masterWallet.publicKey.toBase58()}`);
});
