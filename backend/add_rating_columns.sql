-- Add rating columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS overall_rating DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reliability_rating DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS communication_rating DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS care_rating DECIMAL(3,2) DEFAULT 0.0;

-- Create clothing_ratings table
CREATE TABLE IF NOT EXISTS clothing_ratings (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    clothing_id UUID, -- Reference to your clothing items table
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    quality_rating INTEGER NOT NULL CHECK (quality_rating >= 1 AND quality_rating <= 5),
    style_rating INTEGER NOT NULL CHECK (style_rating >= 1 AND style_rating <= 5),
    condition_rating INTEGER NOT NULL CHECK (condition_rating >= 1 AND condition_rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_ratings table
CREATE TABLE IF NOT EXISTS user_ratings (
    id SERIAL PRIMARY KEY,
    rater_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rated_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    reliability_rating INTEGER NOT NULL CHECK (reliability_rating >= 1 AND reliability_rating <= 5),
    communication_rating INTEGER NOT NULL CHECK (communication_rating >= 1 AND communication_rating <= 5),
    care_rating INTEGER NOT NULL CHECK (care_rating >= 1 AND care_rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE clothing_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies for clothing_ratings
CREATE POLICY "Users can read all clothing ratings" ON clothing_ratings
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own clothing ratings" ON clothing_ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for user_ratings
CREATE POLICY "Users can read all user ratings" ON user_ratings
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own user ratings" ON user_ratings
    FOR INSERT WITH CHECK (auth.uid() = rater_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clothing_ratings_clothing_id ON clothing_ratings(clothing_id);
CREATE INDEX IF NOT EXISTS idx_clothing_ratings_user_id ON clothing_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ratings_rated_user_id ON user_ratings(rated_user_id);
CREATE INDEX IF NOT EXISTS idx_user_ratings_rater_id ON user_ratings(rater_id);
