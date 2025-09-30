# Open Mic Queue Manager 🎤

A real-time, mobile-first web application for managing open mic performance queues. Built with Vue 3, TypeScript, and PrimeVue.

## ✨ Features

### For Performers
- 📱 **Mobile-optimized queue viewing** with real-time updates
- ✍️ **Easy signup** with comprehensive form validation
- ⏱️ **Live wait time estimates** with color-coded urgency
- 🔒 **Password-protected slot management**

### For Audience
- 👀 **Live queue display** - see who's performing and who's up next
- 🔄 **Real-time updates** - no manual refresh needed
- 📊 **Clear queue status** - estimated wait times for all performers

### For Venues
- 🖥️ **Projector view** - full-screen display optimized for large screens
- 🎯 **High contrast design** - readable from across the room
- 💤 **Wake lock support** - screen stays on during show
- 🎬 **Smooth transitions** - professional performer changes

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

See [SETUP.md](./SETUP.md) for detailed setup instructions.

## 🏗️ Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe development
- **PrimeVue** - Rich UI component library
- **Pinia** - State management
- **Vue Router** - Client-side routing
- **Vite** - Fast build tool
- **AWS Cognito** - Authentication
- **WebSocket** - Real-time updates

## 📱 Application Views

### Public Queue View (`/event/{eventId}/queue`)
Real-time queue display for performers and audience. Shows current performer with live timer, upcoming queue with ETAs, and signup button.

### Performer Signup (`/event/{eventId}/signup`)
Comprehensive signup form with validation, password creation, and optional fields (leave-by time, extra setup, notes).

### Projector View (`/event/{eventId}/projector`)
Full-screen display optimized for large screens with massive typography, auto-fullscreen, and wake lock support.

### Home (`/`)
Landing page with navigation to different views and event ID entry.

## 📂 Project Structure

```
src/
├── views/              # Page components
├── components/
│   ├── queue/         # Queue display components
│   ├── performer/     # Performer signup/management
│   ├── admin/         # Admin dashboard (TODO)
│   └── shared/        # Shared/reusable components
├── composables/       # Vue composables (useAPI, useWebSocket)
├── services/          # Core services (API, WebSocket, Auth)
├── stores/            # Pinia stores (auth, event, queue)
├── types/             # TypeScript type definitions
├── router/            # Vue Router configuration
└── utils/             # Utility functions
```

## 📖 Documentation

- **[SETUP.md](./SETUP.md)** - Setup and configuration guide
- **[IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md)** - Detailed implementation status
- **[DEVELOPMENT_STATUS.md](./DEVELOPMENT_STATUS.md)** - Architecture and design decisions

## 🔧 Configuration

The app is pre-configured with your deployed AWS backend. Configuration is in `src/config.ts` and can be overridden with environment variables (see `.env.example`).

Current configuration:
- API: `https://ron7jxwp78.execute-api.us-east-1.amazonaws.com/prod/`
- WebSocket: `wss://bfynx6i5u2.execute-api.us-east-1.amazonaws.com/prod`
- Region: `us-east-1`

## 🎯 Implementation Status

### ✅ Complete (75%)
- Core infrastructure (services, stores, routing)
- Queue display components
- Public queue view
- Performer signup
- Projector display

### ⏳ In Progress (25%)
- Admin dashboard
- Event management
- Slot editing for performers

See [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) for full details.

## 🧪 Testing

```bash
# Run tests (when implemented)
npm run test

# Type checking
npm run build
```

## 🚢 Deployment

```bash
# Build for production
npm run build

# The dist/ folder is ready to deploy to:
# - Netlify
# - Vercel
# - AWS S3 + CloudFront
# - Any static hosting service
```

## 📝 License

This project is part of the Open Mic Backend API system.

## 🙏 Acknowledgments

Built with Vue 3, PrimeVue, and modern web technologies for a smooth, real-time experience.
