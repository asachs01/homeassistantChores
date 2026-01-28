# Task 2: Configure PostgreSQL Database Integration

## Overview
Set up PostgreSQL database connection and initialize schema based on the conceptual data model from the PRD.

## Implementation Details

### 1. Install Dependencies
```bash
npm install pg@8.11+ bcrypt@5+
npm install -D @types/pg @types/bcrypt
```

### 2. Database Configuration (src/db/config.js)
- Read connection string from environment/HA options
- Default: postgresql://localhost:5432/family_chores
- Connection pooling with pg Pool
- Graceful shutdown handling

### 3. Schema Design (src/db/schema.sql)

```sql
-- Households
CREATE TABLE households (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  vacation_mode BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  household_id INTEGER REFERENCES households(id),
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'child')),
  pin_hash VARCHAR(255) NOT NULL,
  avatar VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  household_id INTEGER REFERENCES households(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  type VARCHAR(20) NOT NULL CHECK (type IN ('routine', 'bonus')),
  dollar_value DECIMAL(10,2) DEFAULT 0,
  schedule JSONB DEFAULT '[]',
  time_window JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Task Assignments (many-to-many)
CREATE TABLE task_assignments (
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, user_id)
);

-- Routines
CREATE TABLE routines (
  id SERIAL PRIMARY KEY,
  household_id INTEGER REFERENCES households(id),
  name VARCHAR(255) NOT NULL,
  assigned_user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Routine Tasks (ordered)
CREATE TABLE routine_tasks (
  routine_id INTEGER REFERENCES routines(id) ON DELETE CASCADE,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  PRIMARY KEY (routine_id, task_id)
);

-- Completions
CREATE TABLE completions (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id),
  user_id INTEGER REFERENCES users(id),
  completed_at TIMESTAMP DEFAULT NOW(),
  completion_date DATE NOT NULL,
  UNIQUE(task_id, user_id, completion_date)
);

-- Streaks
CREATE TABLE streaks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  routine_id INTEGER REFERENCES routines(id),
  current_count INTEGER DEFAULT 0,
  best_count INTEGER DEFAULT 0,
  last_completion_date DATE,
  UNIQUE(user_id, routine_id)
);

-- Balances
CREATE TABLE balances (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) UNIQUE,
  current_balance DECIMAL(10,2) DEFAULT 0
);

-- Balance Transactions
CREATE TABLE balance_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  type VARCHAR(20) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_household ON users(household_id);
CREATE INDEX idx_tasks_household ON tasks(household_id);
CREATE INDEX idx_completions_user_date ON completions(user_id, completion_date);
CREATE INDEX idx_completions_task_date ON completions(task_id, completion_date);
```

### 4. Database Initialization (src/db/init.js)
- Check if tables exist
- Run migrations if needed
- Create default household on first run

### 5. PIN Hashing
- Use bcrypt with 12 rounds
- Helper functions: hashPin(pin), verifyPin(pin, hash)

## Test Strategy

- Unit tests for DB connection using Jest
- Test schema creation (tables exist with correct columns)
- Test basic CRUD operations for each table
- Test foreign key constraints
- Test indexes exist

## Acceptance Criteria

- [ ] PostgreSQL connection established and pooled
- [ ] All tables created with correct schema
- [ ] Indexes created for performance
- [ ] PIN hashing works correctly
- [ ] Init script creates default household
- [ ] All tests pass
- [ ] Code follows project conventions
