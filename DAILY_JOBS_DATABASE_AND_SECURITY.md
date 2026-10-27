# THENIJOBS Daily Jobs — Database Schema, Architecture & Security Rules

> **Document:** `DAILY_JOBS_DATABASE_AND_SECURITY.md`  
> **Database:** Google Cloud Firestore (NoSQL Document Store)  
> **Storage:** Firebase Cloud Storage  
> **Target Page:** `http://localhost:3000/daily-jobs`  
> **Security Model:** Role-Based Access Control (RBAC) + Granular Security Rules  

---

## 1. Cloud Firestore Collections & Schemas

The Daily Jobs portal interacts with four principal Firestore collections: `jobs`, `applications`, `savedJobs`, and `companies`.

```
                  ┌──────────────────────┐
                  │      companies       │
                  │ (Verified Employers) │
                  └──────────┬───────────┘
                             │ 1:N
                             ▼
  ┌─────────────────────────────────────────────────────────┐
  │                          jobs                           │
  │    (Active, Fresh, Urgent, Daily Wage, Walk-in Jobs)    │
  └─────────────┬─────────────────────────────┬─────────────┘
                │ 1:N                         │ 1:N
                ▼                             ▼
  ┌───────────────────────────┐ ┌───────────────────────────┐
  │       applications        │ │         savedJobs         │
  │ (Applicant Submissions)   │ │  (Bookmarked Job List)    │
  └───────────────────────────┘ └───────────────────────────┘
```

---

### 1.1 `jobs` Collection Schema

Each job document contains comprehensive metadata supporting multi-dimensional search, hyperlocal filtering, and lifecycle management:

| Field | Type | Description | Indexing & Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Unique Firestore document ID | Primary Key |
| `title` | `string` | Official job title (e.g. "Medical Records Reviewer") | Indexed for search |
| `company` | `string` | Registered employer name | Indexed |
| `employerId` | `string` | UID of posting employer | Foreign Key to `users` |
| `location` | `string` | Physical location (e.g. "Theni, Tamil Nadu") | Indexed |
| `taluk` | `string` | One of 7 Theni Taluks (Theni, Periyakulam, etc.) | High-cardinality filter |
| `city` | `string` | Specific town / locality | Hyperlocal matching |
| `salaryMin` | `number` | Minimum salary in INR (e.g. 8000) | Numeric range filter |
| `salaryMax` | `number` | Maximum salary in INR (e.g. 300000) | Numeric range filter |
| `salaryType` | `string` | `"monthly"` \| `"daily"` \| `"hourly"` \| `"yearly"` | Filterable |
| `isSalaryNegotiable`| `boolean`| Whether salary is open to discussion | Display flag |
| `jobType` | `string` | `"Full-time"` \| `"Part-time"` \| `"Daily Wage"` \| etc. | Indexed |
| `workMode` | `string` | `"on-site"` \| `"remote"` \| `"hybrid"` | Indexed |
| `experience` | `string` | Required experience level (e.g. `"Fresher (0 yrs)"`) | Filterable |
| `qualification` | `string` | Minimum education (e.g. `"Any Degree"`, `"10th"`) | Filterable |
| `skills` | `string[]` | Required technical or vocational skills | Array-contains index |
| `description` | `string` | Full job description and requirements | Full-text indexed |
| `responsibilities` | `string[]`| Bulleted day-to-day duties | Optional display |
| `benefits` | `string[]` | ESI, PF, Food, Transport, Accommodation | Optional display |
| `workingHours` | `string` | Shift timings (e.g. "9:00 AM - 6:00 PM") | Display |
| `applicationDeadline`| `timestamp`| Date after which applications close | Expiry guard |
| `contactPhone` | `string` | Employer phone number for direct inquiries | Cleaned E.164 / local |
| `whatsappNumber` | `string` | WhatsApp number for direct WhatsApp Apply | E.164 format |
| `applyMethod` | `string` | `"internal"` \| `"whatsapp"` \| `"external"` | Controls button behavior |
| `status` | `string` | `"active"` \| `"closed"` \| `"expired"` \| `"draft"` | Security filter (`status == "active"`) |
| `isUrgent` | `boolean` | Flag for urgent vacancy badge | Indexed boolean |
| `isFeatured` | `boolean` | Flag for featured premium listing | Priority sorting |
| `isWalkIn` | `boolean` | Flag for walk-in interview positions | Discovery badge |
| `isDailyWage` | `boolean` | Flag for daily wage / labor positions | Discovery badge |
| `isFresher` | `boolean` | Flag for 0-experience friendly positions | Discovery badge |
| `isVerified` | `boolean` | Verified employer badge flag | Credibility badge |
| `viewsCount` | `number` | Counter of cumulative views | Increment via FieldValue |
| `applicationsCount`| `number` | Counter of candidate applications | Increment on submission |
| `createdAt` | `timestamp`| Creation timestamp (Firestore ServerTimestamp) | Sort key (descending) |
| `updatedAt` | `timestamp`| Last modification timestamp | Audit trail |

---

### 1.2 `applications` Collection Schema

Stores job seeker submissions with duplicate prevention:

