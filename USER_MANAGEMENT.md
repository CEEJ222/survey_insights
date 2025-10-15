# User Management & Signup Flow

## Overview

Survey Insights now supports a complete multi-user system with role-based access control. The first user who signs up becomes the **Company Admin** and can invite additional team members with different access levels.

## User Roles

### 1. Company Admin
- **Full system access** - Complete control over all features
- **User management** - Can invite, manage, and remove team members
- **Survey management** - Create, edit, and delete surveys
- **Response access** - View all survey responses and analytics
- **Assigned automatically** to the first user who creates a company account

### 2. Admin
- **Survey management** - Create, edit, and delete surveys
- **Send surveys** - Can send surveys to respondents
- **Response access** - View all survey responses and analytics
- **No user management** - Cannot invite or manage other users

### 3. User (View-Only)
- **View surveys** - Can view existing surveys
- **View responses** - Can view survey responses and analytics
- **Read-only access** - Cannot create, edit, or delete anything

## Signup Flow

### Free Signup Process

1. **Visit Signup Page**: Navigate to `/admin/signup`
2. **Fill Registration Form**:
   - Company Name
   - Full Name
   - Email Address
   - Password (min 6 characters)
   - Confirm Password
3. **Account Creation**:
   - New company is created
   - User is automatically assigned as **Company Admin**
   - Account is active immediately
4. **Login**: After signup, login at `/admin/login`

### What Happens Behind the Scenes

```typescript
// 1. Company is created
companies {
  id: UUID,
  name: "Your Company Name"
}

// 2. User is created in Supabase Auth
auth.users {
  id: UUID,
  email: "admin@company.com"
}

// 3. Admin user record is created with company_admin role
admin_users {
  id: UUID (same as auth.users),
  company_id: UUID,
  role: "company_admin",
  is_active: true
}
```

## User Management

### Accessing User Management

Company Admins will see a **"Team"** menu item in the dashboard navigation. This takes them to `/admin/dashboard/users`.

### Inviting Users

1. Click **"Invite User"** button
2. Fill in the invite form:
   - Full Name
   - Email Address
   - Role (Admin or User)
3. Click **"Invite User"**
4. System generates a temporary password
5. Share the temporary password with the new user (they should change it on first login)

**Note**: In production, you should implement email invitations instead of showing the temporary password.

### Managing Users

Company Admins can:
- **View all team members** with their roles and status
- **Activate/Deactivate users** - Temporarily disable access without deleting the account
- **Delete users** - Permanently remove team members (cannot delete themselves)
- **See user information** - Email, role, and join date

### User Status

- **Active**: User can log in and access the system according to their role
- **Inactive**: User cannot log in, but their account still exists

## API Endpoints

### List Users
```
GET /api/admin/users
```
Returns all users in the authenticated user's company.

**Response**:
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@company.com",
      "full_name": "John Doe",
      "role": "admin",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Invite User
```
POST /api/admin/users
Content-Type: application/json

{
  "email": "newuser@company.com",
  "fullName": "Jane Smith",
  "role": "admin" // or "user"
}
```

**Requirements**:
- Must be a Company Admin
- Email must be unique
- Role must be "admin" or "user"

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "newuser@company.com",
    "full_name": "Jane Smith",
    "role": "admin"
  },
  "tempPassword": "abc123XYZ!"
}
```

### Update User
```
PATCH /api/admin/users/[id]
Content-Type: application/json

{
  "role": "admin", // optional
  "isActive": false // optional
}
```

**Requirements**:
- Must be a Company Admin
- Cannot update your own account
- User must be in the same company

### Delete User
```
DELETE /api/admin/users/[id]
```

**Requirements**:
- Must be a Company Admin
- Cannot delete your own account
- User must be in the same company

## Database Schema Updates

### admin_users Table

```sql
CREATE TABLE admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    invited_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_role CHECK (role IN ('company_admin', 'admin', 'user'))
);
```

### Row Level Security (RLS) Policies

**Users can view all team members in their company**:
```sql
CREATE POLICY admin_users_select_own_company ON admin_users
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM admin_users WHERE id = auth.uid()
        )
    );
```

**Company admins can manage users**:
- Insert new users to their company
- Update users in their company
- Delete users in their company (except themselves)

**Survey access based on roles**:
- All active users can view surveys
- Company admins and admins can create/edit/delete surveys
- Users (view-only) can only read surveys

## Security Considerations

### Data Isolation
- Users can only access data from their own company
- Row Level Security (RLS) enforces company boundaries
- Cannot view or modify data from other companies

### Permission Checks
- All API endpoints verify user authentication
- Role-based checks ensure proper authorization
- Company admin verification for sensitive operations

### Password Security
- Passwords are hashed by Supabase Auth
- Temporary passwords should be changed on first login
- Minimum password length: 6 characters

## Helper Functions

### Check User Permissions

```typescript
import { canManageUsers, canManageSurveys, isCompanyAdmin } from '@/lib/auth'

// Check if user can manage team members
const { user } = await getCurrentUser()
const canManage = await canManageUsers(user.id)

// Check if user can manage surveys
const canEdit = await canManageSurveys(user.id)

// Check if user is company admin
const isAdmin = await isCompanyAdmin(user.id)
```

### Role-Based UI Rendering

```typescript
// In React components
const [isAdmin, setIsAdmin] = useState(false)

useEffect(() => {
  const checkPermissions = async () => {
    const { user } = await getCurrentUser()
    if (user) {
      const hasPermission = await canManageUsers(user.id)
      setIsAdmin(hasPermission)
    }
  }
  checkPermissions()
}, [])

// Conditional rendering
{isAdmin && (
  <Button onClick={handleInviteUser}>Invite User</Button>
)}
```

## Next Steps & Improvements

### Email Integration
Implement proper email invitations:
1. Generate secure invitation tokens
2. Send email with invitation link
3. Allow users to set their own password
4. Add password reset functionality

### Enhanced User Management
- Bulk user import from CSV
- User groups and departments
- Custom permissions beyond three roles
- Audit logs for user actions

### Onboarding
- Welcome email for new users
- First-login tutorial
- Company admin dashboard tour

### Security Enhancements
- Two-factor authentication (2FA)
- Password strength requirements
- Session management
- Login activity tracking

## Troubleshooting

### User Cannot See Team Menu
- Ensure user has `company_admin` role
- Check if user is active (`is_active = true`)
- Verify dashboard layout is loading admin user data

### Cannot Invite Users
- Verify you are a Company Admin
- Check that email is unique
- Ensure Supabase Auth is configured correctly

### RLS Policy Errors
- Ensure database migrations are applied
- Check that RLS policies are enabled
- Verify user is authenticated

### Temporary Password Not Working
- Password must meet minimum requirements
- Check for copy/paste errors
- Try password reset flow if available

## Testing the Flow

### Test Scenario 1: Company Setup
1. Go to `/admin/signup`
2. Create a new company account
3. Verify you see "Team" in the navigation
4. Check your role is "Company Admin"

### Test Scenario 2: User Invitation
1. Login as Company Admin
2. Navigate to Team page
3. Click "Invite User"
4. Add an Admin user
5. Login as the new user
6. Verify they can create surveys but cannot access Team page

### Test Scenario 3: Role Permissions
1. Create a User (view-only) account
2. Login as that user
3. Verify they can view surveys and responses
4. Verify they cannot create or edit surveys
5. Verify they cannot access Team page

## Support

For questions or issues:
1. Check this documentation
2. Review the database schema
3. Inspect API responses for error messages
4. Check browser console for client-side errors
5. Review server logs for API errors

