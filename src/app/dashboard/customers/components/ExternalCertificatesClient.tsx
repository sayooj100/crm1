'use client';

import React, { useActionState, useState } from 'react';
import { handleAddExternalCertificate } from '@/app/actions/submissions';
import { handleUpdateExpiryDate, handleAcknowledgeExpiry } from '@/app/actions/submissions';
import { Calendar, Plus, ExternalLink, ShieldAlert, Check } from 'lucide-react';

export default function ExternalCertificatesClient({ customerId, externalSubmissions }: { customerId: string, externalSubmissions: any[] }) {
  const [addState, addAction, isAdding] = useActionState(handleAddExternalCertificate, null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="card" style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 className="card-title" style={{ marginBottom: 0 }}>External Certificates (Trackers)</h3>
        <button className="btn btn-primary" onClick={() => setIsFormOpen(!isFormOpen)} style={{ padding: '6px 12px', fontSize: '13px' }}>
          <Plus size={14} style={{ marginRight: '4px' }} /> Add Certificate Tracker
        </button>
      </div>

      {isFormOpen && (
        <form action={addAction} style={{ marginBottom: '24px', padding: '16px', background: 'rgba(99, 102, 241, 0.03)', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Add New Tracker</h4>
          {addState?.error && <div className="login-error" style={{ marginBottom: '12px' }}>{addState.error}</div>}
          {addState?.success && <div className="badge badge-success" style={{ display: 'block', marginBottom: '12px', padding: '8px' }}>Tracker added successfully!</div>}
          
          <input type="hidden" name="user_id" value={customerId} />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="certificate_name">Certificate Name *</label>
              <input type="text" id="certificate_name" name="certificate_name" className="input-text" placeholder="e.g. FSSAI License, ISO 9001" required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="expiry_date">Expiry Date *</label>
              <input type="date" id="expiry_date" name="expiry_date" className="input-text" required />
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isAdding}>
              {isAdding ? 'Adding...' : 'Save Tracker'}
            </button>
          </div>
        </form>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Certificate Name</th>
              <th>Status</th>
              <th>Expiry Date</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {externalSubmissions.map((sub: any) => (
              <tr key={sub.id}>
                <td style={{ fontWeight: 600 }}>{sub.answers?.custom_name || 'External Certificate'}</td>
                <td>
                  <span className={`badge badge-completed`}>Active Tracker</span>
                </td>
                <td style={{ color: 'hsl(var(--warning))', fontWeight: 500 }}>
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
                  <form action={async (formData) => {
                    const { handleDeleteExternalCertificate } = await import('@/app/actions/submissions');
                    await handleDeleteExternalCertificate(null, formData);
                  }} style={{ display: 'inline-block' }}>
                    <input type="hidden" name="id" value={sub.id} />
                    <input type="hidden" name="user_id" value={customerId} />
                    <button type="submit" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', color: 'hsl(var(--danger))' }} title="Delete Tracker">
                      Remove
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {externalSubmissions.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: 'hsl(var(--text-secondary))', padding: '32px 0' }}>
                  No external certificates tracked for this customer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
