# THENIJOBS Platform - Complete Guide with Workflows

## Table of Contents
1. Platform Overview
2. User Roles & Complete Workflows
3. Detailed Feature Breakdown
4. Technical Architecture
5. Database Schema
6. Integration & Communication Flows

---

## 1. Platform Overview

### What is THENIJOBS?
THENIJOBS is a **multi-sided marketplace platform** serving Tamil Nadu that connects:
- 👤 **Job Seekers** (finding employment)
- 🏢 **Employers/HR** (hiring talent)
- 🏭 **Business Owners** (managing companies)
- 📦 **Suppliers/B2B** (selling products/services)
- 🔧 **Service Providers** (offering local services)

### Key Statistics & Metrics
- **Active Users**: Tracked via Realtime Database
- **Live Jobs**: Real-time counter
- **Revenue Tracking**: Payment & subscription metrics
- **User Engagement**: Application submissions, interviews scheduled

---

## 2. User Roles & Complete Workflows

### 2.1 🎯 JOB SEEKER WORKFLOW

```
┌─────────────────────────────────────────────────────────────────┐
│                      JOB SEEKER JOURNEY                         │
└─────────────────────────────────────────────────────────────────┘

Step 1: REGISTRATION & AUTHENTICATION
├─ Visit Homepage (/)
├─ Click "Sign Up" or use Google OAuth
├─ Enter Email/Password or authenticate via Google
├─ Select Role: "Job Seeker"
└─ Firebase Auth creates user record

Step 2: PROFILE CREATION (Seeker Dashboard)
├─ Complete Basic Info
│  ├─ Full Name
│  ├─ Email & Phone
│  ├─ Profile Picture (upload to Cloud Storage)
│  └─ Location/District (select from Tamil Nadu list)
├─ Add Professional Details
│  ├─ Skills Tags (searchable, multi-select)
│  ├─ Years of Experience
│  ├─ Current Job Title
│  ├─ Educational Background (10th, 12th, Degree, etc.)
│  └─ Languages Spoken
└─ Firestore Updates: seekerProfiles collection

Step 3: RESUME MANAGEMENT
├─ Option A: Upload Existing Resume
│  ├─ PDF File Upload → Cloud Storage
│  ├─ Auto-parse (optional AI extraction)
│  └─ Store Reference in seekerProfiles
├─ Option B: Use Built-in Resume Builder
│  ├─ Step-by-step wizard form
│  ├─ Fill: Personal Info, Experience, Education
│  ├─ Select Resume Template (Modern/Classic/Minimal)
│  └─ Export as PDF → Cloud Storage
└─ Resume URL saved in user profile

Step 4: JOB DISCOVERY
├─ Browse Jobs (/jobs)
├─ Apply Filters
│  ├─ Location (All Tamil Nadu / Select District)
│  ├─ Job Category (IT, Sales, Engineering, etc.)
│  ├─ Salary Range Slider
│  ├─ Experience Level
│  └─ Verified Employers Only (toggle)
├─ Sort Options
│  ├─ Newest First
│  ├─ Highest Salary
│  ├─ Featured/Trending
│  └─ Most Applications
└─ View Job Details
   ├─ Job Title, Description, Requirements
   ├─ Salary Range & Benefits
   ├─ Company Logo & Overview
   ├─ Apply Button
   └─ Save for Later (savedJobs collection)

Step 5: JOB APPLICATION
├─ Click "Apply Now"
├─ Application Form Opens
│  ├─ Select Resume (if multiple)
│  ├─ Write Custom Cover Letter (optional)
│  ├─ Confirm Contact Details
│  └─ Consent to Share Details
├─ Firebase Cloud Function Validates
│  ├─ Check if user already applied
│  ├─ Validate resume exists
│  └─ Prevent duplicate applications
├─ Create Record in applications Collection
│  ├─ applicationId (unique)
│  ├─ jobId, userId, resumeUrl
│  ├─ coverLetter, appliedAt (timestamp)
│  └─ status: "Applied" (initial state)
└─ Notification Sent to Employer

Step 6: APPLICATION STATUS TRACKING
Status Transitions (Employer Can Update):
├─ 🟦 Applied (Initial state)
│  └─ Application received, awaiting review
├─ 🟨 Under Review
│  └─ Employer reviewing profile & resume
├─ 🟩 Shortlisted
│  └─ Advanced to next round
├─ 🔵 Interview Scheduled
│  └─ Interview invitation sent
├─ ✅ Selected
│  └─ Job offer extended
└─ ❌ Rejected
   └─ Not selected for this role

Seeker can view:
├─ /seeker/dashboard → All applications summary
├─ View each application status
├─ See interview details if scheduled
└─ Download offer letter (if Selected)

Step 7: INTERVIEW MANAGEMENT
├─ Employer sends Interview Invitation
│  ├─ Create record in interviews Collection
│  └─ Send notification to seeker
├─ Seeker Receives Interview Details
│  ├─ Interview Date & Time
│  ├─ Interview Mode (Video/Phone/In-Person)
│  ├─ Interview Link (for video calls)
│  ├─ Venue Address (for in-person)
│  └─ Duration (30/45/60 mins)
├─ Seeker Confirms/Reschedules
│  ├─ Update interviews record status
│  └─ Notify employer of confirmation
├─ Interview Reminders
│  ├─ Email reminder 24 hours before
│  ├─ SMS reminder 1 hour before
│  └─ Notification in /seeker/reminders dashboard
└─ Join Interview
   ├─ Click "Join Meeting" button
   ├─ Direct link to video call (Zoom/Google Meet)
   ├─ Or call phone number provided
   └─ System logs attendance

Step 8: REMINDERS & TASK MANAGEMENT
Dashboard: /seeker/reminders
├─ Scheduled Interviews
│  ├─ Calendar view of upcoming interviews
│  ├─ Time zones adjusted
│  └─ Quick action: "Join Now"
├─ Subscription Expiry Alerts (if premium)
│  └─ Notify before plan expires
├─ Custom Reminders
│  ├─ Create custom checklists (local storage)
│  ├─ Examples:
│  │  ├─ "Follow up with Company X"
│  │  ├─ "Update resume skills"
│  │  ├─ "Practice for Interview"
│  │  └─ "Update portfolio"
│  ├─ Set due dates
│  └─ Check off as completed
└─ Application Follow-up Tasks
   └─ Auto-reminder to check application status

Step 9: COMMUNICATION & CHAT
├─ Employer Sends Message
│  ├─ Create conversation in conversations Collection
│  ├─ Send first message
│  └─ Trigger notification to seeker
├─ Real-Time Chat (/seeker/messages)
│  ├─ View all conversations with employers
│  ├─ Firestore messages collection (ordered by timestamp)
│  ├─ Send/receive text messages
│  ├─ Optional file attachments
│  └─ Read receipts & typing indicators
└─ Interview Q&A
   ├─ Ask clarifying questions
   ├─ Discuss job details
   └─ Share additional documents

Step 10: AI COACH ASSISTANCE
Dashboard: /seeker/ai-coach
├─ Resume Enhancement Tips
│  ├─ AI analyzes uploaded resume
│  ├─ Suggests improvements
│  │  ├─ Better wording for achievements
│  │  ├─ Industry keyword optimization
│  │  ├─ Format improvements
│  │  └─ Missing sections to add
│  └─ One-click apply suggestions
├─ Mock Interview Practice
│  ├─ AI generates random interview questions
│  ├─ Seeker records video response (optional)
│  ├─ AI provides feedback on:
│  │  ├─ Content relevance
│  │  ├─ Confidence assessment
│  │  ├─ Clarity & communication
│  │  └─ Estimated score
│  └─ Practice multiple times
├─ Job Match Analysis
│  ├─ Match current profile against browsing jobs
│  ├─ Show match percentage (0-100%)
│  ├─ Highlight skills gaps
│  ├─ Recommend new skills to learn
│  └─ Suggest similar jobs better suited to profile
└─ Career Recommendations
   ├─ Based on profile & applied jobs
   ├─ Suggest career growth paths
   ├─ Recommend training/certifications
   └─ Show salary progression trends in region

Workflow Summary:
┌──────────┬──────────┬────────────┬──────────┬─────────┐
│ Register │ Build    │ Discover & │ Interview│ Get Job │
│ Profile  │ Resume   │ Apply Jobs │ Process  │ Offer   │
└──────────┴──────────┴────────────┴──────────┴─────────┘
```

