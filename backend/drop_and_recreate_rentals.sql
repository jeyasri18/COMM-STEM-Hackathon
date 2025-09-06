-- Drop and recreate rentals table to clear any schema cache issues

-- Drop the rentals table if it exists
DROP TABLE IF EXISTS rentals CASCADE;

-- Recreate rentals table with correct schema
CREATE TABLE rentals (
    id SERIAL PRIMARY KEY,
    borrower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_id INTEGER NOT NULL, -- Reference to your clothing items
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,n
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'completed')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;

-- Create policies for rentals
CREATE POLICY "Users can read their own rentals" ON rentals
    FOR SELECT USING (auth.uid() = borrower_id OR auth.uid() = owner_id);

CREATE POLICY "Users can insert their own rental requests" ON rentals
    FOR INSERT WITH CHECK (auth.uid() = borrower_id);

CREATE POLICY "Users can update rentals they own" ON rentals
    FOR UPDATE USING (auth.uid() = owner_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rentals_borrower_id ON rentals(borrower_id);
CREATE INDEX IF NOT EXISTS idx_rentals_owner_id ON rentals(owner_id);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status);
CREATE INDEX IF NOT EXISTS idx_rentals_dates ON rentals(start_date, end_date);
