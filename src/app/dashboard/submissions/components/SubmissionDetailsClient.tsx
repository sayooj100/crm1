'use client';

import React, { useState, useActionState } from 'react';
import Link from 'next/link';
import { handleMoveToProcessing, handleExtendDueDate, handleMarkCompleted, handleUpdateSubmissionFinancials, handleUpdateSubmissionAnswers, handleUpdateExpiryDate } from '@/app/actions/submissions';
import { handleCreateBill } from '@/app/actions/bills';
import { ArrowLeft, Calendar, Download, Clock, AlertCircle, CheckCircle, Plus, Edit2 } from 'lucide-react';

interface Question {
  id: string;
  label: string;
  type: string;
  options?: string[];
  required: boolean;
}

interface Attachment {
  key: string;
  filename: string;
  uploaded_by: string;
  uploaded_at: string;
}

interface StatusHistoryEntry {
  status: 'pending' | 'processing' | 'completed';
  date: string;
  note?: string;
}

interface Submission {
  id: string;
  status: 'pending' | 'processing' | 'completed';
  created_at: string;
  answers: Record<string, any>;
  next_due_date: string | null;
  govt_expense: number;
  service_charge: number;
  remark: string | null;
  attachments: Attachment[];
  status_history: StatusHistoryEntry[];
  user: {
    id: string;
    owner_name: string;
    company_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  service: {
    id: string;
    name: string;
    description: string | null;
    questions: Question[];
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
}

export default function SubmissionDetailsClient({
  submission,
  initialBills = [],
}: {
  submission: Submission;
  initialBills?: Bill[];
}) {
  const [isGeneratingLegacyBill, setIsGeneratingLegacyBill] = useState(false);

  const handleGenerateBillDirect = async () => {
    setIsGeneratingLegacyBill(true);
    try {
      const formData = new FormData();
      formData.append('submission_id', submission.id);
      formData.append('govt_fee', String(submission.govt_expense || 0));
      formData.append('service_charge', String(submission.service_charge || 0));
      formData.append('extra_fee', '0');
      formData.append('remarks', 'Filing Fees & Service invoice');

      const res = await handleCreateBill(null, formData);
      if (res?.error) {
        alert(res.error);
      } else {
        alert('Bill generated successfully! You can now download it.');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to generate bill');
    } finally {
      setIsGeneratingLegacyBill(false);
    }
  };

  // Move to Processing Action State
  const [moveToProcessingState, moveToProcessingAction, isMovingToProcessing] = useActionState(handleMoveToProcessing, null);
  // Extend Due Date Action State
  const [extendDueDateState, extendDueDateAction, isExtending] = useActionState(handleExtendDueDate, null);
  // Update Financials Action State
  const [updateFinancialsState, updateFinancialsAction, isUpdatingFinancials] = useActionState(handleUpdateSubmissionFinancials, null);
  // Update Answers Action State
  const [updateAnswersState, updateAnswersAction, isUpdatingAnswers] = useActionState(handleUpdateSubmissionAnswers, null);
  
  // Lock/Unlock editing states
  const [isEditingFinancials, setIsEditingFinancials] = useState(false);
  const [isEditingAnswers, setIsEditingAnswers] = useState(false);

  // Automatically lock cards back on successful saves
  React.useEffect(() => {
    if (updateFinancialsState?.success) {
      setIsEditingFinancials(false);
    }
  }, [updateFinancialsState]);

  React.useEffect(() => {
    if (updateAnswersState?.success) {
      setIsEditingAnswers(false);
    }
  }, [updateAnswersState]);

  const handleAnswersSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    // Construct the answers object
    const updatedAnswers: Record<string, any> = {};
    questions.forEach((q) => {
      const val = formData.get(q.id);
      if (val !== null) {
        updatedAnswers[q.id] = val;
      }
    });

    // Preserve any existing fields not mapped in questions
    Object.entries(submission.answers).forEach(([key, val]) => {
      if (!questions.some((q) => q.id === key)) {
        updatedAnswers[key] = val;
      }
    });

    const finalFormData = new FormData();
    finalFormData.append('id', submission.id);
    finalFormData.append('answers', JSON.stringify(updatedAnswers));

    React.startTransition(() => {
      updateAnswersAction(finalFormData);
    });
  };

  // Mark Completed Action State
  const [markCompletedState, markCompletedAction, isMarkingCompleted] = useActionState(handleMarkCompleted, null);

  // Update Expiry Date Action State
  const [updateExpiryState, updateExpiryAction, isUpdatingExpiry] = useActionState(handleUpdateExpiryDate, null);

  const handleDownloadAttachment = async (key: string) => {
    try {
      const res = await fetch(`/api/attachments/presign?key=${encodeURIComponent(key)}`);
      if (!res.ok) {
        throw new Error('Failed to request presigned download URL.');
      }
      const { downloadUrl } = await res.json();
      window.open(downloadUrl, '_blank');
    } catch (error: any) {
      alert(error.message || 'Failed to download attachment');
    }
  };

  // Safe check for questions array
  const questions = submission.service?.questions || [];

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', padding: '0 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Link
          href="/dashboard/submissions"
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <ArrowLeft size={16} /> Back to Submissions
        </Link>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>
          Case: {submission.service?.name || 'Workflow Details'}
        </h2>
        <p style={{ color: 'hsl(var(--text-secondary))' }}>
          Customer: {submission.user?.owner_name} {submission.user?.company_name ? `(${submission.user.company_name})` : ''}
        </p>
      </div>

      <div className="detail-grid">
        {/* Left Side: Operations Details, Status Form, Audit Log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Promoted / Operations card deck dependent on Case Status */}
          {submission.status === 'pending' && (
            <div className="card">
              <h3 className="card-title">Promote Case: Move to Processing</h3>
              <form action={moveToProcessingAction}>
                {moveToProcessingState?.error && (
                  <div className="login-error" style={{ marginBottom: '16px' }}>
                    {moveToProcessingState.error}
                  </div>
                )}
                <input type="hidden" name="id" value={submission.id} />

                <div className="form-group">
                  <label htmlFor="next_due_date">Filing Action Deadline (Due Date) *</label>
                  <input
                    type="date"
                    id="next_due_date"
                    name="next_due_date"
                    className="input-text"
                    required
                  />
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label htmlFor="govt_expense">Government Fees (₹)</label>
                    <input
                      type="number"
                      id="govt_expense"
                      name="govt_expense"
                      className="input-text"
                      placeholder="0.00"
                      step="0.01"
                      defaultValue="0"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="service_charge">Our Service Fee (₹)</label>
                    <input
                      type="number"
                      id="service_charge"
                      name="service_charge"
                      className="input-text"
                      placeholder="0.00"
                      step="0.01"
                      defaultValue="0"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="extra_fee">Extra Fee (₹)</label>
                    <input
                      type="number"
                      id="extra_fee"
                      name="extra_fee"
                      className="input-text"
                      placeholder="0.00"
                      step="0.01"
                      defaultValue="0"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="bill_remarks">Invoice Remarks (shown on PDF bill) *</label>
                  <input
                    type="text"
                    id="bill_remarks"
                    name="bill_remarks"
                    className="input-text"
                    placeholder="e.g. Filing Fees & Service invoice"
                    defaultValue="Filing Fees & Service invoice"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="remark">Status/Deadline Reason (Internal Note)</label>
                  <input
                    type="text"
                    id="remark"
                    name="remark"
                    className="input-text"
                    placeholder="e.g. Govt application filed, waiting verification"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '8px' }}
                  disabled={isMovingToProcessing}
                >
                  {isMovingToProcessing ? 'Moving to Processing...' : 'Move to Processing'}
                </button>
              </form>
            </div>
          )}

