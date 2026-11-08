'use client';

import React, { useState, useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { handleUpdateService, handleDeleteService } from '@/app/actions/services';
import { Plus, X, ArrowUp, ArrowDown, Trash2, Edit2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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
}

export default function ServiceDetailsClient({ service }: { service: Service }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [questions, setQuestions] = useState<Question[]>(service.questions || []);

  const [updateState, updateAction, isUpdating] = useActionState(handleUpdateService, null);

  useEffect(() => {
    if (updateState?.success) {
      setIsModalOpen(false);
    }
  }, [updateState]);

  // Keep questions in sync with prop changes (like after a successful save)
  useEffect(() => {
    setQuestions(service.questions || []);
  }, [service.questions]);

  const handleConfirmDelete = async () => {
    const confirmed = confirm(
      'Are you sure you want to permanently delete this service? This will break references for existing client submissions.'
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await handleDeleteService(service.id);
      router.push('/dashboard/services');
    } catch (error: any) {
      alert(error.message || 'Failed to delete service profile.');
      setIsDeleting(false);
    }
  };

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

  return (
    <div>
      {/* Detail Headers */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link
          href="/dashboard/services"
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <ArrowLeft size={16} /> Back to Services
        </Link>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => setIsModalOpen(true)} type="button">
            <Edit2 size={13} /> Edit Service
          </button>
          <button
            className="btn btn-danger"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            type="button"
          >
            <Trash2 size={13} /> {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '16px',
          }}
        >
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>{service.name}</h2>
          <span className={`badge ${service.active ? 'badge-completed' : 'badge-expense'}`}>
            {service.active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <p style={{ color: 'hsl(var(--text-secondary))', lineHeight: 1.6 }}>
          {service.description || 'No description recorded for this catalog service.'}
        </p>
      </div>

      {/* Inputs List Panel */}
      <div className="card">
        <h3 className="card-title" style={{ borderBottom: '1px solid hsl(var(--border))', paddingBottom: '16px' }}>
          Configured Fields Schema
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
          {service.questions.length === 0 ? (
            <p
              style={{
                color: 'hsl(var(--text-secondary))',
                fontSize: '14px',
                padding: '32px 0',
                border: '1px dashed hsl(var(--border))',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              No questions are defined for this service.
            </p>
          ) : (
            service.questions.map((q, idx) => (
              <div
                key={q.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: idx === service.questions.length - 1 ? 'none' : '1px solid hsl(var(--border))',
                  paddingBottom: '16px',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>
                    {idx + 1}. {q.label || 'Unnamed Field'}
                  </span>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'hsl(var(--text-secondary))' }}>
                    <span style={{ textTransform: 'capitalize' }}>Type: {q.type}</span>
                    <span>Required: {q.required ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Service Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Service Catalog</h3>
              <button
                className="btn-icon"
                onClick={() => {
                  setQuestions(service.questions || []);
                  setIsModalOpen(false);
                }}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <form action={updateAction}>
              <div className="modal-body">
                {updateState?.error && (
                  <div className="login-error" style={{ marginBottom: '16px' }}>
                    {updateState.error}
                  </div>
                )}

                <input type="hidden" name="id" value={service.id} />

                <div className="form-group">
                  <label htmlFor="name">Service Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="input-text"
                    required
                    defaultValue={service.name}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    className="input-text"
                    rows={2}
                    defaultValue={service.description || ''}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="active">Service Status</label>
                  <select
                    id="active"
                    name="active"
                    className="select-input"
                    defaultValue={service.active ? 'true' : 'false'}
                    style={{ width: '100%' }}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                {/* Hidden field containing the questions JSON */}
                <input type="hidden" name="questions" value={JSON.stringify(questions)} />

                {/* Form Field Builder */}
                <div style={{ marginTop: '24px', borderTop: '1px solid hsl(var(--border))', paddingTop: '20px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px',
                    }}
                  >
                    <h4 style={{ fontSize: '15px', fontWeight: 600 }}>Form Fields Builder</h4>
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
                      maxHeight: '250px',
                      overflowY: 'auto',
                      paddingRight: '4px',
                    }}
                  >
                    {questions.map((q, idx) => (
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
                            placeholder="Field Label / Question"
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
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setQuestions(service.questions || []);
                    setIsModalOpen(false);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isUpdating}>
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
