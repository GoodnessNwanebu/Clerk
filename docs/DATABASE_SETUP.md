# ClerkSmart Database Setup

This document explains how to set up and use the Prisma database for ClerkSmart.

## 🗄️ Database Schema Overview

The database is designed to support all aspects of the ClerkSmart application:

### Core Models
- **User**: Tracks user accounts and preferences
- **Session**: Manages user sessions
- **Department**: Medical departments and subspecialties
- **Case**: Main case data with all associated information
- **Message**: Conversation messages between student and patient
- **ExaminationResult**: Clinical examination findings
- **InvestigationResult**: Laboratory and imaging results
- **Feedback**: Comprehensive feedback and teaching notes
- **PatientProfile**: Patient characteristics and communication style
- **PediatricProfile**: Specialized pediatric patient profiles
- **EmailReport**: Tracks email report delivery

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up Database URL
Add your PostgreSQL database URL to `.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/clerksmart"
```

### 3. Generate Prisma Client
```bash
npm run db:generate
```

### 4. Push Schema to Database
```bash
npm run db:push
```

### 5. Seed the Database
```bash
npm run db:seed
```

## 📊 Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema changes to database |
| `npm run db:migrate` | Create and apply migrations |
| `npm run db:seed` | Seed database with initial data |
| `npm run db:studio` | Open Prisma Studio for database management |

## 🔧 Database Service Functions

The `lib/database.ts` file provides clean APIs for common operations:

### User Management
```typescript
import { createOrGetUser, getUserById, getUserByEmail } from '../lib/database'

// Create or get user
const user = await createOrGetUser('user@example.com', 'UK')

// Get user by ID
const user = await getUserById('user-id')

// Get user by email
const user = await getUserByEmail('user@example.com')
```

### Case Management
```typescript
import { createCase, getCaseById, getUserCases, updateCaseState } from '../lib/database'

// Create new case
const newCase = await createCase({
  diagnosis: 'Acute MI',
  primaryInfo: 'Patient history...',
  openingLine: 'Hello, I\'m Dr. Smith...',
  isPediatric: false,
  difficultyLevel: 'standard',
  userId: 'user-id',
  departmentId: 'department-id'
})

// Get case with all relations
const caseData = await getCaseById('case-id')

// Get user's cases
const cases = await getUserCases('user-id', 20)

// Update case state
await updateCaseState('case-id', {
  preliminaryDiagnosis: 'Suspected MI',
  examinationPlan: 'Cardiac examination...'
})
```

### Message Management
```typescript
import { addMessage, getCaseMessages } from '../lib/database'

// Add message to case
await addMessage({
  sender: 'student',
  text: 'What brings you in today?',
  caseId: 'case-id'
})

// Get all messages for a case
const messages = await getCaseMessages('case-id')
```

### Results Management
```typescript
import { saveExaminationResults, saveInvestigationResults } from '../lib/database'

// Save examination results
await saveExaminationResults('case-id', examinationResultsArray)

// Save investigation results
await saveInvestigationResults('case-id', investigationResultsArray)
```

### Feedback Management
```typescript
import { saveFeedback, saveDetailedFeedback } from '../lib/database'

// Save basic feedback
await saveFeedback('case-id', feedbackObject)

// Save detailed feedback with teaching notes
await saveDetailedFeedback('case-id', detailedFeedbackObject)
```

## 🔄 API Integration

### Updated AI Route
The main AI route (`app/api/ai/route.ts`) now supports database integration:

```typescript
// Example request with database integration
const response = await fetch('/api/ai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'getPatientResponse',
    payload: { /* ... */ },
    userEmail: 'user@example.com',
    userCountry: 'UK',
    caseId: 'case-id'
  })
})
```

### New Cases API
A new API route (`app/api/cases/route.ts`) provides case management:

```typescript
// Create case
const response = await fetch('/api/cases', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'create',
    data: {
      email: 'user@example.com',
      country: 'UK',
      diagnosis: 'Acute MI',
      // ... other case data
    }
  })
})

// Get user's cases
const cases = await fetch('/api/cases?userId=user-id')

// Get specific case
const caseData = await fetch('/api/cases?caseId=case-id')
```

## 📈 Analytics and Statistics

The database enables powerful analytics:

```typescript
import { getUserStats } from '../lib/database'

// Get user statistics
const stats = await getUserStats('user-id')
// Returns: { totalCases, completedCases, completionRate, departmentBreakdown }
```

## 🎯 Benefits of Database Integration

1. **Persistence**: User progress and case data are saved permanently
2. **Analytics**: Track learning progress and performance metrics
3. **User Management**: Support for user accounts and preferences
4. **Case History**: Complete audit trail of all case interactions
5. **Scalability**: Proper data structure for growth
6. **Backup & Recovery**: Database backups and data integrity
7. **Multi-user Support**: Concurrent users with isolated data
8. **Advanced Features**: Email tracking, detailed analytics, etc.

## 🔒 Security Considerations

- All database operations use parameterized queries (Prisma handles this)
- User data is isolated by user ID
- Sensitive data should be encrypted if required
- Database credentials should be kept secure in environment variables

## 🚀 Next Steps

1. **Set up your PostgreSQL database** (local or cloud)
2. **Configure the DATABASE_URL** in your `.env` file
3. **Run the setup commands** above
4. **Update your frontend** to pass userEmail and caseId to API calls
5. **Test the integration** with a simple case creation
6. **Explore Prisma Studio** to view and manage your data

## 🆘 Troubleshooting

### Common Issues

1. **Database connection failed**
   - Check your DATABASE_URL format
   - Ensure database is running and accessible
   - Verify credentials

2. **Schema push failed**
   - Check for syntax errors in schema.prisma
   - Ensure database has proper permissions
   - Try `prisma db push --force-reset` (⚠️ destroys data)

3. **Seed script failed**
   - Ensure constants.ts file exists with departments data
   - Check database connection
   - Verify all required fields are present

### Getting Help

- Check Prisma documentation: https://pris.ly/docs
- Review the schema.prisma file for model definitions
- Use `npm run db:studio` to inspect your database visually 