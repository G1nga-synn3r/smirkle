# Smirkle 🎮

> A fun, challenging game where you try not to smile! AI-powered face detection meets engaging gameplay.

[![CI Pipeline](https://github.com/G1nga-synn3r/smirkle/actions/workflows/ci.yml/badge.svg)](https://github.com/G1nga-synn3r/smirkle/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)

## 🎯 What is Smirkle?

Smirkle is a web-based game that challenges players to maintain a poker face while watching funny videos. Using advanced AI-powered face detection, the game detects when you smile, smirk, or laugh - ending your game session and awarding points based on survival time.

**Perfect for**: Fun competitions, skill challenges, and testing your ability to stay serious!

## ✨ Features

- 🎬 **Funny Videos**: Curated library of challenging videos
- 🤖 **AI Face Detection**: Real-time facial expression analysis
- 🎮 **Engaging Gameplay**: 100 levels, 20 badges, checkpoint bonuses
- 🏆 **Leaderboard**: Real-time global rankings via Firestore
- 👥 **Social Features**: Search players, add friends, profile system
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 🔐 **Privacy Controls**: Public/private profile field toggles
- ⚡ **PWA Ready**: Installable as a native app
- 🌐 **Progressive Web App**: Works offline with service workers

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or higher
- npm or yarn
- Modern web browser with camera support

### Local Development

```bash
# Clone repository
git clone https://github.com/G1nga-synn3r/smirkle.git
cd smirkle

# Install dependencies
npm install

# Create local environment file
cp .env.example .env.local

# Add your API keys to .env.local
# (See DEPLOYMENT.md for detailed instructions)

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser!

### Docker Setup

```bash
# Using Docker Compose (recommended for development)
docker-compose up

# Using Docker directly
docker build -t smirkle:latest .
docker run -p 3000:3000 smirkle:latest
```

Visit [http://localhost:3000](http://localhost:3000)!

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Complete deployment guide for all platforms |
| [docs/](./docs/) | Architecture documentation for each feature |
| [.github/workflows/](./github/workflows/) | CI/CD pipeline configurations |

## 🎮 How to Play

1. **Register or Play as Guest** - Create account or jump right in
2. **Watch Your Camera** - Face detection calibrates for accuracy
3. **Watch the Video** - Video plays when your face is detected
4. **Stay Serious** - Don't smile, smirk, or laugh!
5. **Survive Longer** - Earn points for each second you hold it together
6. **Complete Checkpoints** - Reach milestones (5min, 15min, 35min...) for bonus points
7. **Climb the Ranks** - Reach level 100 and earn the "Poker God" badge

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **AI/ML**: face-api.js for facial detection
- **Backend**: Firebase (Firestore, Authentication)
- **Deployment**: Vercel, Railway, Docker, AWS
- **Monitoring**: Optional Sentry integration

### Project Structure
```
smirkle/
├── src/
│   ├── components/        # React components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API & Firestore services
│   ├── utils/            # Helper functions
│   ├── data/             # Static data (videos, constants)
│   └── App.jsx           # Main app component
├── public/               # Static assets
├── docs/                 # Architecture documentation
├── scripts/              # Utility scripts
├── .github/workflows/    # CI/CD pipelines
├── Dockerfile            # Container configuration
├── docker-compose.yml    # Docker Compose setup
├── nginx.conf            # Web server config
└── DEPLOYMENT.md         # Deployment guide
```

## 🔐 Security

- ✅ API keys managed via GitHub Secrets
- ✅ Environment variables for sensitive data
- ✅ CORS properly configured
- ✅ CSP headers in nginx config
- ✅ HTTPS enforced in production
- ✅ Non-root Docker user
- ✅ Regular security audits with `npm audit`
- ✅ Secret scanning in CI/CD pipeline

**⚠️ Never commit `.env` files with real API keys!**

## 📊 Statistics

| Metric | Value |
|--------|-------|
| Game Features | 20+ fully implemented |
| Levels | 1-100 with exponential scaling |
| Badges | 20 (every 5 levels) |
| Checkpoint Milestones | 5 (5min, 15min, 35min, 75min, 155min) |
| Top Leaderboard | 25 players |
| Firebase Collections | 3 (users, scores, profiles) |
| Supported Browsers | All modern browsers with getUserMedia |

## 🎯 Recent Milestones

### v1.2.0 - DevOps Infrastructure (Feb 9, 2026)
- ✅ GitHub Actions CI/CD pipelines
- ✅ Docker containerization
- ✅ Nginx reverse proxy configuration
- ✅ Comprehensive deployment documentation
- ✅ ESLint + Prettier code formatting
- ✅ Jest testing framework setup
- ✅ Security scanning in CI/CD
- ✅ Environment variable management

### v1.1.0 - Progression System (Feb 8, 2026)
- ✅ 100-level progression system
- ✅ 20 themed badges (Poker Face → The Poker God)
- ✅ Checkpoint bonuses (5min, 15min, 35min...)
- ✅ Lifetime score tracking
- ✅ Profile integration with Firestore
- ✅ Level display on user profiles

### v1.0.0 - Core Game (Feb 1, 2026)
- ✅ Face detection with eyes open validation
- ✅ Video playback with smile detection
- ✅ Real-time scoring system
- ✅ Leaderboard (top 25 players)
- ✅ User authentication
- ✅ Profile system with privacy controls
- ✅ Friend system with player search
- ✅ Fullscreen video mode with corner camera

## 📱 Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | ✅ Full Support |
| Firefox | 88+ | ✅ Full Support |
| Safari | 14+ | ✅ Full Support |
| Edge | 90+ | ✅ Full Support |
| Mobile Safari | 14+ | ✅ Full Support |
| Chrome Mobile | 90+ | ✅ Full Support |

**Requirements**: Camera access (getUserMedia) and modern JavaScript

## 🚀 Deployment

### Quick Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

### Deploy to Railway

1. Connect your GitHub repo at [railway.app](https://railway.app)
2. Add environment variables
3. Railway auto-deploys on push to main

### Deploy with Docker

```bash
docker build -t smirkle:latest .
docker-compose up -d
```

**See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions for all platforms.**

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm test:watch

# Coverage report
npm test:coverage
```

## 🔧 Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Fix lint issues
npm run lint:fix

# Format code
npm run format

# Type check
npm run type-check
```

## 🐛 Troubleshooting

### Camera Not Working
- Check browser permissions for camera access
- Ensure HTTPS in production (getUserMedia requires secure context)
- Try allowing popups if using iframe

### Build Fails
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Docker Issues
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up
```

See [DEPLOYMENT.md - Troubleshooting](./DEPLOYMENT.md#troubleshooting) for more help.

## 📊 Performance

- **Bundle Size**: ~250KB (gzipped)
- **Lighthouse Score**: 85+ (FCP: <1.5s, LCP: <2.5s)
- **Time to Interactive**: <3 seconds
- **Offline Capable**: Yes (PWA with service workers)

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Credits

- **Face Detection**: [face-api.js](https://github.com/vladmandic/face-api)
- **UI Framework**: [React](https://react.dev)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Backend**: [Firebase](https://firebase.google.com)
- **Icons**: [Lucide React](https://lucide.dev)

## 📞 Support & Contact

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/G1nga-synn3r/smirkle/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/G1nga-synn3r/smirkle/discussions)
- 📧 **Email**: support@smirkle.dev (if applicable)

## 🎉 Acknowledgments

Built for **DevOps 2026 Hackathon - Kilo Code "Ship It" Competition**

---

<div align="center">

**[🎮 Play Now](https://smirkle.vercel.app)** • **[📖 Read Docs](./DEPLOYMENT.md)** • **[⭐ Star Us](https://github.com/G1nga-synn3r/smirkle)**

*Can you keep a poker face? Prove it with Smirkle! 😎*

</div>
