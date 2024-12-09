# Messenger Project

Modern messenger server with real-time features, supporting voice messages, translations, and extended chat functionalities.

## Features

### Basic Features
- User authentication and registration
- Real-time chat functionality
- File uploads
- Chat rooms and direct messages
- Saved messages system

### Extended Features
- Voice messages transcription (OpenAI Whisper)
- Automatic message translation (Google Translate)
- Multi-language support
- Message voice data analytics

## Technical Stack

- Node.js & Express
- PostgreSQL
- Socket.IO for real-time communication
- JWT Authentication
- OpenAI API integration
- Google Cloud Translation API

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)
- npm or yarn

### Installation
1. Clone the repository
```bash
git clone [repository-url]
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the server
```bash
npm run dev
```

## Development

- `npm run dev` - Start development server
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## Deployment

Deployment is automated via GitHub Actions and triggered on pushes to the main branch.

## Project Structure

```
/
├── src/
│   ├── config/       # Configuration files
│   ├── middlewares/  # Express middlewares
│   ├── routes/       # API routes
│   ├── services/     # Business logic
│   ├── socket/       # Socket.IO handlers
│   └── utils/        # Utility functions
├── uploads/          # File uploads directory
└── scripts/         # Utility scripts
```