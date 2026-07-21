# Task: Build AMGOI Campus 3D Navigation System with Admin Dashboard

## Plan
- [x] Initial 3D Scene Setup
- [x] Campus Expansion and Wing Directory
- [x] Enhance Visual Design
- [x] Update Wing Directory Lists with Real Data
- [x] Implement Admin Dashboard
  - [x] Initialize Supabase backend
  - [x] Create rooms table and migrate data
  - [x] Create database API functions
  - [x] Create AdminLogin page with hardcoded credentials (admin/admin123)
  - [x] Create AdminDashboard page with CRUD operations
  - [x] Update routes to include admin paths
  - [x] Update CampusEntrance to fetch data from Supabase
  - [x] Fix authentication to use simple localStorage-based auth
  - [x] Fix Add Room button form submission
  - [x] Replace API calls with local storage for sandbox compatibility
  - [x] Implement real-time data synchronization between admin and campus navigation
- [x] Add Floating AI Chatbot Button
  - [x] Create fixed position button in bottom-right corner
  - [x] Implement emerald glassmorphism design
  - [x] Add smooth hover animations
  - [x] Link to external chatbot URL
  - [x] Ensure mobile responsiveness
  - [x] Enhance button visibility with larger size and prominent design
  - [x] Add pulsing indicator for attention
  - [x] Add hover tooltip "Ask the Campus AI Assistant"
  - [x] Include subtitle text on desktop
- [x] Update Browser Tab Title
  - [x] Set HTML document title to "CampusWay !!!"
  - [x] Add dynamic title updates for all pages
  - [x] Ensure consistency across campus, admin login, and admin dashboard
- [x] UI Improvements
  - [x] Remove "Rendering System Optimized" debug message
  - [x] Optimize 3D camera framing for mobile devices
- [x] Final Verification

## Notes
- Admin credentials: username: admin, password: admin123
- Room data is stored in localStorage for persistence
- All CRUD operations work locally without backend dependency
- Changes in admin panel are immediately reflected in the campus navigation via custom events
- Real-time synchronization ensures both pages stay in sync
- AI Chatbot accessible via prominent floating button at https://campusway-ai.zapier.app
- Browser tab title: "CampusWay !!!" (main), "CampusWay !!! - Admin Login", "CampusWay !!! - Admin Dashboard"
- Mobile camera optimization: FOV 60° (vs 50° desktop), camera position (0, 250, 450) for full wing visibility
- Chatbot button features: 💬 emoji, "Need Help?" text, subtitle "Campus AI Assistant", pulsing indicator, hover tooltip
