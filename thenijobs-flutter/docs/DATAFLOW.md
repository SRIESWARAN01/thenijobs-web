# THENIJOBS Flutter Dataflow

This Flutter app uses the same Firebase-first data model as the Next.js website. The mobile app should treat Firestore as the source of truth and route all reusable reads/writes through `lib/core/services/firestore_service.dart`.

Riverpod entry points for shared stats, notifications, conversations, and leaderboard data live in `lib/core/providers/firestore_data_providers.dart`.

## Source Of Truth

| App area | Firestore collections | Flutter service functions |
| --- | --- | --- |
| Platform dashboard | `users`, `companies`, `jobs`, `applications`, `leads`, `subscriptions` | `getPlatformStats`, `getActivityLogs` |
| Public jobs | `jobs`, `companies`, `savedJobs`, `applications` | `getJobs`, `getJobById`, `saveJob`, `unsaveJob`, `applyToJob` |
| Public businesses | `companies`, `reviews`, `leads` | `getCompanies`, `getCompanyBySlug`, `createCompanyEnquiry`, `createCompanyReview`, `getReviews`, `getLeads`, `updateLeadStatus` |
| Company onboarding | `companies`, `users` | `getCompanyByOwner`, `createCompanyProfile`, `approveCompany`, `rejectCompany` |
| Public identity | `users`, `companies`, `seekerProfiles` | `getCompanyByIdentifier`, `getUserByIdentifier`, `getSeekerProfile` |
| Job seeker portal | `seekerProfiles`, `applications`, `savedJobs`, `jobAlerts`, `interviews`, `notifications`, `gamification` | `getSeekerStats`, `getApplications`, `getSavedJobs`, `getJobAlerts`, `getInterviews`, `getNotifications`, `getGamificationProfile` |
| Employer portal | `companies`, `jobs`, `applications`, `interviews`, `leads`, `reviews`, `subscriptions`, `payments` | `getEmployerStats`, `createDocument`, `updateDocument`, `getApplications`, `updateApplicationStatus`, `getEmployerAnalytics`, `getPayments` |
| Admin portal | `users`, `companies`, `jobs`, `services`, `subscriptions`, `advertisements`, `reviews`, `activityLogs` | `approveCompany`, `rejectCompany`, `featureCompany`, `verifyCompany`, `approveJob`, `rejectJob`, `updateUserRole`, `verifyUser` |
| Messaging | `conversations`, `conversations/{id}/messages` | `createConversation`, `getConversations`, `streamConversations`, `sendChatMessage`, `streamChatMessages`, `markMessagesRead`, `setTypingStatus` |
| Rewards | `gamification`, `gamification/{uid}/activities` | `awardPoints`, `awardBadge`, `getLeaderboard`, `updateAchievementProgress`, `getPointActivities` |

## Core Write Flows

### Company Registration

1. Flutter calls `createCompanyProfile`.
2. The service creates a pending company record with slug, owner, verification, contact, gallery, stats, and services fields.
3. The owner `users/{uid}` document receives `companyId` when rules allow it.
4. Admin approval later calls `approveCompany` or `rejectCompany`, notifying the owner and logging activity.

### Apply To Job

1. Flutter calls `applyToJob`.
2. A batch creates `applications/{id}` and increments `jobs/{jobId}.applicationCount`.
3. The service writes `activityLogs/{id}`.
4. The service resolves `companies/{companyId}.ownerId`.
5. The company owner receives a `notifications/{id}` record.

### Save Job

1. Flutter calls `saveJob` with optional card metadata.
2. The service checks for an existing `savedJobs` record for the same user and job.
3. New records include `userId`, `jobId`, `createdAt`, `savedAt`, and any provided job snapshot fields.
4. Flutter calls `unsaveJob` to delete all matching saved records for that user and job.

### Company Enquiry And Review

1. Flutter calls `createCompanyEnquiry` from public company profiles.
2. The service writes lead fields used by both Flutter and the website, increments `companies/{id}.enquiryCount`, and notifies the company owner.
3. Flutter calls `createCompanyReview` for verified-user reviews.
4. Review records include Flutter model fields and website admin fields, then wait in `pending` state for moderation.

### Application Status Update

1. Employer/admin calls `updateApplicationStatus`.
2. The application gets `status`, `statusTimestamps.{status}`, and an optional `employerNote`.
3. The seeker receives a notification pointing to `/seeker/applications`.

### Company And Job Moderation

1. Admin calls `approveCompany`, `rejectCompany`, `approveJob`, or `rejectJob`.
2. The target document status fields are updated.
3. Owners are notified when applicable.
4. The action is written to `activityLogs`.

### Chat

1. `createConversation` deduplicates by sorted participants and optional `jobId`.
2. `sendChatMessage` creates a message in the subcollection and updates the parent conversation metadata.
3. `streamConversations` and `streamChatMessages` power real-time inbox and thread screens.
4. `markMessagesRead` records read state for messages sent by the other participant.

## Implementation Rule

New Flutter screens should prefer this order:

1. Use an existing model from `lib/shared/data/models`.
2. Use `FirestoreService` for Firebase reads/writes.
3. Use `firestore_data_providers.dart` when a screen only needs shared stats, notifications, conversations, or leaderboard data.
4. Add a feature-specific repository only when the screen needs extra business rules.
5. Keep collection names and field names aligned with the Next.js app and Firestore rules.

The generic portal list and metric surfaces in `route_screens.dart` are service-backed through `streamCollection`, so feature sections should add service methods before adding direct Firebase reads.
