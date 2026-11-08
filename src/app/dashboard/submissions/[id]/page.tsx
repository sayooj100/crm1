import React from 'react';
import Link from 'next/link';
import { getSubmissionById } from '@/lib/services/submissions';
import { getBillsBySubmissionId } from '@/lib/services/bills';
import SubmissionDetailsClient from '../components/SubmissionDetailsClient';
import { ArrowLeft } from 'lucide-react';

export const revalidate = 0; // Dynamic route to pull live updates

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SubmissionDetailPage({ params }: PageProps) {
  const { id } = await params;

  let submission;
  let bills = [];
  try {
    const [subData, billsData] = await Promise.all([
      getSubmissionById(id),
      getBillsBySubmissionId(id),
    ]);
    submission = subData;
    bills = billsData;
  } catch (error) {
    console.error(`Error loading details for submission ${id}:`, error);
    return (
      <div>
        <div style={{ marginBottom: '24px' }}>
          <Link
            href="/dashboard/submissions"
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowLeft size={16} /> Back to Submissions
          </Link>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <h2 style={{ color: 'hsl(var(--danger))', marginBottom: '12px', fontWeight: 700 }}>
            Submission Not Found
          </h2>
          <p style={{ color: 'hsl(var(--text-secondary))' }}>
            The case file you requested does not exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  // Sanitize data attributes to prevent client structure failures
  const sanitizedSubmission = {
    ...submission,
    answers: submission.answers && typeof submission.answers === 'object' ? submission.answers : {},
    attachments: Array.isArray(submission.attachments) ? submission.attachments : [],
    status_history: Array.isArray(submission.status_history) ? submission.status_history : [],
  };

  return <SubmissionDetailsClient submission={sanitizedSubmission} initialBills={bills} />;
}
