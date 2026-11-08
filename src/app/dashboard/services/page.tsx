import React from 'react';
import { listServices } from '@/lib/services/services';
import ServicesListClient from './components/ServicesListClient';

export const revalidate = 0; // Dynamic route for live listings

export default async function ServicesPage() {
  const services = await listServices();

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>
          Service Catalog
        </h2>
        <p style={{ color: 'hsl(var(--text-secondary))' }}>
          Configure firm offerings, setup compliance questionnaires, and manage active bot/entry schemas.
        </p>
      </div>

      <ServicesListClient initialServices={services} />
    </div>
  );
}
