import { createClient } from '@/lib/supabase/server';

async function getClient(customClient?: any) {
  if (customClient) return customClient;
  return await createClient();
}

/**
 * Get the profile details of the currently authenticated employee.
 */
export async function getCurrentEmployee(customClient?: any) {
  const client = await getClient(customClient);
  
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) {
    return null;
  }

  const { data: employee, error } = await client
    .from('employees')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Row not found. Let's auto-create the employee profile record!
      const fallbackName = user.user_metadata?.name || splitEmailName(user.email || '');
      const fallbackEmail = user.email || '';
      
      const { data: newEmployee, error: insertError } = await client
        .from('employees')
        .insert({
          id: user.id,
          name: fallbackName,
          email: fallbackEmail,
        })
        .select()
        .single();
        
      if (!insertError && newEmployee) {
        return newEmployee;
      }
      
      console.warn(`Could not auto-create employee profile for ${user.id}:`, insertError);
    } else {
      console.error(`Error fetching employee profile for ${user.id}:`, error);
    }
    
    // Fallback to basic object if fetching/insertion fails
    return {
      id: user.id,
      name: user.user_metadata?.name || splitEmailName(user.email || ''),
      email: user.email || '',
    };
  }

  return employee;
}

export async function getEmployeeById(id: string, customClient?: any) {
  const client = await getClient(customClient);

  const { data: employee, error } = await client
    .from('employees')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching employee ${id}:`, error);
    throw new Error(error.message);
  }

  return employee;
}

export async function listEmployees(customClient?: any) {
  const client = await getClient(customClient);

  const { data: employees, error } = await client
    .from('employees')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error listing employees:', error);
    throw new Error(error.message);
  }

  return employees;
}

function splitEmailName(email: string): string {
  return email.split('@')[0];
}
