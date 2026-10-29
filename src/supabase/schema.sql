-- ========================================================================
-- LÀNG SÓI — WEREWOLF ONLINE
-- Supabase Database Schema & Realtime Functions
-- ========================================================================

-- Kích hoạt extension cần thiết
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BẢNG PHÒNG CHƠI (rooms)
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL,
    host_id TEXT NOT NULL,
    phase VARCHAR(30) NOT NULL DEFAULT 'LOBBY',
    day_count INT NOT NULL DEFAULT 0,
    night_count INT NOT NULL DEFAULT 0,
    settings JSONB NOT NULL DEFAULT '{
        "maxPlayers": 8,
        "dayDiscussionDuration": 90,
        "votingDuration": 45,
        "nightActionDuration": 30,
        "allowBlankVote": true,
        "revealRoleOnDeath": true,
        "allowSelfGuard": false,
        "witchCanUseBothSameNight": false
    }'::jsonb,
    role_distribution JSONB NOT NULL DEFAULT '{
        "WEREWOLF": 2,
        "SEER": 1,
        "BODYGUARD": 1,
        "WITCH": 1,
        "VILLAGER": 3
    }'::jsonb,
    phase_ends_at TIMESTAMPTZ,
    active_night_target TEXT,
    witch_saved_target BOOLEAN DEFAULT false,
    witch_poisoned_target_id TEXT,
    last_dead_player_ids JSONB DEFAULT '[]'::jsonb,
    winner_team VARCHAR(20),
    win_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. BẢNG NGƯỜI CHƠI (players)
CREATE TABLE IF NOT EXISTS public.players (
    id TEXT NOT NULL, -- Session ID từ client
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    avatar_seed VARCHAR(50) NOT NULL DEFAULT 'wolf1',
    is_host BOOLEAN NOT NULL DEFAULT false,
    is_alive BOOLEAN NOT NULL DEFAULT true,
    is_connected BOOLEAN NOT NULL DEFAULT true,
    seat_number INT NOT NULL DEFAULT 1,
    role VARCHAR(30), -- 'WEREWOLF' | 'VILLAGER' | 'SEER' | 'BODYGUARD' | 'WITCH'
    witch_potions JSONB NOT NULL DEFAULT '{"heal": true, "poison": true}'::jsonb,
    last_protected_target_id TEXT,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (id, room_id)
);

-- 3. BẢNG HÀNH ĐỘNG GAME (game_actions)
CREATE TABLE IF NOT EXISTS public.game_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    phase VARCHAR(30) NOT NULL,
    actor_id TEXT NOT NULL,
    target_id TEXT,
    action_type VARCHAR(30) NOT NULL,
    result TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. BẢNG TIN NHẮN CHAT (game_messages)
CREATE TABLE IF NOT EXISTS public.game_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    sender_name VARCHAR(50) NOT NULL,
    sender_role VARCHAR(30),
    channel VARCHAR(20) NOT NULL DEFAULT 'PUBLIC', -- 'PUBLIC' | 'WEREWOLVES' | 'SYSTEM' | 'SEER_PRIVATE'
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. BẢNG NHẬT KÝ VÁN CHƠI (game_logs)
CREATE TABLE IF NOT EXISTS public.game_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    day INT NOT NULL DEFAULT 0,
    phase VARCHAR(30) NOT NULL,
    content TEXT NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- BẬT REALTIME CHO CÁC BẢNG
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_actions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_logs;

-- ========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================================

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_logs ENABLE ROW LEVEL SECURITY;

-- Cho phép đọc / ghi mở cho anonymous session token trong game phòng
CREATE POLICY "Public read rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Public insert rooms" ON public.rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update rooms" ON public.rooms FOR UPDATE USING (true);

CREATE POLICY "Public read players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Public insert players" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update players" ON public.players FOR UPDATE USING (true);
CREATE POLICY "Public delete players" ON public.players FOR DELETE USING (true);

CREATE POLICY "Public read actions" ON public.game_actions FOR SELECT USING (true);
CREATE POLICY "Public insert actions" ON public.game_actions FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read messages" ON public.game_messages FOR SELECT USING (true);
CREATE POLICY "Public insert messages" ON public.game_messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read logs" ON public.game_logs FOR SELECT USING (true);
CREATE POLICY "Public insert logs" ON public.game_logs FOR INSERT WITH CHECK (true);

-- INDEXES CHO TỐI ƯU HIỆU NĂNG REALTIME
CREATE INDEX IF NOT EXISTS idx_rooms_code ON public.rooms(code);
CREATE INDEX IF NOT EXISTS idx_players_room_id ON public.players(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON public.game_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_actions_room_id ON public.game_actions(room_id);
