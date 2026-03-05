# JobMitra Backend (Node.js + Express + TypeScript)

JobMitra backend is the API and business logic layer for the JobMitra platform. It serves Talent (candidates), Employer (recruiters), and Admin use cases, including authentication, job lifecycle management, applications, recommendations, and feedback.

## Features

### Authentication & User Management
- Talent and Employer registration/login flows
- Admin authentication and management routes
- JWT-based auth with role-aware protected APIs
- Google OAuth verification support

### Job Platform Modules
- Job CRUD and search-ready indexing flow
- Job applications module
- Saved jobs module
- Categories module and recommendation endpoints
- Extracted candidate and notification endpoints
- Feedback module

### Platform Services
- MongoDB integration with Mongoose
- Meilisearch initialization and job indexing
- Socket.IO bootstrap for real-time capabilities
- Static file serving from `public/`

## Tech Stack
- Node.js + Express 5
- TypeScript + ts-node
- MongoDB + Mongoose
- JWT + bcryptjs
- Multer (multipart uploads)
- Zod (validation)
- Jest + Supertest (testing)

## Prerequisites
- Node.js 18+
- npm
- MongoDB (local or remote)
- Meilisearch (recommended for search features)

## Installation

1. Install dependencies

```bash
npm install
```

2. Configure environment variables

```bash
cp .env.example .env
```

3. Update `.env` values for your setup.

4. Start development server

```bash
npm run dev
```

Default server URL: `http://localhost:5000`

## Environment Variables

Current `.env.example` keys:

- `PORT` : API server port (default `5000`)
- `MONGODB_URL` : MongoDB connection string
- `JWT_SECRET` : JWT signing key
- `GOOGLE_CLIENT_ID` : Google OAuth client id for token verification

Example:

```env
PORT=5000
MONGODB_URL=mongodb://localhost:27017/jobmitra_db
JWT_SECRET=your-super-secret-jwt-key-here
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

## Available Scripts

- `npm run dev` : Start server with nodemon + ts-node
- `npm test` : Run all tests
- `npm run test:coverage` : Run tests with coverage report
- `npm run test:coverage:related` : Coverage for related tests

## API Base and Modules

Base path: `/api`

Registered route groups:

- `/api/talentusers`
- `/api/employerusers`
- `/api/jobs`
- `/api/saved-jobs`
- `/api/admin`
- `/api/applications`
- `/api/recommend`
- `/api/extracted-candidates`
- `/api/notifications`
- `/api/categories`
- `/api/feedback`

Health check endpoint:

- `/health`

## Project Structure

- `src/app.ts` : Express app configuration, middleware, route registration
- `src/index.ts` : HTTP server bootstrap and socket initialization
- `src/controllers/` : Route handlers
- `src/services/` : Business logic
- `src/repositories/` : Data access layer
- `src/models/` : Mongoose schemas
- `src/dtos/` : Zod validation DTOs
- `src/routes/` : Express routers
- `src/middlewares/` : Auth/upload/shared middleware
- `src/config/` : App + Meilisearch configuration
- `src/__tests__/` : Unit and integration tests
- `public/` : Uploaded/static files

## Testing

Run test suite:

```bash
npm test
```

Run with coverage:

```bash
npm run test:coverage
```

## Notes

- Keep frontend origin aligned with CORS config in `src/app.ts`.
- Ensure MongoDB is running before starting the API.
- Meilisearch should be available to fully enable search indexing flows.
