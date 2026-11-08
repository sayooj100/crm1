import { createClient } from '@/lib/supabase/server';

export interface LedgerEntryData {
  type: 'income' | 'expense';
  amount: number;
  date?: string;
  source: 'auto' | 'manual';
  linked_submission_id?: string | null;
  remark?: string;
}

async function getClient(customClient?: any) {
  if (customClient) return customClient;
  return await createClient();
}

export async function createLedgerEntry(data: LedgerEntryData, customClient?: any) {
  const client = await getClient(customClient);

  const payload = {
    ...data,
    date: data.date || new Date().toISOString().split('T')[0],
  };

  const { data: entry, error } = await client
    .from('ledger')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error creating ledger entry:', error);
    throw new Error(error.message);
  }

  return entry;
}

export async function listLedgerEntries(
  filters?: { type?: 'income' | 'expense'; source?: 'auto' | 'manual' },
  customClient?: any
) {
  const client = await getClient(customClient);

  let query = client
    .from('ledger')
    .select(`
      *,
      submission:submissions(
        id,
        user:users(company_name, owner_name),
        service:services(name)
      )
    `)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (filters?.type) {
    query = query.eq('type', filters.type);
  }
  if (filters?.source) {
    query = query.eq('source', filters.source);
  }

  const { data: entries, error } = await query;

  if (error) {
    console.error('Error listing ledger entries:', error);
    throw new Error(error.message);
  }

  return entries;
}

export async function getLedgerSummary(customClient?: any) {
  const client = await getClient(customClient);

  const { data: entries, error } = await client
    .from('ledger')
    .select('type, amount');

  if (error) {
    console.error('Error fetching ledger summary:', error);
    throw new Error(error.message);
  }

  let totalIncome = 0;
  let totalExpense = 0;

  entries?.forEach((entry: any) => {
    const amount = Number(entry.amount) || 0;
    if (entry.type === 'income') {
      totalIncome += amount;
    } else if (entry.type === 'expense') {
      totalExpense += amount;
    }
  });

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
  };
}

export async function deleteLedgerEntry(id: string, customClient?: any) {
  const client = await getClient(customClient);

  const { error } = await client
    .from('ledger')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting ledger entry ${id}:`, error);
    throw new Error(error.message);
  }

  return true;
}
