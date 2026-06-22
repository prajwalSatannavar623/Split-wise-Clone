# Splitwise Clone - Complete Route Structure

## USER ROUTES

<!-- ### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh JWT token -->

<!-- ### User Management
- `GET /api/users/:userId` - Get user profile
- `PUT /api/users/:userId` - Update user profile
- `DELETE /api/users/:userId` - Delete user account
- `GET /api/users/:userId/avatar` - Get user avatar
- `POST /api/users/:userId/avatar` - Upload avatar
- `GET /api/users/search` - Search users by name/email (query params) -->

---

## GROUP ROUTES

<!-- ### Group CRUD
- `POST /api/groups` - Create new group
  - Request body: name, description, admin (userId)
  - Response: Group object with participants -->

<!-- - `GET /api/groups/:groupId` - Get group details
  - Returns: Group info, participants, balances -->

<!-- - `PUT /api/groups/:groupId` - Update group (name, description)
  - Only admin can update -->

<!-- - `DELETE /api/groups/:groupId` - Delete group
  - Only admin can delete -->

### Group Members

- `GET /api/groups/:groupId/members` - Get all group members
- `POST /api/groups/:groupId/members` - Add member to group
  - Request body: userId
- `DELETE /api/groups/:groupId/members/:userId` - Remove member from group
  - Auto-settle balances when removing

- `GET /api/groups/:groupId/balances` - Get member balances in group
  - Returns: Who owes whom how much

### User's Groups

- `GET /api/users/:userId/groups` - Get all groups user is part of
- `GET /api/users/:userId/groups/admin` - Get groups user administers
- `GET /api/users/:userId/favorite-groups` - Get favorite groups
- `POST /api/users/:userId/favorite-groups/:groupId` - Add group to favorites
- `DELETE /api/users/:userId/favorite-groups/:groupId` - Remove from favorites

---

## EXPENSE ROUTES

### Expense CRUD

- `POST /api/expenses` - Create new expense
  - Request body:
    ```json
    {
      "description": "Dinner",
      "amount": 100,
      "currency": "INR",
      "paidBy": "userId",
      "group": "groupId",
      "splitStrategy": "equal|percentage|itemized",
      "splitInfo": [
        { "userId": "id1", "shareAmount": 50 },
        { "userId": "id2", "shareAmount": 50 }
      ]
    }
    ```

- `GET /api/expenses/:expenseId` - Get expense details

- `PUT /api/expenses/:expenseId` - Edit expense
  - Can only edit if user is paidBy or admin

- `DELETE /api/expenses/:expenseId` - Delete expense
  - Can only delete if user is paidBy or admin

### Expense Filtering

- `GET /api/groups/:groupId/expenses` - Get all expenses in group
  - Query params: startDate, endDate, limit, offset
  - Returns: sorted by createdAt desc

- `GET /api/users/:userId/expenses` - Get all expenses for user
  - Query params: type (paid|owed), groupId, startDate, endDate

- `GET /api/expenses/search` - Search expenses
  - Query params: description, minAmount, maxAmount, groupId

---

## SETTLEMENT & BALANCES ROUTES

### User Balances

- `GET /api/users/:userId/balance` - Get total balance (overall)
  - Returns: How much user owes vs is owed

- `GET /api/users/:userId/balance/:otherUserId` - Get balance with specific user
  - Returns: Amount owed (positive = owes, negative = owed)

- `GET /api/users/:userId/balances/detailed` - Get detailed breakdown
  - Returns: Balance with each user across all groups

### Group Balances

- `GET /api/groups/:groupId/summary` - Get group expense summary
  - Returns: Total spent, per person breakdown

- `GET /api/groups/:groupId/settlement` - Get settlement suggestions
  - Returns: Minimum transactions needed to settle all debts

### Settlement

- `POST /api/settlements` - Record payment between users
  - Request body:
    ```json
    {
      "from": "userId",
      "to": "userId",
      "amount": 100,
      "currency": "INR",
      "groupId": "groupId",
      "description": "Payment"
    }
    ```
  - Returns: Settlement object with timestamp

- `GET /api/settlements/:settlementId` - Get settlement details

- `DELETE /api/settlements/:settlementId` - Delete/Undo settlement

- `GET /api/users/:userId/settlements` - Get all user's settlements
  - Query params: groupId, status (pending|completed)

- `GET /api/groups/:groupId/settlements` - Get all settlements in group

---

## DASHBOARD & SUMMARY ROUTES

### Overview

- `GET /api/dashboard/summary` - Get dashboard summary for logged-in user
  - Returns: Total balance, recent expenses, pending settlements

- `GET /api/dashboard/activity` - Get recent activity
  - Returns: Recent expenses, settlements, group changes

- `GET /api/dashboard/statistics` - Get user statistics
  - Returns: Total spent, most common groups, spending trends

### Reports

- `GET /api/reports/expenses` - Expense report
  - Query params: groupId, startDate, endDate, sortBy
  - Returns: Detailed expense breakdown

- `GET /api/reports/balances` - Balance report
  - Query params: groupId
  - Returns: All balances in detail

- `GET /api/reports/settle-up` - Settle-up suggestions
  - Query params: groupId
  - Returns: Minimal payment transactions needed

---

## NOTIFICATION ROUTES (Optional)

- `GET /api/notifications` - Get user notifications
- `POST /api/notifications/:notificationId/read` - Mark notification as read
- `DELETE /api/notifications/:notificationId` - Delete notification
- `GET /api/notifications/settings` - Get notification preferences
- `PUT /api/notifications/settings` - Update notification preferences

---

## COMMON QUERY PARAMETERS

- `limit` - Number of results (default: 20, max: 100)
- `offset` - Pagination offset (default: 0)
- `sortBy` - Sort field (default: createdAt)
- `sortOrder` - asc or desc (default: desc)
- `groupId` - Filter by group
- `startDate` - Filter by start date (ISO 8601)
- `endDate` - Filter by end date (ISO 8601)

---

## RESPONSE FORMAT

### Success Response

```json
{
  "success": true,
  "data": {},
  "message": "Success message"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error code",
  "message": "Detailed error message"
}
```

---

## AUTHENTICATION

All routes (except `/api/auth/*`) require:

- Header: `Authorization: Bearer <JWT_TOKEN>`

---

## MIDDLEWARE FLOW

1. **Auth Middleware** - Validate JWT, attach user to request
2. **Validation Middleware** - Validate request body/params
3. **Authorization Middleware** - Check if user has permission
4. **Route Handler** - Process request
5. **Error Handler** - Catch and format errors

---

## IMPORTANT BUSINESS LOGIC

### When Adding User to Group

- Initialize their balance to 0
- Don't include them in past expenses

### When Removing User from Group

- Settle all pending balances
- Keep historical data (don't delete)

### When Deleting Expense

- Recalculate all user balances in the group
- Update SplitInfo entries

### When Settling Debt

- Update group member balance
- Create settlement record
- Notify both users

### Split Strategies

- **EQUAL**: Divide amount equally among all users
- **PERCENTAGE**: Each user has a percentage
- **ITEMIZED**: Each user pays for specific items
