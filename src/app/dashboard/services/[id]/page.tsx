import React from 'react';
import Link from 'next/link';
import { getServiceById } from '@/lib/services/services';
import ServiceDetailsClient from '../components/ServiceDetailsClient';
import { ArrowLeft } from 'lucide-react';

export const revalidate = 0; // Dynamic route to pull live service data

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { id } = await params;

  let service;
  try {
    service = await getServiceById(id);
  } catch (error) {
    console.error(`Error loading service detail for ID ${id}:`, error);
    return (
      <div>
        <div style={{ marginBottom: '24px' }}>
          <Link
            href="/dashboard/services"
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowLeft size={16} /> Back to Services
          </Link>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <h2 style={{ color: 'hsl(var(--danger))', marginBottom: '12px', fontWeight: 700 }}>
            Service Profile Not Found
          </h2>
          <p style={{ color: 'hsl(var(--text-secondary))' }}>
            The catalog service you requested may have been removed or does not exist.
          </p>
        </div>
      </div>
    );
  }

  return <ServiceDetailsClient service={service} />;
}
