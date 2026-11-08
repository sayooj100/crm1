import React from 'react';
import { listLedgerEntries, getLedgerSummary } from '@/lib/services/ledger';
import { listBills } from '@/lib/services/bills';
import AccountsClient from './components/AccountsClient';

export const revalidate = 0; // Dynamic route to pull live financial data

export default async function AccountsPage() {
  const [ledgerEntries, summary, bills] = await Promise.all([
    listLedgerEntries(),
    getLedgerSummary(),
    listBills(),
  ]);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>
          Accounts & Bookkeeping
        </h2>
        <p style={{ color: 'hsl(var(--text-secondary))' }}>
          View income statement entries, file custom ledger transactions, and track client billing invoices.
        </p>
      </div>

      <AccountsClient
        initialLedger={ledgerEntries}
        initialSummary={summary}
        initialBills={bills}
      />
    </div>
  );
}
