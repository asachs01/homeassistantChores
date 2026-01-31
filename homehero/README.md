# HomeHero

A gamified chore tracking and rewards system for families, designed as a Home Assistant add-on.

**Version 1.2.0**

## Features

- **Task Management** - Create tasks with 57 icons, assign dollar values, organize by category
- **Routines** - Group tasks into daily or weekly routines with flexible scheduling
- **Streaks & Milestones** - Track consecutive days; earn bonuses at 7, 14, 30, 60, and 90 days
- **Balance & Earnings** - Children earn money for completed tasks; parents can mark payouts
- **Notifications** - Parents receive alerts on task completion and missed tasks; daily digest
- **Parent Dashboard** - Monitor all children's progress, manage payouts, mark sick days
- **Child Dashboard** - PIN-based login, view tasks, track streaks and earnings
- **Vacation Mode** - Pause routines without breaking streaks
- **Sick Days** - Complete all tasks for a child without earning money; preserves streaks

## Installation

1. Add this repository to your Home Assistant add-on store:
   ```
   https://github.com/asachs01/homehero
   ```
2. Find "HomeHero" in the add-on store and click **Install**
3. Click **Start** - no configuration required

The add-on uses SQLite for self-contained operation. Database is automatically created at `/data/homehero.db`.

## Usage

1. Toggle **Show in sidebar** in the add-on settings
2. Open HomeHero and complete the onboarding wizard
3. Add family members with 4-digit PINs (children) or passwords (parents)
4. Create routines and tasks, assign to children
5. Children log in daily to complete tasks and build streaks
6. Parents monitor progress and manage monthly payouts from the admin panel

## Support

For issues and feature requests, please open an issue on the [GitHub repository](https://github.com/asachs01/homehero).
