# Chat Backend Assignment

A simple chat backend built with Node.js, Express, TypeScript, MySQL, Prisma, and Firebase Firestore.

## Tech Stack

- Node.js
- Express.js
- TypeScript
- MySQL
- Prisma
- Firebase Firestore

## Requirements

- Node.js 24.x
- MySQL 8+
- Firebase account

## Setup

### 1. Clone the project

```bash
git clone <your-repository-url>
cd chat-backend-assignment
```

### 2. Install packages

```bash
npm install
```

### 3. Create MySQL database

Create a database named:

```sql
CREATE DATABASE chat_backend;
```

### 4. Configure environment variables

Create a `.env` file:

```env
NODE_ENV=development
PORT=3000

DATABASE_URL=mysql://root:YOUR_PASSWORD@localhost:3306/chat_backend

FIREBASE_PROJECT_ID=your-firebase-project-id
GOOGLE_APPLICATION_CREDENTIALS=C:/firebase-keys/chat-service-account.json
```

Update the values according to your local setup.

### 5. Setup Prisma

```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```
