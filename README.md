# 🤖 AgentCraft Backend

A modern, production-ready backend for a full-stack AI-powered chat application built with TypeScript, Express, and MongoDB.

## 📋 Description

This backend provides a robust foundation for AI chat applications with a feature-based modular architecture, comprehensive error handling, and modern development tooling. Built with TypeScript and ESM support for scalable development.

## 🛠 Tech Stack

- **Runtime**: Node.js with TSX for ESM development
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Validation**: Zod (environment variables)
- **Code Quality**: ESLint v8 + Prettier
- **Architecture**: Feature-based modular structure
- **Package Manager**: pnpm

## 📁 Folder Structure

```
server/
├── src/
│   ├── config/              # Configuration files
│   │   ├── db.ts           # MongoDB connection
│   │   └── validateEnv.ts  # Environment validation
│   ├── features/           # Feature modules
│   │   └── chat/          # Chat feature
│   │       ├── chat.controller.ts
│   │       ├── chat.routes.ts
│   │       ├── chat.service.ts
│   │       └── chat.types.ts
│   ├── middlewares/        # Express middlewares
│   │   ├── errorHandler.ts
│   │   └── notFound.ts
│   ├── utils/             # Utility functions
│   └── index.ts           # Application entry point
├── .env.example           # Environment template
├── .gitignore            # Git ignore rules
├── package.json          # Project configuration
├── tsconfig.json         # TypeScript configuration
└── README.md            # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm package manager
- MongoDB Atlas account or local MongoDB instance

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd server
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure the following variables:
   ```env
   MONGODB_URI=your-mongodb-connection-string
   PORT=5000
   ```

4. **Start the development server**
   ```bash
   pnpm dev
   ```

The server will start on `http://localhost:5000` and automatically connect to MongoDB.

## 📜 Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm lint` - Run ESLint code analysis
- `pnpm lint:fix` - Fix ESLint issues automatically
- `pnpm format` - Format code with Prettier

## 🔌 API Routes

### Health Check
- **GET** `/health`
  - **Description**: Server health check
  - **Response**: `{ "status": "ok" }`

### Chat
- **POST** `/api/chat`
  - **Description**: Send a chat message and receive AI response
  - **Body**: `{ "prompt": "Your message here" }`
  - **Response**: `{ "response": "This is your AI response" }`

## 🏗 Architecture

This project follows a **feature-based modular architecture** for scalability:

- **Config**: Environment validation and database setup
- **Features**: Self-contained modules (routes, controllers, services, types)
- **Middlewares**: Reusable Express middlewares
- **Utils**: Shared utility functions

Each feature is organized with:
- `*.routes.ts` - Express route definitions
- `*.controller.ts` - Request/response handling
- `*.service.ts` - Business logic
- `*.types.ts` - TypeScript interfaces

## 🔒 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/agentcraft` |
| `PORT` | Server port number | `5000` |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for scalable AI applications** 