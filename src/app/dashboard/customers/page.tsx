import React from 'react';
import { listCustomers } from '@/lib/services/users';
import UsersListClient from './components/CustomersListClient';

export const revalidate = 0; // Dynamic route to pull live customer listings

export default async function UsersPage() {
  const customers = await listCustomers();

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>
          Customer Profiles
        </h2>
        <p style={{ color: 'hsl(var(--text-secondary))' }}>
          Manage client records, industry sectors, contacts, and track active cases.
        </p>
      </div>

      <UsersListClient initialCustomers={customers} />
    </div>
  );
}
