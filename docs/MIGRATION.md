# ClerkSmart Migration Plan: Hybrid Context Management

## Overview
This document tracks the migration from the current localStorage-heavy approach to a secure hybrid system where primary context is stored in JWT cookies and secondary context remains in localStorage.

## Migration Goals
- ✅ Secure primary context (diagnosis, answers) in JWT cookies
- ✅ Maintain responsive UX with localStorage for secondary context
- ✅ Implement proper session validation
- ✅ Improve file organization and type safety
- ✅ Enable cross-device case resumption

## Schema Changes Required

### 1. Add Case Session Management
**Why**: Need to track active case sessions for JWT validation and cross-device sync.

```sql
-- New model: CaseSession
model CaseSession {
  id          String   @id @default(cuid())
  caseId      String
  userId      String
  sessionId   String   @unique // JWT session identifier
  isActive    Boolean  @default(true)
  expiresAt   DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  case Case @relation(fields: [caseId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("case_sessions")
}
```

### 2. Add Case Visibility Control
**Why**: Allow users to control which completed cases are visible/retrievable.

```sql
-- Add to Case model
model Case {
  // ... existing fields ...
  isVisible    Boolean  @default(true) // Controls case visibility
  sessionId    String?  @unique // Active session ID for JWT validation
}
```

### 3. Update User Model
**Why**: Add relation to CaseSession for proper session management.

```sql
-- Add to User model relations
model User {
  // ... existing fields ...
  caseSessions CaseSession[]
}
```

## File Organization Improvements

### Current Structure Issues
- API routes scattered across multiple directories
- Types mixed with components
- Database functions not properly organized
- JWT utilities missing

### Implemented Structure
```
Clerk/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── ai/            # AI-related endpoints
│   │   ├── auth/          # Authentication endpoints
│   │   ├── cases/         # Case management endpoints
│   │   └── sessions/      # Session management endpoints
│   ├── clerking/          # Clerking page
│   ├── departments/       # Department selection page
│   ├── feedback/          # Feedback page
│   ├── onboarding/        # Onboarding page
│   ├── practice/          # Practice page
│   ├── saved-cases/       # Saved cases pages
│   ├── summary/           # Summary page
│   └── test-share/        # Test share page
├── components/            # React components
│   ├── emails/            # Email templates
│   └── ...                # Other components
├── constants/             # Constants and data
│   ├── constants.ts       # Main constants
│   └── countries.ts       # Country data
├── context/               # React context providers
├── docs/                  # Documentation
│   ├── MIGRATION.md       # Migration tracking
│   ├── README.md          # Main README
│   ├── DATABASE_*.md      # Database documentation
│   └── RESEND_*.md        # Email setup documentation
├── hooks/                 # Custom React hooks
├── lib/                   # Library code
│   ├── ai/                # AI-related utilities
│   │   ├── ai-utils.ts    # AI utility functions
│   │   ├── ai-wrapper.ts  # AI service wrapper
│   │   ├── geminiService.ts # Gemini service
│   │   └── prompts/       # AI prompts
│   ├── database/          # Database utilities
│   │   ├── database.ts    # Database functions
│   │   └── prisma.ts      # Prisma client
│   ├── jwt/               # JWT utilities
│   ├── middleware/        # API middleware
│   ├── shared/            # Shared utilities
│   │   ├── shareUtils.ts  # Sharing utilities
│   │   ├── department-utils.ts # Department utilities
│   │   └── timeContext.ts # Time context utilities
│   └── storage/           # Storage utilities
│       ├── localStorage.ts # Local storage utilities
│       └── hybrid-storage.ts # Hybrid storage utilities
├── prisma/                # Database schema and migrations
├── public/                # Static assets
├── scripts/               # Build and utility scripts
├── types/                 # TypeScript type definitions
└── ...                    # Configuration files
```

## Migration Steps

