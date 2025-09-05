# Polly - Advanced Real-Time Polling Platform

Polly is a production-ready, full-stack polling application built with Next.js 15, Supabase, Shadcn UI, and modern React. It enables users to create sophisticated polls with multiple voting types, real-time analytics, and comprehensive user management.

---

## 🚀 Features

- **Advanced Poll Types**: Single choice, multiple choice, ranking (drag-and-drop), and rating polls
- **Interactive Voting**: Drag-and-drop ranking, multi-select checkboxes, rating scales (stars, numbers, hearts, thumbs)
- **Real-Time Analytics**: Comprehensive dashboard with charts, device breakdown, engagement metrics
- **User Authentication**: Secure sign up, login, and logout with Supabase Auth
- **Profile Management**: Edit profile, upload avatar (Supabase Storage), view stats
- **QR Code Sharing**: Generate and share QR codes for polls with mobile optimization
- **Real-Time Updates**: Live vote counts and analytics via Supabase subscriptions
- **Advanced Settings**: Poll-specific configurations, voting requirements, custom scales
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Performance**: React.memo optimizations, loading states, error boundaries
- **Security**: Row Level Security, input validation, and protected routes

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **State Management**: Zustand
- **Validation**: Zod with enhanced schemas
- **Charts & Analytics**: Recharts
- **Drag-and-Drop**: @hello-pangea/dnd
- **Testing**: Jest, Testing Library (25+ passing tests)
- **Performance**: React.memo, useMemo optimizations
- **Deployment**: Vercel

---

## 📦 Project Structure

```
src/
  app/
    (auth)/        # Login, register, callback routes
    profile/       # Profile page
    settings/      # Settings page
    create-poll/   # Poll creation
    polls/         # Poll listing and voting
    api/           # API routes (polls, votes, upload)
  components/
    ui/            # Shadcn UI components (Button, Card, etc.)
    voting/        # Advanced voting components (MultipleChoice, Ranking, Rating)
    analytics/     # Analytics dashboard components
    forms/         # Form components and validation
  contexts/        # AuthContext, ThemeContext
  hooks/           # Custom hooks (usePollCreation, useAdvancedVoting, usePollAnalytics)
  services/        # PollService with API communication
  stores/          # Zustand stores for state management
  lib/             # Supabase clients, utils, configuration
  types/           # TypeScript types (Poll, PollTypes, Analytics)
  __tests__/       # Jest test files (25+ passing tests)
public/            # Static assets
docs/              # Documentation and database schema
```

---

## ⚡ Getting Started

1. **Clone the repo**
   ```bash
   git clone https://github.com/Jaaystones/ai_for_dev.git
   cd ai_for_dev/alx-polly
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure Supabase**
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Run the provided SQL schema and storage setup scripts in Supabase SQL editor:
     - `docs/database-schema.sql`
     - `docs/storage-setup.sql`
   - Configure RLS policies for security
   - Set up the 'avatars' storage bucket for profile images
4. **Configure environment variables**
   - Copy `.env.example` to `.env.local`
   - Add your Supabase project URL, anon key, and service role key
5. **Start the development server**
   ```bash
   npm run dev
   ```
6. **Access the app**
   - Visit `http://localhost:3000`

---

## 🧪 Running & Testing

### Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Testing

