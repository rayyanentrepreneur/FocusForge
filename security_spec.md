# Security Specification for FocusForge Firestore Database

## 1. Data Invariants

1. **User Identity Boundary**: Every document under `/users/{userId}/...` must strictly belong to the authenticated user (`request.auth.uid == userId`). No user may read, list, create, update, or delete another user's tasks, sessions, or settings.
2. **Immutable Ownership**: The `userId` field inside any entity must match `request.auth.uid` upon creation and can never be changed in updates.
3. **Valid Identifiers**: Path IDs (`userId`, `taskId`, `sessionId`, `settingId`) must be valid alphanumeric strings adhering to `^[a-zA-Z0-9_-]+$` with length `<= 128`.
4. **Task Integrity**:
   - `title`: String with length between 1 and 200 characters.
   - `subject`: String with length between 1 and 60 characters.
   - `priority`: Must be one of `['low', 'medium', 'high']`.
   - `estimatedDuration`: Number between 1 and 1440.
   - `completed`: Boolean.
   - `createdAt`: String length `<= 50`.
   - `id`: Must match the document ID in the path.
5. **Session Integrity**:
   - `durationMinutes`: Number between 0 and 1440.
   - `mode`: Must be one of `['focus', 'short_break', 'long_break']`.
   - `subject`: String length between 1 and 60 characters.
   - `startTime` and `endTime`: String length `<= 50`.
   - `distractions`: List with size `<= 50`.
6. **Settings Integrity**:
   - `studentName`: String length between 1 and 60 characters.
   - `dailyGoalMinutes`: Number between 1 and 1440.
   - `theme`: Must be one of `['dark', 'light']`.
7. **Default Deny**: All unmapped collections or paths must be rejected by a global catch-all rule `match /{document=**} { allow read, write: if false; }`.

---

## 2. The "Dirty Dozen" Malicious Payloads

1. **Payload 1 (Identity Spoofing - Task Write to Other User's Tree)**:
   - Target: `/users/victim_user_123/tasks/task_1`
   - Attacker: `attacker_456`
   - Expected: `PERMISSION_DENIED`
2. **Payload 2 (Unauthenticated Read)**:
   - Target: `/users/student_001/tasks/task_1`
   - Auth: `null`
   - Expected: `PERMISSION_DENIED`
3. **Payload 3 (Cross-User List Query Scraping)**:
   - Target Query: `collectionGroup('tasks')` or `/users/other_user/tasks`
   - Auth: `user_123` querying `user_456`
   - Expected: `PERMISSION_DENIED`
4. **Payload 4 (Owner Tampering on Update)**:
   - Target: `/users/user_123/tasks/task_1`
   - Payload: `{ userId: "different_user_999" }`
   - Expected: `PERMISSION_DENIED`
5. **Payload 5 (Huge String / Denial of Wallet Attack)**:
   - Target: `/users/user_123/tasks/task_1`
   - Payload: `{ title: "A".repeat(100000) }`
   - Expected: `PERMISSION_DENIED`
6. **Payload 6 (Invalid Priority Enum)**:
   - Target: `/users/user_123/tasks/task_1`
   - Payload: `{ priority: "super_critical_admin" }`
   - Expected: `PERMISSION_DENIED`
7. **Payload 7 (Negative Duration)**:
   - Target: `/users/user_123/tasks/task_1`
   - Payload: `{ estimatedDuration: -500 }`
   - Expected: `PERMISSION_DENIED`
8. **Payload 8 (Invalid Document ID Injection / Path Poisoning)**:
   - Target: `/users/user_123/tasks/<script>alert(1)</script>`
   - Expected: `PERMISSION_DENIED`
9. **Payload 9 (Unbounded Distractions Array Injection)**:
   - Target: `/users/user_123/sessions/session_1`
   - Payload: `{ distractions: new Array(500).fill({ note: "spam" }) }`
   - Expected: `PERMISSION_DENIED`
10. **Payload 10 (Invalid Timer Mode Spoofing)**:
    - Target: `/users/user_123/sessions/session_1`
    - Payload: `{ mode: "free_pass_infinite" }`
    - Expected: `PERMISSION_DENIED`
11. **Payload 11 (Shadow Field Injection on Update)**:
    - Target: `/users/user_123/tasks/task_1`
    - Payload: `{ ghostAdminField: true }`
    - Expected: `PERMISSION_DENIED`
12. **Payload 12 (Write to Root / Arbitrary Collection)**:
    - Target: `/system_config/keys` or `/admins/user_123`
    - Expected: `PERMISSION_DENIED`

---

## 3. Test Runner Design

The test runner `firestore.rules.test.ts` uses `@firebase/rules-unit-testing` logic to simulate each scenario and assert that every malicious attempt returns `PERMISSION_DENIED`.
