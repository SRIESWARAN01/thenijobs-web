import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Admin Job Alerts & Cross-Role Workflow Audit Tests', () => {
  const rootDir = process.cwd();

  it('1. Admin Job Alerts Page exists with full management capabilities', () => {
    const alertsPagePath = path.join(rootDir, 'src/app/admin/job-alerts/page.tsx');
    assert.ok(fs.existsSync(alertsPagePath), 'admin/job-alerts/page.tsx must exist');
    const content = fs.readFileSync(alertsPagePath, 'utf8');

    // Queries live jobAlerts and users
    assert.ok(content.includes("useCollection<JobAlertDoc>('jobAlerts')"), 'Must query jobAlerts collection');
    assert.ok(content.includes("useCollection<UserDoc>('users')"), 'Must query users collection to correlate candidate info');

    // Filter & search capabilities
    assert.ok(content.includes('searchQuery') && content.includes('districtFilter') && content.includes('statusFilter'), 'Must have search and filters');
    assert.ok(content.includes('channelFilter'), 'Must have channel filter');

    // Management actions: toggle status & delete
    assert.ok(content.includes('handleToggleStatus'), 'Must allow toggling alert status (active/paused)');
    assert.ok(content.includes('handleDeleteAlert'), 'Must allow deleting an alert');
    assert.ok(content.includes("deleteDocument('jobAlerts'"), 'Must call deleteDocument for jobAlerts');

    // Cross-link to Job Seeker Profile
    assert.ok(content.includes('/admin/job-seekers?q='), 'Must cross-link to candidate profile');
  });

  it('2. Admin Layout Navigation contains Job Alerts menu item', () => {
    const adminLayoutPath = path.join(rootDir, 'src/app/admin/layout.tsx');
    const content = fs.readFileSync(adminLayoutPath, 'utf8');

    assert.ok(content.includes('/admin/job-alerts'), 'ADMIN_NAV must include /admin/job-alerts');
    assert.ok(content.includes("label: 'Job Alerts'") || content.includes('label: "Job Alerts"'), 'Nav label must be Job Alerts');
  });

  it('3. Admin Job Seekers Directory correlates Job Alerts & Candidate Transitions', () => {
    const jobSeekersPagePath = path.join(rootDir, 'src/app/admin/job-seekers/page.tsx');
    const content = fs.readFileSync(jobSeekersPagePath, 'utf8');

    // Query job alerts
    assert.ok(content.includes("useCollection<any>('jobAlerts')"), 'Must query jobAlerts');
    
    // MergedCandidate has alert fields
    assert.ok(content.includes('alerts?: any[]') && content.includes('alertCount?: number'), 'MergedCandidate must store alert info');
    assert.ok(content.includes('employerApplication?:'), 'MergedCandidate must store employerApplication');

    // Table column for Job Alerts
    assert.ok(content.includes("key: 'jobAlerts'") && content.includes('/admin/job-alerts?q='), 'Must display Job Alerts column linking to alerts manager');

    // Dossier modal displays candidate alerts & employer registration request
    assert.ok(content.includes('Job Alert Subscriptions'), 'Dossier modal must display Job Alert Subscriptions section');
    assert.ok(content.includes('Employer Registration Request') || content.includes('employerApplication'), 'Dossier modal must show employer application banner');
  });

  it('4. Business Approvals queue surfaces Job Seeker Employer applications', () => {
    const approvalsPagePath = path.join(rootDir, 'src/app/admin/business-approvals/page.tsx');
    const content = fs.readFileSync(approvalsPagePath, 'utf8');

    assert.ok(content.includes('u.employerApplication?.status !== undefined'), 'Approvals filter must include candidate employer applications');
    assert.ok(content.includes('u.employerApplication?.companyName'), 'Approvals queue must resolve company name from application');
  });

  it('5. Backend Firestore Service handles Candidate-to-Employer promotion and alert rules', () => {
    const firestoreServicePath = path.join(rootDir, 'src/lib/firebase/firestoreService.ts');
    const content = fs.readFileSync(firestoreServicePath, 'utf8');

    // approveBusinessOwner promotes role and links company
    assert.ok(content.includes("role: 'business_owner'"), 'approveBusinessOwner must promote role to business_owner');
    assert.ok(content.includes("userUpdates['employerApplication.status'] = 'approved'"), 'Must update employerApplication.status to approved');

    // rejectBusinessOwner handles employer application
    assert.ok(content.includes("updates['employerApplication.status'] = 'rejected'"), 'rejectBusinessOwner must update employerApplication.status to rejected');
  });

  it('6. Firestore Security Rules grant Admin full access to jobAlerts while protecting Job Seekers', () => {
    const rulesPath = path.join(rootDir, 'firestore.rules');
    const content = fs.readFileSync(rulesPath, 'utf8');

    // Match jobAlerts
    assert.ok(content.includes('match /jobAlerts/{alertId}'), 'Must have rules for /jobAlerts/{alertId}');
    assert.ok(content.includes('isAdmin()'), 'jobAlerts rule must grant isAdmin() access');
    assert.ok(
      content.includes('resource.data.userId == request.auth.uid') ||
      content.includes('request.resource.data.userId == request.auth.uid') ||
      content.includes('request.auth.uid == request.resource.data.userId') ||
      content.includes('request.auth.uid == resource.data.userId'),
      'jobAlerts rule must restrict users to their own alerts'
    );
  });

  it('7. Role Route Protection verified across all four portals', () => {
    // Admin portal
    const adminLayout = fs.readFileSync(path.join(rootDir, 'src/app/admin/layout.tsx'), 'utf8');
    assert.ok(adminLayout.includes("'admin'") && adminLayout.includes("'super_admin'"), 'Admin layout must check admin / super_admin role');
    assert.ok(!adminLayout.includes("'employee'") && !adminLayout.includes("'job_seeker'"), 'Admin layout must block employee and seeker roles');

    // Employee role routing and authorization (Company Staff / Recruiter workspace)
    const employerLayout = fs.readFileSync(path.join(rootDir, 'src/app/employer/layout.tsx'), 'utf8');
    assert.ok(employerLayout.includes("'employee'"), 'Employer workspace layout must authorize employee role');
    const authRedirect = fs.readFileSync(path.join(rootDir, 'src/lib/authRedirect.ts'), 'utf8');
    assert.ok(authRedirect.includes("role === 'employee'"), 'Auth redirect must route employee to employer dashboard');

    // Job Seeker portal
    const seekerLayout = fs.readFileSync(path.join(rootDir, 'src/app/seeker/layout.tsx'), 'utf8');
    assert.ok(seekerLayout.includes("'job_seeker'"), 'Job Seeker layout must check job_seeker role');

    // Business Owner portal
    assert.ok(employerLayout.includes("'business_owner'") && employerLayout.includes("'employer'"), 'Employer layout must authorize business_owner and employer roles');
  });
});
