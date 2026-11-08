import { createClient } from '@/lib/supabase/server';

export interface Attachment {
  key: string;
  filename: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface StatusHistoryEntry {
  status: 'pending' | 'processing' | 'completed';
  date: string;
  note?: string;
}

export interface SubmissionData {
  user_id: string;
  service_id: string;
  answers: Record<string, any>;
  status?: 'pending' | 'processing' | 'completed';
  remark?: string;
  govt_expense?: number;
  service_charge?: number;
  next_due_date?: string | null;
  status_history?: StatusHistoryEntry[];
  attachments?: Attachment[];
}

async function getClient(customClient?: any) {
  if (customClient) return customClient;
  return await createClient();
}

export async function createSubmission(data: SubmissionData, customClient?: any) {
  const client = await getClient(customClient);
  
  const status = data.status || 'pending';
  const initialHistory: StatusHistoryEntry[] = [
    {
      status,
      date: new Date().toISOString(),
      note: 'Submission created',
    },
  ];

  const submissionPayload = {
    ...data,
    status,
    status_history: data.status_history || initialHistory,
    attachments: data.attachments || [],
    govt_expense: data.govt_expense || 0,
    service_charge: data.service_charge || 0,
  };

  const { data: submission, error } = await client
    .from('submissions')
    .insert([submissionPayload])
    .select(`
      *,
      user:users(*),
      service:services(*)
    `)
    .single();

  if (error) {
    console.error('Error creating submission:', error);
    throw new Error(error.message);
  }

  return submission;
}

export async function getSubmissionById(id: string, customClient?: any) {
  const client = await getClient(customClient);

  const { data: submission, error } = await client
    .from('submissions')
    .select(`
      *,
      user:users(*),
      service:services(*),
      bills(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching submission ${id}:`, error);
    throw new Error(error.message);
  }

  return submission;
}

export async function listSubmissions(filters?: { status?: string; user_id?: string; service_id?: string }, customClient?: any) {
  const client = await getClient(customClient);

  let query = client
    .from('submissions')
    .select(`
      *,
      user:users(*),
      service:services(*)
    `)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.user_id) {
    query = query.eq('user_id', filters.user_id);
  }
  if (filters?.service_id) {
    query = query.eq('service_id', filters.service_id);
  }

  const { data: submissions, error } = await query;

  if (error) {
    console.error('Error listing submissions:', error);
    throw new Error(error.message);
  }

  return submissions;
}

/**
 * Updates status and automatically appends a new entry to the status history audit trail.
 */
export async function updateSubmissionStatus(
  id: string,
  status: 'pending' | 'processing' | 'completed',
  note?: string,
  customClient?: any
) {
  const client = await getClient(customClient);

  // Fetch current history first
  const { data: submission, error: fetchError } = await client
    .from('submissions')
    .select('status_history')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('Error fetching submission history for update:', fetchError);
    throw new Error(fetchError.message);
  }

  const currentHistory = (submission?.status_history as StatusHistoryEntry[]) || [];
  const updatedHistory: StatusHistoryEntry[] = [
    ...currentHistory,
    {
      status,
      date: new Date().toISOString(),
      note: note || `Status updated to ${status}`,
    },
  ];

  const { data: updatedSubmission, error: updateError } = await client
    .from('submissions')
    .update({
      status,
      status_history: updatedHistory,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(`
      *,
      user:users(*),
      service:services(*)
    `)
    .single();

  if (updateError) {
    console.error(`Error updating status for submission ${id}:`, updateError);
    throw new Error(updateError.message);
  }

  return updatedSubmission;
}

/**
 * Updates submission details (like remark, expenses, charges, next due date)
 */
export async function updateSubmission(id: string, data: Partial<SubmissionData>, customClient?: any) {
  const client = await getClient(customClient);

  const payload: any = { ...data };
  delete payload.status_history; // History updates should go through updateSubmissionStatus

  const { data: submission, error } = await client
    .from('submissions')
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(`
      *,
      user:users(*),
      service:services(*)
    `)
    .single();

  if (error) {
    console.error(`Error updating submission ${id}:`, error);
    throw new Error(error.message);
  }

  return submission;
}

/**
 * Appends a new attachment reference to a submission row
 */
export async function addAttachment(
  id: string,
  attachment: { key: string; filename: string; uploaded_by: string },
  customClient?: any
) {
  const client = await getClient(customClient);

  const { data: submission, error: fetchError } = await client
    .from('submissions')
    .select('attachments')
    .eq('id', id)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const currentAttachments = (submission?.attachments as Attachment[]) || [];
  const newAttachment: Attachment = {
    ...attachment,
    uploaded_at: new Date().toISOString(),
  };

  const updatedAttachments = [...currentAttachments, newAttachment];

  const { data: updatedSubmission, error: updateError } = await client
    .from('submissions')
    .update({
      attachments: updatedAttachments,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    throw new Error(updateError.message);
  }

  return updatedSubmission;
}

/**
 * Fetches processing submissions that are overdue or due today
 * next_due_date <= today AND status = 'processing'
 */
export async function getOverdueSubmissions(customClient?: any) {
  const client = await getClient(customClient);
  const todayStr = new Date().toISOString().split('T')[0];

  const { data: submissions, error } = await client
    .from('submissions')
    .select(`
      *,
      user:users(*),
      service:services(*)
    `)
    .eq('status', 'processing')
    .lte('next_due_date', todayStr)
    .order('next_due_date', { ascending: true });

  if (error) {
    console.error('Error fetching overdue submissions:', error);
    throw new Error(error.message);
  }

  return submissions;
}

/**
 * Fetches completed certificates that are expiring within the next 7 days
 * next_due_date <= today + 7 days AND status = 'completed'
 */
export async function getExpiringCertificates(customClient?: any) {
  const client = await getClient(customClient);
  
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  const { data: submissions, error } = await client
    .from('submissions')
    .select(`
      *,
      user:users(*),
      service:services(*)
    `)
    .eq('status', 'completed')
    .not('next_due_date', 'is', null)
    .lte('next_due_date', nextWeekStr)
    .order('next_due_date', { ascending: true });

  if (error) {
    console.error('Error fetching expiring certificates:', error);
    throw new Error(error.message);
  }

  // Filter out those that have been explicitly acknowledged
  const filtered = submissions.filter((sub: any) => !sub.answers?.expiry_acknowledged);

  return filtered;
}
