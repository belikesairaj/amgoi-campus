-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wing TEXT NOT NULL CHECK (wing IN ('Left Wing', 'Centre Wing', 'Right Wing')),
  name TEXT NOT NULL,
  location TEXT,
  in_charge TEXT,
  contact TEXT,
  directions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster wing queries
CREATE INDEX IF NOT EXISTS idx_rooms_wing ON rooms(wing);

-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Public read access for all rooms
CREATE POLICY "Public can read all rooms"
  ON rooms
  FOR SELECT
  TO public
  USING (true);

-- Admin full access (authenticated users can manage rooms)
CREATE POLICY "Authenticated users can manage rooms"
  ON rooms
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert existing room data
INSERT INTO rooms (wing, name, location, in_charge, contact, directions) VALUES
-- Left Wing
('Left Wing', 'Exam Cell', 'FL-01', 'R P Patil', '8855903003', 'Entrance → Left Wing → 1st Floor → Turn Left → You''ll find Exam Cell'),
('Left Wing', 'First Year HOD Cabin', 'Near FL-03', 'Amol A. Suryavanshi', '9970028737', 'Entrance → Left Wing → 1st Floor → Turn Left → Exam Cell → Go Straight → Turn Right → FY HOD Cabin'),
('Left Wing', 'Seminar Hall', 'FL-10', NULL, NULL, 'Entrance → Left Wing → 1st Floor → Turn Right'),
('Left Wing', 'Physics Lab', 'SL-07', 'A L Chavan', '8055899898', 'Entrance → Left Wing → 2nd Floor → Turn Left → You''ll Find Physics Lab'),
('Left Wing', 'Engg. Mechanics Lab', 'SL-01', 'B R Mali', '9503219059', 'Entrance → Left Wing → 2nd Floor → Go Straight → Turn Left'),
('Left Wing', 'Computational Lab', 'SL-10', 'Prathamesh Ghatage', '9834587810', 'Entrance → Left Wing → 2nd Floor → Turn Right → You''ll Find Computational Lab'),

-- Centre Wing
('Centre Wing', 'Central Library', 'Opposite to MBA Dept.', 'Laxman Khadtare', '9503442145', 'Entrance → Central Stairs → 1st Floor → Turn Right → You''ll Find Central Library'),
('Centre Wing', 'Administration Office', 'Near Entrance', 'Rahul B. Bodake', '9028307500', 'Entrance → Turn Left'),
('Centre Wing', 'Store', 'Near Centre Wing', 'Avinash Patil', '9527824274', 'Entrance → Centre Wing → You will find Store'),

-- Right Wing
('Right Wing', 'Department Of Mechanical Engineering', 'GR 03', NULL, NULL, 'Entrance → Right Wing → Ground Floor → Move Left → You will reach Department Of Mechanical Engineering'),
('Right Wing', 'Air Conditioning Laboratory', 'GR 01', NULL, NULL, 'Entrance → Right Wing → Ground Floor → Move Left → Walk Straight → You will reach'),
('Right Wing', 'CAD/CAM / Incubation Centre / Research and Development Cell', 'GR 08', NULL, NULL, 'Entrance → Right Wing → Ground Floor → Move Right → Walk Straight → You will reach'),
('Right Wing', 'Chemistry Laboratory', 'GR 09', NULL, NULL, 'Entrance → Right Wing → Ground Floor → Move Right → Walk Straight → You will reach'),
('Right Wing', 'Board Room', 'Ground Floor (Left side of Right Wing)', NULL, NULL, 'Entrance → Right Wing → Ground Floor → Move Left → On your left hand → You will reach'),
('Right Wing', 'Department Of Computer Science', 'FR 03', NULL, NULL, 'Entrance → Right Wing → 1st Floor → Move Left → You will reach Department Of Computer Science'),
('Right Wing', 'Project / Network Laboratory', 'FR 01', NULL, NULL, 'Entrance → Right Wing → 1st Floor → Move Left → You will reach Project and Network Laboratory'),
('Right Wing', 'Server Room and Advanced Computing Laboratory', 'FR 05', NULL, NULL, 'Entrance → Right Wing → 1st Floor → Move Left → You will reach Server Room and Advanced Computing Laboratory'),
('Right Wing', 'Web Technology Laboratory and Database Laboratory', 'FR 09', 'S.S. Sarade', '9011464838', 'Entrance → Right Wing → 1st Floor → Move Right → You will reach Web Technology Laboratory and Database Laboratory'),
('Right Wing', 'Department Of AIDS with System Programming Laboratory Programming Laboratory I/II', 'FR 08', 'S.S. Sarade', '9011464838', 'Entrance → Right Wing → 1st Floor → Move Right → You will reach Department Of AIDS with System Programming Laboratory'),
('Right Wing', 'Department Of Electronics and Tele-Communication', 'SR 03', 'D.J. Pawar', '9665159556', 'Entrance → Right Wing → 2nd Floor → Move Left → You will reach Department Of Electronics and Tele-Communication'),
('Right Wing', 'Industry Institute Interaction Laboratory', 'SR 04', 'D.J. Pawar', '9665159556', 'Entrance → Right Wing → 2nd Floor → Move Left → You will reach Industry Institute Interaction Laboratory'),
('Right Wing', 'Yoga and Meditation Hall', 'SR 11', NULL, NULL, 'Entrance → Right Wing → 2nd Floor → Move Right → You will reach Yoga and Meditation Hall'),
('Right Wing', 'Cultural Club', 'SR 10', NULL, NULL, 'Entrance → Right Wing → 2nd Floor → Move Right → You will reach Cultural Club');