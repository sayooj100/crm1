'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  updateSubmissionStatus,
  updateSubmission,
  addAttachment,
  createSubmission,
} from '@/lib/services/submissions';
import { createLedgerEntry } from '@/lib/services/ledger';

export async function handleCreateSubmissionManual(prevState: any, formData: FormData) {
  const user_id = formData.get('user_id') as string;
  const multiSubmissionsJson = formData.get('multi_submissions') as string;
  
  if (!user_id) {
    return { error: 'Please select a customer' };
  }

  let blocks: any[] = [];
  try {
    if (multiSubmissionsJson) {
      blocks = JSON.parse(multiSubmissionsJson);
    } else {
      // Fallback for single submission backward compatibility
      const service_id = formData.get('service_id') as string;
      const answersJson = formData.get('answers') as string;
      if (service_id) {
        blocks = [{ serviceId: service_id, answers: answersJson ? JSON.parse(answersJson) : {} }];
      }
    }
  } catch (error) {
    return { error: 'Invalid submission data format' };
  }

  const validBlocks = blocks.filter(b => b.serviceId);
  if (validBlocks.length === 0) {
    return { error: 'Please select at least one service' };
  }

  try {
    const supabase = await createClient();
    
    // Create each submission independently
    for (const block of validBlocks) {
      await createSubmission({
        user_id,
        service_id: block.serviceId,
        answers: block.answers || {},
        status: 'pending',
      }, supabase);
    }

    revalidatePath('/dashboard/submissions');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to file new case submissions' };
  }
}

export async function handleMoveToProcessing(prevState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const next_due_date = formData.get('next_due_date') as string;
  const remark = formData.get('remark') as string;
  const govt_expense_str = formData.get('govt_expense') as string;
  const service_charge_str = formData.get('service_charge') as string;
  const extra_fee_str = formData.get('extra_fee') as string;
  const bill_remarks = formData.get('bill_remarks') as string;

  if (!id) {
    return { error: 'Submission ID is required' };
  }
  if (!next_due_date) {
    return { error: 'Filing next due date is required' };
  }

  const govt_expense = govt_expense_str ? parseFloat(govt_expense_str) : 0;
  const service_charge = service_charge_str ? parseFloat(service_charge_str) : 0;
  const extra_fee = extra_fee_str ? parseFloat(extra_fee_str) : 0;

  try {
    const supabase = await createClient();

    // 1. Move status to processing with audit log entry
    const note = remark || 'Case moved to active filing process';
    await updateSubmissionStatus(id, 'processing', note, supabase);

    // 2. Save filing details
    await updateSubmission(id, {
      next_due_date,
      remark: remark || undefined,
      govt_expense,
      service_charge,
    }, supabase);

    // 3. Create Auto Ledger expense entries (for the out of pocket government payment)
    if (govt_expense > 0) {
      await createLedgerEntry({
        type: 'expense',
        amount: govt_expense,
        source: 'auto',
        linked_submission_id: id,
        remark: `Govt. Filing Fee: ${remark || 'Filing Expense'}`,
      }, supabase);
    }

    // 4. Create client invoice (Bill) and auto ledger income entry for total invoice amount
    const { createBill } = await import('@/lib/services/bills');
    await createBill({
      submission_id: id,
      govt_fee: govt_expense,
      service_charge,
      extra_fee,
      remarks: bill_remarks || 'Filing Fees & Service invoice',
    }, supabase);

    revalidatePath(`/dashboard/submissions/${id}`);
    revalidatePath('/dashboard/submissions');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to move case to processing' };
  }
}

