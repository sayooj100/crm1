'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createCustomer, updateCustomer } from '@/lib/services/users';

export async function handleCreateCustomer(prevState: any, formData: FormData) {
  const owner_name = formData.get('owner_name') as string;
  const company_name = formData.get('company_name') as string;
  const sector = formData.get('sector') as string;
  const phone = formData.get('phone') as string;
  const email = formData.get('email') as string;
  const remark = formData.get('remark') as string;
  const gender = formData.get('gender') as string;
  const date_of_birth = formData.get('date_of_birth') as string;
  const fathers_name = formData.get('fathers_name') as string;
  const aadhar_number = formData.get('aadhar_number') as string;
  const pan_card_number = formData.get('pan_card_number') as string;
  const name_of_bank = formData.get('name_of_bank') as string;
  const ifsc_code = formData.get('ifsc_code') as string;
  const account_number = formData.get('account_number') as string;
  const address = formData.get('address') as string;
  const investment_amount_raw = formData.get('investment_amount') as string;
  const investment_amount = investment_amount_raw ? Number(investment_amount_raw) : undefined;

  if (!owner_name) {
    return { error: 'Owner Name is required' };
  }

  try {
    const supabase = await createClient();
    await createCustomer({
      owner_name,
      company_name: company_name || undefined,
      sector: sector || undefined,
      phone: phone || undefined,
      email: email || undefined,
      remark: remark || undefined,
      gender: gender || undefined,
      date_of_birth: date_of_birth || undefined,
      fathers_name: fathers_name || undefined,
      aadhar_number: aadhar_number || undefined,
      pan_card_number: pan_card_number || undefined,
      name_of_bank: name_of_bank || undefined,
      ifsc_code: ifsc_code || undefined,
      account_number: account_number || undefined,
      address: address || undefined,
      investment_amount: investment_amount !== undefined && !isNaN(investment_amount) ? investment_amount : undefined,
    }, supabase);

    revalidatePath('/dashboard/customers');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to create customer' };
  }
}

export async function handleUpdateCustomer(prevState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const owner_name = formData.get('owner_name') as string;
  const company_name = formData.get('company_name') as string;
  const sector = formData.get('sector') as string;
  const phone = formData.get('phone') as string;
  const email = formData.get('email') as string;
  const remark = formData.get('remark') as string;
  const gender = formData.get('gender') as string;
  const date_of_birth = formData.get('date_of_birth') as string;
  const fathers_name = formData.get('fathers_name') as string;
  const aadhar_number = formData.get('aadhar_number') as string;
  const pan_card_number = formData.get('pan_card_number') as string;
  const name_of_bank = formData.get('name_of_bank') as string;
  const ifsc_code = formData.get('ifsc_code') as string;
  const account_number = formData.get('account_number') as string;
  const address = formData.get('address') as string;
  const investment_amount_raw = formData.get('investment_amount') as string;
  const investment_amount = investment_amount_raw ? Number(investment_amount_raw) : undefined;

  if (!id) {
    return { error: 'Customer ID is required' };
  }
  if (!owner_name) {
    return { error: 'Owner Name is required' };
  }

  try {
    const supabase = await createClient();
    await updateCustomer(id, {
      owner_name,
      company_name: company_name || undefined,
      sector: sector || undefined,
      phone: phone || undefined,
      email: email || undefined,
      remark: remark || undefined,
      gender: gender || undefined,
      date_of_birth: date_of_birth || undefined,
      fathers_name: fathers_name || undefined,
      aadhar_number: aadhar_number || undefined,
      pan_card_number: pan_card_number || undefined,
      name_of_bank: name_of_bank || undefined,
      ifsc_code: ifsc_code || undefined,
      account_number: account_number || undefined,
      address: address || undefined,
      investment_amount: investment_amount !== undefined && !isNaN(investment_amount) ? investment_amount : undefined,
    }, supabase);

    revalidatePath(`/dashboard/customers/${id}`);
    revalidatePath('/dashboard/customers');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to update customer' };
  }
}

export async function handleDeleteCustomer(id: string) {
  if (!id) {
    return { error: 'Customer ID is required' };
  }

  try {
    const supabase = await createClient();
    const { deleteCustomer } = await import('@/lib/services/users');
    await deleteCustomer(id, supabase);

    revalidatePath('/dashboard/customers');
  } catch (error: any) {
    return { error: error.message || 'Failed to delete customer' };
  }

  const { redirect } = await import('next/navigation');
  redirect('/dashboard/customers');
}