```bash
npm test             # Run all tests (25+ passing)
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

---

## 📝 Usage Examples

### Creating Advanced Polls

1. **Single Choice**: Traditional one-option selection
2. **Multiple Choice**: Select multiple options with min/max limits
3. **Ranking**: Drag-and-drop to rank options in order of preference
4. **Rating**: Rate each option using stars, numbers, hearts, or thumbs

### Poll Settings

- **Min/Max Selections**: For multiple choice polls
- **Rating Scales**: Customize rating ranges (3-10 scale)
- **Other Options**: Allow custom user input
- **Voting Requirements**: Require explanations for votes
- **Randomization**: Shuffle option order

### Analytics Dashboard

- **Real-time Metrics**: Vote counts, engagement rates, response times
- **Device Breakdown**: Mobile, desktop, tablet usage
- **Geographic Data**: Voting distribution by location
- **Advanced Analytics**: Ranking consensus, rating averages

---

## 🗄️ Architecture

### Service Layer

- **PollService**: Centralized API communication with timeout handling
- **Custom Hooks**: Business logic separation (usePollCreation, useAdvancedVoting)
- **Error Boundaries**: Graceful error handling and user feedback
- **State Management**: Zustand stores with optimistic updates

### Enhanced Components

- **MultipleChoiceVoting**: Checkbox-based selection with limits
- **RankingVoting**: Drag-and-drop with accessibility support
- **RatingVoting**: Interactive scales with multiple visual styles
- **PollAnalyticsDashboard**: Comprehensive metrics with charts

---

## 🛡️ Security & Validation

- **Enhanced Zod Validation**: Type-specific schemas with cross-field validation
- **Row Level Security (RLS)**: Database-level access control
- **Duplicate Vote Prevention**: Unique constraints and IP tracking
- **Input Sanitization**: XSS prevention and data validation
- **Protected Routes**: Middleware-based route protection
- **Error Boundaries**: Secure error handling without data leaks
- **Secure File Uploads**: Supabase Storage with validation

---

## 📱 Accessibility & Performance

### Accessibility

- **ARIA Labels**: Comprehensive screen reader support
- **Keyboard Navigation**: Full keyboard accessibility including drag-and-drop alternatives
- **Focus Management**: Proper focus indicators and tab order
- **Semantic HTML**: Meaningful markup structure

### Performance

- **React Optimizations**: memo, useMemo, useCallback implementations
- **Loading States**: Skeleton components and progressive loading
- **Error Recovery**: Graceful fallbacks and retry mechanisms
- **Bundle Optimization**: Code splitting and dynamic imports

---

## 📱 Mobile & Accessibility

- Fully responsive design
- Accessible components and forms
- Keyboard navigation and focus states

---

## 📝 Development Roadmap

- [x] Authentication & Profile Management
- [x] Poll CRUD & Voting
- [x] Real-Time Updates
- [x] QR Code Sharing
- [x] Dark Mode & Settings
- [x] Supabase Storage Integration
- [x] Security & RLS
- [x] Advanced Voting Features
  - [x] Multiple Choice Voting
  - [x] Ranking Voting (Drag & Drop)
  - [x] Rating Voting (Star Ratings)
- [x] Analytics Dashboard
  - [x] Real-time poll metrics
  - [x] Visual charts and graphs
  - [x] Device and geographic analytics
- [x] Performance Optimization
- [x] Comprehensive Testing Suite (25+ tests)
- [x] Error Boundaries & Accessibility
- [ ] Production Deployment

---

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Connect Repository**:

   ```bash
   # Push your code to GitHub
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**:

   - Visit [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

3. **Custom Domain** (Optional):
   - Add your custom domain in Vercel dashboard
   - Configure DNS settings with your domain provider

### Other Deployment Options

- **Netlify**: Similar process with drag-and-drop deployment
- **Railway**: Full-stack deployment with database hosting
- **Docker**: Use the included Dockerfile for containerized deployment

---

## 🔧 Troubleshooting

### Common Issues

**Build Errors**:

```bash
# Clear cache and reinstall dependencies
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

**Supabase Connection Issues**:

- Verify environment variables in `.env.local`
- Check Supabase project URL and anon key
- Ensure RLS policies are properly configured

**TypeScript Errors**:

```bash
# Type check the entire project
npm run type-check
```

**Testing Issues**:

```bash
# Run tests with verbose output
npm run test -- --verbose
```

### Performance Tips

- Enable React StrictMode for development
- Use React DevTools Profiler for optimization
- Monitor bundle size with `npm run analyze`
- Implement proper image optimization

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run the test suite: `npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Maintain accessibility standards
- Update documentation as needed
- Follow the existing code style

### Issues and Feature Requests

- Check existing issues before creating new ones
- Use clear, descriptive titles
- Provide detailed descriptions and steps to reproduce
- Label issues appropriately

---

## ❓ FAQ

**Q: Can I use this for production?**
A: Yes! The app is production-ready with proper security, error handling, and performance optimizations.

**Q: How do I add new voting types?**
A: Extend the `VotingType` enum and create new voting components following the existing patterns.

**Q: Is real-time functionality reliable?**
A: Yes, powered by Supabase real-time subscriptions with automatic reconnection and error recovery.

**Q: Can I customize the UI?**
A: Absolutely! The app uses a flexible design system with CSS variables and Tailwind classes.

**Q: How secure is the voting system?**
A: Very secure with Row Level Security (RLS), authenticated sessions, and input validation.

---

## 📄 License

MIT

---

## 💡 Inspiration

Built as a modern SaaS demo to showcase scalable full-stack architectures with Next.js and Supabase.

---

## 📣 Connect

- [LinkedIn](https://www.linkedin.com/in/jaaystones)
- [Supabase](https://supabase.com)
- [Next.js](https://nextjs.org)

---

**Polly: Create, share, and vote on polls in real time. Modern, secure, and beautiful.**
