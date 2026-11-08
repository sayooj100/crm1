import { createClient } from '@/lib/supabase/server';
import { createLedgerEntry } from './ledger';

export interface BillData {
  submission_id: string;
  govt_fee: number;
  service_charge: number;
  extra_fee: number;
  remarks?: string;
}

async function getClient(customClient?: any) {
  if (customClient) return customClient;
  return await createClient();
}

export async function createBill(data: BillData, customClient?: any) {
  const client = await getClient(customClient);

  // Calculate total
  const total = Number(data.govt_fee) + Number(data.service_charge) + Number(data.extra_fee);

  // Insert the bill
  const { data: bill, error: billError } = await client
    .from('bills')
    .insert([
      {
        submission_id: data.submission_id,
        govt_fee: data.govt_fee,
        service_charge: data.service_charge,
        extra_fee: data.extra_fee,
        remarks: data.remarks,
        total,
      },
    ])
    .select(`
      *,
      submission:submissions(
        *,
        user:users(*),
        service:services(*)
      )
    `)
    .single();

  if (billError) {
    console.error('Error creating bill:', billError);
    throw new Error(billError.message);
  }

  // Create an automatic ledger entry for this income
  try {
    const serviceName = bill.submission?.service?.name || 'Service';
    const customerName = bill.submission?.user?.owner_name || 'Customer';
    const companyName = bill.submission?.user?.company_name ? ` (${bill.submission.user.company_name})` : '';

    await createLedgerEntry({
      type: 'income',
      amount: total,
      date: new Date().toISOString().split('T')[0],
      source: 'auto',
      linked_submission_id: data.submission_id,
      remark: `Auto-generated bill for ${serviceName} - Customer: ${customerName}${companyName}`,
    }, client);
  } catch (ledgerError) {
    console.error('Failed to create auto ledger entry for bill:', ledgerError);
    // We don't fail the entire request, but log it
  }

  return bill;
}

export async function getBillById(id: string, customClient?: any) {
  const client = await getClient(customClient);

  const { data: bill, error } = await client
    .from('bills')
    .select(`
      *,
      submission:submissions(
        *,
        user:users(*),
        service:services(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching bill ${id}:`, error);
    throw new Error(error.message);
  }

  return bill;
}

export async function getBillsBySubmissionId(submissionId: string, customClient?: any) {
  const client = await getClient(customClient);

  const { data: bills, error } = await client
    .from('bills')
    .select('*')
    .eq('submission_id', submissionId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`Error fetching bills for submission ${submissionId}:`, error);
    throw new Error(error.message);
  }

  return bills;
}

export async function listBills(customClient?: any) {
  const client = await getClient(customClient);

  const { data: bills, error } = await client
    .from('bills')
    .select(`
      *,
      submission:submissions(
        *,
        user:users(*),
        service:services(*)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error listing bills:', error);
    throw new Error(error.message);
  }

  return bills;
}
