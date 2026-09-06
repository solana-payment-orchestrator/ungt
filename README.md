# 🌉 Solana SWIFT Gateway

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solana](https://img.shields.io/badge/Solana-1.98-9945FF)](https://solana.com)
[![SWIFT](https://img.shields.io/badge/SWIFT-ISO%2020022-blue)](https://www.iso20022.org)

> **Convert SWIFT bank messages into instant USDC settlements on Solana.**

---

## 🎯 What is this?

A middleware gateway that bridges traditional banking (SWIFT/ISO 20022) with Solana blockchain. Receives `pacs.008` XML messages, parses them, runs AML checks, and executes USDC transfers on Solana in **~400ms**.

**Perfect for**: Banks, fintech platforms, payment providers who want blockchain settlements without rebuilding their SWIFT infrastructure.

---

## ⚡ Architecture
