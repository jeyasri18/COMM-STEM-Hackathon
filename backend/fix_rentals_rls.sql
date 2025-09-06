-- Fix RLS policies for rentals table to allow unauthenticated inserts for testing

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own rentals" ON rentals;
DROP POLICY IF EXISTS "Users can insert their own rental requests" ON rentals;
DROP POLICY IF EXISTS "Users can update rentals they own" ON rentals;

-- Create more permissive policies for testing
CREATE POLICY "Allow all reads" ON rentals
    FOR SELECT USING (true);

CREATE POLICY "Allow all inserts" ON rentals
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all updates" ON rentals
    FOR UPDATE USING (true);

-- Alternative: Disable RLS temporarily for testing
-- ALTER TABLE rentals DISABLE ROW LEVEL SECURITY;
