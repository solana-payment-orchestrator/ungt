# 📘 Инструкция для банковского офицера

## StraitsX DVA Gateway

---

### 1. Реквизиты для SWIFT-перевода

**Пожалуйста, отправьте SWIFT-перевод на следующие реквизиты:**

| Поле | Значение |
|------|----------|
| **Bank Name** | StraitsX (DBS Bank) |
| **Account Name** | [Ваша компания] |
| **Account Number** | [Ваш DVA от StraitsX] |
| **SWIFT/BIC** | DBSSSGSG |
| **Currency** | USD или EUR |
| **Reference** | Уникальный ID клиента |

---

### 2. Дополнительные требования

В сообщении SWIFT **обязательно укажите** Solana-адрес получателя:

```xml
<CdtrAcct>
  <Id>
    <Othr>
      <Id>2t7rkti6YeUDD32bAgTMS1G4TEpzsMStxYZrLi92zqeM</Id>
    </Othr>
  </Id>
</CdtrAcct>
