---

## Person 1 — Auth & Foundation Layer (Complete ✓)

**Branch:** `feature/auth-person1`

### What is built
- JWT based user registration and login
- Password hashing using bcryptjs
- Role based access control — Admin, Manager, Member
- Project creation with custom workflow stages
- Add team members to a project
- Reusable auth middleware for the entire backend

### Folder Structure

server/
models/
User.js               → User schema
Project.js            → Project schema
routes/
auth.js               → Register and login
projects.js           → Project endpoints
middleware/
authMiddleware.js     → protect and allowRoles
index.js                → Server entry point

### API Endpoints Ready

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/projects` | Manager, Admin |
| GET | `/api/projects` | Any logged in user |
| POST | `/api/projects/:id/members` | Manager, Admin |

### Middleware usage (for Person 2)
```js
const { protect, allowRoles } = require('../middleware/authMiddleware');

router.post('/tasks', protect, allowRoles('manager', 'admin'), yourFunction);

req.user.id    // logged in user's MongoDB id
req.user.role  // admin / manager / member
```

### Status
- [x] User model
- [x] Project model
- [x] Register and login APIs
- [x] JWT authentication
- [x] Role based middleware
- [x] Project creation and member management
- [x] All endpoints tested in Postman
