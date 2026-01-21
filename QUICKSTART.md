# GitCore API - Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 15+ installed (or use Docker)
- Git installed (for Git operations)

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

#### Option A: Using Docker (Recommended)

```bash
docker-compose up -d
```

This will start PostgreSQL on port 5432.

#### Option B: Manual PostgreSQL Setup

1. Create a PostgreSQL database named `gitcore`
2. Update `.env` file with your database credentials

### 3. Configure Environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- Database credentials
- JWT secret (use a strong random string)
- Storage configuration (local or S3)

### 4. Run Database Migrations

The application uses TypeORM's `synchronize` option in development mode, which will automatically create tables on startup.

### 5. Start the Application

```bash
# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000/api`

### 6. Test the API

#### Register a new user:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'
```

#### Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### Create a repository (use the token from login):
```bash
curl -X POST http://localhost:3000/api/repositories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "my-project",
    "description": "My first repository",
    "visibility": "public"
  }'
```

## Project Structure

```
src/
├── entities/           # Database entities (TypeORM)
├── modules/
│   ├── auth/          # Authentication (JWT, Passport)
│   ├── user/          # User management, SSH keys, collaborators
│   ├── repository/    # Repository CRUD operations
│   ├── version-control/ # Commits, branches, pull requests
│   ├── activity/      # Contribution tracking
│   ├── git/           # Git operations (child_process)
│   ├── storage/       # File storage (local/S3)
│   └── websocket/     # Real-time events
├── main.ts            # Application entry point
└── app.module.ts      # Root module
```

## Key Features

✅ **Repository Management**
- Create public/private repositories
- Fork repositories
- Star repositories
- File tree visualization

✅ **Version Control**
- Create commits with SHA-1 hashing
- Branch management (create, delete, merge)
- Pull requests with code review
- Diff calculation between branches

✅ **User & Access**
- JWT authentication
- SSH key management
- Collaborator permissions (read/write/admin)
- Repository visibility control

✅ **Activity Tracking**
- GitHub-style contribution graph
- Activity stream per repository
- User contribution statistics

✅ **Real-time Updates**
- WebSocket events for commits, PRs, etc.
- Repository room subscriptions

✅ **Storage**
- Local filesystem storage
- AWS S3 support
- Git repository management

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Formatting
```bash
npm run format
```

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Disable `synchronize` in TypeORM config (use migrations instead)
3. Use a strong JWT secret
4. Configure proper CORS settings
5. Set up reverse proxy (nginx) if needed
6. Use process manager (PM2) for running the app

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists: `psql -U postgres -l`

### Git Operations Failing
- Ensure Git is installed: `git --version`
- Check file permissions for storage directory
- Verify storage path is writable

### Port Already in Use
- Change `PORT` in `.env`
- Or kill the process using port 3000

## Next Steps

- Read [API.md](./API.md) for complete API documentation
- Check [README.md](./README.md) for more details
- Explore the codebase to understand the architecture

## Support

For issues or questions, please check the codebase documentation or create an issue.
