-- Supabase Database Schema for Polling App

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Polls table
CREATE TABLE public.polls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  allow_multiple_votes BOOLEAN DEFAULT FALSE,
  require_auth BOOLEAN DEFAULT TRUE,
  qr_code_url TEXT,
  total_votes INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}'::jsonb,
  
  -- Check constraint to ensure expiry is in future
  CONSTRAINT check_expiry_future CHECK (expires_at > created_at),
  -- Auto-expire constraint (24 hours max)
  CONSTRAINT check_max_duration CHECK (expires_at <= created_at + INTERVAL '24 hours')
);

-- Poll options table
CREATE TABLE public.poll_options (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  vote_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate options per poll
  UNIQUE(poll_id, text)
);

-- Votes table
CREATE TABLE public.votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
  option_id UUID REFERENCES public.poll_options(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate votes per user per poll (if authenticated)
  UNIQUE(poll_id, user_id),
  -- Prevent duplicate votes per IP per poll (for anonymous voting)
  UNIQUE(poll_id, ip_address)
);

-- Poll views/analytics table
CREATE TABLE public.poll_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_polls_created_by ON public.polls(created_by);
CREATE INDEX idx_polls_active ON public.polls(is_active, expires_at);
CREATE INDEX idx_poll_options_poll_id ON public.poll_options(poll_id);
CREATE INDEX idx_votes_poll_id ON public.votes(poll_id);
CREATE INDEX idx_votes_user_id ON public.votes(user_id);
CREATE INDEX idx_votes_created_at ON public.votes(created_at);
CREATE INDEX idx_poll_views_poll_id ON public.poll_views(poll_id);

-- Functions to update vote counts
CREATE OR REPLACE FUNCTION update_poll_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update option vote count
  UPDATE public.poll_options 
  SET vote_count = (
    SELECT COUNT(*) FROM public.votes 
    WHERE option_id = NEW.option_id
  )
  WHERE id = NEW.option_id;
  
  -- Update total poll vote count
  UPDATE public.polls 
  SET total_votes = (
    SELECT COUNT(*) FROM public.votes 
    WHERE poll_id = NEW.poll_id
  )
  WHERE id = NEW.poll_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update vote counts
CREATE TRIGGER trigger_update_vote_counts
  AFTER INSERT OR DELETE ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION update_poll_vote_counts();

-- Function to auto-deactivate expired polls
CREATE OR REPLACE FUNCTION deactivate_expired_polls()
RETURNS void AS $$
BEGIN
  UPDATE public.polls 
  SET is_active = FALSE 
  WHERE expires_at <= NOW() AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_views ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Polls policies
CREATE POLICY "Polls are viewable by everyone" ON public.polls
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create polls" ON public.polls
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own polls" ON public.polls
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own polls" ON public.polls
  FOR DELETE USING (auth.uid() = created_by);

-- Poll options policies
CREATE POLICY "Poll options are viewable by everyone" ON public.poll_options
  FOR SELECT USING (true);

CREATE POLICY "Poll creators can manage options" ON public.poll_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.polls 
      WHERE polls.id = poll_options.poll_id 
      AND polls.created_by = auth.uid()
    )
  );

-- Votes policies
CREATE POLICY "Votes are viewable by poll creators and voters" ON public.votes
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.polls 
      WHERE polls.id = votes.poll_id 
      AND polls.created_by = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can vote" ON public.votes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.polls 
      WHERE polls.id = poll_id 
      AND polls.is_active = TRUE 
      AND polls.expires_at > NOW()
    )
  );

-- Poll views policies
CREATE POLICY "Poll views are viewable by poll creators" ON public.poll_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.polls 
      WHERE polls.id = poll_views.poll_id 
      AND polls.created_by = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert poll views" ON public.poll_views
  FOR INSERT WITH CHECK (true);
