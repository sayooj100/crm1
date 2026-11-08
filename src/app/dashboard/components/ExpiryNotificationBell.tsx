'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ShieldAlert, X } from 'lucide-react';
import { handleAcknowledgeExpiry } from '@/app/actions/submissions';

interface ExpiringCertificate {
  id: string;
  next_due_date: string;
  user: {
    owner_name: string;
    company_name: string | null;
  };
  service: {
    name: string;
  };
  answers?: any;
}

export default function ExpiryNotificationBell({ expiringList }: { expiringList: ExpiringCertificate[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDismissing, setIsDismissing] = useState<string | null>(null);

  const count = expiringList.length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onDismiss = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDismissing(id);
    try {
      await handleAcknowledgeExpiry(id);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDismissing(null);
    }
  };

  return (
    <div className="bell-container" ref={dropdownRef}>
      <button
        className="bell-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle expiry notifications"
        type="button"
      >
        <ShieldAlert size={20} />
        {count > 0 && <span className="bell-badge" style={{ backgroundColor: 'hsl(var(--warning))' }}>{count}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <span>Expiring Certificates</span>
            {count > 0 && <span className="badge badge-warning" style={{ backgroundColor: 'hsl(var(--warning))', color: '#fff' }}>{count} expiring</span>}
          </div>
          <ul className="notification-list">
            {count === 0 ? (
              <li className="notification-empty">No certificates expiring soon.</li>
            ) : (
              expiringList.map((sub) => (
                <li key={sub.id} className="notification-item" style={{ display: 'flex', alignItems: 'center' }}>
                  <Link
                    href={`/dashboard/submissions/${sub.id}`}
                    className="notification-link"
                    onClick={() => setIsOpen(false)}
                    style={{ flex: 1 }}
                  >
                    <div className="notification-title">
                      {sub.service.name === 'External Certificate' && sub.answers?.custom_name ? sub.answers.custom_name : sub.service.name}
                    </div>
                    <div className="notification-meta">
                      <span>
                        {sub.user.owner_name}
                        {sub.user.company_name ? ` (${sub.user.company_name})` : ''}
                      </span>
                      <span className="notification-due" style={{ color: 'hsl(var(--warning))', fontWeight: 600 }}>Expires: {sub.next_due_date}</span>
                    </div>
                  </Link>
                  <button
                    onClick={(e) => onDismiss(e, sub.id)}
                    disabled={isDismissing === sub.id}
                    className="btn-icon"
                    title="Dismiss Notification"
                    style={{ marginLeft: '12px', color: 'hsl(var(--text-muted))', padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
