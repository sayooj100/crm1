'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createLedgerEntry } from '@/lib/services/ledger';

export async function handleCreateLedgerEntryManual(prevState: any, formData: FormData) {
  const type = formData.get('type') as 'income' | 'expense';
  const amount_str = formData.get('amount') as string;
  const date = formData.get('date') as string;
  const remark = formData.get('remark') as string;

  if (!type) {
    return { error: 'Transaction type is required' };
  }
  if (!amount_str) {
    return { error: 'Amount is required' };
  }

  const amount = parseFloat(amount_str);
  if (isNaN(amount) || amount <= 0) {
    return { error: 'Amount must be a positive number greater than zero' };
  }

  try {
    const supabase = await createClient();
    await createLedgerEntry({
      type,
      amount,
      date: date || undefined,
      source: 'manual',
      remark: remark || undefined,
    }, supabase);

    revalidatePath('/dashboard/accounts');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to record manual transaction' };
  }
}
