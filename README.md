# GitCore API

Professional Git-like API with microservices architecture built with NestJS, TypeORM, and PostgreSQL.

## 🚀 Features

- **Repository Service**: Create and manage repositories (Public/Private)
- **Version Control**: Full Git logic simulation (commits, branches, diffs)
- **Pull Requests**: Code review and merge functionality
- **User & Access Management**: SSH keys, permissions, collaborators
- **Activity Stream**: Track user contributions (GitHub-style green squares)
- **Real-time Notifications**: WebSocket support for live updates
- **File Storage**: Local filesystem or S3 bucket support

## 🛠 Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT + Passport
- **Real-time**: WebSockets (Socket.IO)
- **Storage**: Local filesystem / AWS S3
- **Git Operations**: Node.js child_process

## 📦 Installation

```bash
npm install
```

## 🔧 Configuration

Create a `.env` file in the root directory:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=gitcore

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Storage
STORAGE_TYPE=local
STORAGE_PATH=./storage
# OR for S3:
# STORAGE_TYPE=s3
# AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=your-key
# AWS_SECRET_ACCESS_KEY=your-secret
# S3_BUCKET=gitcore-repos

# Server
PORT=3000
NODE_ENV=development
```

## 🚀 Running the app

```bash
# development
npm run start:dev

# production
npm run build
npm run start:prod
```

## 📚 API Documentation

API endpoints will be available at `http://localhost:3000/api`

## 🏗 Architecture

The application follows a microservices architecture with the following modules:

1. **Repository Service**: Manages repositories and Git operations
2. **Version Control Service**: Handles commits, branches, and diffs
3. **User & Access Service**: Manages users, SSH keys, and permissions
4. **Activity Stream Service**: Tracks user contributions

<!-- Update 1 -->

<!-- Update 2 -->

<!-- Update 3 -->

<!-- Update 4 -->

<!-- Update 5 -->

<!-- Update 6 -->

<!-- Update 7 -->

<!-- Update 8 -->

<!-- Update 9 -->

<!-- Update 10 -->

<!-- Update 11 -->

<!-- Update 12 -->

<!-- Update 13 -->

<!-- Update 14 -->

<!-- Update 15 -->

<!-- Update 16 -->

<!-- Update 17 -->

<!-- Update 18 -->

<!-- Update 19 -->
