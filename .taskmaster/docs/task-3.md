# Task 3: Implement User Authentication with PIN

## Overview
Develop a 4-6 digit PIN-based login system with avatar grid selection for kid-friendly authentication.

## Implementation Details

### 1. Install Dependencies
```bash
npm install jsonwebtoken@9+
npm install -D @types/jsonwebtoken
```

### 2. Avatar Assets (public/avatars/)
Create or source 10+ avatar options:
- Animal avatars (cat, dog, bear, etc.)
- Simple character avatars
- Store as SVG or PNG files
- Define avatar manifest in src/data/avatars.json

### 3. API Endpoints

**GET /api/users** (public - for login screen)
- Returns list of users with: id, name, avatar
- No sensitive data (no PIN hashes)

**POST /api/auth/login**
```json
Request: { "userId": 1, "pin": "1234" }
Response: { "token": "jwt...", "user": { "id", "name", "role", "avatar" } }
```
- Verify PIN against bcrypt hash
- Generate JWT with user info
- Token expiry: 24 hours

**POST /api/auth/logout**
- Invalidate token (optional - can be client-side only)

**GET /api/auth/me**
- Return current user from JWT
- Used to verify session

### 4. JWT Configuration (src/auth/jwt.js)
- Secret from environment variable
- Payload: { userId, role, householdId }
- Expiry: 24 hours
- Middleware: requireAuth, requireAdmin

### 5. Auth Middleware (src/middleware/auth.js)
- Extract JWT from Authorization header
- Verify and decode token
- Attach user to request
- Role-based access: isAdmin middleware

### 6. Frontend Components

**Login Screen (src/components/Login.jsx)**
- Grid of avatar cards (fetch from /api/users)
- Tap avatar to select
- Show large numpad for PIN entry
- Submit on 4-6 digit entry
- Show error feedback for invalid PIN

**Numpad Component (src/components/Numpad.jsx)**
- Large touch targets (64px+ buttons)
- Numbers 0-9, backspace, clear
- Visual feedback on tap

## Test Strategy

- Unit tests for JWT generation/verification
- API tests with Supertest:
  - Successful login with correct PIN
  - Failed login with wrong PIN
  - Token refresh/expiry
  - Protected route access
- Frontend e2e tests with Playwright:
  - Avatar selection flow
  - PIN entry simulation
  - Error state handling

## Acceptance Criteria

- [ ] Avatar assets available (10+ options)
- [ ] Login endpoint validates PIN correctly
- [ ] JWT tokens generated and verified
- [ ] Auth middleware protects routes
- [ ] Login UI is touch-friendly
- [ ] Error feedback is clear
- [ ] All tests pass
