'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createBill } from '@/lib/services/bills';

export async function handleCreateBill(prevState: any, formData: FormData) {
  const submission_id = formData.get('submission_id') as string;
  const govt_fee_str = formData.get('govt_fee') as string;
  const service_charge_str = formData.get('service_charge') as string;
  const extra_fee_str = formData.get('extra_fee') as string;
  const remarks = formData.get('remarks') as string;

  if (!submission_id) {
    return { error: 'Submission ID is required' };
  }

  const govt_fee = govt_fee_str ? parseFloat(govt_fee_str) : 0;
  const service_charge = service_charge_str ? parseFloat(service_charge_str) : 0;
  const extra_fee = extra_fee_str ? parseFloat(extra_fee_str) : 0;

  try {
    const supabase = await createClient();
    await createBill({
      submission_id,
      govt_fee,
      service_charge,
      extra_fee,
      remarks: remarks || undefined,
    }, supabase);

    revalidatePath(`/dashboard/submissions/${submission_id}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to generate bill record' };
  }
}

export async function handleCreateConsolidatedBills(items: {
  submission_id: string;
  govt_fee: number;
  service_charge: number;
  extra_fee: number;
  remarks: string;
}[]) {
  try {
    const supabase = await createClient();
    const billIds = [];
    for (const item of items) {
      const bill = await createBill({
        submission_id: item.submission_id,
        govt_fee: item.govt_fee,
        service_charge: item.service_charge,
        extra_fee: item.extra_fee,
        remarks: item.remarks || undefined,
      }, supabase);
      billIds.push(bill.id);
    }
    revalidatePath('/dashboard/submissions');
    return { success: true, billIds };
  } catch (error: any) {
    return { error: error.message || 'Failed to generate consolidated bills' };
  }
}
