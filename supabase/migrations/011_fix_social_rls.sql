-- ============================================================
-- MIGRATION 011: ENABLE RLS AND POLICIES FOR SOCIAL TABLES
-- ============================================================

-- 1. Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_notifications ENABLE ROW LEVEL SECURITY;

-- 2. POSTS Policies
CREATE POLICY "posts_select_all" ON public.posts FOR SELECT USING (true);
CREATE POLICY "posts_insert_own" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_update_own" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "posts_delete_own" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- 3. POST_LIKES Policies
CREATE POLICY "post_likes_select_all" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "post_likes_insert_own" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_likes_delete_own" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- 4. FOLLOWS Policies
CREATE POLICY "follows_select_all" ON public.follows FOR SELECT USING (true);
CREATE POLICY "follows_insert_own" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete_own" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- 5. SOCIAL_NOTIFICATIONS Policies
CREATE POLICY "social_notifications_select_own" ON public.social_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "social_notifications_update_own" ON public.social_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "social_notifications_delete_own" ON public.social_notifications FOR DELETE USING (auth.uid() = user_id);
