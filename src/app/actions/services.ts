'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createService, updateService, deleteService } from '@/lib/services/services';

export async function handleCreateService(prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const active = formData.get('active') === 'true';
  const questionsJson = formData.get('questions') as string;

  if (!name) {
    return { error: 'Service name is required' };
  }

  let questions = [];
  try {
    if (questionsJson) {
      questions = JSON.parse(questionsJson);
    }
  } catch (error) {
    return { error: 'Invalid question schema structure' };
  }

  try {
    const supabase = await createClient();
    await createService({
      name,
      description: description || undefined,
      active,
      questions,
    }, supabase);

    revalidatePath('/dashboard/services');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to create service' };
  }
}

export async function handleUpdateService(prevState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const active = formData.get('active') === 'true';
  const questionsJson = formData.get('questions') as string;

  if (!id) {
    return { error: 'Service ID is required' };
  }
  if (!name) {
    return { error: 'Service name is required' };
  }

  let questions = [];
  try {
    if (questionsJson) {
      questions = JSON.parse(questionsJson);
    }
  } catch (error) {
    return { error: 'Invalid question schema structure' };
  }

  try {
    const supabase = await createClient();
    await updateService(id, {
      name,
      description: description || undefined,
      active,
      questions,
    }, supabase);

    revalidatePath(`/dashboard/services/${id}`);
    revalidatePath('/dashboard/services');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to update service' };
  }
}

export async function handleDeleteService(id: string) {
  if (!id) {
    throw new Error('Service ID is required');
  }

  try {
    const supabase = await createClient();
    await deleteService(id, supabase);
    revalidatePath('/dashboard/services');
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to delete service');
  }
}
