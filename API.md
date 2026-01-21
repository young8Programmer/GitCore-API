# GitCore API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-token>
```

---

## Auth Endpoints

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "fullName": "John Doe" // optional
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "fullName": "John Doe"
  }
}
```

---

## User Endpoints

### Get Current User Profile
```http
GET /api/users/me
Authorization: Bearer <token>
```

### Get User by ID
```http
GET /api/users/:id
```

### Update Profile
```http
PUT /api/users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "John Doe Updated",
  "bio": "Software Developer",
  "avatar": "https://example.com/avatar.jpg"
}
```

---

## SSH Keys

### Create SSH Key
```http
POST /api/ssh-keys
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "My Laptop",
  "publicKey": "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ..."
}
```

### List SSH Keys
```http
GET /api/ssh-keys
Authorization: Bearer <token>
```

### Get SSH Key
```http
GET /api/ssh-keys/:id
Authorization: Bearer <token>
```

### Delete SSH Key
```http
DELETE /api/ssh-keys/:id
Authorization: Bearer <token>
```

---

## Repository Endpoints

### Create Repository
```http
POST /api/repositories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "my-project",
  "description": "My awesome project",
  "visibility": "public" // or "private"
}
```

### List Repositories
```http
GET /api/repositories
GET /api/repositories?user=userId // Filter by user
```

### Get Repository
```http
GET /api/repositories/:id
GET /api/repositories/:owner/:name
```

### Update Repository
```http
PUT /api/repositories/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Updated description",
  "visibility": "private",
  "defaultBranch": "main"
}
```

### Delete Repository
```http
DELETE /api/repositories/:id
Authorization: Bearer <token>
```

### Get File Tree
```http
GET /api/repositories/:id/tree?branch=main
```

### Create Commit
```http
POST /api/repositories/:id/commits
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Initial commit",
  "files": [
    {
      "path": "src/index.js",
      "content": "console.log('Hello World');"
    },
    {
      "path": "README.md",
      "content": "# My Project"
    }
  ],
  "branch": "main"
}
```

### Star Repository
```http
POST /api/repositories/:id/star
Authorization: Bearer <token>
```

### Fork Repository
```http
POST /api/repositories/:id/fork
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "my-fork" // optional
}
```

### Add Collaborator
```http
POST /api/repositories/:id/collaborators
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user-uuid",
  "permission": "write" // "read", "write", or "admin"
}
```

### List Collaborators
```http
GET /api/repositories/:id/collaborators
```

### Update Collaborator Permission
```http
PUT /api/repositories/:id/collaborators/:userId
Authorization: Bearer <token>
Content-Type: application/json

{
  "permission": "admin"
}
```

### Remove Collaborator
```http
DELETE /api/repositories/:id/collaborators/:userId
Authorization: Bearer <token>
```

---

## Version Control Endpoints

### Create Commit
```http
POST /api/repositories/:repoId/commits
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Fix bug",
  "description": "Fixed critical bug in authentication",
  "files": [
    {
      "path": "src/auth.js",
      "content": "// fixed code"
    }
  ],
  "branch": "main"
}
```

### List Commits
```http
GET /api/repositories/:repoId/commits?branch=main&limit=50
```

### Get Commit
```http
GET /api/repositories/:repoId/commits/:sha
```

### Create Branch
```http
POST /api/repositories/:repoId/branches
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "feature/new-feature",
  "fromBranch": "main" // optional
}
```

### List Branches
```http
GET /api/repositories/:repoId/branches
```

### Get Branch
```http
GET /api/repositories/:repoId/branches/:name
```

### Delete Branch
```http
DELETE /api/repositories/:repoId/branches/:name
Authorization: Bearer <token>
```

### Get Diff
```http
GET /api/repositories/:repoId/diff?from=commit-sha-1&to=commit-sha-2
```

### Create Pull Request
```http
POST /api/repositories/:repoId/pull-requests
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Add new feature",
  "description": "This PR adds a new feature",
  "sourceBranch": "feature/new-feature",
  "targetBranch": "main",
  "isDraft": false
}
```

### List Pull Requests
```http
GET /api/repositories/:repoId/pull-requests
GET /api/repositories/:repoId/pull-requests?status=open
```

### Get Pull Request
```http
GET /api/repositories/:repoId/pull-requests/:number
```

### Merge Pull Request
```http
POST /api/repositories/:repoId/pull-requests/:number/merge
Authorization: Bearer <token>
Content-Type: application/json

{
  "mergeMessage": "Merge PR #1" // optional
}
```

### Close Pull Request
```http
PUT /api/repositories/:repoId/pull-requests/:number/close
Authorization: Bearer <token>
```

---

## Activity Endpoints

### Get My Contributions
```http
GET /api/activity/contributions?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

### Get Contribution Graph (GitHub-style)
```http
GET /api/activity/contributions/graph?year=2024
Authorization: Bearer <token>
```

### Get User Contributions
```http
GET /api/activity/users/:userId/contributions?year=2024
```

### Get Repository Activity
```http
GET /api/activity/repositories/:repoId?limit=50
```

---

## WebSocket Events

Connect to WebSocket at: `ws://localhost:3000/events`

### Events Emitted by Server

- `repository:created` - New repository created
- `repository:updated` - Repository updated
- `commit:created` - New commit created
- `branch:created` - New branch created
- `branch:deleted` - Branch deleted
- `pull_request:created` - New pull request created
- `pull_request:updated` - Pull request updated
- `pull_request:merged` - Pull request merged
- `pull_request:closed` - Pull request closed

### Join Repository Room
```javascript
socket.emit('join', { repositoryId: 'repo-uuid' });
```

---

## Error Responses

All errors follow this format:
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

Common status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