export async function handleExtendDueDate(prevState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const next_due_date = formData.get('next_due_date') as string;
  const remark = formData.get('remark') as string;

  if (!id) {
    return { error: 'Submission ID is required' };
  }
  if (!next_due_date) {
    return { error: 'New target deadline is required' };
  }

  try {
    const supabase = await createClient();

    // Fetch current status history
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('status_history')
      .eq('id', id)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    const currentHistory = (submission?.status_history as any[]) || [];
    const formattedDate = new Date(next_due_date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const updatedHistory = [
      ...currentHistory,
      {
        status: 'processing',
        date: new Date().toISOString(),
        note: `Extended due date to ${formattedDate}. Reason: ${remark || 'Not specified'}`,
      },
    ];

    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        next_due_date,
        status_history: updatedHistory,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) throw new Error(updateError.message);

    revalidatePath(`/dashboard/submissions/${id}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to extend due date' };
  }
}

export async function handleMarkCompleted(prevState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const expiry_date = formData.get('expiry_date') as string;
  const remark = formData.get('remark') as string;

  if (!id) {
    return { error: 'Submission ID is required' };
  }

  try {
    const supabase = await createClient();
    const note = remark || 'Filing marked as completed and closed';
    await updateSubmissionStatus(id, 'completed', note, supabase);

    if (expiry_date) {
      await updateSubmission(id, {
        next_due_date: expiry_date
      }, supabase);
    } else {
      await updateSubmission(id, {
        next_due_date: null
      }, supabase);
    }

    revalidatePath(`/dashboard/submissions/${id}`);
    revalidatePath('/dashboard/submissions');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to mark case completed' };
  }
}

export async function handleUpdateSubmissionStatus(prevState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const status = formData.get('status') as 'pending' | 'processing' | 'completed';
  const note = formData.get('note') as string;

  if (!id) {
    return { error: 'Submission ID is required' };
  }
  if (!status) {
    return { error: 'Status is required' };
  }

  try {
    const supabase = await createClient();
    await updateSubmissionStatus(id, status, note || undefined, supabase);

    revalidatePath(`/dashboard/submissions/${id}`);
    revalidatePath('/dashboard/submissions');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to update submission status' };
  }
}

export async function handleUpdateSubmissionDetails(prevState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const remark = formData.get('remark') as string;
  const next_due_date = formData.get('next_due_date') as string;
  const govt_expense_str = formData.get('govt_expense') as string;
  const service_charge_str = formData.get('service_charge') as string;

  if (!id) {
    return { error: 'Submission ID is required' };
  }

  const govt_expense = govt_expense_str ? parseFloat(govt_expense_str) : undefined;
  const service_charge = service_charge_str ? parseFloat(service_charge_str) : undefined;

  try {
    const supabase = await createClient();
    await updateSubmission(id, {
      remark: remark || undefined,
      next_due_date: next_due_date || null,
      govt_expense,
      service_charge,
    }, supabase);

    revalidatePath(`/dashboard/submissions/${id}`);
    revalidatePath('/dashboard/submissions');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to update submission details' };
  }
}

export async function handleUploadAttachmentAction(
  submissionId: string,
  key: string,
  filename: string
) {
  if (!submissionId || !key || !filename) {
    throw new Error('All attachment parameters are required');
  }

  try {
    const supabase = await createClient();
    
    // Retrieve the user email session for audit logging
    const { data: { user } } = await supabase.auth.getUser();
    const uploaded_by = user?.email || 'system';

    await addAttachment(submissionId, {
      key,
      filename,
      uploaded_by,
    }, supabase);

    revalidatePath(`/dashboard/submissions/${submissionId}`);
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to record file attachment');
  }
}

export async function handleUpdateSubmissionFinancials(prevState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const govt_expense_str = formData.get('govt_expense') as string;
  const service_charge_str = formData.get('service_charge') as string;
  const extra_fee_str = formData.get('extra_fee') as string;
  const remarks = formData.get('remarks') as string;

  if (!id) {
    return { error: 'Submission ID is required' };
  }

  const govt_expense = govt_expense_str ? parseFloat(govt_expense_str) : 0;
  const service_charge = service_charge_str ? parseFloat(service_charge_str) : 0;
  const extra_fee = extra_fee_str ? parseFloat(extra_fee_str) : 0;

  try {
    const supabase = await createClient();

    // 1. Update submissions table
    await updateSubmission(id, {
      govt_expense,
      service_charge,
    }, supabase);

    // 2. Fetch or update associated Bill
    const { data: existingBill, error: billFetchError } = await supabase
      .from('bills')
      .select('*')
      .eq('submission_id', id)
      .maybeSingle();

    if (billFetchError) throw new Error(billFetchError.message);

    const total = govt_expense + service_charge + extra_fee;

    if (existingBill) {
      const { error: billUpdateError } = await supabase
        .from('bills')
        .update({
          govt_fee: govt_expense,
          service_charge,
          extra_fee,
          remarks: remarks || 'Filing Fees & Service invoice',
          total,
        })
        .eq('id', existingBill.id);

      if (billUpdateError) throw new Error(billUpdateError.message);
    } else {
      const { createBill } = await import('@/lib/services/bills');
      await createBill({
        submission_id: id,
        govt_fee: govt_expense,
        service_charge,
        extra_fee,
        remarks: remarks || 'Filing Fees & Service invoice',
      }, supabase);
    }

    // 3. Sync Expense Ledger Entry
    const { data: expenseLedger, error: expError } = await supabase
      .from('ledger')
      .select('*')
      .eq('linked_submission_id', id)
      .eq('type', 'expense')
      .eq('source', 'auto')
      .maybeSingle();

    if (expError) throw new Error(expError.message);

    if (govt_expense > 0) {
      if (expenseLedger) {
        await supabase
          .from('ledger')
          .update({ amount: govt_expense })
          .eq('id', expenseLedger.id);
      } else {
        const { createLedgerEntry } = await import('@/lib/services/ledger');
        await createLedgerEntry({
          type: 'expense',
          amount: govt_expense,
          source: 'auto',
          linked_submission_id: id,
          remark: `Govt. Filing Fee Expense`,
        }, supabase);
      }
    } else if (expenseLedger) {
      await supabase
        .from('ledger')
        .delete()
        .eq('id', expenseLedger.id);
    }

    // 4. Sync Income Ledger Entry
    const { data: incomeLedger, error: incError } = await supabase
      .from('ledger')
      .select('*')
      .eq('linked_submission_id', id)
      .eq('type', 'income')
      .eq('source', 'auto')
      .maybeSingle();

    if (incError) throw new Error(incError.message);

    const { data: sub } = await supabase
      .from('submissions')
      .select('*, service:services(*), user:users(*)')
      .eq('id', id)
      .single();

    const serviceName = sub?.service?.name || 'Service';
    const customerName = sub?.user?.owner_name || 'Customer';
    const companyName = sub?.user?.company_name ? ` (${sub.user.company_name})` : '';
    const incomeRemark = `Auto-generated bill for ${serviceName} - Customer: ${customerName}${companyName}`;

    if (incomeLedger) {
      await supabase
        .from('ledger')
        .update({ amount: total, remark: incomeRemark })
        .eq('id', incomeLedger.id);
    } else {
      const { createLedgerEntry } = await import('@/lib/services/ledger');
      await createLedgerEntry({
        type: 'income',
        amount: total,
        source: 'auto',
        linked_submission_id: id,
        remark: incomeRemark,
      }, supabase);
    }

    revalidatePath(`/dashboard/submissions/${id}`);
    revalidatePath('/dashboard/submissions');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to update financials' };
  }
}

export async function handleUpdateSubmissionAnswers(prevState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const answersJson = formData.get('answers') as string;

  if (!id) {
    return { error: 'Submission ID is required' };
  }
  if (!answersJson) {
    return { error: 'Answers data is required' };
  }

  try {
    const answers = JSON.parse(answersJson);
    const supabase = await createClient();

    const { error } = await supabase
      .from('submissions')
      .update({
        answers,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw new Error(error.message);

    revalidatePath(`/dashboard/submissions/${id}`);
    revalidatePath('/dashboard/submissions');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to update application form answers' };
  }
}


export async function handleUpdateExpiryDate(prevState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const expiry_date = formData.get('expiry_date') as string;

  if (!id) {
    return { error: 'Submission ID is required' };
  }

  try {
    const supabase = await createClient();
    
    // Fetch current answers to remove expiry_acknowledged flag
    const { data: sub } = await supabase.from('submissions').select('answers').eq('id', id).single();
    let updatedAnswers = sub?.answers || {};
    if (updatedAnswers.expiry_acknowledged) {
      delete updatedAnswers.expiry_acknowledged;
    }

    await supabase.from('submissions').update({
      next_due_date: expiry_date || null,
      answers: updatedAnswers
    }).eq('id', id);

    revalidatePath(`/dashboard/submissions/${id}`);
    revalidatePath('/dashboard/submissions');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to update expiry date' };
  }
}

export async function handleAcknowledgeExpiry(id: string) {
  try {
    const supabase = await createClient();
    const { data: sub } = await supabase.from('submissions').select('answers').eq('id', id).single();
    let updatedAnswers = sub?.answers || {};
    updatedAnswers.expiry_acknowledged = true;

    await supabase.from('submissions').update({
      answers: updatedAnswers
    }).eq('id', id);

    revalidatePath('/dashboard/submissions');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to acknowledge expiry', error);
    throw new Error('Failed to acknowledge expiry');
  }
}

export async function handleAddExternalCertificate(prevState: any, formData: FormData) {
  const user_id = formData.get('user_id') as string;
  const certificate_name = formData.get('certificate_name') as string;
  const expiry_date = formData.get('expiry_date') as string;

  if (!user_id || !certificate_name) {
    return { error: 'Customer and Certificate Name are required' };
  }

  try {
    const supabase = await createClient();

    // Find or create 'External Certificate' service
    let serviceId: string;
    const { data: extService } = await supabase.from('services').select('id').eq('name', 'External Certificate').single();
    
    if (extService) {
      serviceId = extService.id;
    } else {
      const { data: newService, error: sErr } = await supabase.from('services').insert({
        name: 'External Certificate',
        description: 'Auto-generated service for tracking external customer certificates.',
        active: false,
        questions: []
      }).select('id').single();
      if (sErr) throw new Error(sErr.message);
      serviceId = newService.id;
    }

    // Insert completed submission with is_external flag
    const { error } = await supabase.from('submissions').insert({
      user_id,
      service_id: serviceId,
      status: 'completed',
      next_due_date: expiry_date || null,
      answers: {
        is_external: true,
        custom_name: certificate_name
      }
    });

    if (error) throw new Error(error.message);

    revalidatePath(`/dashboard/customers/${user_id}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to add external certificate' };
  }
}

export async function handleDeleteExternalCertificate(prevState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const user_id = formData.get('user_id') as string;

  if (!id) return { error: 'Missing tracker ID' };

  try {
    const supabase = await createClient();
    const { error } = await supabase.from('submissions').delete().eq('id', id);
    
    if (error) throw new Error(error.message);

    if (user_id) {
      revalidatePath(`/dashboard/customers/${user_id}`);
    }
    revalidatePath('/dashboard/customers');
    
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to delete tracker' };
  }
}
