import { createClient } from '@/lib/supabase/server';

export interface CustomerData {
  company_name?: string;
  owner_name: string;
  sector?: string;
  phone?: string;
  email?: string;
  remark?: string;
  gender?: string;
  date_of_birth?: string;
  fathers_name?: string;
  aadhar_number?: string;
  pan_card_number?: string;
  name_of_bank?: string;
  ifsc_code?: string;
  account_number?: string;
  address?: string;
  investment_amount?: number;
}

/**
 * Get the Supabase client, either the provided one or a newly created server client.
 */
async function getClient(customClient?: any) {
  if (customClient) return customClient;
  return await createClient();
}

export async function createCustomer(data: CustomerData, customClient?: any) {
  const client = await getClient(customClient);
  
  const { data: customer, error } = await client
    .from('users')
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error('Error creating customer:', error);
    throw new Error(error.message);
  }

  return customer;
}

export async function getCustomerById(id: string, customClient?: any) {
  const client = await getClient(customClient);

  const { data: customer, error } = await client
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching customer ${id}:`, error);
    throw new Error(error.message);
  }

  return customer;
}

export async function listCustomers(customClient?: any) {
  const client = await getClient(customClient);

  const { data: customers, error } = await client
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error listing customers:', error);
    throw new Error(error.message);
  }

  return customers;
}

export async function updateCustomer(id: string, data: Partial<CustomerData>, customClient?: any) {
  const client = await getClient(customClient);

  const { data: customer, error } = await client
    .from('users')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating customer ${id}:`, error);
    throw new Error(error.message);
  }

  return customer;
}

export async function deleteCustomer(id: string, customClient?: any) {
  const client = await getClient(customClient);

  const { error } = await client
    .from('users')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting customer ${id}:`, error);
    throw new Error(error.message);
  }

  return true;
}
