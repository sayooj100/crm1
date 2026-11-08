import React from 'react';
import { getCurrentEmployee } from '@/lib/services/employees';
import { getOverdueSubmissions, getExpiringCertificates } from '@/lib/services/submissions';
import SidebarNav from './components/SidebarNav';
import NotificationBell from './components/NotificationBell';
import ExpiryNotificationBell from './components/ExpiryNotificationBell';
import { signOut } from '@/app/actions/auth';
import { LogOut } from 'lucide-react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch current employee session details
  const employee = await getCurrentEmployee();

  // Fetch overdue processing tasks for the notification bell
  let overdueList: any[] = [];
  let expiringList: any[] = [];
  try {
    overdueList = await getOverdueSubmissions();
    expiringList = await getExpiringCertificates();
  } catch (error) {
    console.error('Error fetching notification alert list:', error);
  }

  // Format dates for display in Indian standard format
  const formattedOverdue = overdueList.map((sub: any) => ({
    id: sub.id,
    next_due_date: sub.next_due_date
      ? new Date(sub.next_due_date).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      : '',
    user: {
      owner_name: sub.user?.owner_name || 'Customer',
      company_name: sub.user?.company_name || null,
    },
    service: {
      name: sub.service?.name || 'Service',
    },
  }));

  const formattedExpiring = expiringList.map((sub: any) => ({
    id: sub.id,
    next_due_date: sub.next_due_date
      ? new Date(sub.next_due_date).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      : '',
    user: {
      owner_name: sub.user?.owner_name || 'Customer',
      company_name: sub.user?.company_name || null,
    },
    service: {
      name: sub.service?.name || 'Service',
    },
    answers: sub.answers
  }));

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">Test Operations</div>
        
        <SidebarNav />

        <div className="sidebar-footer">
          <div className="employee-info">
            <span className="employee-name" title={employee?.name || 'Staff'}>
              {employee?.name || 'Staff Member'}
            </span>
            <span className="employee-email" title={employee?.email || ''}>
              {employee?.email || 'authenticated'}
            </span>
          </div>
          <form action={signOut}>
            <button type="submit" className="btn-icon" title="Sign Out" aria-label="Sign Out">
              <LogOut size={18} />
            </button>
          </form>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="main-content">
        <header className="topbar">
          <div className="page-title">Operations Console</div>
          <div className="topbar-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <ExpiryNotificationBell expiringList={formattedExpiring} />
            <NotificationBell overdueList={formattedOverdue} />
          </div>
        </header>

        <main className="content-wrapper">{children}</main>
      </div>
    </div>
  );
}
