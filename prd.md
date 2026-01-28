# Product Requirements Document: Family Household Manager

**Version:** 1.0  
**Date:** January 28, 2025  
**Author:** Aaron Sachs  
**Status:** Draft

---

## Executive Summary

A self-hosted household management application designed to replace commercial solutions like Skylight at a fraction of the cost. The app helps families manage chores, build healthy habits, and gamify task completion for children. Built as a Home Assistant add-on, it provides a tablet-friendly interface for daily use while giving parents visibility and control over household routines.

---

## Problem Statement

### Pain Points

1. **Inconsistent chore completion:** Household cleaning tasks pile up, leading to overwhelming cleanup sessions or the need to hire help.
2. **Difficulty establishing children's routines:** Kids struggle to follow morning and bedtime routines without constant reminders.
3. **Expensive commercial alternatives:** Products like Skylight cost $650+ and don't integrate with existing smart home infrastructure.
4. **Lack of motivation:** Children need incentive systems to build and maintain healthy habits.

### Target Users

- **Parents/Adults:** Manage household tasks, configure routines, track children's progress, handle payouts
- **Children (ages 5+):** Complete assigned tasks, view progress, earn rewards
- **Younger Children (ages 2-4):** Future support for simplified visual task lists

---

## Product Vision

A light, playful, family-friendly web application that runs as a Home Assistant add-on. Wall-mounted tablets display task dashboards that family members interact with throughout the day. The interface is designed for quick tap-based interactions with clear visual feedback, making it accessible for children while providing robust management tools for parents.

### Design Philosophy

- **Light and playful:** Soft colors, rounded corners, friendly typography
- **Not overly cartoony:** Approachable but mature enough for adults to display in common areas
- **Touch-first:** Large tap targets, minimal typing required
- **Glanceable:** Status should be clear at arm's length

---

## User Personas

### Persona 1: Parent (Admin)

- Configures household members, tasks, and routines
- Reviews completion status and approves bonus chores
- Manages reward payouts
- Receives notifications about task completion and missed items

### Persona 2: Child (Age 8)

- Views personal task dashboard on bedroom tablet
- Taps to mark tasks complete
- Tracks streak progress and earnings
- Claims bonus chores from available board

### Persona 3: Young Child (Age 2-4) — Future Phase

- Simplified visual interface with icons instead of text
- Limited task set (e.g., "put toys away")
- Parent-assisted completion tracking

---

## Feature Requirements

### MVP (Phase 1)

#### 1. User Management

| Requirement | Description |
|-------------|-------------|
| Family onboarding | Guided setup to create household and add family members |
| User roles | Parent (admin) and Child roles with appropriate permissions |
| Kid-friendly authentication | 4-6 digit PIN login per user |
| Avatar selection | Visual identity for each family member |

#### 2. Task Management

| Requirement | Description |
|-------------|-------------|
| Task creation | Parents can create tasks with name, description, and optional icon |
| Task assignment | Assign tasks to specific family members or mark as shared |
| Scheduling | Configure which days each task appears (e.g., daily, weekdays, specific days) |
| Task categories | Routine tasks (expected daily) vs. Bonus chores (above and beyond) |
| Dollar values | Assign monetary value to bonus chores |
| Time windows | Optional deadlines for task completion |

#### 3. Routine Management

| Requirement | Description |
|-------------|-------------|
| Routine grouping | Group tasks into routines (e.g., "Morning Routine", "Bedtime Routine") |
| Routine assignment | Assign routines to specific family members |
| Order/sequence | Define task order within routines |

#### 4. Task Completion

| Requirement | Description |
|-------------|-------------|
| Tap to complete | Single tap marks task as done |
| Visual feedback | Clear state change on completion (color, checkmark, animation) |
| Timestamp tracking | Record when each task was completed |
| Undo capability | Allow unmarking within a reasonable window |

#### 5. Gamification

| Requirement | Description |
|-------------|-------------|
| Streak tracking | Track consecutive days of routine completion |
| Streak rewards | Configurable bonuses for streak milestones (7-day, 30-day, etc.) |
| Running balance | Display accumulated earnings from bonus chores |
| Monthly payout tracking | Show earnings per month, support monthly payout cycle |

#### 6. Dashboard Views

| Requirement | Description |
|-------------|-------------|
| Individual view | Personal dashboard showing user's tasks, streaks, and balance |
| Family dashboard | Overview showing all family members' progress at a glance |
| Grid/button layout | Large, touch-friendly task buttons in responsive grid |

#### 7. Parent Controls

| Requirement | Description |
|-------------|-------------|
| Task configuration | Full CRUD for tasks and routines |
| Vacation mode | Pause all routines without breaking streaks |
| Sick day override | Excuse individual user from tasks for a day |
| Streak protection | Maintain streaks during excused absences |

#### 8. Notifications

| Requirement | Description |
|-------------|-------------|
| Task completion alerts | Notify parents when children complete tasks |
| Missed task alerts | Alert when routine tasks weren't completed |
| Daily digest | Summary of household task completion |
| Delivery flexibility | Support for in-app notifications with Home Assistant integration as stretch goal |

### Phase 2 (Future)

#### Calendar Integration

| Requirement | Description |
|-------------|-------------|
| Google Calendar sync | Bidirectional sync with Google Calendar |
| Apple Calendar sync | Bidirectional sync with Apple Calendar |
| Outlook sync | Bidirectional sync with Outlook Calendar |
| Event awareness | Adjust routines based on calendar events |

#### Home Assistant Deep Integration

| Requirement | Description |
|-------------|-------------|
| HA notifications | Push notifications through Home Assistant |
| Automation triggers | Expose task completion as HA events for automations |
| Physical button support | IoT buttons that sync task completion (e.g., button by dog food turns green when pressed) |
| State exposure | Expose routine/task states to HA for dashboard widgets |

