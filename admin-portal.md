# THENIJOBS — Admin Portal Documentation

This document describes the access controls, security mechanisms, and management features implemented for the **THENIJOBS Admin Panel**.

---

## 🔐 1. Access Control & Initialization

The admin panel at `/admin/dashboard` is protected with client-side session guards.

### First-Time Initialization
When visiting `/admin/dashboard` for the first time, if no configuration is found in the browser's storage:
1. You will be greeted by the **Create Admin Account** screen.
2. Enter your custom **Username** and a secure **Password** (minimum 6 characters).
3. Click **Initialize Portal**.
4. The system will save your custom admin credentials and automatically log you in.

### Subsequent Authentications
On all future visits:
1. You will see the **Admin Authentication** screen.
2. Log in using the custom username and password you created.
3. Click **Authenticate** to load the dashboard.

### Logging Out
To secure your session, click the **Log Out** button at the bottom left of the sidebar menu. This immediately destroys the active session and returns you to the authentication screen.

---

## 🛠️ 2. Portal Features & Tabs

The Admin Portal contains six main tabs designed for platform supervision:

### 📊 Dashboard Tab
* **Stats Tracker**: At-a-glance status overview showing total registered Users, listed Companies, Active Jobs, and Sent Applications.
* **Pending Company Approvals**: Real-time moderation feed to approve or reject newly submitted business listings.
* **Reported Jobs**: Moderation list for job posts flagged by the community.

### 👤 Users Tab
* **User Ledger**: Table showing User Name, Role (e.g. Job Seeker, Employer, Business Owner, Supplier), District, Join Date, and Status (Active/Suspended).
* **Moderation Controls**: Options to inspect details, verify emails/mobile badges, suspend/unsuspend, or completely delete accounts.

### 🏢 Companies Tab
* **Directory Moderation**: Extended tools to view registered businesses, approve listings, reject spam, or toggle the **Premium (Featured)** badge.

### 💼 Jobs Tab
* **Job Directory**: Detailed listings list with options to remove posts violating terms.

### 📈 Reports Tab
* **Platform Health Analytics**: Metrics detailing platform revenue, registration growth, and posting trends.

### ⚙️ Settings Tab
* **Admin Credentials Configuration**: Form allowing you to change your custom admin username and password directly from the dashboard.
* **Category & Location Builders**: Panels to edit search filters, categories, and districts.

---

## 📂 3. Directory File References

* **Admin Panel Page**: [src/app/admin/dashboard/page.tsx](file:///c:/jo/thenijobs/src/app/admin/dashboard/page.tsx)
* **Firestore Rules**: [firestore.rules](file:///c:/jo/thenijobs/firestore.rules)
* **Realtime DB Rules**: [database.rules.json](file:///c:/jo/thenijobs/database.rules.json)
* **Storage Rules**: [storage.rules](file:///c:/jo/thenijobs/storage.rules)
