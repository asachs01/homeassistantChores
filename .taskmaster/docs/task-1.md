# Task 1: Set up Home Assistant Add-on Scaffold

## Overview
Create the basic Home Assistant add-on structure with configuration files and entrypoint.

## Implementation Details

Use the official Home Assistant add-on repository template. The add-on should:

1. **Create add-on directory structure:**
   ```
   family-chores/
   ├── config.yaml          # HA add-on configuration
   ├── Dockerfile           # Container build instructions
   ├── run.sh              # Entrypoint script
   ├── package.json        # Node.js dependencies
   ├── src/
   │   ├── server.js       # Express API server
   │   └── index.html      # Basic frontend placeholder
   └── README.md           # Add-on documentation
   ```

2. **config.yaml requirements:**
   - Name: "Family Household Manager"
   - Version: 1.0.0
   - Expose port 3000 for web UI
   - Configure PostgreSQL connection (port 5432)
   - Set appropriate permissions (homeassistant, api)
   - Define options schema for configuration

3. **Dockerfile:**
   - Base image: Node.js 20 Alpine
   - Install dependencies
   - Copy source files
   - Set entrypoint to run.sh

4. **Express server (src/server.js):**
   - Basic Express app on port 3000
   - Health check endpoint: GET /api/health
   - Static file serving for frontend
   - CORS configuration for HA integration

5. **package.json:**
   - Express v4.18+
   - Basic scripts: start, dev

## Test Strategy

- Verify add-on installs in HA Supervisor without errors
- Verify add-on starts and stays running
- Verify health endpoint returns 200 OK
- Verify web UI is accessible at http://homeassistant.local:3000

## Acceptance Criteria

- [ ] Add-on directory structure created correctly
- [ ] config.yaml is valid HA add-on config
- [ ] Dockerfile builds successfully
- [ ] Express server starts and responds to health check
- [ ] All tests pass
- [ ] Code follows project conventions
- [ ] Atomic, well-messaged commits
