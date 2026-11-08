'use client';

import React, { useState, useActionState, useEffect } from 'react';
import Link from 'next/link';
import { handleCreateService } from '@/app/actions/services';
import { Plus, X, ArrowUp, ArrowDown, Trash2, Eye } from 'lucide-react';

interface Question {
  id: string;
  label: string;
  type: 'text' | 'number' | 'image' | 'pdf';
  required: boolean;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  questions: Question[];
  created_at: string;
}

export default function ServicesListClient({ initialServices }: { initialServices: Service[] }) {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);

  // React 19 Action State Hook
  const [createState, createAction, isCreating] = useActionState(handleCreateService, null);

  useEffect(() => {
    if (createState?.success) {
      setIsModalOpen(false);
      setQuestions([]);
    }
  }, [createState]);

  const addQuestion = () => {
    const newQ: Question = {
      id: Math.random().toString(36).substring(2, 9),
      label: '',
      type: 'text',
      required: false,
    };
    setQuestions([...questions, newQ]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: string, fields: Partial<Question>) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, ...fields } : q))
    );
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= questions.length) return;

    const newQuestions = [...questions];
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[nextIndex];
    newQuestions[nextIndex] = temp;
    setQuestions(newQuestions);
  };

  const filteredServices = initialServices.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Search Bar & Header Action */}
      <div className="filter-bar">
        <div className="search-group">
          <input
            type="text"
            className="input-text"
            placeholder="Search services by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            setQuestions([]);
            setIsModalOpen(true);
          }}
          type="button"
        >
          <Plus size={16} /> Add Service
        </button>
      </div>

      {/* Services Table List */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Service Name</th>
                <th>Created At</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((svc) => (
                <tr key={svc.id}>
                  <td style={{ fontWeight: 600 }}>{svc.name}</td>
                  <td style={{ color: 'hsl(var(--text-secondary))' }}>
                    {new Date(svc.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td>
                    <span className={`badge ${svc.active ? 'badge-completed' : 'badge-expense'}`}>
                      {svc.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link
                      href={`/dashboard/services/${svc.id}`}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                    >
                      <Eye size={14} /> View Details
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredServices.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'hsl(var(--text-secondary))', padding: '32px 0' }}>
                    No services registered in catalog.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Service Modal with Dynamic Schema Builder */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Create Service Profile</h3>
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

                <div className="form-group">
                  <label htmlFor="name">Service Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="input-text"
                    required
                    placeholder="e.g. Private Limited Company Registration"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    className="input-text"
                    rows={2}
                    placeholder="Provide details of files/process requirements..."
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="active">Catalog Visibility / Status</label>
                  <select id="active" name="active" className="select-input" style={{ width: '100%' }}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                {/* Hidden field containing current question schema */}
                <input type="hidden" name="questions" value={JSON.stringify(questions)} />

                {/* Form Question Builder Area */}
                <div style={{ marginTop: '24px', borderTop: '1px solid hsl(var(--border))', paddingTop: '20px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px',
                    }}
                  >
                    <h4 style={{ fontSize: '15px', fontWeight: 600 }}>Dynamic Questionnaire Fields</h4>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={addQuestion}
                    >
                      <Plus size={14} /> Add Question Field
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      maxHeight: '300px',
                      overflowY: 'auto',
                      paddingRight: '4px',
                    }}
                  >
                    {questions.length === 0 ? (
                      <p
                        style={{
                          textAlign: 'center',
                          color: 'hsl(var(--text-secondary))',
                          fontSize: '13px',
                          padding: '24px 0',
                          border: '1px dashed hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      >
                        No questions defined. This workflow is currently set as an empty direct submission.
                      </p>
                    ) : (
                      questions.map((q, idx) => (
                        <div
                          key={q.id}
                          style={{
                            backgroundColor: 'hsl(var(--bg-panel))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            padding: '16px',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: '12px',
                              marginBottom: '12px',
                              alignItems: 'center',
                            }}
                          >
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--primary))' }}>
                              Field #{idx + 1}
                            </span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                type="button"
                                className="btn-icon"
                                onClick={() => moveQuestion(idx, 'up')}
                                disabled={idx === 0}
                                title="Move Up"
                              >
                                <ArrowUp size={14} />
                              </button>
                              <button
                                type="button"
                                className="btn-icon"
                                onClick={() => moveQuestion(idx, 'down')}
                                disabled={idx === questions.length - 1}
                                title="Move Down"
                              >
                                <ArrowDown size={14} />
                              </button>
                              <button
                                type="button"
                                className="btn-icon"
                                style={{ color: 'hsl(var(--danger))' }}
                                onClick={() => removeQuestion(q.id)}
                                title="Delete Field"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          <div className="form-group" style={{ marginBottom: '10px' }}>
                            <input
                              type="text"
                              className="input-text"
                              required
                              placeholder="e.g. Enter PAN Card Number or Upload Scan"
                              value={q.label}
                              onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
                            />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', alignItems: 'center' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <select
                                className="select-input"
                                style={{ width: '100%' }}
                                value={q.type}
                                onChange={(e) =>
                                  updateQuestion(q.id, {
                                    type: e.target.value as any,
                                  })
                                }
                              >
                                <option value="text">Text</option>
                                <option value="number">Number</option>
                                <option value="image">Image File</option>
                                <option value="pdf">PDF File</option>
                              </select>
                            </div>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                              <input
                                type="checkbox"
                                checked={q.required}
                                onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                                style={{ cursor: 'pointer' }}
                              />
                              Required field
                            </label>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
