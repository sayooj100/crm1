'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';

interface OverdueSubmission {
  id: string;
  next_due_date: string;
  user: {
    owner_name: string;
    company_name: string | null;
  };
  service: {
    name: string;
  };
}

export default function NotificationBell({ overdueList }: { overdueList: OverdueSubmission[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const count = overdueList.length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bell-container" ref={dropdownRef}>
      <button
        className="bell-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle notifications"
        type="button"
      >
        <Bell size={20} />
        {count > 0 && <span className="bell-badge">{count}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <span>Overdue Actions</span>
            {count > 0 && <span className="badge badge-pending">{count} active</span>}
          </div>
          <ul className="notification-list">
            {count === 0 ? (
              <li className="notification-empty">No urgent actions today!</li>
            ) : (
              overdueList.map((sub) => (
                <li key={sub.id} className="notification-item">
                  <Link
                    href={`/dashboard/submissions/${sub.id}`}
                    className="notification-link"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="notification-title">
                      {sub.service.name}
                    </div>
                    <div className="notification-meta">
                      <span>
                        {sub.user.owner_name}
                        {sub.user.company_name ? ` (${sub.user.company_name})` : ''}
                      </span>
                      <span className="notification-due">Due: {sub.next_due_date}</span>
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
