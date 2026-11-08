import { createClient } from '@/lib/supabase/server';

export interface QuestionSchema {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'dropdown' | 'textarea';
  options?: string[];
  required: boolean;
}

export interface ServiceData {
  name: string;
  description?: string;
  active: boolean;
  questions: QuestionSchema[];
}

async function getClient(customClient?: any) {
  if (customClient) return customClient;
  return await createClient();
}

export async function createService(data: ServiceData, customClient?: any) {
  const client = await getClient(customClient);

  const { data: service, error } = await client
    .from('services')
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error('Error creating service:', error);
    throw new Error(error.message);
  }

  return service;
}

export async function getServiceById(id: string, customClient?: any) {
  const client = await getClient(customClient);

  const { data: service, error } = await client
    .from('services')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching service ${id}:`, error);
    throw new Error(error.message);
  }

  return service;
}

export async function listServices(customClient?: any) {
  const client = await getClient(customClient);

  const { data: services, error } = await client
    .from('services')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error listing services:', error);
    throw new Error(error.message);
  }

  return services;
}

export async function updateService(id: string, data: Partial<ServiceData>, customClient?: any) {
  const client = await getClient(customClient);

  const { data: service, error } = await client
    .from('services')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating service ${id}:`, error);
    throw new Error(error.message);
  }

  return service;
}

export async function deleteService(id: string, customClient?: any) {
  const client = await getClient(customClient);

  const { error } = await client
    .from('services')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting service ${id}:`, error);
    throw new Error(error.message);
  }

  return true;
}