### Phase 1: Foundation (Week 1)
- [ ] **Step 1.1**: Create new database migration for schema changes
- [ ] **Step 1.2**: Implement strict TypeScript types for JWT and sessions
- [ ] **Step 1.3**: Create JWT utility functions with proper typing
- [ ] **Step 1.4**: Reorganize file structure for better maintainability

**Expected Behavior**: Database schema updated, types defined, no functional changes yet.

### Phase 2: JWT Implementation (Week 2)
- [ ] **Step 2.1**: Implement JWT creation and validation functions
- [ ] **Step 2.2**: Create session management API endpoints
- [ ] **Step 2.3**: Update case generation to use JWT cookies
- [ ] **Step 2.4**: Implement JWT middleware for API routes

**Expected Behavior**: Case generation creates JWT cookies, primary context secured.

### Phase 3: AI Integration (Week 3)
- [ ] **Step 3.1**: Update AI endpoints to validate JWT sessions
- [ ] **Step 3.2**: Modify patient response generation to use JWT context
- [ ] **Step 3.3**: Update examination/investigation result endpoints
- [ ] **Step 3.4**: Implement session validation for all AI interactions

**Expected Behavior**: AI responses use secure primary context from JWT.

### Phase 4: Frontend Integration (Week 4)
- [ ] **Step 4.1**: Update AppContext to handle JWT-based primary context
- [ ] **Step 4.2**: Modify localStorage to store only secondary context
- [ ] **Step 4.3**: Implement case resumption with JWT validation
- [ ] **Step 4.4**: Update UI to handle session-based case management

**Expected Behavior**: Frontend uses JWT for primary context, localStorage for secondary.

### Phase 5: Case Completion & Feedback (Week 5)
- [ ] **Step 5.1**: Update case completion flow with JWT validation
- [ ] **Step 5.2**: Implement secure feedback generation on backend
- [ ] **Step 5.3**: Add case visibility controls
- [ ] **Step 5.4**: Update saved cases management

**Expected Behavior**: Complete cases saved securely with visibility controls.

### Phase 6: Testing & Polish (Week 6)
- [ ] **Step 6.1**: Comprehensive testing of all flows
- [ ] **Step 6.2**: Error handling and edge cases
- [ ] **Step 6.3**: Performance optimization
- [ ] **Step 6.4**: Documentation updates

**Expected Behavior**: System fully functional with improved security and UX.

## Type Safety Requirements

### Strict TypeScript Implementation
- No `any` types allowed
- Proper interface definitions for all data structures
- Generic types for reusable components
- Union types for discriminated unions
- Proper error handling with typed errors

