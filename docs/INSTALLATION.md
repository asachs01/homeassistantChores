# Installation Guide

This guide walks you through installing and configuring the Family Household Manager add-on for Home Assistant.

## Prerequisites

Before installing, ensure you have:

1. **Home Assistant with Supervisor** - The add-on requires Home Assistant OS or a Supervised installation
2. **PostgreSQL Database** - Either the Home Assistant PostgreSQL add-on or an external PostgreSQL server

## Step 1: Set Up PostgreSQL

### Option A: Using Home Assistant PostgreSQL Add-on (Recommended)

1. Navigate to **Settings > Add-ons > Add-on Store**
2. Search for "PostgreSQL" and install the official add-on
3. Start the PostgreSQL add-on
4. Open the add-on's Configuration tab and note the connection details:
   - Host: `core-postgres` (internal hostname)
   - Port: `5432`
   - Database: Create a database named `family_chores`
   - Username/Password: Use the credentials from the add-on configuration

To create the database, access the PostgreSQL terminal:
```sql
CREATE DATABASE family_chores;
```

### Option B: Using External PostgreSQL

If you have an existing PostgreSQL server:

1. Create a new database:
   ```sql
   CREATE DATABASE family_chores;
   ```

2. Create a user with access to the database:
   ```sql
   CREATE USER family_chores_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE family_chores TO family_chores_user;
   ```

3. Ensure your PostgreSQL server is accessible from your Home Assistant instance

## Step 2: Add the Repository

1. Navigate to **Settings > Add-ons > Add-on Store**
2. Click the **three-dot menu** in the top right corner
3. Select **Repositories**
4. Add the Family Household Manager repository URL:
   ```
   https://github.com/your-username/homeassistantChores
   ```
5. Click **Add**
6. The repository will be scanned and the add-on will appear in the store

## Step 3: Install the Add-on

1. Find **"Family Household Manager"** in the add-on store
2. Click on it to view details
3. Click **Install**
4. Wait for the installation to complete (this may take a few minutes)

## Step 4: Configure the Add-on

1. After installation, go to the add-on's **Configuration** tab
2. Enter your PostgreSQL connection details:

```yaml
postgres_host: "core-postgres"
postgres_port: 5432
postgres_db: "family_chores"
postgres_user: "your_username"
postgres_password: "your_password"
```

### Configuration Options

| Option            | Description                           | Default         |
|-------------------|---------------------------------------|-----------------|
| postgres_host     | PostgreSQL server hostname or IP      | (required)      |
| postgres_port     | PostgreSQL server port                | 5432            |
| postgres_db       | Database name                         | family_chores   |
| postgres_user     | Database username                     | (required)      |
| postgres_password | Database password                     | (required)      |

### Using Home Assistant Secrets

For security, you can use Home Assistant secrets for sensitive values:

1. Add to your `secrets.yaml`:
   ```yaml
   postgres_user: your_username
   postgres_password: your_secure_password
   ```

2. Reference in the add-on configuration:
   ```yaml
   postgres_user: "!secret postgres_user"
   postgres_password: "!secret postgres_password"
   ```

## Step 5: Start the Add-on

1. Go to the add-on's **Info** tab
2. Toggle **Start on boot** if desired
3. Toggle **Show in sidebar** to add a menu link
4. Click **Start**
5. Check the **Log** tab for any errors

If the add-on starts successfully, you'll see:
```
Family Household Manager running on port 3000
Streak calculator job scheduled
```

## Step 6: Complete Onboarding

1. Click **Open Web UI** or navigate to:
   ```
   http://[YOUR_HA_IP]:3000
   ```

2. You'll be redirected to the onboarding screen

3. **Create your household**:
   - Enter a name for your household (e.g., "The Smith Family")
   - Click **Create Household**

4. **Create the first parent account**:
   - Enter parent's name
   - Select an avatar
   - Create a 4-6 digit PIN (required for parents)
   - Click **Create Account**

5. You'll be redirected to the login screen

6. **Log in** with the parent account you just created

7. From the admin panel, you can:
   - Add more family members (parents and children)
   - Create tasks
   - Build routines
   - Assign routines to children

## Accessing the Interface

### From Home Assistant Sidebar

If you enabled "Show in sidebar", click **Family Household Manager** in the Home Assistant sidebar.

### Direct URL

Access the web interface directly at:
```
http://[YOUR_HA_IP]:3000
```

### Ingress (Coming Soon)

Full Home Assistant Ingress support is planned for a future release.

## Troubleshooting

### Add-on Won't Start

1. **Check the logs**: Go to the add-on's Log tab for error messages

2. **Database connection issues**:
   - Verify PostgreSQL is running
   - Check hostname/IP is correct
   - Ensure credentials are valid
   - Verify the database exists

3. **Port conflicts**:
   - If port 3000 is in use, another add-on may be using it
   - Check for conflicts in Home Assistant's network settings

### Database Connection Errors

If you see connection errors in the logs:

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

This usually means:
- PostgreSQL is not running
- The hostname is incorrect
- A firewall is blocking the connection

**Solution**: For the HA PostgreSQL add-on, use `core-postgres` as the hostname, not `localhost` or `127.0.0.1`.

### "No household found" After Restart

If the onboarding data is lost after restart:
- Verify PostgreSQL data persistence
- Check that the database is the same one configured in the add-on

### Can't Access Web Interface

1. Verify the add-on is running (check Info tab)
2. Check if the port is exposed correctly
3. Try accessing via IP address instead of hostname
4. Check your network/firewall settings

## Backup and Restore

### Backing Up Data

The Family Household Manager stores all data in PostgreSQL. To back up:

1. **Using Home Assistant**:
   - Create a full Home Assistant backup
   - This includes the PostgreSQL add-on data

2. **Manual PostgreSQL backup**:
   ```bash
   pg_dump -h localhost -U your_user family_chores > backup.sql
   ```

### Restoring Data

1. **From Home Assistant backup**:
   - Restore the full backup
   - Both the add-on and database will be restored

2. **From manual backup**:
   ```bash
   psql -h localhost -U your_user family_chores < backup.sql
   ```

## Updating

When updates are available:

1. Go to **Settings > Add-ons**
2. Click on **Family Household Manager**
3. Click **Update** if available
4. The add-on will restart automatically

Database migrations are handled automatically during startup.

## Uninstalling

To remove the add-on:

1. Go to **Settings > Add-ons**
2. Click on **Family Household Manager**
3. Click **Uninstall**

**Note**: This does not delete the database. To completely remove all data, also delete the `family_chores` database from PostgreSQL.

## Getting Help

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section above
2. Review the add-on logs for specific error messages
3. Search existing GitHub issues
4. Open a new issue with:
   - Home Assistant version
   - Add-on version
   - PostgreSQL version
   - Relevant log entries
   - Steps to reproduce the issue