---

### 2.2 🏢 EMPLOYER/COMPANY WORKFLOW

```
┌─────────────────────────────────────────────────────────────────┐
│                     EMPLOYER JOURNEY                            │
└─────────────────────────────────────────────────────────────────┘

Step 1: REGISTRATION & COMPANY VERIFICATION
├─ Sign Up as Employer
│  ├─ Email/Password or Google OAuth
│  └─ Select Role: "Employer/HR"
├─ Company Registration Form
│  ├─ Company Name
│  ├─ GST Number (mandatory verification)
│  │  ├─ Validate against GSTIN API
│  │  ├─ Verify company is registered
│  │  ├─ Check if already registered on platform
│  │  └─ Flag for admin review if duplicate
│  ├─ Company Logo Upload
│  │  ├─ Cloud Storage
│  │  └─ Resize/optimize
│  ├─ Company Description (250-500 chars)
│  ├─ Industry Category
│  ├─ Company Size (10-50, 50-200, 200+)
│  ├─ Website URL
│  ├─ Founded Year
│  └─ Headquarters Address (Tamil Nadu location)
├─ Store in companies Collection
│  ├─ companyId (unique)
│  ├─ ownerId (links to user)
│  ├─ verificationStatus: "Pending" (initial)
│  ├─ gstVerified: false (until admin approves)
│  └─ createdAt timestamp
└─ Notification Sent to Admin
   └─ "New Company Registration Pending Verification"

Step 2: ADMIN VERIFICATION (Behind Scenes)
├─ Admin Portal (/admin/companies)
├─ Review Company Details
│  ├─ Check GST validity
│  ├─ Verify company legitimacy
│  ├─ Review logo & description
│  └─ Check for duplicate registrations
├─ Approve or Reject
│  ├─ If Approved:
│  │  ├─ Set gstVerified = true
│  │  ├─ verificationStatus = "Verified"
│  │  └─ Send approval email to employer
│  └─ If Rejected:
│     ├─ Provide reason for rejection
│     └─ Allow resubmission with corrections
└─ Featured Status (Optional)
   ├─ Admin can toggle "Featured" badge
   └─ Featured companies appear at top of listings

Step 3: COMPANY PROFILE COMPLETION
Dashboard: /employer/dashboard
├─ Add Multiple Branches (Optional)
│  ├─ Branch Name
│  ├─ Address & District
│  ├─ Phone Number
│  └─ Manager Contact
├─ Company Gallery (Media Upload)
│  ├─ Office Photos (5-10 images)
│  ├─ Team Photos
│  ├─ Work Culture Videos
│  └─ Cloud Storage handles all files
├─ Company Social Links
│  ├─ LinkedIn Page
│  ├─ Twitter/X Account
│  ├─ Facebook Page
│  └─ Instagram Handle
├─ Contact Information
│  ├─ HR Email
│  ├─ Recruitment Phone
│  └─ Official Website
└─ Firestore updates companies Collection with all data

Step 4: SUBSCRIPTION & PAYMENT PLAN
├─ Choose Subscription Tier
│  ├─ 🆓 Free Plan
│  │  ├─ 1 Active Job Post
│  │  ├─ Receive Applications
│  │  ├─ Basic Analytics
│  │  └─ No video interviews
│  ├─ 💚 Basic Plan
│  │  ├─ 5 Active Job Posts
│  │  ├─ Receive Applications
│  │  ├─ View Candidate Database
│  │  ├─ 1 Video Interview/month
│  │  └─ Email Support
│  ├─ 💙 Premium Plan
│  │  ├─ 20 Active Job Posts
│  │  ├─ Full Candidate Search & Filters
│  │  ├─ Unlimited Video Interviews
│  │  ├─ Bulk Email Candidates
│  │  ├─ Advanced Analytics
│  │  └─ Priority Support
│  └─ 💎 Enterprise Plan
│     ├─ Unlimited Active Posts
│     ├─ Dedicated Account Manager
│     ├─ Custom Branding
│     ├─ API Access
│     └─ Custom Integrations
├─ Payment Methods
│  ├─ Razorpay Credit/Debit Card Payment (instant)
│  ├─ UPI Payment (instant)
│  └─ Manual Bank Transfer
│     ├─ Employer submits request
│     ├─ Admin reviews & approves
│     ├─ Creates payment record
│     └─ Activates subscription
├─ Store in subscriptions Collection
│  ├─ subscriptionId
│  ├─ companyId
│  ├─ planType (Free/Basic/Premium/Enterprise)
│  ├─ startDate & expiryDate
│  ├─ jobPostingQuota (based on plan)
│  └─ paymentStatus (Pending/Completed/Failed)
└─ Update jobPostingQuota in Cloud Functions
   └─ Enforce posting limits per subscription level

Step 5: JOB POSTING
Dashboard: /employer/post-job
├─ Create New Job Post
├─ Basic Job Information
│  ├─ Job Title
│  ├─ Job Category (IT, HR, Sales, Engineering, etc.)
│  ├─ No. of Vacancies (how many positions)
│  └─ Work Mode (Full-time, Part-time, Contract, Remote)
├─ Job Details
│  ├─ Job Description (detailed)
│  ├─ Key Responsibilities
│  ├─ Required Skills (multi-select with suggestions)
│  ├─ Required Experience (min years)
│  ├─ Educational Qualification
│  └─ Languages Required
├─ Location & Salary
│  ├─ Select District (select from Tamil Nadu districts)
│  ├─ Select Area/City within district
│  ├─ Salary Range (Min & Max)
│  ├─ Salary Visibility (Public or Hidden)
│  ├─ Benefits Offered (Health Insurance, Bonus, etc.)
│  └─ Perks List
├─ Additional Details
│  ├─ Reporting Manager Title
│  ├─ Company Culture Notes
│  ├─ Application Deadline Date
│  ├─ Interview Process Description
│  └─ Questions to Ask Candidates (custom pre-screening)
├─ Cloud Function Validation
│  ├─ Check subscription posting limit not exceeded
│  ├─ If limit reached:
│  │  ├─ Show: "Upgrade plan to post more jobs"
│  │  └─ Block posting
│  └─ If limit available: Allow posting
├─ Create Job Record in jobs Collection
│  ├─ jobId (unique)
│  ├─ companyId
│  ├─ All job details
│  ├─ status: "Active"
│  ├─ views: 0 (counter for analytics)
│  ├─ applicationsCount: 0
│  ├─ createdAt & expiryAt (duration: 30/60/90 days)
│  ├─ featured: false (unless paid for)
│  └─ salaryTransparency: true/false
└─ Job Goes Live
   ├─ Appears in /jobs board immediately
   ├─ Searchable and filterable
   ├─ Show "Featured" badge (if selected)
   └─ Visible to all job seekers

Step 6: TALENT SEARCH & CANDIDATE SOURCING
Dashboard: /employer/talent-search
├─ Access Full Candidate Database
│  ├─ Available only to Basic+ plans
│  ├─ Search Bar with keywords
│  └─ Auto-complete suggestions from skill tags
├─ Advanced Filters
│  ├─ Skills (multi-select)
│  │  └─ Filter candidates with specific skills
│  ├─ Location/District
│  │  └─ Find candidates in target areas
│  ├─ Experience Range
│  │  └─ Filter by years of experience
│  ├─ Education Level
│  │  └─ 10th Pass, 12th, Degree, Post-Graduate
│  ├─ Languages
│  │  └─ Tamil, English, Hindi, etc.
│  ├─ Availability Status
│  │  ├─ Actively Looking
│  │  ├─ Open to Offers
│  │  └─ Not Available
│  └─ Salary Expectations
│     └─ Match with budget
├─ Search Results Display
│  ├─ Candidate Card Layout
│  │  ├─ Profile Picture
│  │  ├─ Name & Job Title
│  │  ├─ Skills Tags
│  │  ├─ Experience Summary
│  │  ├─ Location
│  │  ├─ Match % to open job
│  │  └─ Action Buttons:
│  │     ├─ View Full Profile
│  │     ├─ Send Interview Invite
│  │     ├─ Save Candidate
│  │     └─ Message Candidate
│  └─ Bulk Actions
│     ├─ Select Multiple Candidates
│     ├─ Bulk Email (with template)
│     ├─ Bulk Interview Invite
│     └─ Add to Saved Pool
├─ Saved Candidates List
│  ├─ Star/bookmark candidates
│  ├─ Organize by job
│  ├─ Bulk manage saved candidates
│  └─ Export candidate list (CSV)
└─ Advanced Analytics
   ├─ Search history
   ├─ Top skills searched
   └─ Candidate demographics

Step 7: APPLICATION MANAGEMENT
Dashboard: /employer/applications (or applications tab)
├─ View All Applications
│  ├─ Filter by job post
│  ├─ Filter by status
│  ├─ Sort by date applied
│  └─ Sort by match score
├─ Application Card View
│  ├─ Candidate Name & Photo
│  ├─ Applied Position
│  ├─ Applied Date & Time
│  ├─ Current Status
│  ├─ Quick Actions:
│  │  ├─ View Resume (PDF)
│  │  ├─ View Cover Letter
│  │  ├─ View Full Profile
│  │  ├─ View Match Score
│  │  └─ Action Dropdown:
│  │     ├─ Shortlist
│  │     ├─ Send Interview Invite
│  │     ├─ Reject (with reason)
│  │     └─ Message Candidate
│  └─ Application History
│     └─ Timeline of all updates for this application
├─ Bulk Application Management
│  ├─ Select multiple applications
│  ├─ Bulk Status Update
│  │  ├─ Change to "Shortlisted"
│  │  ├─ Change to "Under Review"
│  │  └─ Bulk Reject
│  └─ Bulk Interview Scheduling
├─ Application Status Updates
│  ├─ Change: "Applied" → "Under Review"
│  ├─ Change: "Under Review" → "Shortlisted"
│  ├─ Change: "Shortlisted" → "Interview Scheduled"
│  ├─ Change: "Interview Scheduled" → "Selected"
│  └─ Change: Any → "Rejected"
│     ├─ Provide rejection reason
│     └─ Send notification to candidate
└─ Firestore Updates
   └─ Update applications Collection status field

Step 8: INTERVIEW SCHEDULING & MANAGEMENT
Dashboard: /employer/interviews
├─ Send Interview Invite to Shortlisted Candidate
│  ├─ Select Candidate from application
│  ├─ Or search talent database
│  ├─ Create Interview Record
│  │  ├─ Interview Title/Round Name
│  │  ├─ Proposed Date & Time
│  │  ├─ Interview Duration (30/45/60 mins)
│  │  ├─ Interview Mode:
│  │  │  ├─ Video Call (Zoom/Google Meet auto-link)
│  │  │  ├─ Phone Call (provide phone number)
│  │  │  └─ In-Person (provide venue address)
│  │  ├─ Interviewer Details (HR/Hiring Manager)
│  │  ├─ Interview Description/Questions
│  │  └─ Interview Link (auto-generated for video)
│  └─ Send Invite
│     ├─ Email notification to candidate
│     ├─ SMS reminder option
│     └─ In-app notification
├─ Interview Calendar
│  ├─ Calendar View of all scheduled interviews
│  ├─ Color-coded by status
│  │  ├─ Blue: Pending Confirmation
│  │  ├─ Green: Confirmed
│  │  └─ Red: Rejected/Rescheduled
│  ├─ Quick Actions:
│  │  ├─ Reschedule
│  │  ├─ Cancel
│  │  └─ Send Reminder
│  └─ Time Zone Support
│     └─ Auto-adjust candidate's local time
├─ Interview Feedback
│  ├─ After interview completes
│  ├─ Interviewer submits Feedback Form
│  │  ├─ Overall Rating (1-5 stars)
│  │  ├─ Technical Skills (1-5)
│  │  ├─ Communication (1-5)
│  │  ├─ Cultural Fit (1-5)
│  │  ├─ Comments & Notes
│  │  └─ Recommendation (Proceed/Hold/Reject)
│  └─ Feedback Stored in interviews Collection
├─ Move to Next Round
│  ├─ If Passed Round 1: Create Round 2 Interview
│  ├─ Schedule with next interviewer
│  └─ Repeat feedback process
└─ Final Decision
   ├─ After all rounds complete
   ├─ Make Final Selection Decision
   └─ Generate Offer Letter (if selected)

Step 9: OFFER & HIRING
├─ Candidate Selected
│  ├─ Generate Offer Letter
│  │  ├─ Job Title
│  │  ├─ Salary Details
│  │  ├─ Joining Date
│  │  ├─ Employment Terms
│  │  └─ Benefits Summary
│  ├─ Send to Candidate
│  │  ├─ Email PDF offer
│  │  ├─ In-app notification
│  │  └─ SMS confirmation
│  └─ Store in applications Collection
│     └─ Update status to "Offer Extended"
├─ Candidate Acceptance/Rejection
│  ├─ If Accepted:
│  │  ├─ Update status to "Selected"
│  │  ├─ Close Job Posting (if all positions filled)
│  │  ├─ Auto-reject remaining applicants
│  │  └─ Store in hire_history collection
│  └─ If Rejected:
│     ├─ Update status back to "Interview Scheduled"
│     ├─ Keep job posting active
│     └─ Continue recruiting
└─ Onboarding (Post-Hiring)
   ├─ Create Onboarding Checklist
   ├─ Send Joining Documentation
   ├─ Schedule First-Day Orientation
   └─ Store in onboarding Collection

Step 10: LEADS & BUSINESS INQUIRIES (For B2B Companies)
Dashboard: /employer/leads
├─ This applies to companies listing products/services
├─ Receive Inquiries from B2B Clients
│  ├─ Via Company Showcase page
│  ├─ Customer fills inquiry form:
│  │  ├─ Business Name
│  │  ├─ Contact Person
│  │  ├─ Email & Phone
│  │  ├─ Message/Inquiry Details
│  │  ├─ Quote Amount (optional)
│  │  └─ Preferred Contact Method
│  └─ Inquiry stored in leads Collection
├─ Kanban-Style Funnel Management
│  ├─ 🆕 New Leads (inbox)
│  │  ├─ Auto-notify employer
│  │  ├─ Click to view details
│  │  └─ Auto-move after 1st contact
│  ├─ 📞 Contacted
│  │  ├─ Employer clicked "Contact" button
│  │  ├─ Call/Message log created
│  │  └─ Tracks when contacted
│  ├─ ✅ Qualified
│  │  ├─ Customer interested & meeting scheduled
│  │  ├─ Proposal shared
│  │  └─ Move manually or auto-rule
│  ├─ 🤝 Converted
│  │  ├─ Deal closed, order received
│  │  ├─ Mark as converted
│  │  └─ Auto-calculate conversion rate
│  └─ ❌ Lost
│     ├─ Customer rejected
│     ├─ Log reason
│     └─ Archive for analysis
├─ Lead Actions
│  ├─ View Full Lead Details
│  ├─ Call Candidate (VOIP/Phone)
│  ├─ Send Email/Message
│  ├─ Share Proposal/Quotation
│  ├─ Schedule Callback
│  ├─ Add Tags (VIP, Hot Lead, etc.)
│  └─ Set Reminder/Follow-up Date
├─ Lead Analytics
│  ├─ Total Leads Received (MTD)
│  ├─ Conversion Rate (%)
│  ├─ Average Deal Value
│  ├─ Sales Pipeline Value
│  ├─ Lead Source Breakdown
│  └─ Top Converting Products
└─ CRM Features
   ├─ Auto-email sequence after lead received
   ├─ Scheduled reminders for follow-ups
   ├─ Lead scoring (hot/warm/cold)
   ├─ Notes & activity log per lead
   └─ Export leads (CSV for external CRM)

Step 11: REVIEWS & REPUTATION MANAGEMENT
├─ Employer Receives Reviews
│  ├─ From job candidates
│  ├─ From customers (B2B)
│  └─ Stored in reviews Collection
├─ Manage Reviews
│  ├─ View all reviews on company profile
│  ├─ See average rating (1-5 stars)
│  ├─ Reply to reviews
│  │  ├─ Public response
│  │  ├─ Address concerns
│  │  └─ Thank positive reviews
│  ├─ Flag inappropriate reviews
│  │  └─ Request admin removal if needed
│  └─ Analytics
│     ├─ Review trend over time
│     ├─ Common feedback themes
│     └─ Sentiment analysis
└─ Reputation Dashboard
   ├─ Overall Rating Score
   ├─ Review Count
   ├─ Response Rate %
   └─ Trust Badges (if rating > 4.5 stars)

Workflow Summary:
┌────────────┬──────────┬─────────────┬─────────┬──────────┬────────┐
│ Register & │ Add Job  │ Receive &   │ Schedule│ Conduct  │ Offer &│
│ Verify     │ Postings │ Review Apps │Interview│ Interview│ Hire   │
└────────────┴──────────┴─────────────┴─────────┴──────────┴────────┘
```

