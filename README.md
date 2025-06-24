# AgentCraft: Neural AI Chat Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0-blue.svg)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-green.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0-green.svg)](https://www.mongodb.com/)
[![Zustand](https://img.shields.io/badge/Zustand-4.4-purple.svg)](https://github.com/pmndrs/zustand)
[![Vitest](https://img.shields.io/badge/Vitest-1.0-yellow.svg)](https://vitest.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

AgentCraft is a production-ready, full-stack AI chat platform built with modern web technologies. It delivers a premium ChatGPT-like experience with intelligent thread management, real-time synchronization, and mobile-first design.

🔗 [Live Demo](https://agentcraft-client-1.onrender.com/)

![AgentCraft Preview](preview.png)

## 🌟 Key Features

- **Advanced Chat Experience**
  - Real-time message synchronization
  - Intelligent thread management
  - Smart auto-scroll behavior
  - Message search and filtering
  - Export conversations (JSON, TXT, MD)

- **Professional UI/UX**
  - Mobile-first responsive design
  - Glass morphism effects
  - Smooth animations and transitions
  - Dark mode support
  - Touch-optimized interactions

- **Enterprise-Grade Security**
  - Google OAuth 2.0 integration
  - JWT with HttpOnly cookies
  - CORS protection
  - Rate limiting
  - XSS prevention

- **Performance Optimized**
  - Code splitting and lazy loading
  - Image optimization
  - Caching strategies
  - Minimized bundle size
  - Optimized API calls

## 🛠️ Tech Stack

### Frontend
- **Core**: React 18, TypeScript 5
- **State Management**: Zustand
- **Styling**: Tailwind CSS, CSS Modules
- **Routing**: React Router 6
- **Build Tool**: Vite
- **Testing**: Vitest, Testing Library
- **Performance**: React Suspense, Code Splitting

### Backend
- **Runtime**: Node.js 18
- **Framework**: Express 4
- **Database**: MongoDB 6
- **Authentication**: Passport.js, JWT
- **API**: Google OAuth2, Gemini AI
- **Testing**: Supertest, Jest
- **Security**: Helmet, CORS, Rate Limiting

## 🏗️ Architecture

```
agentcraft/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── app/           # App initialization
│   │   ├── components/    # Reusable components
│   │   ├── features/      # Feature modules
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API services
│   │   ├── stores/       # Zustand stores
│   │   └── utils/        # Utility functions
│   ├── public/           # Static assets
│   └── tests/            # Frontend tests
│
├── server/                # Backend Express application
│   ├── src/
│   │   ├── config/       # Configuration
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Custom middleware
│   │   ├── models/       # MongoDB models
│   │   ├── routes/       # API routes
│   │   └── services/     # Business logic
│   └── tests/            # Backend tests
│
├── docker/               # Docker configuration
└── docs/                # Documentation
```

## 🔐 Authentication Flow

1. User initiates Google OAuth login
2. Server validates OAuth tokens
3. JWT generated and stored in HttpOnly cookie
4. Secure session maintained with refresh tokens
5. Automatic token refresh handling

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB 6+
- pnpm (recommended) or npm

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/agentcraft.git
cd agentcraft
```

2. Install dependencies:
```bash
# Install root dependencies
pnpm install

# Install client dependencies
cd client && pnpm install

# Install server dependencies
cd ../server && pnpm install
```

3. Set up environment variables:
```bash
# Client
cp client/.env.example client/.env

# Server
cp server/.env.example server/.env
```

4. Start development servers:
```bash
# Start client (from client directory)
pnpm dev

# Start server (from server directory)
pnpm dev
```

### Docker Development

```bash
# Build and run with Docker Compose
docker-compose up --build
```

## 🧪 Testing Strategy

- **Unit Tests**: Components, hooks, utilities
- **Integration Tests**: API endpoints, authentication flow
- **E2E Tests**: Critical user journeys
- **Coverage**: Maintained at >80%

Run tests:
```bash
# Client tests
cd client && pnpm test

# Server tests
cd server && pnpm test

# Coverage reports
pnpm test:coverage
```

## 📦 Deployment

The application is deployed on Render with the following configuration:

### Frontend (Static Site)
- Build Command: `cd client && pnpm install && pnpm build`
- Output Directory: `client/dist`
- Environment: Node 18
- Auto Deploy: Yes

### Backend (Web Service)
- Build Command: `cd server && pnpm install`
- Start Command: `cd server && pnpm start`
- Environment: Node 18
- Health Check: `/health`

## 🔧 Best Practices

- **Code Quality**
  - ESLint + Prettier configuration
  - TypeScript strict mode
  - Consistent code style
  - Comprehensive documentation

- **Security**
  - Regular dependency updates
  - Security headers
  - Input validation
  - Error boundaries

- **Performance**
  - Lazy loading
  - Image optimization
  - Bundle size monitoring
  - Performance monitoring

- **DevOps**
  - CI/CD pipeline
  - Docker support
  - Environment separation
  - Automated testing

## 👤 Author

**Shai Batonya**
- GitHub: [@ShaiBatonya](https://github.com/ShaiBatonya)
- LinkedIn: [Shai Batonya](https://linkedin.com/in/shaibatonya)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React Documentation](https://reactjs.org/)
- [Express Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Google Cloud Platform](https://cloud.google.com/)