          {submission.status === 'processing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Complete Workflow Card */}
              <div className="card" style={{ border: '1.5px solid hsl(var(--success))', background: 'rgba(16, 185, 129, 0.02)' }}>
                <h3 className="card-title" style={{ color: 'hsl(var(--success))' }}>Complete Case Filing</h3>
                <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', marginBottom: '16px', lineHeight: '1.5' }}>
                  Once all official documentations are issued or registrar approvals are complete, transition this case to the final Completed status.
                </p>
                <form action={markCompletedAction}>
                  {markCompletedState?.error && (
                    <div className="login-error" style={{ marginBottom: '16px' }}>
                      {markCompletedState.error}
                    </div>
                  )}
                  <input type="hidden" name="id" value={submission.id} />
                  
                  <div className="form-group">
                    <label htmlFor="expiry_date">Certificate Expiry Date (Optional)</label>
                    <input
                      type="date"
                      id="expiry_date"
                      name="expiry_date"
                      className="input-text"
                    />
                    <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
                      Leave blank if this certificate does not expire.
                    </p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="complete_remark">Closing Remarks (Optional)</label>
                    <input
                      type="text"
                      id="complete_remark"
                      name="remark"
                      className="input-text"
                      placeholder="e.g. Certificate issued and sent to client"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', backgroundColor: 'hsl(var(--success))', borderColor: 'hsl(var(--success))' }}
                    disabled={isMarkingCompleted}
                  >
                    {isMarkingCompleted ? 'Processing...' : 'Mark Completed'}
                  </button>
                </form>
              </div>

              {/* Extend Due Date Card */}
              <div className="card">
                <h3 className="card-title">Extend Due Date</h3>
                <form action={extendDueDateAction}>
                  {extendDueDateState?.error && (
                    <div className="login-error" style={{ marginBottom: '16px' }}>
                      {extendDueDateState.error}
                    </div>
                  )}
                  <input type="hidden" name="id" value={submission.id} />

                  <div className="form-group">
                    <label htmlFor="next_due_date">New Action Deadline (Due Date) *</label>
                    <input
                      type="date"
                      id="next_due_date"
                      name="next_due_date"
                      className="input-text"
                      defaultValue={submission.next_due_date ? submission.next_due_date.split('T')[0] : ''}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="remark">Extension Reason / Remarks *</label>
                    <input
                      type="text"
                      id="remark"
                      name="remark"
                      className="input-text"
                      placeholder="e.g. Waiting for registrar comments reply"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-secondary"
                    style={{ width: '100%', marginTop: '8px' }}
                    disabled={isExtending}
                  >
                    {isExtending ? 'Extending deadline...' : 'Extend Due Date'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {submission.status === 'completed' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="card" style={{ border: '1px solid hsl(var(--primary))', background: 'rgba(99, 102, 241, 0.02)', textAlign: 'center', padding: '32px 16px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'hsl(var(--success))', marginBottom: '16px' }}>
                  <CheckCircle size={24} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Filing Completed</h3>
                <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', lineHeight: 1.5 }}>
                  This case filing has been successfully completed and locked. The audit trail history is fully archived below.
                </p>
              </div>

              <div className="card">
                <h3 className="card-title">Update Certificate Expiry Date</h3>
                <form action={updateExpiryAction}>
                  {updateExpiryState?.error && (
                    <div className="login-error" style={{ marginBottom: '16px' }}>
                      {updateExpiryState.error}
                    </div>
                  )}
                  {updateExpiryState?.success && (
                    <div className="badge badge-success" style={{ display: 'block', marginBottom: '16px', padding: '8px' }}>
                      Expiry date updated successfully!
                    </div>
                  )}
                  <input type="hidden" name="id" value={submission.id} />
                  
                  <div className="form-group">
                    <label htmlFor="update_expiry_date">Certificate Expiry Date (Optional)</label>
                    <input
                      type="date"
                      id="update_expiry_date"
                      name="expiry_date"
                      className="input-text"
                      defaultValue={submission.next_due_date ? submission.next_due_date.split('T')[0] : ''}
                    />
                    <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
                      Clear this field and save if the certificate no longer expires.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-secondary"
                    style={{ width: '100%', marginTop: '8px' }}
                    disabled={isUpdatingExpiry}
                  >
                    {isUpdatingExpiry ? 'Saving...' : 'Save Expiry Date'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Audit Logs */}
          <div className="card">
            <h3 className="card-title">Checkpoint Audit Log</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              {submission.status_history.map((log, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    borderBottom: idx === submission.status_history.length - 1 ? 'none' : '1px solid hsl(var(--border))',
                    paddingBottom: '12px',
                  }}
                >
                  <Clock size={16} style={{ color: 'hsl(var(--text-secondary))', marginTop: '2px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className={`badge badge-${log.status}`} style={{ fontSize: '10px' }}>
                        {log.status}
                      </span>
                      <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                        {new Date(log.date).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {log.note && <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))' }}>{log.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Dynamic form answers & Attachments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Dynamic Answers Card */}
          <div className="card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="card-title" style={{ marginBottom: 0 }}>Filing Application Form Answers</h3>
              {!isEditingAnswers && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '4px 8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => setIsEditingAnswers(true)}
                >
                  <Edit2 size={12} /> Edit
                </button>
              )}
            </div>

            {isEditingAnswers ? (
              <form onSubmit={handleAnswersSubmit}>
                {updateAnswersState?.error && (
                  <div className="login-error" style={{ marginBottom: '16px' }}>
                    {updateAnswersState.error}
                  </div>
                )}
                {updateAnswersState?.success && (
                  <div className="login-success" style={{ marginBottom: '16px', color: 'hsl(var(--success))', fontSize: '13px', fontWeight: 600 }}>
                    Form answers updated successfully!
                  </div>
                )}
                
                <div className="detail-list" style={{ marginTop: '12px' }}>
                  {questions.map((q) => {
                    const val = submission.answers[q.id];
                    const isFile = q.type === 'image' || q.type === 'pdf';
                    
                    return (
                      <div className="form-group" key={q.id}>
                        <label htmlFor={`edit_ans_${q.id}`} style={{ fontWeight: 600 }}>
                          {q.label} {q.required && <span style={{ color: 'hsl(var(--danger))' }}>*</span>}
                        </label>
                        
                        {isFile ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))' }}>
                              {val ? 'File uploaded' : 'No file'}
                            </span>
                            {val && (
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                                onClick={() => handleDownloadAttachment(String(val))}
                              >
                                View Current File
                              </button>
                            )}
                            <input type="hidden" name={q.id} value={val || ''} />
                          </div>
                        ) : q.type === 'textarea' ? (
                          <textarea
                            id={`edit_ans_${q.id}`}
                            name={q.id}
                            className="input-text"
                            rows={3}
                            defaultValue={val !== undefined ? String(val) : ''}
                            required={q.required}
                          />
                        ) : q.type === 'dropdown' ? (
                          <select
                            id={`edit_ans_${q.id}`}
                            name={q.id}
                            className="select-input"
                            style={{ width: '100%' }}
                            defaultValue={val !== undefined ? String(val) : ''}
                            required={q.required}
                          >
                            <option value="">Select option...</option>
                            {q.options?.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={q.type === 'number' ? 'number' : q.type === 'date' ? 'date' : 'text'}
                            id={`edit_ans_${q.id}`}
                            name={q.id}
                            className="input-text"
                            defaultValue={val !== undefined ? String(val) : ''}
                            required={q.required}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    disabled={isUpdatingAnswers}
                  >
                    {isUpdatingAnswers ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsEditingAnswers(false)}
                    disabled={isUpdatingAnswers}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="detail-list" style={{ marginTop: '12px' }}>
                {questions.length === 0 ? (
                  <div style={{ display: 'flex', gap: '12px', padding: '16px', border: '1px dashed hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--text-secondary))' }}>
                    <AlertCircle size={20} />
                    <p style={{ fontSize: '13px' }}>
                      No form questions defined for this service schema. Showing raw input mappings:
                    </p>
                  </div>
                ) : (
                  questions.map((q) => {
                    const val = submission.answers[q.id];
                    const isFile = (q.type === 'image' || q.type === 'pdf') && val;
                    return (
                      <div className="detail-item" key={q.id} style={{ flexDirection: isFile ? 'column' : 'row', alignItems: isFile ? 'flex-start' : 'center' }}>
                        <span className="detail-label">
                          {q.label} {q.required && <span style={{ color: 'hsl(var(--danger))' }}>*</span>}
                        </span>
                        {isFile ? (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{
                              padding: '4px 8px',
                              fontSize: '12px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginTop: '6px',
                            }}
                            onClick={() => handleDownloadAttachment(String(val))}
                          >
                            <Download size={12} /> View {q.type === 'image' ? 'Image File' : 'PDF Document'}
                          </button>
                        ) : (
                          <span className="detail-val">{val !== undefined && val !== '' ? String(val) : '—'}</span>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Display raw values if no questions map to them */}
                {Object.keys(submission.answers).filter(
                  (key) => !questions.some((q) => q.id === key)
                ).length > 0 && (
                  <div style={{ marginTop: '16px', borderTop: '1px solid hsl(var(--border))', paddingTop: '16px' }}>
                    <span className="detail-label" style={{ marginBottom: '8px', display: 'block' }}>Other Form Data (Bot Entries)</span>
                    {Object.entries(submission.answers)
                      .filter(([key]) => !questions.some((q) => q.id === key))
                      .map(([key, val]) => (
                        <div className="detail-item" key={key}>
                          <span className="detail-label">{key}</span>
                          <span className="detail-val">{String(val)}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Filing Financials & Accounting Card */}
          {submission.status !== 'pending' && (() => {
            const activeBill = initialBills[0] || null;
            const currentGovtFee = activeBill ? activeBill.govt_fee : submission.govt_expense;
            const currentServiceCharge = activeBill ? activeBill.service_charge : submission.service_charge;
            const currentExtraFee = activeBill ? activeBill.extra_fee : 0;
            const currentRemarks = activeBill ? activeBill.remarks : 'Filing Fees & Service invoice';

            return (
              <div className="card" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 className="card-title" style={{ marginBottom: 0 }}>Filing Financials & Accounting</h3>
                  {!isEditingFinancials && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => setIsEditingFinancials(true)}
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                  )}
                </div>

                {isEditingFinancials ? (
                  <form action={updateFinancialsAction}>
                    {updateFinancialsState?.error && (
                      <div className="login-error" style={{ marginBottom: '16px' }}>
                        {updateFinancialsState.error}
                      </div>
                    )}
                    {updateFinancialsState?.success && (
                      <div className="login-success" style={{ marginBottom: '16px', color: 'hsl(var(--success))', fontSize: '13px', fontWeight: 600 }}>
                        Financials & accounts updated successfully!
                      </div>
                    )}
                    <input type="hidden" name="id" value={submission.id} />

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label htmlFor="edit_govt_expense">Govt Fee (₹)</label>
                        <input
                          type="number"
                          id="edit_govt_expense"
                          name="govt_expense"
                          className="input-text"
                          step="0.01"
                          defaultValue={currentGovtFee}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="edit_service_charge">Service Fee (₹)</label>
                        <input
                          type="number"
                          id="edit_service_charge"
                          name="service_charge"
                          className="input-text"
                          step="0.01"
                          defaultValue={currentServiceCharge}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="edit_extra_fee">Extra Fee (₹)</label>
                        <input
                          type="number"
                          id="edit_extra_fee"
                          name="extra_fee"
                          className="input-text"
                          step="0.01"
                          defaultValue={currentExtraFee}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="edit_remarks">Invoice Remarks</label>
                      <input
                        type="text"
                        id="edit_remarks"
                        name="remarks"
                        className="input-text"
                        defaultValue={currentRemarks || ''}
                        placeholder="Remarks printed on bill"
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ flex: 1 }}
                        disabled={isUpdatingFinancials}
                      >
                        {isUpdatingFinancials ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setIsEditingFinancials(false)}
                        disabled={isUpdatingFinancials}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <p style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))', marginBottom: '16px', lineHeight: 1.4 }}>
                      Manage government expenses, service charges, extra fees, and remarks. Changes here update the ledger accounts and invoices.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div className="detail-item">
                        <span className="detail-label">Govt Fee</span>
                        <span className="detail-val">₹{Number(currentGovtFee).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Service Fee</span>
                        <span className="detail-val">₹{Number(currentServiceCharge).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Extra Fee</span>
                        <span className="detail-val">₹{Number(currentExtraFee).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    <div className="detail-item" style={{ marginTop: '12px' }}>
                      <span className="detail-label">Invoice Remarks</span>
                      <span className="detail-val">{currentRemarks || '—'}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Billing & Invoicing Card */}
          <div className="card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="card-title" style={{ marginBottom: 0 }}>Billing & Invoices</h3>
              {submission.status !== 'pending' && initialBills.length === 0 && (
                <button
                  className="btn btn-primary"
                  style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  onClick={handleGenerateBillDirect}
                  disabled={isGeneratingLegacyBill}
                  type="button"
                >
                  <Plus size={12} /> {isGeneratingLegacyBill ? 'Generating...' : 'Generate Bill'}
                </button>
              )}
            </div>

            {/* Invoices List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {initialBills.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', textAlign: 'center', padding: '16px 0', border: '1px dashed hsl(var(--border))', borderRadius: '8px' }}>
                  No invoices generated for this case yet.
                </p>
              ) : (
                initialBills.map((bill) => (
                  <div
                    key={bill.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      backgroundColor: 'hsl(var(--bg-panel))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))' }}>
                        {new Date(bill.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--primary))' }}>
                        ₹{Number(bill.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'hsl(var(--text-secondary))' }}>
                      <span>Govt: ₹{Number(bill.govt_fee).toFixed(0)} | Serv: ₹{Number(bill.service_charge).toFixed(0)} {Number(bill.extra_fee) > 0 && `| Extra: ₹${Number(bill.extra_fee).toFixed(0)}`}</span>
                      <a
                        href={`/api/bills/download/${bill.id}`}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Download size={10} /> Download DOCX
                      </a>
                    </div>
                    {bill.remarks && (
                      <p style={{ fontSize: '11px', fontStyle: 'italic', margin: 0, borderTop: '1px solid hsl(var(--border))', paddingTop: '6px', color: 'hsl(var(--text-muted))' }}>
                        Note: {bill.remarks}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