---

### 2.3 🏪 BUSINESS OWNER / SUPPLIER WORKFLOW

```
┌─────────────────────────────────────────────────────────────────┐
│           BUSINESS OWNER / SUPPLIER JOURNEY                     │
└─────────────────────────────────────────────────────────────────┘

Step 1: REGISTRATION & VERIFICATION
├─ Select Role: "Business Owner" or "Supplier/B2B"
├─ Complete Registration
│  ├─ Company/Business Name
│  ├─ GST Number (mandatory)
│  ├─ Business Category (Retail, Manufacturing, Services, etc.)
│  ├─ Phone Number Verification
│  │  ├─ OTP sent to phone
│  │  ├─ Verify to prove ownership
│  │  └─ Phone stored in users Collection
│  ├─ Email Verification
│  └─ Set Password
├─ Admin Verification Process
│  ├─ Auto-verify phone number
│  ├─ Check GST validity via GSTIN database
│  ├─ Auto-approve if GST valid
│  ├─ verificationStatus: "Verified" (if approved)
│  └─ Set businessVerified flag in companies Collection
└─ Account Status: Ready to Post

Step 2: BUSINESS PROFILE SETUP
Dashboard: /business/dashboard
├─ Complete Company Profile
│  ├─ Company Logo Upload
│  ├─ Company Description (services/products offered)
│  ├─ Business Category & Subcategories
│  ├─ Years in Business
│  ├─ Business Size (Sole Proprietor, 10-50 employees, etc.)
│  ├─ Headquarters Address
│  │  ├─ Street Address
│  │  ├─ District (Tamil Nadu)
│  │  ├─ City
│  │  ├─ Pincode
│  │  └─ Map coordinates
│  ├─ Contact Information
│  │  ├─ Primary Phone
│  │  ├─ Business Email
│  │  ├─ Website URL
│  │  └─ WhatsApp Business Number
│  └─ Operating Hours
│     └─ Mon-Fri, Sat-Sun timings
├─ Multiple Locations (Chain Businesses)
│  ├─ Add Branch Locations
│  ├─ Each location independent
│  └─ Cross-link inventory (optional)
├─ Upload Business Documents
│  ├─ GST Certificate
│  ├─ Business Registration
│  ├─ Trade License
│  ├─ Bank Account Proof
│  └─ All stored in Cloud Storage
└─ Firestore updates companies Collection

Step 3: PRODUCT/SERVICE LISTING
Dashboard: /business/listings
├─ Add Products or Services
├─ Product Listing Details
│  ├─ Product/Service Name
│  ├─ SKU/Reference Code
│  ├─ Category (from taxonomy)
│  ├─ Detailed Description
│  ├─ Price (Offer Price)
│  ├─ Cost Price (for analytics only)
│  ├─ Minimum Order Quantity
│  ├─ Available Stock Quantity
│  ├─ Availability Status (In Stock/Out of Stock)
│  ├─ Product Images (5-10 photos)
│  │  ├─ Upload from device
│  │  ├─ Cloud Storage handles uploads
│  │  └─ Resize & thumbnail auto-generated
│  ├─ Product Video (optional, embedded)
│  ├─ Specifications
│  │  ├─ Material, Size, Weight, etc.
│  │  └─ Technical specs
│  ├─ Certifications/Compliance
│  │  └─ ISO, BIS, CE marks, etc.
│  ├─ Delivery Options
│  │  ├─ Pick-up (From Location)
│  │  ├─ Same-city Delivery
│  │  ├─ Pan-India Shipping
│  │  └─ Delivery Charge
│  ├─ Warranty/Guarantee Terms
│  ├─ Return Policy
│  ├─ Tags for Searchability
│  │  ├─ Material tags
│  │  ├─ Application tags
│  │  └─ Feature tags
│  └─ SEO Meta Information
│     ├─ Custom URL slug
│     ├─ Meta description
│     └─ Meta keywords
├─ Store in products Collection
│  ├─ productId
│  ├─ companyId (owner)
│  ├─ All listing details
│  ├─ status: "Active" (public)
│  ├─ createdAt & updatedAt timestamps
│  ├─ viewCount: 0
│  ├─ likeCount: 0
│  └─ rating: 0
└─ Product Goes Live
   ├─ Searchable via /services or marketplace
   ├─ Appears in category listings
   ├─ Indexed by search engine
   └─ Shareable via social media

Step 4: BULK PRODUCT IMPORT (B2B Feature)
├─ For businesses with many products
├─ Import via CSV Template
│  ├─ Download CSV template
│  ├─ Fill in product details:
│  │  ├─ Name, Category, Price, Stock
│  │  ├─ Description, Images (URLs)
│  │  └─ SKU, Tags, Specifications
│  ├─ Validate data
│  │  ├─ Check for required fields
│  │  ├─ Validate image URLs
│  │  └─ Check for duplicates
│  └─ Bulk upload 100+ products at once
├─ Batch Import Schedule
│  ├─ Schedule for off-peak hours
│  ├─ Track progress via email notification
│  └─ Download error report if issues
└─ Update Existing Products
   ├─ Bulk edit prices
   ├─ Bulk update stock levels
   └─ Bulk status changes (Active/Inactive)

Step 5: INVENTORY MANAGEMENT
Dashboard: /business/inventory
├─ Real-Time Stock Tracking
│  ├─ View all product stock levels
│  ├─ Color-code by status:
│  │  ├─ 🟢 In Stock (quantity > reorder level)
│  │  ├─ 🟡 Low Stock (quantity = reorder level)
│  │  └─ 🔴 Out of Stock (quantity = 0)
│  └─ Sort by stock level
├─ Inventory Alerts
│  ├─ Auto-alert when stock hits reorder level
│  ├─ Email notification to inventory manager
│  ├─ In-app notification
│  └─ Set custom reorder levels per product
├─ Stock Adjustments
│  ├─ Manual stock update
│  │  ├─ Adjust quantity up/down
│  │  ├─ Log reason (Purchase, Damage, Return, etc.)
│  │  └─ Timestamp recorded for audit
│  └─ Batch adjustments (Excel import)
├─ Inventory Analytics
│  ├─ Fastest moving products
│  ├─ Slow-moving/dead stock products
│  ├─ Stock value (on-hand value)
│  ├─ Inventory turnover ratio
│  ├─ Average days to sell
│  └─ Forecasting (suggest reorder quantities)
├─ Multi-Location Inventory
│  ├─ Track stock across locations
│  ├─ Transfer stock between branches
│  ├─ Centralized or distributed views
│  └─ Location-wise analytics
└─ Barcode Integration (Optional)
   ├─ Generate barcodes for products
   ├─ Print barcode stickers
   └─ Scan to update inventory

Step 6: CUSTOMER INQUIRIES & LEADS
├─ Receive Leads from Customers
│  ├─ Via Product Page Inquiry Form
│  ├─ Customer submits:
│  │  ├─ Business Name
│  │  ├─ Contact Name
│  │  ├─ Email & Phone
│  │  ├─ Quantity Required
│  │  ├─ Message/Special Request
│  │  └─ Preferred Contact Method
│  └─ Lead Auto-Stored in leads Collection
├─ Notification System
│  ├─ Email notification to business email
│  ├─ SMS notification to business phone
│  ├─ WhatsApp notification (if opted-in)
│  └─ In-app notification in dashboard
├─ Lead Management Dashboard (/business/leads)
│  ├─ View All Leads
│  │  ├─ Filter by product
│  │  ├─ Filter by status
│  │  ├─ Sort by date or quantity
│  │  └─ Search by customer name
│  ├─ Lead Details Card
│  │  ├─ Customer Name & Company
│  │  ├─ Contact Information
│  │  ├─ Product Inquired
│  │  ├─ Quantity Required
│  │  ├─ Message Details
│  │  ├─ Inquiry Date & Time
│  │  └─ Lead Status: New/Contacted/Quoted/Converted/Lost
│  ├─ Quick Actions
│  │  ├─ Call Customer (VOIP)
│  │  ├─ Send Email
│  │  ├─ Send WhatsApp Message
│  │  ├─ Share Quotation
│  │  ├─ Schedule Follow-up
│  │  └─ Move to Next Stage
│  └─ Bulk Actions
│     ├─ Send mass email to new leads
│     ├─ Bulk status change
│     └─ Bulk export to CRM
├─ Sales Funnel (Kanban View)
│  ├─ Column 1: 🆕 New Leads
│  │  └─ Inbox of inquiries
│  ├─ Column 2: 📞 Contacted
│  │  └─ Already called/messaged
│  ├─ Column 3: 💰 Quoted
│  │  └─ Quotation sent
│  ├─ Column 4: ✅ Converted
│  │  └─ Order received
│  └─ Column 5: ❌ Lost
│     └─ Customer rejected
├─ Lead Scoring (A.I. Optional)
│  ├─ Hot: High-value, quick response needed
│  ├─ Warm: Medium-value, regular follow-up
│  └─ Cold: Low-value, long-term nurture
└─ Lead Analytics
   ├─ Total leads (daily/monthly)
   ├─ Conversion rate (% of Converted)
   ├─ Avg. time to convert
   ├─ Lead source breakdown
   └─ Product-wise lead performance

Step 7: QUOTATION & ORDER MANAGEMENT
├─ Create Quotations
│  ├─ For selected lead
│  ├─ Or manual quotation
│  ├─ Quotation Form
│  │  ├─ Customer details auto-filled
│  │  ├─ Add line items
│  │  │  ├─ Product name
│  │  │  ├─ Quantity
│  │  │  ├─ Unit price
│  │  │  ├─ Tax rate
│  │  │  └─ Discount %
│  │  ├─ Add delivery charges
│  │  ├─ Add taxes (GST)
│  │  ├─ Payment terms
│  │  │  ├─ 50% Advance, 50% on delivery
│  │  │  ├─ Full payment upfront
│  │  │  ├─ Net 30/45/60 days (credit)
│  │  │  └─ Custom terms
│  │  ├─ Valid Until (expiry date)
│  │  └─ Notes/Terms & Conditions
│  └─ Auto-calculate Grand Total
├─ Send Quotation
│  ├─ Email PDF quotation to customer
│  ├─ WhatsApp quotation link
│  ├─ Mark as "Quoted" in lead funnel
│  └─ System tracks send date
├─ Quotation Tracking
│  ├─ View: Opened by customer?
│  ├─ View: Downloaded?
│  ├─ View: Forwarded to others?
│  ├─ Reminder: Follow-up after 3 days
│  └─ Auto-expire quotation after validity date
├─ Order Received
│  ├─ Customer accepts quotation
│  ├─ Create Purchase Order (PO) in system
│  ├─ Auto-move lead to "Converted"
│  └─ Generate Invoice
├─ Invoice Management
│  ├─ Auto-generate invoice from PO
│  ├─ Invoice Details
│  │  ├─ Invoice Number (auto-generated)
│  │  ├─ Date
│  │  ├─ All line items with taxes
│  │  ├─ Payment terms
│  │  ├─ Bank details for payment
│  │  └─ Notes
│  ├─ Email invoice to customer
│  ├─ Payment tracking
│  │  ├─ Mark partial payments
│  │  ├─ Track payment date
│  │  └─ Send payment reminders
│  └─ Generate reports (Invoice history, paid/unpaid)
└─ Purchase Orders Archive
   └─ Store all PO/Invoice history for records

Step 8: CUSTOMER REVIEWS & RATINGS
├─ Receive Customer Reviews
│  ├─ After product purchase/service completion
│  ├─ Customer rates: 1-5 stars
│  ├─ Customer writes review text
│  └─ Review stored in reviews Collection
├─ Manage Reviews on Profile
│  ├─ View all reviews on company page
│  ├─ See overall rating (average stars)
│  ├─ See review count
│  ├─ Reply to reviews
│  │  ├─ Public response to customer
│  │  ├─ Thank for positive reviews
│  │  ├─ Address concerns in negative reviews
│  │  └─ Response visible on product page
│  ├─ Flag inappropriate reviews
│  │  └─ Request admin removal if necessary
│  └─ Analytics
│     ├─ Review trend (improving/declining)
│     ├─ Common feedback themes
│     ├─ Sentiment analysis (positive/negative)
│     └─ Keyword cloud of review text
├─ Trust Badges (Reputation)
│  ├─ Display on business profile if:
│  │  ├─ Rating >= 4.5 stars
│  │  ├─ 50+ reviews
│  │  └─ Response rate > 80%
│  └─ Badge improves visibility & credibility
└─ Encourage Reviews
   ├─ Auto-email request after purchase
   ├─ In-app review request popup
   ├─ WhatsApp review request
   └─ Offer incentive (optional): "Give review, get coupon"

Step 9: PAYMENT PROCESSING (B2B Payments)
├─ Payment Methods Offered
│  ├─ Direct Bank Transfer
│  │  ├─ Provide business bank details
│  │  ├─ Customer transfers amount
│  │  ├─ Receive notification (optional)
│  │  └─ Manually mark as paid
│  ├─ Razorpay Payment Gateway
│  │  ├─ Customer pays via Razorpay
│  │  ├─ Accept Credit/Debit Card
│  │  ├─ Accept Net Banking
│  │  ├─ Accept UPI
│  │  └─ Accept Wallet
│  ├─ Cheque (for large orders)
│  │  └─ Add as payment method
│  └─ Credit Terms (for verified businesses)
│     └─ Net 30/45/60 days payment
├─ Payment Received Notification
│  ├─ Real-time notification
│  ├─ Auto-reconciliation (if integrated)
│  ├─ Email confirmation to customer
│  ├─ Update invoice status to "Paid"
│  └─ Auto-trigger fulfillment process
├─ Settlement & Payouts
│  ├─ Admin processes payments to business bank account
│  ├─ Monthly or weekly settlements (configurable)
│  ├─ Net of platform commission (%)
│  ├─ Store in paymentRequests Collection
│  └─ Business receives bank transfer
└─ Payment Analytics
   ├─ Total revenue (daily/monthly)
   ├─ Payment pending amount
   ├─ Overdue payments
   ├─ Average time to pay (metrics)
   └─ Payment history export

Step 10: MARKETING & PROMOTION
Dashboard: /business/marketing
├─ Featured Listing
│  ├─ Pay for Featured Badge
│  ├─ Appears at top of category/search
│  ├─ Highlighted with badge
│  ├─ Increase visibility & inquiries
│  └─ Plans:
│     ├─ Daily Featured (₹500)
│     ├─ Weekly Featured (₹2,500)
│     └─ Monthly Featured (₹8,000)
├─ Advertisements
│  ├─ Create Display Ads
│  ├─ Ad details:
│  │  ├─ Ad Image/Creative
│  │  ├─ Headline Text
│  │  ├─ Description
│  │  ├─ Call-to-Action Button
│  │  └─ Landing URL
│  ├─ Targeting Options
│  │  ├─ All Users / Category-specific
│  │  ├─ District-specific
│  │  ├─ Business Size targeting
│  │  └─ Job title targeting
│  ├─ Budget Setting
│  │  ├─ Daily budget cap
│  │  ├─ Total campaign budget
│  │  ├─ Cost per click (CPC)
│  │  └─ Cost per impression (CPM)
│  ├─ Campaign Scheduling
│  │  ├─ Start date
│  │  ├─ End date
│  │  └─ Time-of-day scheduling
│  └─ Run Campaign
│     ├─ Ad displays on platform
│     ├─ Track impressions in real-time
│     ├─ Track clicks
│     └─ Calculate ROI
├─ Email Marketing
│  ├─ Build email list from inquiries
│  ├─ Create email campaign
│  │  ├─ Email template
│  │  ├─ Subject line
│  │  ├─ Body text
│  │  ├─ Product links
│  │  └─ Call-to-Action
│  ├─ Schedule send
│  │  ├─ Immediate
│  │  ├─ Scheduled date/time
│  │  └─ Recurring (weekly, monthly)
│  ├─ Segment recipients
│  │  ├─ By customer type
│  │  ├─ By purchase history
│  │  ├─ By engagement level
│  │  └─ By location
│  └─ Track Email Performance
│     ├─ Opens, Clicks, Conversions
│     ├─ Bounce rate
│     ├─ Unsubscribe rate
│     └─ A/B testing results
├─ Social Media Integration
│  ├─ Share products to Facebook
│  ├─ Share products to Instagram
│  ├─ Generate shareable product links
│  └─ Track social clicks to store
├─ Referral Program
│  ├─ Generate referral link
│  ├─ Share with customers/partners
│  ├─ Offer incentive (₹X off per referral)
│  ├─ Track referral signups
│  └─ Offer rewards (commissions, credits)
└─ Analytics Dashboard
   ├─ Campaign performance
   ├─ Top performing products
   ├─ Marketing ROI
   └─ Customer acquisition cost

Workflow Summary:
┌──────────┬────────────┬──────────┬───────────┬──────────┬─────────┐
│ Register │ List       │ Receive  │ Send      │ Receive  │ Manage &│
│ & Verify │ Products   │ Inquiries│ Quotation │ Payment  │ Grow    │
└──────────┴────────────┴──────────┴───────────┴──────────┴─────────┘
```

