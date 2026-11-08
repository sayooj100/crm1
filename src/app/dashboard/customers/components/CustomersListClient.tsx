'use client';

import React, { useState, useActionState, useEffect } from 'react';
import Link from 'next/link';
import { handleCreateCustomer, handleUpdateCustomer } from '@/app/actions/users';
import { Plus, Edit2, X, Eye } from 'lucide-react';

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

export default function UsersListClient({ initialCustomers }: { initialCustomers: Customer[] }) {
  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form states using React 19 useActionState
  const [createState, createAction, isCreating] = useActionState(handleCreateCustomer, null);
  const [updateState, updateAction, isUpdating] = useActionState(handleUpdateCustomer, null);

  // Close modal on successful action
  useEffect(() => {
    if (createState?.success) {
      setIsModalOpen(false);
    }
  }, [createState]);

  useEffect(() => {
    if (updateState?.success) {
      setIsModalOpen(false);
      setEditingCustomer(null);
    }
  }, [updateState]);

  // Extract unique sectors for the filter dropdown
  const sectors = Array.from(
    new Set(initialCustomers.map((c) => c.sector).filter(Boolean))
  ) as string[];

  // Filter customers based on search and sector
  const filteredCustomers = initialCustomers.filter((c) => {
    const matchesSearch =
      c.owner_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.company_name?.toLowerCase() || '').includes(search.toLowerCase());
    
    const matchesSector = selectedSector === '' || c.sector === selectedSector;

    return matchesSearch && matchesSector;
  });

  const openAddModal = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer, e: React.MouseEvent) => {
    e.preventDefault();
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  return (
    <div>
      {/* Search & Action Panel */}
      <div className="filter-bar">
        <div className="search-group">
          <input
            type="text"
            className="input-text"
            placeholder="Search by owner name or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="select-input"
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
          >
            <option value="">All Sectors</option>
            {sectors.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
        </div>

        <button className="btn btn-primary" onClick={openAddModal} type="button">
          <Plus size={16} /> Add Customer
        </button>
      </div>

      {/* Customers List Card */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Owner Name</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((cust) => (
                <tr key={cust.id}>
                  <td style={{ fontWeight: 600 }}>{cust.company_name || '—'}</td>
                  <td>{cust.owner_name}</td>
                  <td style={{ color: 'hsl(var(--text-secondary))' }}>
                    {new Date(cust.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link
                        href={`/dashboard/customers/${cust.id}`}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '13px' }}
                      >
                        <Eye size={14} /> View Details
                      </Link>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px' }}
                        onClick={(e) => openEditModal(cust, e)}
                        title="Edit Customer"
                        type="button"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'hsl(var(--text-secondary))', padding: '32px 0' }}>
                    No customers found matching the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px', width: '100%' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingCustomer ? 'Edit Customer Profile' : 'Add New Customer'}
              </h3>
              <button className="btn-icon" onClick={closeModal} type="button">
                <X size={18} />
              </button>
            </div>

            <form action={editingCustomer ? updateAction : createAction}>
              <div className="modal-body" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                {(editingCustomer ? updateState?.error : createState?.error) && (
                  <div className="login-error" style={{ marginBottom: '16px' }}>
                    {editingCustomer ? updateState?.error : createState?.error}
                  </div>
                )}

                {editingCustomer && (
                  <input type="hidden" name="id" value={editingCustomer.id} />
                )}

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
                    defaultValue={editingCustomer?.owner_name || ''}
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
                    defaultValue={editingCustomer?.company_name || ''}
                    placeholder="Enter registered company name"
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
                      defaultValue={editingCustomer?.sector || ''}
                      placeholder="e.g. IT, Finance, Retail"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      className="input-text"
                      defaultValue={editingCustomer?.phone || ''}
                      placeholder="e.g. +91 98765 43210"
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
                    defaultValue={editingCustomer?.email || ''}
                    placeholder="owner@company.com"
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
                      defaultValue={editingCustomer?.gender || ''}
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
                      defaultValue={editingCustomer?.date_of_birth || ''}
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
                    defaultValue={editingCustomer?.fathers_name || ''}
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
                      defaultValue={editingCustomer?.aadhar_number || ''}
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
                      defaultValue={editingCustomer?.pan_card_number || ''}
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
                    defaultValue={editingCustomer?.name_of_bank || ''}
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
                      defaultValue={editingCustomer?.account_number || ''}
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
                      defaultValue={editingCustomer?.ifsc_code || ''}
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
                    defaultValue={editingCustomer?.address || ''}
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
                    defaultValue={editingCustomer?.investment_amount || ''}
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
                    defaultValue={editingCustomer?.remark || ''}
                    placeholder="Add details on client preferences, lead status, etc."
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editingCustomer ? isUpdating : isCreating}
                >
                  {editingCustomer
                    ? (isUpdating ? 'Saving...' : 'Save Changes')
                    : (isCreating ? 'Creating...' : 'Create Customer')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