| Field | Type | Description | Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Document ID or `${jobId}_${applicantId}` | Compound uniqueness |
| `jobId` | `string` | Reference to `jobs` document | Foreign Key |
| `jobTitle` | `string` | Denormalized title for fast seeker queries | Fast lookup |
| `companyName` | `string` | Denormalized company name | Fast lookup |
| `applicantId` | `string` | UID of job seeker | Foreign Key to `users` |
| `applicantName` | `string` | Full name of applicant | Required |
| `applicantEmail` | `string` | Verified email address | Required |
| `applicantPhone` | `string` | Contact phone number | Required (10 digits) |
| `resumeUrl` | `string` | Cloud Storage URL to PDF / DOCX resume | Optional / URL |
| `coverNote` | `string` | Applicant message or cover note | Text max 2000 chars |
| `status` | `string` | `"pending"` \| `"reviewed"` \| `"shortlisted"` \| `"rejected"` \| `"hired"` | Employer workflow |
| `appliedAt` | `timestamp`| Submission timestamp | Audit |

---

### 1.3 `savedJobs` Collection Schema

Maintains seeker bookmarks across sessions:

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | `${userId}_${jobId}` compound identifier |
| `userId` | `string` | UID of authenticated user |
| `jobId` | `string` | UID of bookmarked job |
| `savedAt` | `timestamp`| Bookmark timestamp |

*Note: For guest visitors, bookmarks are cached in browser `localStorage` under `thenijobs_saved_jobs` and synchronized upon sign-in.*

---

## 2. Cloud Firestore Security Rules Configuration

The `firestore.rules` file enforces rigorous role-based access control (RBAC):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper Functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
        (request.auth.token.role == 'admin' || 
         request.auth.token.email in ['admin@thenijobs.com', 'admin@theni.local']);
    }

    // 1. JOBS RULES
    match /jobs/{jobId} {
      // Anyone can read active, approved jobs
      allow read: if resource.data.status == 'active' || 
                     isAdmin() || 
                     (isAuthenticated() && resource.data.employerId == request.auth.uid);
      
      // Only employers and admins can create jobs
      allow create: if isAuthenticated() && 
                       (request.auth.token.role in ['employer', 'company', 'admin']) &&
                       request.resource.data.employerId == request.auth.uid;
      
      // Only the owning employer or an admin can update or delete
      allow update, delete: if isAdmin() || 
                               (isAuthenticated() && resource.data.employerId == request.auth.uid);
    }

    // 2. APPLICATIONS RULES
    match /applications/{applicationId} {
      // Seeker can read their own applications; Employer can read applications for their jobs
      allow read: if isAdmin() || 
                     (isAuthenticated() && resource.data.applicantId == request.auth.uid) ||
                     (isAuthenticated() && resource.data.employerId == request.auth.uid);
      
      // Any authenticated seeker can create an application
      allow create: if isAuthenticated() && 
                       request.resource.data.applicantId == request.auth.uid;
      
      // Only the employer or admin can update status (e.g. shortlisted, rejected)
      allow update: if isAdmin() || 
                       (isAuthenticated() && resource.data.employerId == request.auth.uid);
      
      // Only admin can hard-delete applications
      allow delete: if isAdmin();
    }

    // 3. SAVED JOBS RULES
    match /savedJobs/{saveId} {
      allow read, write: if isAuthenticated() && 
                            (resource == null || resource.data.userId == request.auth.uid) &&
                            (request.resource == null || request.resource.data.userId == request.auth.uid);
    }
  }
}
```

---

## 3. Firebase Cloud Storage Security Rules

The `storage.rules` file safeguards sensitive applicant documents:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Resume Uploads: resumes/{userId}/{filename}
    match /resumes/{userId}/{allPaths=**} {
      // Applicant can upload and read their own resume
      allow read: if request.auth != null && 
                     (request.auth.uid == userId || request.auth.token.role in ['employer', 'admin']);
      allow write: if request.auth != null && 
                      request.auth.uid == userId && 
                      request.resource.size < 5 * 1024 * 1024 && // 5MB max
                      request.resource.contentType.matches('application/pdf|application/msword|application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    }

    // Company Logos: company-logos/{companyId}/{filename}
    match /company-logos/{companyId}/{allPaths=**} {
      allow read: if true; // Publicly visible
      allow write: if request.auth != null && 
                      (request.auth.uid == companyId || request.auth.token.role == 'admin') &&
                      request.resource.size < 2 * 1024 * 1024 && // 2MB max
                      request.resource.contentType.matches('image/.*');
    }
  }
}
```

---

## 4. Anti-Fraud & Data Sanitization Guarantees

1. **Duplicate Application Prevention:**
   - Both client-side state tracking and compound document keys (`jobId_seekerId`) prevent spam submissions.
2. **Freshness & Expiry Guard:**
   - Calculation for "Today's Jobs" strictly requires `diffMs < 86400000` and same calendar day.
   - Closed or expired jobs are excluded from public search queries via `status == 'active'` and `deadline > now`.
3. **Contact Data Protection:**
   - WhatsApp links format candidate context with specific job URLs, preventing fraudulent impersonation.
   - Employer phone numbers are validated to ensure genuine reachable contacts.
