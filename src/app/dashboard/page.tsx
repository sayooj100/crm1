import React from 'react';
import Link from 'next/link';
import { listSubmissions } from '@/lib/services/submissions';
import { listLedgerEntries } from '@/lib/services/ledger';
import {
  Users,
  FileText,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Clock,
  CheckCircle,
  Briefcase,
  ChevronRight,
  Calendar
} from 'lucide-react';

export const revalidate = 0; // Dynamic route to pull live metrics

export default async function DashboardPage() {
  const [submissions, ledgerEntries] = await Promise.all([
    listSubmissions(),
    listLedgerEntries(),
  ]);

  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Calculate case checklist stats
  const pendingCount = submissions.filter((s: any) => s.status === 'pending').length;
  
  const dueTodayCount = submissions.filter((s: any) => {
    if (s.status !== 'processing' || !s.next_due_date) return false;
    const dueDate = new Date(s.next_due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() === today.getTime();
  }).length;

  const overdueCount = submissions.filter((s: any) => {
    if (s.status !== 'processing' || !s.next_due_date) return false;
    const dueDate = new Date(s.next_due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  }).length;

  // 2. Calculate this month's financial metrics
  let monthIncome = 0;
  let monthExpense = 0;

  ledgerEntries.forEach((entry: any) => {
    const entryDate = new Date(entry.date);
    const now = new Date();
    
    // Check if entry falls in the current calendar month and year
    if (
      entryDate.getMonth() === now.getMonth() &&
      entryDate.getFullYear() === now.getFullYear()
    ) {
      const amount = Number(entry.amount) || 0;
      if (entry.type === 'income') {
        monthIncome += amount;
      } else {
        monthExpense += amount;
      }
    }
  });

  const monthProfit = monthIncome - monthExpense;

  // Get active overdue items list to display prominently
  const overdueList = submissions.filter((s: any) => {
    if (s.status !== 'processing' || !s.next_due_date) return false;
    const dueDate = new Date(s.next_due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  });

  return (
    <div>
      {/* Brand Header Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary-glow)) 0%, transparent 100%)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          marginBottom: '24px',
          padding: '24px',
        }}
      >
        <h2 style={{ fontSize: '26px', marginBottom: '8px', fontWeight: 700 }}>
          Test Operations Dashboard
        </h2>
        <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '15px' }}>
          Real-time case tracker, compliance deadlines calendar, and general ledger statement overview.
        </p>
      </div>

      {/* Quick Console Links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <Link
          href="/dashboard/submissions"
          className="btn btn-primary"
          style={{ padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileText size={20} />
            <span style={{ fontWeight: 600 }}>Submissions Board</span>
          </div>
          <ChevronRight size={16} />
        </Link>

        <Link
          href="/dashboard/accounts"
          className="btn btn-secondary"
          style={{ padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', border: '1px solid hsl(var(--border))' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'hsl(var(--text-primary))' }}>
            <CreditCard size={20} style={{ color: 'hsl(var(--primary))' }} />
            <span style={{ fontWeight: 600 }}>Accounts Console</span>
          </div>
          <ChevronRight size={16} style={{ color: 'hsl(var(--text-secondary))' }} />
        </Link>
      </div>

      {/* Key Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        {/* Pending Cases */}
        <div className="stat-card">
          <div className="stat-icon stat-icon-blue">
            <Clock size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Pending Reviews</span>
            <span className="stat-value">{pendingCount}</span>
          </div>
        </div>

        {/* Overdue deadliness */}
        <div className="stat-card" style={{ border: overdueCount > 0 ? '1px solid hsl(var(--danger))' : undefined }}>
          <div className={`stat-icon ${overdueCount > 0 ? 'stat-icon-red' : 'stat-icon-orange'}`}>
            <AlertTriangle size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Overdue Tasks</span>
            <span className="stat-value" style={{ color: overdueCount > 0 ? 'hsl(var(--danger))' : undefined }}>
              {overdueCount}
            </span>
          </div>
        </div>

        {/* Due Today */}
        <div className="stat-card">
          <div className="stat-icon stat-icon-orange">
            <Calendar size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Due Today</span>
            <span className="stat-value">{dueTodayCount}</span>
          </div>
        </div>
      </div>

      {/* Financial Health Summary - THIS MONTH */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Financial Performance (This Month)</h3>
        <div className="stats-grid">
          {/* Month Income */}
          <div className="stat-card">
            <div className="stat-icon stat-icon-green">
              <ArrowUpRight size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Month Income</span>
              <span className="stat-value">₹{monthIncome.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Month Expense */}
          <div className="stat-card">
            <div className="stat-icon stat-icon-red">
              <ArrowDownRight size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Month Expense</span>
              <span className="stat-value">₹{monthExpense.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Month Net Profit */}
          <div className="stat-card">
            <div className="stat-icon stat-icon-blue">
              <CreditCard size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Month Net Profit</span>
              <span className="stat-value" style={{ color: monthProfit >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}>
                ₹{monthProfit.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alert / List Panel layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Critical Alerts: Overdue Submissions */}
        <div className="card" style={{ marginBottom: 0, border: overdueList.length > 0 ? '1px solid rgba(239, 68, 68, 0.2)' : undefined }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="card-title" style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} style={{ color: overdueList.length > 0 ? 'hsl(var(--danger))' : 'hsl(var(--text-secondary))' }} />
              Overdue Compliance Actions
            </h3>
            <span className={`badge badge-${overdueList.length > 0 ? 'expense' : 'completed'}`}>
              {overdueList.length} urgent
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {overdueList.slice(0, 5).map((sub: any) => (
              <div
                key={sub.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.02)',
                  border: '1px solid rgba(239, 68, 68, 0.1)',
                  borderRadius: '8px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{sub.service?.name}</div>
                  <div style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))' }}>
                    Client: {sub.user?.owner_name} {sub.user?.company_name ? `(${sub.user.company_name})` : ''}
                  </div>
                </div>
                <Link
                  href={`/dashboard/submissions/${sub.id}`}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  Solve Task
                </Link>
              </div>
            ))}
            {overdueList.length === 0 && (
              <p style={{ textAlign: 'center', color: 'hsl(var(--text-secondary))', padding: '32px 0', fontSize: '14px', fontStyle: 'italic' }}>
                ✓ Excellent! No compliance delays today.
              </p>
            )}
          </div>
        </div>

        {/* Recent Ledger Entries */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="card-title" style={{ margin: 0 }}>
              Recent Transactions
            </h3>
            <Link
              href="/dashboard/accounts"
              style={{
                fontSize: '13px',
                color: 'hsl(var(--primary))',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                textDecoration: 'none',
              }}
            >
              Ledger <ArrowUpRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {ledgerEntries.slice(0, 5).map((entry: any) => {
              const isIncome = entry.type === 'income';
              return (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: 'hsl(var(--bg-panel))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{entry.remark || 'General Log'}</div>
                    <div style={{ fontSize: '11px', color: 'hsl(var(--text-secondary))' }}>
                      {new Date(entry.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}{' '}
                      | <span style={{ textTransform: 'capitalize' }}>{entry.source}</span>
                    </div>
                  </div>
                  <span style={{ fontWeight: 700, color: isIncome ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}>
                    {isIncome ? '+' : '-'} ₹{Number(entry.amount).toLocaleString('en-IN')}
                  </span>
                </div>
              );
            })}
            {ledgerEntries.length === 0 && (
              <p style={{ textAlign: 'center', color: 'hsl(var(--text-secondary))', padding: '32px 0', fontSize: '14px', fontStyle: 'italic' }}>
                No ledger statement items logged.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
