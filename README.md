# 🚀 [Authentication App] - Backend API

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)

A highly scalable, secure, and production-ready backend API for [Your Project Name]. Built with Node.js, Express, TypeScript, and PostgreSQL.

## ✨ Features

- **Authentication & Authorization:** JWT-based login, refresh tokens, and role-based access control (RBAC).
- **Two-Factor Authentication (2FA):** Secure OTP verification via SMS (using [Akedly/Twilio]).
- **Device & Session Management:** Track user logins, device fingerprints, and revoke sessions.
- **Password Reset:** Secure password reset flow using hashed tokens.
- **Database:** Fully normalized PostgreSQL schema with optimized queries and materialized views.
- **Security:** Helmet, CORS, Rate Limiting, and Data Sanitization.

## 🛠️ Tech Stack

- **Framework:** Node.js, Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL (using `pg` pool)
- **Authentication:** JSON Web Tokens (JWT) & Bcrypt
- **Validation:** Zod
- **SMS Provider:** Akedly / Twilio

## 📂 Project Structure

```text
src/
├── config/          # Database and environment configuration
├── controllers/     # Route controllers (handling HTTP requests)
├── middlewares/     # Custom Express middlewares (auth, validation, errors)
├── models/          # Database queries and schemas
├── repositories/    # Data access layer (SQL queries)
├── routes/          # API route definitions
├── services/        # Core business logic
├── types/           # TypeScript interfaces and DTOs
├── utils/           # Helper functions (logger, encryption, etc.)
└── server.ts        # Application entry point
