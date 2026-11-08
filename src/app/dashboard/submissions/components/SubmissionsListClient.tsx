'use client';

import React, { useState, useActionState, useEffect } from 'react';
import Link from 'next/link';
import { handleCreateSubmissionManual } from '@/app/actions/submissions';
import { handleCreateConsolidatedBills } from '@/app/actions/bills';
import { Eye, Calendar, Clock, CheckCircle, Plus, X, Upload, Loader } from 'lucide-react';

interface Question {
  id: string;
  label: string;
  type: 'text' | 'number' | 'image' | 'pdf' | 'date' | 'dropdown' | 'textarea';
  required: boolean;
  options?: string[];
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
  next_due_date: string | null;
  status_history: StatusHistoryEntry[];
  attachments: Attachment[];
  user: {
    owner_name: string;
    company_name: string | null;
  } | null;
  service: {
    name: string;
  } | null;
  govt_expense?: number;
  service_charge?: number;
}

interface UserOption {
  id: string;
  owner_name: string;
  company_name: string | null;
}

interface ServiceOption {
  id: string;
  name: string;
  active: boolean;
  questions: Question[];
}

interface ServiceBlock {
  id: string;
  serviceId: string;
  answers: Record<string, any>;
}

export default function SubmissionsListClient({
  initialSubmissions,
  users,
  services,
}: {
  initialSubmissions: Submission[];
  users: UserOption[];
  services: ServiceOption[];
}) {
  const [activeTab, setActiveTab] = useState<'pending' | 'processing' | 'completed'>('pending');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Consolidated Bill States
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const [isConsolidatedModalOpen, setIsConsolidatedModalOpen] = useState(false);
  const [consolidatedItems, setConsolidatedItems] = useState<any[]>([]);
  const [isGeneratingBills, setIsGeneratingBills] = useState(false);

  // New manual submission state
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [serviceBlocks, setServiceBlocks] = useState<ServiceBlock[]>([
    { id: 'initial-1', serviceId: '', answers: {} }
  ]);
  const [uploadingFieldId, setUploadingFieldId] = useState<string | null>(null);

  const [createState, createAction, isCreating] = useActionState(handleCreateSubmissionManual, null);

  useEffect(() => {
    if (createState?.success) {
      setIsModalOpen(false);
      setSelectedUserId('');
      setServiceBlocks([{ id: Date.now().toString(), serviceId: '', answers: {} }]);
    }
  }, [createState]);

  const handleFormFieldUpload = async (blockId: string, questionId: string, file: File) => {
    const uploadId = `${blockId}_${questionId}`;
    setUploadingFieldId(uploadId);
    try {
      // 1. Get presigned upload URL
      const res = await fetch('/api/attachments/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      if (!res.ok) throw new Error('Failed to request storage credentials');
      const { uploadUrl, key } = await res.json();

      // 2. Perform direct storage PUT request
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error('Storage direct upload failed');

      // 3. Save key to specific block's answers
      setServiceBlocks((prev) =>
        prev.map((block) => {
          if (block.id === blockId) {
            return { ...block, answers: { ...block.answers, [questionId]: key } };
          }
          return block;
        })
      );
      alert('Document uploaded successfully!');
    } catch (error: any) {
      alert(error.message || 'File upload failed');
    } finally {
      setUploadingFieldId(null);
    }
  };


  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedSubmissions(filtered.map(s => s.id));
    } else {
      setSelectedSubmissions([]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedSubmissions(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const openConsolidatedModal = () => {
    const selected = initialSubmissions.filter(s => selectedSubmissions.includes(s.id));
    const firstUser = selected[0]?.user?.owner_name;
    const allSameUser = selected.every(s => s.user?.owner_name === firstUser);
    
    if (!allSameUser) {
      alert("All selected services must belong to the same customer to generate a single bill.");
      return;
    }

    setConsolidatedItems(selected.map(s => ({
      submission_id: s.id,
      name: s.service?.name || 'Service',
      govt_fee: Number(s.govt_expense) || 0,
      service_charge: Number(s.service_charge) || 0,
      extra_fee: 0,
      remarks: ''
    })));
    setIsConsolidatedModalOpen(true);
  };

  const submitConsolidatedBills = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingBills(true);
    try {
      const res = await handleCreateConsolidatedBills(consolidatedItems);
      if (res.error) throw new Error(res.error);
      
      if (res.billIds && res.billIds.length > 0) {
        window.open(`/api/bills/download-combined?ids=${res.billIds.join(',')}`, '_blank');
        setIsConsolidatedModalOpen(false);
        setSelectedSubmissions([]);
        setIsSelectionMode(false);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to generate bills');
    } finally {
      setIsGeneratingBills(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = userSearchQuery.toLowerCase();
    return (
      u.owner_name.toLowerCase().includes(term) ||
      (u.company_name && u.company_name.toLowerCase().includes(term))
    );
  });

  const addServiceBlock = () => {
    setServiceBlocks([...serviceBlocks, { id: Date.now().toString(), serviceId: '', answers: {} }]);
    setTimeout(() => {
      const modal = document.querySelector('.modal-body');
      if (modal) modal.scrollTo({ top: modal.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const removeServiceBlock = (blockId: string) => {
    setServiceBlocks(serviceBlocks.filter(b => b.id !== blockId));
  };

  // 1. Filter submissions by active tab
  let filtered = initialSubmissions.filter((sub) => sub.status === activeTab);

  // 2. Apply tab-specific sorting rules
  if (activeTab === 'processing') {
    // Processing tab: sorted ascending by next_due_date
    filtered = [...filtered].sort((a, b) => {
      if (!a.next_due_date) return 1;
      if (!b.next_due_date) return -1;
      return new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime();
    });
  } else {
    // Pending/Completed: sorted descending by created_at
    filtered = [...filtered].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  const getTabCount = (tab: 'pending' | 'processing' | 'completed') => {
    return initialSubmissions.filter((sub) => sub.status === tab).length;
  };

  const getCompletedDate = (sub: Submission) => {
    const compLog = sub.status_history?.find((log) => log.status === 'completed');
    if (compLog) {
      return new Date(compLog.date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
    return new Date(sub.created_at).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
  };

  return (
    <div>
      {/* Submissions Control Header */}
      <div className="filter-bar" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', gap: '8px' }}>
        {activeTab === 'processing' && (
          isSelectionMode ? (
            <>
              <button className="btn btn-primary" onClick={openConsolidatedModal} type="button" style={{ backgroundColor: 'hsl(var(--success))', color: '#fff', border: 'none' }} disabled={selectedSubmissions.length === 0}>
                Proceed ({selectedSubmissions.length})
              </button>
              <button className="btn btn-secondary" onClick={() => { setIsSelectionMode(false); setSelectedSubmissions([]); }} type="button">
                Cancel
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => setIsSelectionMode(true)} type="button">
              Generate Bill
            </button>
          )
        )}
        <button
          className="btn btn-primary"
          onClick={() => {
            setSelectedUserId('');
            setServiceBlocks([{ id: Date.now().toString(), serviceId: '', answers: {} }]);
            setIsModalOpen(true);
          }}
          type="button"
        >
          <Plus size={16} /> New Submission
        </button>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid hsl(var(--border))', marginBottom: '24px', gap: '8px' }}>
        {(['pending', 'processing', 'completed'] as const).map((tab) => {
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
              }}
              type="button"
            >
              <span style={{ textTransform: 'capitalize' }}>{tab}</span>
              <span className="badge badge-processing" style={{ fontSize: '10px', padding: '2px 6px' }}>
                {getTabCount(tab)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Submissions List Card */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                {activeTab === 'processing' && isSelectionMode && (
                  <th style={{ width: '40px' }}>
                    <input 
                      type="checkbox" 
                      checked={filtered.length > 0 && selectedSubmissions.length === filtered.length}
                      onChange={handleSelectAll} 
                    />
                  </th>
                )}
                <th>Customer / Company</th>
                <th>Service Applied</th>
                {activeTab === 'completed' ? <th>Completed At</th> : <th>Due / Action Alert</th>}
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const isOverdue =
                  sub.status === 'processing' &&
                  sub.next_due_date &&
                  new Date(sub.next_due_date) < today;

                const isDueToday =
                  sub.status === 'processing' &&
                  sub.next_due_date &&
                  new Date(sub.next_due_date).toDateString() === today.toDateString();

                return (
                  <tr key={sub.id}>
                    {activeTab === 'processing' && isSelectionMode && (
                      <td>
                        <input 
                          type="checkbox" 
                          checked={selectedSubmissions.includes(sub.id)} 
                          onChange={() => toggleSelect(sub.id)} 
                        />
                      </td>
                    )}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600 }}>{sub.user?.owner_name || 'N/A'}</span>
                        {sub.user?.company_name && (
                          <span style={{ fontSize: '11px', color: 'hsl(var(--text-secondary))' }}>
                            {sub.user.company_name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{sub.service?.name || 'N/A'}</td>
                    <td>
                      {sub.status === 'completed' ? (
                        <span className="badge badge-completed" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle size={12} /> {getCompletedDate(sub)}
                        </span>
                      ) : sub.status === 'processing' && sub.next_due_date ? (
                        <span
                          className={`badge ${
                            isOverdue
                              ? 'badge-expense' // Red for overdue
                              : isDueToday
                              ? 'badge-pending' // Yellow for due today
                              : 'badge-processing' // Neutral/Blue for active upcoming
                          }`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Calendar size={12} />
                          {isOverdue ? 'Overdue: ' : isDueToday ? 'Due Today: ' : 'Due: '}
                          {new Date(sub.next_due_date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </span>
                      ) : (
                        <span className="badge badge-processing" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={12} /> Pending Review
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        href={`/dashboard/submissions/${sub.id}`}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '13px' }}
                      >
                        <Eye size={14} /> View Details
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={activeTab === 'processing' ? 5 : 4} style={{ textAlign: 'center', color: 'hsl(var(--text-secondary))', padding: '48px 0' }}>
                    No submissions currently matching this status tab.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Submission Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Manual Case Registration</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)} type="button">
                <X size={18} />
              </button>
            </div>

            <form action={createAction}>
              <div className="modal-body">
                {createState?.error && (
                  <div className="login-error" style={{ marginBottom: '16px' }}>
                    {createState.error}
                  </div>
                )}

                {/* Pick Client with Search */}
                <div className="form-group">
                  <label htmlFor="user_search">Search Customer</label>
                  <input
                    type="text"
                    id="user_search"
                    className="input-text"
                    style={{ marginBottom: '8px' }}
                    placeholder="Type name or company to filter list..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                  />
                  
                  <label htmlFor="user_id">Select Customer *</label>
                  <select
                    id="user_id"
                    name="user_id"
                    className="select-input"
                    style={{ width: '100%' }}
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Customer --</option>
                    {filteredUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.owner_name} {u.company_name ? `(${u.company_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Multi Submissions List */}
                <input type="hidden" name="multi_submissions" value={JSON.stringify(serviceBlocks)} />
                
                {serviceBlocks.map((block, index) => {
                  const selectedService = services.find((s) => s.id === block.serviceId);

                  const updateAnswer = (qId: string, val: any) => {
                    setServiceBlocks(prev => prev.map(b => 
                      b.id === block.id ? { ...b, answers: { ...b.answers, [qId]: val } } : b
                    ));
                  };

                  return (
                    <div key={block.id} style={{ marginTop: index > 0 ? '24px' : '0', padding: index > 0 ? '16px' : '0', border: index > 0 ? '1px solid hsl(var(--border))' : 'none', borderRadius: '8px', position: 'relative' }}>
                      <div className="form-group">
                        <label>Select Filing Service *</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <select
                            className="select-input"
                            style={{ flex: 1 }}
                            value={block.serviceId}
                            onChange={(e) => {
                              const newId = e.target.value;
                              setServiceBlocks(prev => prev.map(b => 
                                b.id === block.id ? { ...b, serviceId: newId, answers: {} } : b
                              ));
                            }}
                            required
                          >
                            <option value="">-- Choose Catalog Service --</option>
                            {services.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                          {serviceBlocks.length > 1 && (
                            <button type="button" className="btn-icon" onClick={() => removeServiceBlock(block.id)}>
                              <X size={18} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Dynamic Questions Render */}
                      {selectedService && (
                        <div style={{ marginTop: '20px', borderTop: '1px solid hsl(var(--border))', paddingTop: '16px' }}>
                          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
                            Filing Form Fields: {selectedService.name}
                          </h4>

                          {selectedService.questions.length === 0 ? (
                            <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', fontStyle: 'italic' }}>
                              No inputs defined for this service catalog.
                            </p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {selectedService.questions.map((q) => {
                                const isUploaded = !!block.answers[q.id];
                                const currentUploadId = `${block.id}_${q.id}`;

                                return (
                                  <div className="form-group" key={q.id}>
                                    <label>
                                      {q.label} {q.required && <span style={{ color: 'hsl(var(--danger))' }}>*</span>}
                                    </label>

                                    {q.type === 'text' && (
                                      <input
                                        type="text"
                                        className="input-text"
                                        required={q.required}
                                        value={block.answers[q.id] || ''}
                                        onChange={(e) => updateAnswer(q.id, e.target.value)}
                                        placeholder="Enter text value"
                                      />
                                    )}

                                    {q.type === 'number' && (
                                      <input
                                        type="number"
                                        className="input-text"
                                        required={q.required}
                                        value={block.answers[q.id] || ''}
                                        onChange={(e) => updateAnswer(q.id, e.target.value)}
                                        placeholder="Enter numeric value"
                                      />
                                    )}

                                    {q.type === 'date' && (
                                      <input
                                        type="date"
                                        className="input-text"
                                        required={q.required}
                                        value={block.answers[q.id] || ''}
                                        onChange={(e) => updateAnswer(q.id, e.target.value)}
                                      />
                                    )}

                                    {q.type === 'dropdown' && (
                                      <select
                                        className="select-input"
                                        style={{ width: '100%' }}
                                        required={q.required}
                                        value={block.answers[q.id] || ''}
                                        onChange={(e) => updateAnswer(q.id, e.target.value)}
                                      >
                                        <option value="">-- Choose Option --</option>
                                        {q.options?.map((opt) => (
                                          <option key={opt} value={opt}>
                                            {opt}
                                          </option>
                                        ))}
                                      </select>
                                    )}

                                    {q.type === 'textarea' && (
                                      <textarea
                                        className="input-text"
                                        rows={3}
                                        required={q.required}
                                        value={block.answers[q.id] || ''}
                                        onChange={(e) => updateAnswer(q.id, e.target.value)}
                                        placeholder="Enter details..."
                                      />
                                    )}

                                    {(q.type === 'image' || q.type === 'pdf') && (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <label
                                          className="btn btn-secondary"
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            cursor: uploadingFieldId === currentUploadId ? 'not-allowed' : 'pointer',
                                            padding: '8px 14px',
                                          }}
                                        >
                                          {uploadingFieldId === currentUploadId ? (
                                            <>
                                              <Loader size={14} className="animate-spin" />
                                              <span>Uploading...</span>
                                            </>
                                          ) : (
                                            <>
                                              <Upload size={14} />
                                              <span>Upload {q.type === 'image' ? 'Image' : 'PDF'}</span>
                                            </>
                                          )}
                                          <input
                                            type="file"
                                            accept={q.type === 'image' ? 'image/*' : 'application/pdf'}
                                            style={{ display: 'none' }}
                                            disabled={uploadingFieldId === currentUploadId}
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) handleFormFieldUpload(block.id, q.id, file);
                                            }}
                                          />
                                        </label>
                                        {isUploaded ? (
                                          <span style={{ fontSize: '12px', color: 'hsl(var(--success))', fontWeight: 600 }}>
                                            ✓ Document Uploaded
                                          </span>
                                        ) : (
                                          q.required && (
                                            <span style={{ fontSize: '11px', color: 'hsl(var(--text-secondary))' }}>
                                              Required
                                            </span>
                                          )
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
                  <button type="button" className="btn btn-secondary" onClick={addServiceBlock}>
                    <Plus size={16} style={{ marginRight: '8px' }} /> Add Service
                  </button>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isCreating || !!uploadingFieldId}>
                  {isCreating ? 'Filing Case...' : 'File Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Consolidated Bill Modal */}
      {isConsolidatedModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Generate Consolidated Bill</h3>
              <button className="btn-icon" onClick={() => setIsConsolidatedModalOpen(false)} type="button">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={submitConsolidatedBills}>
              <div className="modal-body">
                <table className="data-table" style={{ marginBottom: '16px' }}>
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Govt Fee</th>
                      <th>Service Charge</th>
                      <th>Extra Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consolidatedItems.map((item, index) => (
                      <tr key={item.submission_id}>
                        <td>{item.name}</td>
                        <td>
                          <input type="number" className="input-text" style={{ padding: '6px' }} value={item.govt_fee} onChange={(e) => {
                            const newItems = [...consolidatedItems];
                            newItems[index].govt_fee = Number(e.target.value);
                            setConsolidatedItems(newItems);
                          }} required />
                        </td>
                        <td>
                          <input type="number" className="input-text" style={{ padding: '6px' }} value={item.service_charge} onChange={(e) => {
                            const newItems = [...consolidatedItems];
                            newItems[index].service_charge = Number(e.target.value);
                            setConsolidatedItems(newItems);
                          }} required />
                        </td>
                        <td>
                          <input type="number" className="input-text" style={{ padding: '6px' }} value={item.extra_fee} onChange={(e) => {
                            const newItems = [...consolidatedItems];
                            newItems[index].extra_fee = Number(e.target.value);
                            setConsolidatedItems(newItems);
                          }} required />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ fontWeight: 600 }}>
                      <td>Total</td>
                      <td>{consolidatedItems.reduce((acc, curr) => acc + curr.govt_fee, 0)}</td>
                      <td>{consolidatedItems.reduce((acc, curr) => acc + curr.service_charge, 0)}</td>
                      <td>{consolidatedItems.reduce((acc, curr) => acc + curr.extra_fee, 0)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsConsolidatedModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isGeneratingBills}>
                  {isGeneratingBills ? 'Generating...' : 'Generate Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

