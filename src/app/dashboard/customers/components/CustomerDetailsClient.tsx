'use client';

import React, { useState, useActionState, useEffect } from 'react';
import { handleUpdateCustomer, handleDeleteCustomer } from '@/app/actions/users';
import { Edit2, X, Phone, Mail, Trash2 } from 'lucide-react';

interface Customer {
  id: string;
  company_name: string | null;
  owner_name: string;
  sector: string | null;
  phone: string | null;
  email: string | null;
  remark: string | null;
  created_at: string;
  gender: string | null;
  date_of_birth: string | null;
  fathers_name: string | null;
  aadhar_number: string | null;
  pan_card_number: string | null;
  name_of_bank: string | null;
  ifsc_code: string | null;
  account_number: string | null;
  address: string | null;
  investment_amount: number | null;
}

export default function CustomerDetailsClient({ customer }: { customer: Customer }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updateState, updateAction, isUpdating] = useActionState(handleUpdateCustomer, null);

  useEffect(() => {
    if (updateState?.success) {
      setIsModalOpen(false);
    }
  }, [updateState]);

  return (
    <div className="card" style={{ position: 'sticky', top: '94px', marginBottom: 0 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
        }}
      >
        <h3 className="card-title" style={{ margin: 0, fontSize: '18px' }}>
          Customer Card
        </h3>
        <button
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '13px' }}
          onClick={() => setIsModalOpen(true)}
          type="button"
        >
          <Edit2 size={12} /> Edit Info
        </button>
      </div>

      <div className="detail-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', paddingRight: '4px' }}>
        {/* Contact Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="detail-item">
            <span className="detail-label">Company Name</span>
            <span className="detail-val" style={{ fontWeight: 600 }}>
              {customer.company_name || '—'}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Owner Name</span>
            <span className="detail-val">{customer.owner_name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Industry / Sector</span>
            <span
              className="badge badge-processing"
              style={{ textTransform: 'uppercase', fontSize: '10px', width: 'fit-content' }}
            >
              {customer.sector || 'General'}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Phone</span>
            <span className="detail-val" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={13} style={{ color: 'hsl(var(--text-secondary))' }} />
              {customer.phone || '—'}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Email</span>
            <span className="detail-val" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={13} style={{ color: 'hsl(var(--text-secondary))' }} />
              {customer.email || '—'}
            </span>
          </div>
        </div>

        {/* Personal Details */}
        <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h4 style={{ fontSize: '11px', fontWeight: 700, margin: '0 0 4px 0', color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Personal Profile
          </h4>
          <div className="detail-item">
            <span className="detail-label">Gender</span>
            <span className="detail-val">{customer.gender || '—'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Date of Birth</span>
            <span className="detail-val">
              {customer.date_of_birth
                ? new Date(customer.date_of_birth).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Father's Name</span>
            <span className="detail-val">{customer.fathers_name || '—'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Aadhar Number</span>
            <span className="detail-val">{customer.aadhar_number || '—'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">PAN Card Number</span>
            <span className="detail-val" style={{ textTransform: 'uppercase' }}>
              {customer.pan_card_number || '—'}
            </span>
          </div>
        </div>

        {/* Bank & Financials */}
        <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h4 style={{ fontSize: '11px', fontWeight: 700, margin: '0 0 4px 0', color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Bank & Investment
          </h4>
          <div className="detail-item">
            <span className="detail-label">Bank Name</span>
            <span className="detail-val">{customer.name_of_bank || '—'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Account Number</span>
            <span className="detail-val">{customer.account_number || '—'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">IFSC Code</span>
            <span className="detail-val" style={{ textTransform: 'uppercase' }}>
              {customer.ifsc_code || '—'}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Investment Amount</span>
            <span className="detail-val" style={{ fontWeight: 600 }}>
              {customer.investment_amount !== null && customer.investment_amount !== undefined
                ? `₹${Number(customer.investment_amount).toLocaleString('en-IN')}`
                : '—'}
            </span>
          </div>
        </div>

        {/* Address & Remarks */}
        <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h4 style={{ fontSize: '11px', fontWeight: 700, margin: '0 0 4px 0', color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Other Details
          </h4>
          <div className="detail-item">
            <span className="detail-label">Address</span>
            <span className="detail-val" style={{ fontSize: '13px', lineHeight: 1.4 }}>
              {customer.address || '—'}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Remarks</span>
            <span
              className="detail-val"
              style={{
                whiteSpace: 'pre-wrap',
                color: 'hsl(var(--text-secondary))',
                fontSize: '13px',
                lineHeight: 1.5,
              }}
            >
              {customer.remark || 'No specific notes recorded.'}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Customer Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px', width: '100%' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Customer Profile</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)} type="button">
                <X size={18} />
              </button>
            </div>

            <form action={updateAction}>
              <div className="modal-body" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                {updateState?.error && (
                  <div className="login-error" style={{ marginBottom: '16px' }}>
                    {updateState.error}
                  </div>
                )}

                <input type="hidden" name="id" value={customer.id} />

                {/* Section 1: Basic Info */}
                <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: 'hsl(var(--primary))' }}>
                  Basic Contact Info
                </h4>

                <div className="form-group">
                  <label htmlFor="owner_name">Owner Name *</label>
                  <input
                    type="text"
                    id="owner_name"
                    name="owner_name"
                    className="input-text"
                    required
                    defaultValue={customer.owner_name}
                    placeholder="Enter owner's full name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="company_name">Company Name</label>
                  <input
                    type="text"
                    id="company_name"
                    name="company_name"
                    className="input-text"
                    defaultValue={customer.company_name || ''}
                    placeholder="Enter registered business name"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="sector">Sector / Industry</label>
                    <input
                      type="text"
                      id="sector"
                      name="sector"
                      className="input-text"
                      defaultValue={customer.sector || ''}
                      placeholder="e.g. IT, Finance, Food"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      className="input-text"
                      defaultValue={customer.phone || ''}
                      placeholder="e.g. +91 99999 99999"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="input-text"
                    defaultValue={customer.email || ''}
                    placeholder="client@domain.com"
                  />
                </div>

                {/* Section 2: Personal Details */}
                <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: 'hsl(var(--primary))', borderTop: '1px solid hsl(var(--border))', paddingTop: '16px' }}>
                  Personal Details
                </h4>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="gender">Gender</label>
                    <select
                      id="gender"
                      name="gender"
                      className="select-input"
                      style={{ width: '100%' }}
                      defaultValue={customer.gender || ''}
                    >
                      <option value="">-- Select --</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="date_of_birth">Date of Birth</label>
                    <input
                      type="date"
                      id="date_of_birth"
                      name="date_of_birth"
                      className="input-text"
                      defaultValue={customer.date_of_birth || ''}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="fathers_name">Father's Name</label>
                  <input
                    type="text"
                    id="fathers_name"
                    name="fathers_name"
                    className="input-text"
                    defaultValue={customer.fathers_name || ''}
                    placeholder="Enter father's name"
                  />
                </div>

                <div className="form-row" style={{ marginBottom: '24px' }}>
                  <div className="form-group">
                    <label htmlFor="aadhar_number">Aadhar Number</label>
                    <input
                      type="text"
                      id="aadhar_number"
                      name="aadhar_number"
                      className="input-text"
                      defaultValue={customer.aadhar_number || ''}
                      placeholder="12-digit Aadhar number"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="pan_card_number">PAN Card Number</label>
                    <input
                      type="text"
                      id="pan_card_number"
                      name="pan_card_number"
                      className="input-text"
                      defaultValue={customer.pan_card_number || ''}
                      placeholder="10-digit PAN number"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>
                </div>

                {/* Section 3: Bank Details */}
                <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: 'hsl(var(--primary))', borderTop: '1px solid hsl(var(--border))', paddingTop: '16px' }}>
                  Bank Details
                </h4>

                <div className="form-group">
                  <label htmlFor="name_of_bank">Bank Name</label>
                  <input
                    type="text"
                    id="name_of_bank"
                    name="name_of_bank"
                    className="input-text"
                    defaultValue={customer.name_of_bank || ''}
                    placeholder="e.g. State Bank of India"
                  />
                </div>

                <div className="form-row" style={{ marginBottom: '24px' }}>
                  <div className="form-group">
                    <label htmlFor="account_number">Account Number</label>
                    <input
                      type="text"
                      id="account_number"
                      name="account_number"
                      className="input-text"
                      defaultValue={customer.account_number || ''}
                      placeholder="Bank account number"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="ifsc_code">IFSC Code</label>
                    <input
                      type="text"
                      id="ifsc_code"
                      name="ifsc_code"
                      className="input-text"
                      defaultValue={customer.ifsc_code || ''}
                      placeholder="11-character IFSC code"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>
                </div>

                {/* Section 4: Other Info */}
                <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: 'hsl(var(--primary))', borderTop: '1px solid hsl(var(--border))', paddingTop: '16px' }}>
                  Additional Information
                </h4>

                <div className="form-group">
                  <label htmlFor="address">Address</label>
                  <textarea
                    id="address"
                    name="address"
                    className="input-text"
                    rows={2}
                    defaultValue={customer.address || ''}
                    placeholder="Enter complete postal address"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="investment_amount">Investment Amount (₹)</label>
                  <input
                    type="number"
                    id="investment_amount"
                    name="investment_amount"
                    className="input-text"
                    defaultValue={customer.investment_amount || ''}
                    placeholder="e.g. 500000"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="remark">Internal Notes / Remarks</label>
                  <textarea
                    id="remark"
                    name="remark"
                    className="input-text"
                    rows={3}
                    defaultValue={customer.remark || ''}
                    placeholder="Enter any additional context here..."
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <button
                  type="button"
                  className="btn"
                  style={{
                    backgroundColor: 'hsl(var(--danger))',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '13px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this customer? All their submissions and bills will be permanently deleted.')) {
                      setIsDeleting(true);
                      const res = await handleDeleteCustomer(customer.id);
                      setIsDeleting(false);
                      if (res?.error) {
                        alert(res.error);
                      }
                    }
                  }}
                  disabled={isDeleting}
                >
                  <Trash2 size={14} /> {isDeleting ? 'Deleting...' : 'Delete Customer'}
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
