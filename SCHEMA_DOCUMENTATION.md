# DocManager – Prisma Schema Documentation

This document explains the Prisma models in `server/prisma/schema.prisma`, how they relate, and how they are used by the API.

## 1) Entity overview

### User
Represents a login-capable account.

Key fields:
- `id`: primary key
- `name`, `email`: identity
- `password`, `salt`: password storage (salted + hashed)
- `imageUrl`: profile image URL (optional)
- `empId`: employee identifier (optional)
- `isActive`: whether the account is allowed to login
- `roleId`: FK to `Role`
- `userTypeId`: FK to `UserType`

Relationships:
- **User → Role**: many users belong to one role
- **User → UserType**: many users belong to one user type

### Role
Represents an authorization group (what a user can do).

Key fields:
- `name`: e.g. `SUPER_ADMIN`, `DOCTOR`
- `permissions`: relation to `RolePermission` (join table)

Relationships:
- **Role → User**: one role can have many users
- **Role ↔ Permission**: many-to-many via `RolePermission`

### Permission
Represents a single capability. Stored as a unique string `key`.

Examples (from seed):
- `MANAGE_USERS`
- `MANAGE_ROLES`
- `VIEW_USERS`
- `VIEW_REPORTS`

Relationships:
- **Permission ↔ Role**: many-to-many via `RolePermission`

### RolePermission
Join table between `Role` and `Permission`.

Constraints:
- `@@unique([roleId, permissionId])` prevents duplicates.

### UserType
Represents a classification / hierarchy of user categories.

Key fields:
- `name`: e.g. `SUPER_ADMIN`, `DOCTOR`, `THERAPIST`
- `parentId`: optional FK to another `UserType`

Relationships:
- **UserType → User**: one user type can have many users
- **UserType → UserType (hierarchy)**: parent/children via `parentId`

## 2) Relationship diagram (conceptual)

```
           ┌───────────────┐
           │   Permission   │
           │  (key unique)  │
           └───────┬───────┘
                   │   many-to-many
                   │   via RolePermission
           ┌───────┴───────┐
           │ RolePermission │
           └───────┬───────┘
                   │
           ┌───────┴───────┐
           │     Role      │
           └───────┬───────┘
                   │  one-to-many
                   │
               ┌───┴───┐
               │ User  │
               └───┬───┘
                   │  one-to-many
                   │
            ┌──────┴──────┐
            │   UserType   │
            │ (hierarchy)  │
            └──────────────┘
```

Important: **Role and UserType are not directly related** in the database. They are both assigned to the user.

## 3) What is Role vs UserType?

### Role = Authorization
Role answers:
- “What can the user do?”

Technically:
- Role gets a list of `Permission` keys through `RolePermission`.

Used in:
- The permission middleware checks whether the logged-in user’s role includes a required permission key.

### UserType = Classification / Hierarchy
UserType answers:
- “What kind of user is this?”
- “Where are they in the hierarchy?”

Technically:
- UserType forms a tree using `parentId`.

Used for:
- Organizational structure, reporting, approval flows, filtering.

## 4) Seed example (what exists by default)

From `server/prisma/seeder/seed.ts`:

### Permissions
Creates keys like:
- `MANAGE_USERS`
- `MANAGE_ROLES`
- `VIEW_USERS`
- `VIEW_REPORTS`
- etc.

### Roles
Creates roles:
- `SUPER_ADMIN` (gets all permissions)
- `DOCTOR`
- `THERAPIST`
- `SALES`

### UserType hierarchy
Creates user types like:
- `SUPER_ADMIN`
  - `DOCTOR`
    - `PSYCHIATRIST`
      - `THERAPIST`
        - `JUNIOR_THERAPIST`
  - `SALES`
    - `TRANSACTION`
      - `APPOINTMENT_MANAGER`

### Super admin user
Creates a default user:
- Email: `admin@system.com`
- Password: `admin123`
- Role: `SUPER_ADMIN`
- UserType: `SUPER_ADMIN`

## 5) API examples (based on implemented endpoints)

Base URL:
- `http://localhost:8002/api` (default in client)

All admin endpoints require:
- `Authorization: Bearer <token>`

### 5.1 Login
`POST /api/login`

Request:
```json
{
  "email": "admin@system.com",
  "password": "admin123"
}
```

Response (example):
```json
{
  "token": "<jwt>",
  "user": {
    "id": "...",
    "name": "Super Admin",
    "email": "admin@system.com",
    "role": "SUPER_ADMIN",
    "imageUrl": "https://..."
  }
}
```

### 5.2 List roles
`GET /api/admin/roles`

Response (example):
```json
{
  "roles": [
    {
      "id": "role1",
      "name": "SUPER_ADMIN",
      "description": "Full system access",
      "permissions": ["MANAGE_USERS", "MANAGE_ROLES"],
      "permissionIds": ["perm1", "perm2"]
    }
  ]
}
```

### 5.3 Create user (assign Role + UserType)
`POST /api/admin/users`

Request:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "john123",
  "empId": "EMP-1001",
  "roleId": "<role_id>",
  "userTypeId": "<user_type_id>",
  "isActive": true
}
```

Notes:
- If `userTypeId` is omitted, server attempts to auto-pick a user type where `UserType.name === Role.name`.

### 5.4 Create permission
`POST /api/admin/permissions`

Request:
```json
{
  "key": "MANAGE_DOCUMENTS",
  "description": "Can create/update documents"
}
```

### 5.5 Assign permissions to a role
`PUT /api/admin/roles/:roleId/permissions`

Request:
```json
{
  "permissionIds": ["perm1", "perm2", "perm3"]
}
```

This replaces the role’s permissions (delete existing then create new).

### 5.6 Create user type
`POST /api/admin/user-types`

Request:
```json
{
  "name": "TEAM_LEAD",
  "parentId": "<optional_parent_user_type_id>"
}
```

## 6) Common patterns

### Checking authorization
To allow an action, you grant the user’s role a permission key.

Example:
- Give role `ADMIN` permission `MANAGE_USERS`.
- Any user whose `roleId` points to `ADMIN` can call the protected endpoints.

### Why you don’t see UserType under Role
Because there is no relation from `Role` to `UserType` in the schema.
If you need a strict mapping, you would add a field like `Role.userTypeId` and migrate the DB.
