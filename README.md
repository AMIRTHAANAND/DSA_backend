# DSA Learning Platform - Backend API

A comprehensive backend API for the DSA (Data Structures and Algorithms) Learning Platform built with TypeScript, Node.js, Express.js, and MongoDB.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Complete user CRUD operations with profile management
- **Content Management**: Topics, assignments, and quizzes with rich content support
- **Progress Tracking**: Comprehensive learning progress tracking and analytics
- **Admin Dashboard**: Administrative functions and analytics
- **RESTful API**: Well-structured REST API with validation and error handling
- **Security**: Helmet, CORS, rate limiting, and input validation
- **TypeScript**: Full TypeScript support with type safety

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express-validator
- **Security**: Helmet, CORS, bcryptjs
- **Development**: Nodemon, ts-node

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/dsa_learning_platform
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=7d
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system or use MongoDB Atlas.

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production build
   npm run build
   npm start
   ```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update current user profile
- `PUT /api/users/password` - Change password
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)
- `PATCH /api/users/:id/status` - Toggle user status (Admin only)

### Topics
- `GET /api/topics` - Get all published topics
- `GET /api/topics/:slug` - Get topic by slug
- `POST /api/topics` - Create topic (Admin/Instructor only)
- `PUT /api/topics/:id` - Update topic (Admin/Instructor only)
- `DELETE /api/topics/:id` - Delete topic (Admin only)
- `PATCH /api/topics/:id/publish` - Toggle publication (Admin/Instructor only)

### Assignments
- `GET /api/assignments` - Get all published assignments
- `GET /api/assignments/:id` - Get assignment by ID
- `POST /api/assignments` - Create assignment (Admin/Instructor only)
- `PUT /api/assignments/:id` - Update assignment (Admin/Instructor only)
- `DELETE /api/assignments/:id` - Delete assignment (Admin only)
- `PATCH /api/assignments/:id/publish` - Toggle publication (Admin/Instructor only)
- `POST /api/assignments/:id/submit` - Submit assignment solution

### Quizzes
- `GET /api/quizzes` - Get all published quizzes
- `GET /api/quizzes/:id` - Get quiz by ID
- `POST /api/quizzes` - Create quiz (Admin/Instructor only)
- `PUT /api/quizzes/:id` - Update quiz (Admin/Instructor only)
- `DELETE /api/quizzes/:id` - Delete quiz (Admin only)
- `PATCH /api/quizzes/:id/publish` - Toggle publication (Admin/Instructor only)
- `POST /api/quizzes/:id/submit` - Submit quiz answers

### Progress
- `GET /api/progress` - Get user progress
- `POST /api/progress/topic` - Update topic progress
- `POST /api/progress/assignment` - Update assignment progress
- `POST /api/progress/quiz` - Update quiz progress
- `GET /api/progress/stats` - Get progress statistics

### Admin
- `GET /api/admin/dashboard` - Admin dashboard statistics
- `GET /api/admin/users` - Get all users with filtering
- `GET /api/admin/topics` - Get all topics with filtering
- `GET /api/admin/assignments` - Get all assignments with filtering
- `GET /api/admin/quizzes` - Get all quizzes with filtering
- `GET /api/admin/analytics` - Get analytics data

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 👥 User Roles

- **student**: Can access published content and track progress
- **instructor**: Can create and manage content (topics, assignments, quizzes)
- **admin**: Full access to all features including user management

## 📊 Database Models

### User
- Basic profile information
- Role-based access control
- Password hashing with bcrypt

### Topic
- Rich content with code snippets
- Complexity analysis
- Visualizations and examples
- Prerequisites and related topics

### Assignment
- Problem statements and constraints
- Test cases and solutions
- Multiple programming language support
- Scoring and time limits

### Quiz
- Multiple question types
- Scoring and time limits
- Attempt tracking

### Progress
- Comprehensive learning tracking
- Time spent and completion status
- Performance metrics

## 🧪 Development

### Scripts
```bash
npm run dev          # Start development server with nodemon
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
```

### Code Structure
```
src/
├── config/          # Configuration files
├── middleware/      # Custom middleware
├── models/          # Mongoose models
├── routes/          # API route handlers
└── index.ts         # Main server file
```

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API rate limiting
- **Input Validation**: Request validation with express-validator
- **Password Hashing**: bcryptjs for secure password storage
- **JWT**: Secure token-based authentication

## 📈 Performance

- **Database Indexing**: Optimized MongoDB queries
- **Compression**: Response compression
- **Pagination**: Efficient data pagination
- **Caching**: Ready for Redis integration

## 🚀 Deployment

### Environment Variables
Set the following environment variables for production:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dsa_learning_platform
JWT_SECRET=your-production-jwt-secret
JWT_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ALLOWED_ORIGINS=https://yourdomain.com
```

### Build and Deploy
```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please open an issue in the repository or contact the development team.

## 🔮 Future Enhancements

- **Real-time Features**: WebSocket integration for live updates
- **File Uploads**: Support for image and document uploads
- **Advanced Analytics**: Machine learning-based recommendations
- **Mobile API**: Optimized endpoints for mobile applications
- **Caching**: Redis integration for improved performance
- **Testing**: Comprehensive test suite with Jest
- **Documentation**: API documentation with Swagger/OpenAPI

