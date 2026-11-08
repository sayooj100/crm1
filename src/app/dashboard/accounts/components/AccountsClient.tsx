'use client';

import React, { useState, useActionState, useEffect } from 'react';
import Link from 'next/link';
import { handleCreateLedgerEntryManual } from '@/app/actions/ledger';
import { Plus, X, ArrowUpRight, ArrowDownRight, Download, CreditCard, Calendar, Tag, BarChart3, Filter } from 'lucide-react';

interface LedgerEntry {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  date: string;
  source: 'auto' | 'manual';
  remark: string | null;
  submission?: {
    id: string;
    user?: {
      owner_name: string;
      company_name: string | null;
    } | null;
    service?: {
      name: string;
    } | null;
  } | null;
}

interface Bill {
  id: string;
  govt_fee: number;
  service_charge: number;
  extra_fee: number;
  remarks: string | null;
  total: number;
  created_at: string;
  submission?: {
    id: string;
    user?: {
      owner_name: string;
      company_name: string | null;
    } | null;
    service?: {
      name: string;
    } | null;
  } | null;
}

interface LedgerSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

type DateFilterType = 'today' | 'week' | 'month' | 'all' | 'custom';

export default function AccountsClient({
  initialLedger,
  initialSummary,
  initialBills,
}: {
  initialLedger: LedgerEntry[];
  initialSummary: LedgerSummary;
  initialBills: Bill[];
}) {
  const [activeTab, setActiveTab] = useState<'ledger' | 'bills'>('ledger');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilterType>('month');

  // Custom date range bounds
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [ledgerState, ledgerAction, isCreating] = useActionState(handleCreateLedgerEntryManual, null);

  useEffect(() => {
    if (ledgerState?.success) {
      setIsModalOpen(false);
    }
  }, [ledgerState]);

  // Helper to determine if entry matches the active filter
  const filterLedgerEntry = (entry: LedgerEntry) => {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateFilter === 'today') {
      return entryDate.getTime() === today.getTime();
    }

    if (dateFilter === 'week') {
      const pastWeek = new Date(today);
      pastWeek.setDate(today.getDate() - 7);
      return entryDate >= pastWeek && entryDate <= today;
    }

    if (dateFilter === 'month') {
      return (
        entryDate.getMonth() === today.getMonth() &&
        entryDate.getFullYear() === today.getFullYear()
      );
    }

    if (dateFilter === 'custom') {
      if (!startDate && !endDate) return true;
      const start = startDate ? new Date(startDate) : new Date(0);
      start.setHours(0, 0, 0, 0);
      const end = endDate ? new Date(endDate) : new Date(8640000000000000);
      end.setHours(23, 59, 59, 999);
      return entryDate >= start && entryDate <= end;
    }

    return true; // 'all' filter
  };

  // Filter bills list similarly if in Bills view
  const filterBillEntry = (bill: Bill) => {
    const billDate = new Date(bill.created_at);
    billDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateFilter === 'today') {
      return billDate.getTime() === today.getTime();
    }

    if (dateFilter === 'week') {
      const pastWeek = new Date(today);
      pastWeek.setDate(today.getDate() - 7);
      return billDate >= pastWeek && billDate <= today;
    }

    if (dateFilter === 'month') {
      return (
        billDate.getMonth() === today.getMonth() &&
        billDate.getFullYear() === today.getFullYear()
      );
    }

    if (dateFilter === 'custom') {
      if (!startDate && !endDate) return true;
      const start = startDate ? new Date(startDate) : new Date(0);
      start.setHours(0, 0, 0, 0);
      const end = endDate ? new Date(endDate) : new Date(8640000000000000);
      end.setHours(23, 59, 59, 999);
      return billDate >= start && billDate <= end;
    }

    return true;
  };

  const filteredLedger = initialLedger.filter(filterLedgerEntry);
  const filteredBills = initialBills.filter(filterBillEntry);

  // Recalculate metrics for the selected period dynamically
  let totalIncome = 0;
  let totalExpense = 0;

  filteredLedger.forEach((entry) => {
    const amount = Number(entry.amount) || 0;
    if (entry.type === 'income') {
      totalIncome += amount;
    } else {
      totalExpense += amount;
    }
  });

  const netBalance = totalIncome - totalExpense;

  // Chart data points - Group filtered entries by date
  const getChartData = () => {
    const groups: Record<string, { date: string; income: number; expense: number }> = {};
    
    // Sort chronological
    const sorted = [...filteredLedger].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sorted.forEach((entry) => {
      const formattedDate = new Date(entry.date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
      });
      if (!groups[formattedDate]) {
        groups[formattedDate] = { date: formattedDate, income: 0, expense: 0 };
      }
      if (entry.type === 'income') {
        groups[formattedDate].income += Number(entry.amount);
      } else {
        groups[formattedDate].expense += Number(entry.amount);
      }
    });

    return Object.values(groups);
  };

  const chartData = getChartData();
  const maxVal = Math.max(...chartData.map((d) => Math.max(d.income, d.expense)), 1);

  return (
    <div>
      {/* Date Filter Bar */}
      <div
        className="card"
        style={{
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} style={{ color: 'hsl(var(--text-secondary))' }} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>
            Period:
          </span>
          <div style={{ display: 'flex', gap: '4px', backgroundColor: 'hsl(var(--bg-panel))', border: '1px solid hsl(var(--border))', borderRadius: '6px', padding: '2px' }}>
            {(['today', 'week', 'month', 'all', 'custom'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setDateFilter(opt)}
                className="btn"
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  background: dateFilter === opt ? 'hsl(var(--primary))' : 'transparent',
                  color: dateFilter === opt ? 'hsl(var(--btn-primary-text))' : 'hsl(var(--text-primary))',
                  fontWeight: dateFilter === opt ? 600 : 500,
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
                type="button"
              >
                {opt === 'all' ? 'All Time' : opt === 'week' ? 'Last 7 Days' : opt === 'month' ? 'This Month' : opt}
              </button>
            ))}
          </div>
        </div>

        {dateFilter === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="date"
              className="input-text"
              style={{ padding: '6px 10px', fontSize: '13px', width: '140px' }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))' }}>to</span>
            <input
              type="date"
              className="input-text"
              style={{ padding: '6px 10px', fontSize: '13px', width: '140px' }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Recalculating Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon stat-icon-green">
            <ArrowUpRight size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Income Received</span>
            <span className="stat-value">₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-red">
            <ArrowDownRight size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Operational Expenses</span>
            <span className="stat-value">₹{totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-blue">
            <CreditCard size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Net Profit Balance</span>
            <span className="stat-value" style={{ color: netBalance >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}>
              ₹{netBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Income vs Expense Custom Chart */}
      {activeTab === 'ledger' && chartData.length > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <BarChart3 size={18} style={{ color: 'hsl(var(--primary))' }} />
            <h3 className="card-title" style={{ margin: 0 }}>Filing Incomes & Expenses Trend</h3>
          </div>

          {/* SVG Grouped Bar Chart */}
          <div style={{ width: '100%', overflowX: 'auto', paddingTop: '10px' }}>
            <div style={{ minWidth: '500px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ height: '160px', display: 'flex', alignItems: 'flex-end', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '8px', gap: '20px' }}>
                {chartData.map((d, index) => {
                  const incomeHeight = (d.income / maxVal) * 130;
                  const expenseHeight = (d.expense / maxVal) * 130;

                  return (
                    <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '130px' }}>
                        {/* Income Bar */}
                        <div
                          style={{
                            width: '12px',
                            height: `${Math.max(incomeHeight, 2)}px`,
                            background: 'linear-gradient(to top, hsl(var(--success)), rgba(16, 185, 129, 0.4))',
                            borderRadius: '3px 3px 0 0',
                            transition: 'height 0.3s ease',
                          }}
                          title={`Income: ₹${d.income}`}
                        />
                        {/* Expense Bar */}
                        <div
                          style={{
                            width: '12px',
                            height: `${Math.max(expenseHeight, 2)}px`,
                            background: 'linear-gradient(to top, hsl(var(--danger)), rgba(239, 68, 68, 0.4))',
                            borderRadius: '3px 3px 0 0',
                            transition: 'height 0.3s ease',
                          }}
                          title={`Expense: ₹${d.expense}`}
                        />
                      </div>
                      <span style={{ fontSize: '10px', color: 'hsl(var(--text-secondary))', whiteSpace: 'nowrap' }}>
                        {d.date}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Legend indicator */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '12px', marginTop: '4px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '12px', height: '12px', backgroundColor: 'hsl(var(--success))', borderRadius: '2px' }} />
                  <span>Received Income</span>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '12px', height: '12px', backgroundColor: 'hsl(var(--danger))', borderRadius: '2px' }} />
                  <span>Out-of-Pocket Expense</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Headers */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid hsl(var(--border))', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['ledger', 'bills'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="btn"
                style={{
                  background: 'none',
                  border: 'none',
                  borderRadius: 0,
                  borderBottom: isActive ? '2px solid hsl(var(--primary))' : '2px solid transparent',
                  color: isActive ? 'hsl(var(--text-primary))' : 'hsl(var(--text-secondary))',
                  fontWeight: 600,
                  padding: '12px 16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
                type="button"
              >
                {tab === 'ledger' ? 'General Ledger' : 'Client Invoices Registry'}
                <span className="badge badge-processing" style={{ fontSize: '10px', padding: '2px 6px' }}>
                  {tab === 'ledger' ? filteredLedger.length : filteredBills.length}
                </span>
              </button>
            );
          })}
        </div>

        {activeTab === 'ledger' && (
          <button
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
            style={{ marginBottom: '8px' }}
            type="button"
          >
            <Plus size={16} /> Record Transaction
          </button>
        )}
      </div>

      {/* Table Records */}
      <div className="card" style={{ padding: 0 }}>
        {activeTab === 'ledger' ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Source</th>
                  <th>Case Reference</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredLedger.map((entry) => {
                  const isIncome = entry.type === 'income';
                  return (
                    <tr key={entry.id}>
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--text-secondary))' }}>
                          <Calendar size={12} />
                          {new Date(entry.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${isIncome ? 'completed' : 'expense'}`}>
                          {isIncome ? 'INCOME' : 'EXPENSE'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: isIncome ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}>
                        {isIncome ? '+' : '-'} ₹{Number(entry.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span className={`badge badge-${entry.source === 'auto' ? 'processing' : 'pending'}`}>
                          {entry.source.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {entry.submission ? (
                          <Link
                            href={`/dashboard/submissions/${entry.submission.id}`}
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Tag size={10} /> {entry.submission.service?.name || 'View Case'}
                          </Link>
                        ) : (
                          <span style={{ color: 'hsl(var(--text-muted))', fontSize: '12px' }}>General Entry</span>
                        )}
                      </td>
                      <td style={{ color: 'hsl(var(--text-secondary))', fontSize: '13px' }}>
                        {entry.remark || 'N/A'}
                      </td>
                    </tr>
                  );
                })}
                {filteredLedger.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'hsl(var(--text-secondary))', padding: '48px 0' }}>
                      No ledger transactions recorded in this selected period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Filing Date</th>
                  <th>Client / Company</th>
                  <th>Catalog Service</th>
                  <th>Fee Breakdown</th>
                  <th>Total Amount</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill) => (
                  <tr key={bill.id}>
                    <td>
                      {new Date(bill.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600 }}>{bill.submission?.user?.owner_name || 'N/A'}</span>
                        {bill.submission?.user?.company_name && (
                          <span style={{ fontSize: '11px', color: 'hsl(var(--text-secondary))' }}>
                            {bill.submission.user.company_name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{bill.submission?.service?.name || 'N/A'}</td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))' }}>
                        Govt: ₹{Number(bill.govt_fee).toFixed(0)} | Serv: ₹{Number(bill.service_charge).toFixed(0)} {Number(bill.extra_fee) > 0 && `| Extra: ₹${Number(bill.extra_fee).toFixed(0)}`}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'hsl(var(--primary))' }}>
                      ₹{Number(bill.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <a
                        href={`/api/bills/download/${bill.id}`}
                        className="btn btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}
                      >
                        <Download size={14} /> Download DOCX
                      </a>
                    </td>
                  </tr>
                ))}
                {filteredBills.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'hsl(var(--text-secondary))', padding: '48px 0' }}>
                      No bills/invoices generated in this selected period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Transaction Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Record General Ledger Entry</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)} type="button">
                <X size={18} />
              </button>
            </div>

            <form action={ledgerAction}>
              <div className="modal-body">
                {ledgerState?.error && (
                  <div className="login-error" style={{ marginBottom: '16px' }}>
                    {ledgerState.error}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="type">Transaction Type *</label>
                  <select id="type" name="type" className="select-input" style={{ width: '100%' }} required>
                    <option value="income">Income / Deposit</option>
                    <option value="expense">Expense / Payment</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="amount">Transaction Amount (₹) *</label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    className="input-text"
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="date">Transaction Date</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    className="input-text"
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="remark">Remarks / Description *</label>
                  <input
                    type="text"
                    id="remark"
                    name="remark"
                    className="input-text"
                    placeholder="e.g. Office rent payment"
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isCreating}>
                  {isCreating ? 'Saving...' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
