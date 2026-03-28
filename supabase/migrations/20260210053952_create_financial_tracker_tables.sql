/*
  # Financial Tracker Database Schema

  1. New Tables
    - `expenses`
      - `id` (uuid, primary key) - Unique identifier for each expense
      - `amount` (decimal) - Expense amount
      - `category` (text) - Category of expense (Food, Travel, Shopping, Bills)
      - `date` (date) - Date of the expense
      - `user_id` (uuid) - Reference to user (for future multi-user support)
      - `created_at` (timestamptz) - Timestamp when record was created
    
    - `user_income`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (uuid) - Reference to user
      - `monthly_income` (decimal) - Monthly income amount
      - `month` (integer) - Month number (1-12)
      - `year` (integer) - Year
      - `created_at` (timestamptz) - Timestamp when record was created
      - `updated_at` (timestamptz) - Timestamp when record was updated

  2. Security
    - Enable RLS on both tables
    - Add policies for public access (for demo purposes)
    - In production, these should be restricted to authenticated users
*/

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount decimal NOT NULL,
  category text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  user_id uuid DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT gen_random_uuid(),
  monthly_income decimal NOT NULL DEFAULT 0,
  month integer NOT NULL,
  year integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month, year)
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_income ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to expenses"
  ON expenses
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to expenses"
  ON expenses
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public delete expenses"
  ON expenses
  FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Allow public read access to user_income"
  ON user_income
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to user_income"
  ON user_income
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update to user_income"
  ON user_income
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);