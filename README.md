# DSA Learning Platform Backend

A comprehensive backend API for a Data Structures and Algorithms learning platform built with Node.js, Express, TypeScript, and MongoDB.

## Features

- **User Authentication & Authorization**: JWT-based auth with role-based access control
- **Admin Management**: Admin registration, approval system, and dashboard
- **Topic Management**: CRUD operations for DSA topics and subtopics
- **Assignment System**: Create, manage, and track coding assignments
- **Quiz System**: Interactive quizzes with multiple question types
- **Progress Tracking**: Monitor user learning progress and statistics
- **Email Notifications**: Automated email system for user engagement
- **Rate Limiting**: API protection against abuse
- **Security**: Helmet, CORS, input validation, and sanitization

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, bcryptjs, express-rate-limit
- **Validation**: express-validator
- **Email**: Nodemailer
- **Development**: ts-node-dev, ESLint

## Project Structure

```
src/
├── config/          # Database and app configuration
├── controllers/     # Route controllers
├── middleware/      # Custom middleware (auth, error handling)
├── models/          # MongoDB/Mongoose models
├── routes/          # API route definitions
├── scripts/         # Database seeding and utility scripts
├── services/        # Business logic and external services
└── index.ts         # Application entry point
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Installation

1. **Clone and setup the project** (already done)

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   - Set your MySQL connection string: `DATABASE_URL="mysql://username:password@localhost:3306/dsa_learning_platform"`
   - Generate a secure JWT secret
   - Configure email settings (optional)

4. **Database Setup**:
   ```bash
   # Complete database setup (generate client, migrate, and seed)
   npm run db:setup
   
   # Or run individually:
   npx prisma generate          # Generate Prisma client
   npx prisma migrate dev       # Create and run migrations
   npm run seed                 # Seed with sample data
   
   # Optional: Open Prisma Studio to view your database
   npx prisma studio
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:5000`

## 🔐 Default Accounts

After seeding, you can use these accounts:

- **Super Admin**: `dknishwanth1718@gmail.com` / `admin123`
- **Instructor**: `instructor@dsa-platform.com` / `instructor123`  
- **Student**: `student@dsa-platform.com` / `student123`

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the TypeScript project
- `npm start` - Start production server
- `npm run seed` - Seed the database with initial data
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Reset password

### Admin Authentication
- `POST /api/admin/auth/register` - Admin registration (requires approval)
- `POST /api/admin/auth/login` - Admin login
- `GET /api/admin/auth/pending` - Get pending admin approvals

### Topics
- `GET /api/topics` - Get all topics
- `POST /api/topics` - Create new topic (admin only)
- `PUT /api/topics/:id` - Update topic (admin only)
- `DELETE /api/topics/:id` - Delete topic (admin only)

### Assignments
- `GET /api/assignments` - Get assignments
- `POST /api/assignments` - Create assignment (admin only)
- `POST /api/assignments/:id/submit` - Submit assignment solution

### Quizzes
- `GET /api/quizzes` - Get quizzes
- `POST /api/quizzes` - Create quiz (admin only)
- `POST /api/quizzes/:id/submit` - Submit quiz answers

### Progress
- `GET /api/progress` - Get user progress
- `POST /api/progress` - Update progress

### Health Check
- `GET /api/health` - Server health status

## Database Models

- **User**: User accounts with authentication
- **Admin**: Admin accounts with approval system
- **Topic**: DSA topics and subtopics
- **Assignment**: Coding assignments and submissions
- **Quiz**: Quizzes with questions and answers
- **Progress**: User learning progress tracking

## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS configuration
- Helmet for security headers
- Environment variable protection

## Development

### Database Seeding

To populate your database with initial data:

```bash
npm run seed
```

This will create sample topics, assignments, and quizzes.

### Environment Variables

Key environment variables you need to set:

- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)

## Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Set production environment variables

3. Start the production server:
   ```bash
   npm start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.


