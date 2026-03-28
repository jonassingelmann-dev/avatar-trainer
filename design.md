# HeyGen Avatar Trainer — Mobile App Design

## Brand Identity

The app serves two distinct user types: trainers who configure AI-powered learning experiences, and learners who engage with a live avatar. The visual language should feel authoritative yet approachable — clean, modern, and professional, inspired by enterprise learning platforms but with the warmth of a personal tutor.

**Color Palette:**
- Primary: `#5B4FE9` (deep indigo — trust, intelligence)
- Secondary: `#00C2A8` (teal — energy, interaction)
- Background: `#0F0F1A` (dark navy — immersive, premium)
- Surface: `#1A1A2E` (elevated dark surface)
- Surface2: `#252540` (card backgrounds)
- Foreground: `#F0F0FF` (near-white text)
- Muted: `#8888AA` (secondary text)
- Accent Train: `#5B4FE9` (indigo)
- Accent Challenge: `#FF6B6B` (coral red)
- Accent Ask: `#00C2A8` (teal)
- Accent Watch: `#FFB347` (amber)

---

## Screen List

### Trainer Side
1. **Trainer Home** — Dashboard showing all configured sessions
2. **New Session Setup** — Step-by-step session creation wizard
   - Step 1: Choose Avatar (4 visual options from HeyGen)
   - Step 2: Choose Mode (Train / Challenge / Ask / Watch)
   - Step 3: Upload Documents (PDF, DOCX, TXT)
   - Step 4: Configure (title, description, language, voice)
   - Step 5: Review & Generate Link
3. **Session Detail** — View session info, edit, copy learner link, view stats
4. **Document Manager** — List of uploaded documents per session

### Learner Side
5. **Learner Entry** — Minimal screen shown when opening a shared link (session title, avatar preview, mode badge, Start button)
6. **Avatar Session Screen** — Full-screen live avatar interaction
   - Video feed (avatar occupies top 60% of screen)
   - Mode-specific interaction panel (bottom 40%)
7. **Session Complete** — Summary screen after session ends

### Shared
8. **Role Selector** — Initial screen: "I am a Trainer" / "I am a Learner" (for direct app opens without a link)

---

## Primary Content and Functionality

### Trainer Home
- List of sessions as cards: avatar thumbnail, title, mode badge, learner count, share button
- FAB (+) to create new session
- Empty state with illustration and "Create your first session" CTA

### New Session Setup (Wizard)
- Progress indicator (5 steps)
- Avatar selection: horizontal scroll of 4 avatar cards with name and preview image
- Mode selection: 4 large cards with icon, name, and description
- Document upload: drag-drop area + file picker, shows uploaded file list with remove option
- Config form: text inputs for title, description; language picker; voice picker
- Review: summary of all choices, "Generate Learner Link" button

### Session Detail
- Header with avatar preview and session title
- Mode badge and status indicator
- Learner link with copy + share buttons
- Document list (read-only)
- Edit and Delete actions

### Learner Entry
- Full-screen gradient background matching the mode color
- Avatar name and session title
- Mode badge with icon
- Brief description of what to expect
- Large "Start Session" button
- Subtle animated avatar preview (static image with pulse effect)

### Avatar Session Screen
- **Train Mode**: Avatar explains content; learner can tap to ask follow-up questions; text transcript shown below
- **Challenge Mode**: Avatar poses questions; learner answers via voice or text; avatar gives feedback
- **Ask Mode**: Free-form Q&A; text input + voice input; avatar responds from knowledge base
- **Watch Mode**: Avatar presents content; learner watches; minimal controls (pause, replay, end)
- Common controls: mute mic, end session, fullscreen toggle

### Session Complete
- Congratulation message
- Session duration
- Key topics covered (from transcript)
- "Return to Home" button

---

## Key User Flows

### Trainer Creates a Session
1. Opens app → Role Selector → "I am a Trainer"
2. Trainer Home → FAB (+) → New Session Setup
3. Selects avatar → Selects mode (e.g., "Train") → Uploads PDF document
4. Fills in title and description → Taps "Generate Link"
5. Session Detail screen shows → Copies learner link → Shares via system share sheet

### Learner Joins a Session
1. Receives link (e.g., `heygen-trainer://session/abc123`) → Opens app
2. Learner Entry screen loads with session info
3. Taps "Start Session" → App requests microphone permission
4. Avatar Session Screen opens → HeyGen streaming session starts
5. Interacts with avatar based on mode
6. Taps "End Session" → Session Complete screen

---

## Layout Principles

- **Portrait-first**: All screens designed for 9:16 ratio, one-handed use
- **Dark theme default**: Immersive experience for avatar interaction
- **Bottom-heavy controls**: Primary actions always reachable with thumb
- **Avatar prominence**: On the session screen, the avatar video is the hero element
- **Mode color coding**: Each mode has a distinct accent color used consistently across badges, buttons, and backgrounds
- **Minimal chrome on session screen**: During avatar interaction, UI chrome is minimal to maximize immersion

---

## Navigation Structure

```
App Root
├── Role Selector (initial screen, no tab bar)
├── Trainer Stack
│   ├── Trainer Home (tab: home)
│   ├── New Session Wizard (modal)
│   └── Session Detail (push)
└── Learner Stack
    ├── Learner Entry (from deep link or direct)
    └── Avatar Session (full screen modal)
        └── Session Complete (replace)
```
