import { NextRequest, NextResponse } from 'next/server';
import { isBotAuthorized, getBotSupabaseClient } from '@/lib/api-auth';
import { createCustomer } from '@/lib/services/users';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Bot Authorization
    if (!isBotAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await request.json();
    const { owner_name, company_name, sector, phone, email, remark } = body;

    // Validation
    if (!owner_name) {
      return NextResponse.json({ error: 'owner_name is required' }, { status: 400 });
    }

    // 3. Instantiate RLS-bypassing client
    const client = getBotSupabaseClient();

    // 4. Create customer record
    const customer = await createCustomer(
      {
        owner_name,
        company_name,
        sector,
        phone,
        email,
        remark,
      },
      client
    );

    return NextResponse.json({
      success: true,
      message: 'Customer created successfully',
      customer,
    }, { status: 201 });
  } catch (error: any) {
    console.error('API Error in POST /api/users:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