#### Advanced Task Features

| Requirement | Description |
|-------------|-------------|
| Chore rotation | Automatic rotation of task assignments |
| Claim board | Available bonus chores that kids can claim |
| Parent approval | Optional verification step for high-value tasks |

#### Reporting and History

| Requirement | Description |
|-------------|-------------|
| Historical data | Track completion rates over time |
| Streak history | View past streak achievements |
| Payout history | Record of all payouts and earnings |

#### Young Child Support

| Requirement | Description |
|-------------|-------------|
| Icon-based tasks | Visual task representation for pre-readers |
| Simplified UI | Reduced interface complexity |
| Assisted completion | Parent-confirmed task completion |

---

## Technical Requirements

### Architecture

| Component | Specification |
|-----------|---------------|
| Deployment | Home Assistant add-on |
| Database | PostgreSQL |
| Frontend | Web-based, responsive design optimized for tablets |
| Authentication | Self-contained with optional HA user integration |
| API | RESTful API for frontend and future integrations |

### Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Response time | < 200ms for task completion actions |
| Offline support | Basic functionality when HA is unreachable (stretch) |
| Tablet optimization | Primary target: 10" tablets in landscape orientation |
| Browser support | Modern browsers (Chrome, Safari, Firefox) |

### Data Model (Conceptual)

```
Household
├── Users (parents, children)
│   ├── Role (admin/child)
│   ├── PIN
│   └── Avatar
├── Tasks
│   ├── Name, description, icon
│   ├── Type (routine/bonus)
│   ├── Dollar value (if bonus)
│   ├── Schedule (days of week)
│   └── Assigned users
├── Routines
│   ├── Name (Morning, Bedtime, etc.)
│   ├── Assigned user
│   └── Ordered tasks
├── Completions
│   ├── Task reference
│   ├── User reference
│   ├── Timestamp
│   └── Date
├── Streaks
│   ├── User reference
│   ├── Routine reference
│   ├── Current count
│   └── Best count
└── Balances
    ├── User reference
    ├── Current balance
    └── Transaction history
```

---

## User Interface Specifications

### Design System

| Element | Specification |
|---------|---------------|
| Color palette | Soft, warm colors (pastels, muted tones); avoid harsh primary colors |
| Typography | Clean, readable sans-serif; larger sizes for tablet viewing |
| Corners | Rounded (8-16px radius) |
| Buttons | Large tap targets (minimum 48px, preferred 64px+) |
| Spacing | Generous whitespace for touch accuracy |
| Animations | Subtle, satisfying feedback on interactions |

### Key Screens

#### Login Screen
- Grid of family member avatars
- Tap avatar → PIN entry
- Large numpad for PIN input

#### Child Dashboard
- Greeting with avatar and name
- Current routine tasks in grid/list
- Streak counter prominently displayed
- Balance/earnings display
- Quick access to bonus chore board

#### Family Dashboard (Parent View)
- All family members in cards/columns
- Today's completion status per person
- Quick stats (streaks, missed tasks)
- Access to admin functions

#### Task Completion Flow
1. View task in grid
2. Single tap to mark complete
3. Visual/haptic feedback (color change, checkmark animation)
4. Optional: celebratory animation for routine completion

#### Admin/Settings
- Manage family members
- Configure tasks and routines
- Set dollar values and streak rewards
- Vacation mode toggle
- Notification preferences

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Daily active usage | All configured family members interact daily |
| Routine completion rate | > 80% of routine tasks completed on time |
| Streak maintenance | Average streak length increases over first 3 months |
| Time to complete routine | < 30 seconds to check off all routine items |
| Parent satisfaction | Reduced need for verbal reminders |

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Kids game the system (marking done without doing) | Parent notifications; optional approval for bonus chores; trust + verify conversations |
| PostgreSQL complexity with HA add-on | Research HA add-on database patterns; consider SQLite fallback for MVP |
| Tablet always-on display concerns | Implement screen dimming; leverage HA presence detection |
| Novelty wears off | Regular streak rewards; rotating bonus chores; celebrate milestones |

---

## Out of Scope (MVP)

- Mobile native apps (web-only for MVP)
- Multi-household support
- Social/sharing features
- Integration with allowance/banking apps
- Voice control
- Detailed analytics/reporting

---

## Open Questions

1. **App naming:** Need a family-friendly, memorable name
2. **HA add-on architecture:** Research best patterns for HA add-ons with persistent databases
3. **Notification delivery:** Determine best HA notification integration approach
4. **Payout automation:** Define what "automated withdrawal" means in practice (reminder? integration?)

---

## Appendix

### Competitive Analysis

| Product | Price | Pros | Cons |
|---------|-------|------|------|
| Skylight Calendar | $650+ | Beautiful hardware, family-focused | Expensive, no smart home integration |
| Cozi | Free | Calendar sharing, lists | Ad-supported, not gamified |
| OurHome | Free/Paid | Chore tracking, rewards | Limited customization, no HA integration |
| ChoreMonster | Discontinued | Was good for gamification | No longer available |

### Reference: Routine Examples

**Morning Routine (Child)**
1. Wake up (optional tracking)
2. Get dressed
3. Brush teeth
4. Eat breakfast
5. Feed the dog
6. Check backpack

**Bedtime Routine (Child)**
1. Brush teeth
2. Floss
3. Put on pajamas
4. Set out school uniform
5. Set out extracurricular uniforms (if applicable)
6. Reading time

**Bonus Chores**
- Help with dishes ($0.50)
- Vacuum living room ($1.00)
- Help clean bathroom ($2.00)
- Fold laundry ($1.00)
- Take out trash ($0.50)