---

### 2.4 🔧 SERVICE PROVIDER WORKFLOW

```
┌─────────────────────────────────────────────────────────────────┐
│              SERVICE PROVIDER JOURNEY                           │
└─────────────────────────────────────────────────────────────────┘

Step 1: REGISTRATION & PROFILE SETUP
├─ Sign Up as Service Provider
│  ├─ Email/Password or Google OAuth
│  └─ Select Role: "Service Provider"
├─ Basic Information
│  ├─ Full Name
│  ├─ Phone Number (Mandatory - used for booking)
│  ├─ Email Address
│  ├─ Profile Picture (upload professional photo)
│  └─ Location (Select District in Tamil Nadu)
├─ Service Provider Verification
│  ├─ Phone OTP Verification
│  │  ├─ OTP sent to phone
│  │  ├─ Verify ownership of number
│  │  └─ Phone stored as primary contact
│  └─ Optional: Government ID Verification
│     ├─ Upload ID (Aadhar/PAN/License)
│     ├─ Verify via document OCR
│     └─ Build trust with customers
├─ Store in users Collection
│  ├─ userId
│  ├─ role: "serviceProvider"
│  ├─ verificationStatus: "Verified" (after phone OTP)
│  └─ All profile details
└─ Account Active

Step 2: DETAILED SERVICE PROFILE
Dashboard: /provider/profile
├─ Add Service Details
│  ├─ Primary Service Category
│  │  ├─ Plumbing, Electrical, Carpentry
│  │  ├─ Cleaning, Moving, Painting
│  │  ├─ Tutoring, Coaching, Consulting
│  │  ├─ Beauty, Health & Wellness
│  │  ├─ Automotive Services
│  │  └─ Other services (searchable)
│  ├─ Service Specializations (multi-select)
│  │  ├─ If Plumbing: Leak Fixing, Pipe Installation, etc.
│  │  ├─ If Tutoring: Math, Science, English, IIT-JEE, etc.
│  │  └─ Select all relevant options
│  ├─ Experience & Qualifications
│  │  ├─ Years in Business
│  │  ├─ Certifications/Credentials (list)
│  │  ├─ Education Level
│  │  └─ Training Completed
│  ├─ Bio/Professional Summary
│  │  ├─ 50-200 words about services
│  │  ├─ Expertise highlights
│  │  └─ Unique selling points
│  ├─ Service Coverage Area
│  │  ├─ Which districts (multi-select)
│  │  ├─ Within city or pan-state
│  │  ├─ Willingness to travel
│  │  └─ Service radius (KM from location)
│  ├─ Pricing Model
│  │  ├─ Hourly Rate (₹X per hour)
│  │  ├─ Fixed Price per Job (₹X per job)
│  │  ├─ Package Pricing
│  │  │  ├─ Basic Package: ₹X (includes A, B, C)
│  │  │  ├─ Standard Package: ₹Y (includes A, B, C, D, E)
│  │  │  └─ Premium Package: ₹Z (full service)
│  │  └─ Minimum Order Value (optional)
│  ├─ Availability
│  │  ├─ Working Days (Mon-Sun)
│  │  ├─ Working Hours (9 AM - 6 PM, flexible)
│  │  ├─ Availability Type (Real-time, Pre-booking)
│  │  └─ Response Time (same-day, next-day, etc.)
│  ├─ Service Images
│  │  ├─ Portfolio Photos (5-10 images)
│  │  ├─ Before/After Photos (if applicable)
│  │  ├─ Equipment/Tools Photos
│  │  └─ Cloud Storage handles uploads
│  └─ Gallery Video (optional, 30-60 second demo)
├─ Firestore stores in serviceProfiles Collection
│  ├─ serviceProviderId
│  ├─ All profile & pricing details
│  ├─ rating: 0 (initially)
│  ├─ reviewCount: 0
│  ├─ completedJobs: 0
│  └─ profileStrength: % (based on completeness)
└─ Profile Goes Live
   └─ Visible on /services directory

Step 3: BOOKING & SERVICE REQUEST
├─ Customer Books Service
│  ├─ Visit /services directory
│  ├─ Search/Filter by:
│  │  ├─ Service Category
│  │  ├─ District/Location
│  │  ├─ Price Range
│  │  ├─ Rating/Reviews
│  │  └─ Availability
│  ├─ View Service Provider Profile
│  │  ├─ Photo, Bio, Qualifications
│  │  ├─ Service Details, Pricing
│  │  ├─ Average Rating & Review Count
│  │  ├─ Response Time
│  │  └─ Availability Status
│  ├─ Click "Book Service" or "Get Quote"
│  └─ Booking Form
│     ├─ Service Date
│     ├─ Service Time (optional)
│     ├─ Service Location
│     ├─ Service Description (detailed notes)
│     ├─ Preferred Package (if applicable)
│     ├─ Special Requests/Instructions
│     ├─ Customer Contact (auto-filled)
│     └─ Accept Terms & Conditions
├─ Booking Created
│  ├─ Store in bookings Collection
│  │  ├─ bookingId (unique)
│  │  ├─ serviceProviderId
│  │  ├─ customerId
│  │  ├─ All request details
│  │  ├─ bookingStatus: "Pending" (awaiting provider response)
│  │  ├─ quotedPrice: null (to be filled by provider)
│  │  └─ createdAt timestamp
│  ├─ Notification to Service Provider
│  │  ├─ Email notification
│  │  ├─ SMS notification
│  │  ├─ In-app notification
│  │  └─ Call-to-action: "Review & Respond"
│  └─ Notification to Customer
│     ├─ Confirmation email
│     └─ In-app notification: "Provider will respond shortly"
├─ Service Provider Reviews Booking
│  ├─ View Booking Details
│  ├─ Check Customer Profile
│  │  ├─ Name, Rating, Reviews
│  │  └─ Previous bookings/reviews
│  └─ Make Decision:
│     ├─ Option A: Accept Booking
│     │  ├─ Auto-calculate price based on details
│     │  ├─ Or override with custom quote
│     │  ├─ Send quote to customer
│     │  ├─ Update bookingStatus: "Quoted"
│     │  └─ Wait for customer confirmation
│     └─ Option B: Decline Booking
│        ├─ Provide reason (optional)
│        ├─ Update bookingStatus: "Declined"
│        └─ Customer can book alternative provider
└─ Customer Confirms Quote
   ├─ Receives quote notification
   ├─ Reviews price & details
   ├─ Click "Confirm Booking"
   ├─ Update bookingStatus: "Confirmed"
   └─ Payment process begins

Step 4: PAYMENT FOR SERVICE
├─ Payment Options
│  ├─ Online Payment (Razorpay)
│  │  ├─ Customer pays via UPI/Card/Net Banking
│  │  ├─ Platform collects with commission %
│  │  └─ Real-time confirmation
│  ├─ Cash Payment
│  │  ├─ Pay provider directly at service
│  │  ├─ Manual mark as paid post-service
│  │  └─ Less recommended for both parties
│  ├─ Wallet Payment
│  │  ├─ Customer has account balance
│  │  ├─ Auto-deduct on booking confirmation
│  │  └─ Quick & hassle-free
│  └─ Advance Payment Model
│     ├─ Customer pays 30-50% advance now
│     ├─ Rest pay after service completion
│     └─ Reduces no-show risk
```

---

<!-- NOTE: The following sections were truncated during input and need to be added:
   - Service Provider Steps 5-8 (Service Execution, Reviews, Analytics, Growth)
   - Section 2.5: Admin Workflow
   - Section 3: Detailed Feature Breakdown
   - Section 4: Technical Architecture
   - Section 5: Database Schema
   - Section 6: Integration & Communication Flows
-->
