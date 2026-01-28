# Task 5: Develop Task CRUD Operations

## Overview
Implement full create/read/update/delete operations for household tasks with assignments and scheduling.

## Implementation Details

### 1. API Endpoints (Admin-only)

**POST /api/tasks** - Create task
```json
Request: {
  "name": "Brush teeth",
  "description": "Morning and evening",
  "icon": "🦷",
  "type": "routine",
  "dollarValue": 0,
  "schedule": [0, 1, 2, 3, 4, 5, 6],
  "assignedUsers": [1, 2],
  "timeWindow": { "start": "07:00", "end": "09:00" }
}
Response: { "id": 1, ...task }
```

**GET /api/tasks** - List all tasks
- Query params: ?type=routine|bonus, ?userId=1
- Returns tasks for current household
- Include assigned users

**GET /api/tasks/:id** - Get single task
- Include assigned users and schedule

**PUT /api/tasks/:id** - Update task
- Partial updates allowed
- Update assignments if provided

**DELETE /api/tasks/:id** - Delete task
- Cascade delete assignments
- Soft delete or hard delete?

### 2. Task Model (src/models/task.js)

```javascript
class Task {
  static async create(householdId, data) { }
  static async findAll(householdId, filters) { }
  static async findById(id) { }
  static async update(id, data) { }
  static async delete(id) { }
  static async assignUsers(taskId, userIds) { }
  static async getAssignedUsers(taskId) { }
  static async getTasksForUser(userId, date) { }
}
```

### 3. Validation (src/validators/task.js)
- Name: required, 1-255 chars
- Type: required, enum ['routine', 'bonus']
- DollarValue: required if bonus, >= 0
- Schedule: array of integers 0-6
- AssignedUsers: array of valid user IDs

### 4. Schedule Logic
- Store as JSONB array of day numbers (0=Sunday, 6=Saturday)
- Helper: isScheduledForDate(task, date)
- Time windows optional: { start: "HH:mm", end: "HH:mm" }

### 5. Task Types
- **Routine**: Expected daily tasks (no dollar value)
- **Bonus**: Extra chores with dollar rewards

### 6. Admin-Only Access
- All endpoints require auth + admin role
- Use requireAdmin middleware

## Test Strategy

- API tests with Supertest:
  - Create task with all fields
  - Create task with minimal fields
  - Validation error on invalid data
  - List tasks with filters
  - Update task partially
  - Delete task cascades assignments
  - Non-admin cannot access
- Unit tests:
  - Schedule JSONB serialization
  - Date-based task filtering
  - Validation logic

## Acceptance Criteria

- [ ] Full CRUD for tasks works
- [ ] Task assignments work correctly
- [ ] Schedule stored as JSONB
- [ ] Filtering by type and user works
- [ ] Admin-only access enforced
- [ ] Validation prevents bad data
- [ ] All tests pass
