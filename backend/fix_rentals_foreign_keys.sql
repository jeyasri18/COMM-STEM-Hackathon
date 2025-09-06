-- Fix foreign key constraints in rentals table to reference the correct user table

-- Drop the existing rentals table
DROP TABLE IF EXISTS rentals CASCADE;

-- Recreate rentals table with correct foreign key references
CREATE TABLE rentals (
    id SERIAL PRIMARY KEY,
    borrower_id UUID NOT NULL, -- Reference to user_profiles.user_id
    listing_id UUID NOT NULL, -- Reference to clothing table UUID
    owner_id UUID NOT NULL, -- Reference to user_profiles.user_id
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'completed')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for testing
CREATE POLICY "Allow all reads" ON rentals
    FOR SELECT USING (true);

CREATE POLICY "Allow all inserts" ON rentals
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all updates" ON rentals
    FOR UPDATE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rentals_borrower_id ON rentals(borrower_id);
CREATE INDEX IF NOT EXISTS idx_rentals_owner_id ON rentals(owner_id);
CREATE INDEX IF NOT EXISTS idx_rentals_listing_id ON rentals(listing_id);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status);
CREATE INDEX IF NOT EXISTS idx_rentals_dates ON rentals(start_date, end_date);
