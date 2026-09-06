# 📘 Инструкция для банковского офицера

## FinchTrade Gateway

---

### 1. Реквизиты для SWIFT-перевода

| Поле | Значение |
|------|----------|
| **Bank Name** | FinchTrade |
| **Account Name** | FinchTrade |
| **SWIFT/BIC** | [получите от FinchTrade] |
| **Currency** | EUR/USD |

---

### 2. Пример SWIFT-сообщения

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <CdtTrfTxInf>
      <Amt>
        <InstdAmt Ccy="USD">1000000.00</InstdAmt>
      </Amt>
      <CdtrAcct>
        <Id>
          <Othr>
            <Id>2t7rkti6YeUDD32bAgTMS1G4TEpzsMStxYZrLi92zqeM</Id>
          </Othr>
        </Id>
      </CdtrAcct>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>
