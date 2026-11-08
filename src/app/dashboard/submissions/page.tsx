import React from 'react';
import { listSubmissions } from '@/lib/services/submissions';
import { listCustomers } from '@/lib/services/users';
import { listServices } from '@/lib/services/services';
import SubmissionsListClient from './components/SubmissionsListClient';

export const revalidate = 0; // Dynamic route to pull live data updates

export default async function SubmissionsPage() {
  const [submissions, customers, services] = await Promise.all([
    listSubmissions(),
    listCustomers(),
    listServices(),
  ]);

  const regularSubmissions = submissions.filter((s: any) => s.answers?.is_external !== true);

  // We only show active services in the manual filing dropdown selector
  const activeServices = services.filter((s: any) => s.active);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>
          Customer Submissions
        </h2>
        <p style={{ color: 'hsl(var(--text-secondary))' }}>
          Track case filings, review bot-submitted forms, and check task status checklists.
        </p>
      </div>

      <SubmissionsListClient
        initialSubmissions={regularSubmissions}
        users={customers}
        services={activeServices}
      />
    </div>
  );
}