### Key Type Definitions
```typescript
// JWT Types
interface CaseJWT {
  caseId: string;
  userId: string;
  sessionId: string;
  primaryContext: PrimaryContext;
  iat: number;
  exp: number;
}

// Context Types
interface PrimaryContext {
  diagnosis: string;
  primaryInfo: string;
  openingLine: string;
  patientProfile?: PatientProfile;
  pediatricProfile?: PediatricProfile;
  isPediatric: boolean;
  department: string;
  difficultyLevel: DifficultyLevel;
}

interface SecondaryContext {
  messages: Message[];
  preliminaryDiagnosis: string;
  examinationPlan: string;
  investigationPlan: string;
  examinationResults: ExaminationResult[];
  investigationResults: InvestigationResult[];
  finalDiagnosis: string;
  managementPlan: string;
  feedback: Feedback | ComprehensiveFeedback | null;
}

// Session Types
interface CaseSession {
  id: string;
  caseId: string;
  userId: string;
  sessionId: string;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## Security Considerations

### JWT Security
- Secure cookie settings (httpOnly, secure, sameSite)
- Proper expiration handling
- Session invalidation on logout
- CSRF protection

### Data Validation
- Input validation on all API endpoints
- Type checking for all data structures
- Sanitization of user inputs
- Proper error handling without information leakage

## Testing Strategy

### Unit Tests
- JWT creation and validation
- Session management functions
- Type safety validation
- Database operations

### Integration Tests
- Complete case flow with JWT
- AI interaction with session validation
- Case resumption across devices
- Error handling scenarios

### Security Tests
- JWT tampering attempts
- Session hijacking prevention
- Primary context isolation
- Cross-user data access prevention

## Rollback Plan

### If Issues Arise
1. **Immediate Rollback**: Revert to localStorage-based system
2. **Gradual Migration**: Implement hybrid approach incrementally
3. **Feature Flags**: Use feature flags to enable/disable new system
4. **Data Migration**: Ensure no data loss during transition

## Success Metrics

### Security Metrics
- ✅ Primary context never exposed to frontend
- ✅ All API calls validated with JWT
- ✅ No unauthorized access to case data
- ✅ Session management working correctly

### Performance Metrics
- ✅ Page load times maintained
- ✅ API response times acceptable
- ✅ localStorage usage reduced
- ✅ Cross-device sync working

### User Experience Metrics
- ✅ Case resumption working across devices
- ✅ No disruption to existing workflows
- ✅ Improved error handling
- ✅ Better offline capabilities

## Current Status: Phase 4 - Frontend Integration (Complete)
- [x] Analysis of current system
- [x] Design of hybrid approach
- [x] Schema changes defined
- [x] Implementation plan created
- [x] Type definitions planned
- [x] File organization strategy defined
- [x] **Step 1.1**: Create new database migration for schema changes
- [x] **Step 1.2**: Implement strict TypeScript types for JWT and sessions
- [x] **Step 1.3**: Create JWT utility functions with proper typing
- [x] **Step 1.4**: Create hybrid storage manager for secondary context
- [x] **Step 2.1**: Implement JWT creation and validation functions
- [x] **Step 2.2**: Create session management API endpoints
- [x] **Step 2.3**: Update case generation to use JWT cookies
- [x] **Step 2.4**: Implement JWT middleware for API routes
- [x] **Step 3.1**: Update AI endpoints to validate JWT sessions
- [x] **Step 3.2**: Modify patient response generation to use JWT context
- [x] **Step 3.3**: Update examination/investigation result endpoints
- [x] **Step 3.4**: Implement session validation for all AI interactions

**Completed in Phase 1:**
- ✅ Updated Prisma schema with CaseSession model and visibility controls
- ✅ Created strict TypeScript types with proper organization:
  - `types/shared.ts` - Common types used across multiple files
  - `types/auth.ts` - Authentication and JWT-specific types
  - `types/sessions.ts` - Session management and secondary context types
  - `types/conversation.ts` - Conversation and message types
  - `types/examination.ts` - Examination result types
  - `types/investigation.ts` - Investigation result types
  - `types/diagnosis.ts` - Case and context types
  - `types/feedback.ts` - Feedback and teaching types
  - `types/case-report.ts` - Case report and state types
  - `types/ui.ts` - UI and theme types
  - `types/index.ts` - Clean re-exports from all type files
- ✅ Implemented JWT utility functions in `lib/jwt/case-jwt.ts`
- ✅ Created hybrid storage manager in `lib/storage/hybrid-storage.ts`
- ✅ All types are strictly typed with no `any` usage
- ✅ Proper error handling and validation
- ✅ Eliminated type duplication through proper imports
- ✅ Organized all files with imports at top and exports at bottom

**Completed in Phase 2:**
- ✅ **Step 2.1**: JWT utility functions implemented with proper validation
- ✅ **Step 2.2**: Session management API endpoints created:
  - `POST /api/sessions` - Create new case sessions
  - `GET /api/sessions` - Get active cases for user
  - `POST /api/sessions/validate` - Validate case sessions
  - `POST /api/sessions/invalidate` - Invalidate case sessions
- ✅ **Step 2.3**: Case generation endpoint updated to create JWT cookies and sessions directly
- ✅ **Step 2.4**: JWT middleware created for API route protection
- ✅ Secure cookie handling with httpOnly, secure, and sameSite settings
- ✅ Database session tracking with expiration handling
- ✅ Primary context secured in JWT cookies
- ✅ **Optimization**: Backend-to-backend session creation eliminates double JWT decoding
- ✅ **Type Safety**: Fixed session typing issues across all endpoints

**Completed in Phase 3:**
- ✅ **Step 3.1**: All AI endpoints updated to use JWT middleware:
  - `POST /api/ai/patient-response` - Patient response generation with secure context
  - `POST /api/ai/examination-results` - Examination results with secure context
  - `POST /api/ai/investigation-results` - Investigation results with secure context
  - `POST /api/ai/feedback` - Basic feedback generation with secure context
  - `POST /api/ai/comprehensive-feedback` - Comprehensive feedback with secure context
  - `POST /api/ai/detailed-feedback` - Detailed feedback with secure context
  - `POST /api/ai/patient-profile` - Patient profile generation with secure context
- ✅ **Step 3.2**: Patient response generation now uses secure primary context from JWT
- ✅ **Step 3.3**: Examination and investigation result endpoints secured with JWT validation
- ✅ **Step 3.4**: All AI interactions now require valid JWT sessions
- ✅ **Security Enhancement**: Primary context (diagnosis, answers) never exposed to frontend
- ✅ **Session Validation**: All AI endpoints validate active case sessions
- ✅ **Type Safety**: Strict TypeScript typing maintained across all AI endpoints
- ✅ **Type Safety Improvements**: Fixed PatientProfile type issues and eliminated `any` types:
  - Fixed examination/investigation endpoints to use proper patient context from `primaryInfo`
  - Replaced `any` types with proper union types for `ExaminationResult` and `InvestigationResult`
  - Added proper return types for AI utility functions
  - Fixed `ConsultantTeachingNotes` type usage in detailed feedback endpoint

**Completed in Phase 4:**
- ✅ **Step 4.1**: Updated AppContext to handle JWT-based primary context
  - Modified case generation to use new JWT-based backend API
  - Updated localStorage restoration to only load secondary context
  - Primary context (diagnosis, patient info) now comes from JWT cookies
- ✅ **Step 4.2**: Modified localStorage to store only secondary context
  - Updated `LocalStorageCase` interface to separate primary and secondary context
  - Changed `ConversationStorage` to use `updateSecondaryContext` method
  - Removed primary context storage from localStorage
- ✅ **Step 4.3**: Updated service functions to use JWT-based API
  - Modified `generateClinicalCaseWithDifficulty` to use new backend endpoint
  - Updated `getPatientResponse`, `getInvestigationResults`, `getExaminationResults` to use JWT middleware
  - Added proper TypeScript types for all API responses
- ✅ **Step 4.4**: Implemented case resumption with JWT validation
  - Added `validateCaseSession` function to check JWT validity
  - Added `getActiveCases` function to retrieve user's active cases
  - Added `resumeCase` function to resume cases with JWT validation
  - Updated case restoration logic to validate JWT sessions before restoring
  - Implemented automatic cleanup of invalid sessions
- ✅ **Step 4.5**: Enhanced type safety in localStorage
  - Fixed `any` types in `LocalStorageCase` interface
  - Added proper types for `ExaminationResult[]`, `InvestigationResult[]`, and `Feedback | ComprehensiveFeedback`
  - Ensured strict TypeScript compliance across all localStorage operations

## Current Status: Phase 5 - Case Completion & Feedback (Complete)

### Phase 5 Requirements:
- ✅ **Step 5.1**: Update case completion flow with JWT validation
- ✅ **Step 5.2**: Implement secure feedback generation on backend
- ✅ **Step 5.3**: Generate standard medical case report (rounds format)
- ✅ **Step 5.4**: Add case visibility controls (default: false, user can set to true)
- ✅ **Step 5.5**: Update saved cases management
- ✅ **Step 5.6**: Clear localStorage after successful case completion

### Medical Case Report Specifications:
- **Format**: Standard medical case report (as presented during rounds)
- **Content**: Case details only (no AI feedback)
- **Default visibility**: `false` (hidden by default)
- **User control**: Set to `true` only if user clicks "Save"
- **Analytics**: Handled outside codebase

### Phase 5 Implementation Details:
- ✅ **Case Completion API**: Created `/api/cases/complete` endpoint with JWT validation
- ✅ **Feedback Generation**: Secure backend feedback generation using primary context from JWT
- ✅ **Case Report Generation**: AI-powered standard medical case report generation
- ✅ **Visibility Controls**: API endpoints for managing case visibility (`/api/cases/visibility`)
- ✅ **Saved Cases Management**: API endpoint for retrieving saved cases (`/api/cases/saved`)
- ✅ **localStorage Clearing**: Automatic cleanup after successful case completion
- ✅ **Frontend Integration**: Updated AppContext with new case completion functions
- ✅ **Type Safety**: Strict TypeScript types for all new functionality

## Current Status: Phase 6 - Testing & Polish (In Progress)

### Phase 6 Requirements:
- **Step 6.1**: Comprehensive testing of all flows
- **Step 6.2**: Error handling and edge cases
- **Step 6.3**: Performance optimization
- **Step 6.4**: Documentation updates

### Phase 6 Implementation Details:
- ✅ **Case Completion API**: Fixed JWT middleware integration and database schema issues
- ✅ **Type Safety**: Resolved all TypeScript errors in case completion endpoint
- ✅ **Database Operations**: Fixed Prisma schema compatibility issues
- ✅ **Feedback Generation**: Updated to match ComprehensiveFeedback type structure
- ✅ **Code Cleanup**: Removed redundant localStorage-based save functions and API endpoints
- ✅ **AppContext Simplification**: Eliminated background save queue and retry logic
- ✅ **AI Integration**: Fixed comprehensive feedback to call actual AI service
- ✅ **Component Updates**: Updated all components to use new JWT-based system:
  - Fixed `app/summary/page.tsx` - Removed old save functions, updated to use JWT system
  - Fixed `app/clerking/page.tsx` - Removed old save functions, fixed department type issues
  - Fixed `app/feedback/page.tsx` - Updated to use `completeCaseWithJWT`, fixed department type issues
  - Fixed `context/AppContext.tsx` - Updated case generation to use JWT-based backend API
- ✅ **Type Safety**: Fixed all department type issues (string vs object)

**Next Step**: Begin comprehensive testing of all JWT-based flows and error handling.

## **📁 File Structure Reorganization (Complete)**

### **Reorganization Summary:**
- ✅ **Created `docs/` folder**: Moved all markdown documentation files
- ✅ **Created `constants/` folder**: Moved constants and country data
- ✅ **Consolidated `lib/` structure**: Organized into logical subdirectories
- ✅ **Moved services**: Integrated services into appropriate lib directories
- ✅ **Updated all import paths**: Fixed all import references across the codebase
- ✅ **Removed empty directories**: Cleaned up unused directories

### **Key Changes:**
1. **Documentation**: All `.md` files moved to `docs/` folder
2. **Constants**: `constants.ts` and `countries.ts` moved to `constants/` folder
3. **Library Structure**: 
   - `lib/ai/` - AI-related utilities and services
   - `lib/database/` - Database utilities and Prisma client
   - `lib/shared/` - Shared utilities (sharing, departments, time context)
   - `lib/storage/` - Storage utilities (localStorage, hybrid storage)
   - `lib/jwt/` - JWT utilities (unchanged)
   - `lib/middleware/` - API middleware (unchanged)
4. **Services**: Moved `services/` contents to `lib/ai/`
5. **Components**: Moved `emails/` to `components/emails/`

### **Benefits:**
- **Better Organization**: Related files grouped logically
- **Clearer Structure**: Easier to find and maintain code
- **Reduced Confusion**: Eliminated overlap between `lib/` and `utils/`
- **Improved Maintainability**: Clear separation of concerns
- **Documentation Centralization**: All docs in one place
