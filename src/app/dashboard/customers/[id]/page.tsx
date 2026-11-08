import React from 'react';
import Link from 'next/link';
import { getCustomerById } from '@/lib/services/users';
import { listSubmissions } from '@/lib/services/submissions';
import CustomerDetailsClient from '../components/CustomerDetailsClient';
import ExternalCertificatesClient from '../components/ExternalCertificatesClient';
import { ArrowLeft, ExternalLink, Calendar } from 'lucide-react';

export const revalidate = 0; // Disable static cache to reflect updates in real-time

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;

  let customer;
  let submissions: any[] = [];

  try {
    customer = await getCustomerById(id);
    submissions = await listSubmissions({ user_id: id });
  } catch (error) {
    console.error(`Error loading profile detail for customer ${id}:`, error);
    return (
      <div>
        <div style={{ marginBottom: '24px' }}>
          <Link
            href="/dashboard/customers"
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowLeft size={16} /> Back to Customers
          </Link>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <h2 style={{ color: 'hsl(var(--danger))', marginBottom: '12px', fontWeight: 700 }}>
            Customer Profile Not Found
          </h2>
          <p style={{ color: 'hsl(var(--text-secondary))' }}>
            The customer ID you requested may have been removed or does not exist.
          </p>
        </div>
      </div>
    );
  }

  // Submissions breakdown counts
  const pendingCount = submissions.filter((s: any) => s.status === 'pending').length;
  const processingCount = submissions.filter((s: any) => s.status === 'processing').length;
  const completedCount = submissions.filter((s: any) => s.status === 'completed').length;

  return (
    <div>
      {/* Navigation Headers */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link
          href="/dashboard/customers"
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <ArrowLeft size={16} /> Back to Customers
        </Link>
      </div>

      {/* Main Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700 }}>
          {customer.company_name || customer.owner_name}
        </h2>
        <p style={{ color: 'hsl(var(--text-secondary))' }}>
          Overview of customer profile details, accounts activity, and historical submissions.
        </p>
      </div>

      {/* Submissions Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card" style={{ padding: '16px 20px' }}>
          <div className="stat-icon stat-icon-blue" style={{ width: '36px', height: '36px' }}>
            <span style={{ fontWeight: 700, fontSize: '14px' }}>T</span>
          </div>
          <div className="stat-info" style={{ gap: '2px' }}>
            <span className="stat-label" style={{ fontSize: '10px' }}>Total Submissions</span>
            <span className="stat-value" style={{ fontSize: '18px' }}>{submissions.length}</span>
          </div>
        </div>

        <div className="stat-card" style={{ padding: '16px 20px' }}>
          <div className="stat-icon stat-icon-orange" style={{ width: '36px', height: '36px' }}>
            <span style={{ fontWeight: 700, fontSize: '14px' }}>P</span>
          </div>
          <div className="stat-info" style={{ gap: '2px' }}>
            <span className="stat-label" style={{ fontSize: '10px' }}>Pending</span>
            <span className="stat-value" style={{ fontSize: '18px' }}>{pendingCount}</span>
          </div>
        </div>

        <div className="stat-card" style={{ padding: '16px 20px' }}>
          <div className="stat-icon stat-icon-blue" style={{ width: '36px', height: '36px' }}>
            <span style={{ fontWeight: 700, fontSize: '14px' }}>R</span>
          </div>
          <div className="stat-info" style={{ gap: '2px' }}>
            <span className="stat-label" style={{ fontSize: '10px' }}>Processing</span>
            <span className="stat-value" style={{ fontSize: '18px' }}>{processingCount}</span>
          </div>
        </div>

        <div className="stat-card" style={{ padding: '16px 20px' }}>
          <div className="stat-icon stat-icon-green" style={{ width: '36px', height: '36px' }}>
            <span style={{ fontWeight: 700, fontSize: '14px' }}>C</span>
          </div>
          <div className="stat-info" style={{ gap: '2px' }}>
            <span className="stat-label" style={{ fontSize: '10px' }}>Completed</span>
            <span className="stat-value" style={{ fontSize: '18px' }}>{completedCount}</span>
          </div>
        </div>
      </div>

      {/* Main Details Section */}
      <div className="detail-grid">
        {/* Left Side: Client Profile Card */}
        <div>
          <CustomerDetailsClient customer={customer} />
        </div>

        {/* Right Side: Submissions Portfolio Table */}
        <div className="card" style={{ marginBottom: 0 }}>
          <h3 className="card-title">Submissions Portfolio</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Submitted Date</th>
                  <th>Next Action Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.filter((s: any) => s.answers?.is_external !== true).map((sub: any) => (
                  <tr key={sub.id}>
                    <td style={{ fontWeight: 600 }}>{sub.service?.name}</td>
                    <td>
                      <span className={`badge badge-${sub.status}`}>{sub.status}</span>
                    </td>
                    <td style={{ color: 'hsl(var(--text-secondary))' }}>
                      {new Date(sub.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td style={{ color: sub.status === 'processing' ? 'hsl(var(--warning))' : 'hsl(var(--text-secondary))' }}>
                      {sub.next_due_date ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={13} />
                          {new Date(sub.next_due_date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        href={`/dashboard/submissions/${sub.id}`}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        Open Case <ExternalLink size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
                {submissions.filter((s: any) => s.answers?.is_external !== true).length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'hsl(var(--text-secondary))', padding: '48px 0' }}>
                      No submissions logged for this customer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* External Certificates Tracker Section */}
      <ExternalCertificatesClient 
        customerId={id} 
        externalSubmissions={submissions.filter((s: any) => s.answers?.is_external === true)} 
      />
    </div>
  );
}
