# Polly - Real-Time Polling App

Polly is a modern, full-stack polling application built with Next.js 15, Supabase, Shadcn UI, and Tailwind CSS. It enables users to create, share, and vote on polls in real time, with a beautiful, responsive interface and robust backend.

---

## 🚀 Features

- **User Authentication**: Secure sign up, login, and logout with Supabase Auth
- **Profile Management**: Edit profile, upload avatar (Supabase Storage), view stats
- **Poll Creation**: Create polls with multiple options, set expiration, and custom settings
- **Voting System**: Vote on polls with duplicate prevention and real-time updates
- **QR Code Sharing**: Generate and share QR codes for polls
- **Real-Time Updates**: Live vote counts and analytics via Supabase subscriptions
- **Settings Page**: Customize poll defaults, account preferences, and dark mode
- **Dark Mode**: Toggleable dark/light theme with persistent settings
- **Responsive UI**: Mobile-first design, custom animations, and Shadcn UI components
- **Security**: Row Level Security, input validation, and protected routes

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
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
  components/      # UI components (Navigation, Avatar, etc.)
  contexts/        # AuthContext, ThemeContext
  hooks/           # Custom hooks (usePollRealtime)
  lib/             # Supabase clients, utils
  types/           # TypeScript types
public/            # Static assets
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
3. **Configure environment variables**
   - Copy `.env.example` to `.env.local`
   - Add your Supabase project URL, anon key, and service role key
4. **Run database migrations**
   - Execute `docs/database-schema.sql` and `docs/storage-setup.sql` in Supabase SQL editor
5. **Start the development server**
   ```bash
   npm run dev
   ```
6. **Access the app**
   - Visit `http://localhost:3000`

---

## 🗄️ Supabase Setup

- Create a Supabase project at [supabase.com](https://supabase.com)
- Run the provided SQL schema and storage setup scripts
- Configure RLS policies for security
- Set up the 'avatars' storage bucket for profile images

---

## 🧩 Key Components

- **AuthContext**: Manages authentication state and user profile
- **Navigation**: Dynamic navbar with user dropdown and signout
- **Profile Page**: Edit profile, upload avatar, view stats
- **Settings Page**: Account settings, dark mode toggle
- **Polls**: Create, view, vote, and share polls
- **API Routes**: RESTful endpoints for polls, votes, uploads
- **Realtime Hooks**: Live updates for poll results

---

## 🛡️ Security & Validation

- Row Level Security (RLS) on all tables
- Duplicate vote prevention (unique constraints)
- Input validation with Zod
- Protected routes via middleware
- Secure file uploads with Supabase Storage

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
- [ ] Performance Optimization
- [ ] Production Deployment
- [ ] Automated Testing

---

## 🤝 Contributing

Pull requests and issues are welcome! Please open an issue for bugs, feature requests, or questions.

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
