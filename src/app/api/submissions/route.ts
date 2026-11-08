import { NextRequest, NextResponse } from 'next/server';
import { isBotAuthorized, getBotSupabaseClient } from '@/lib/api-auth';
import { createSubmission } from '@/lib/services/submissions';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Bot Authorization
    if (!isBotAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await request.json();
    const { user_id, service_id, answers, remark, govt_expense, service_charge, next_due_date } = body;

    // Validation
    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }
    if (!service_id) {
      return NextResponse.json({ error: 'service_id is required' }, { status: 400 });
    }
    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'answers must be a valid JSON object' }, { status: 400 });
    }

    // 3. Instantiate RLS-bypassing client
    const client = getBotSupabaseClient();

    // 4. Log the submission
    const submission = await createSubmission(
      {
        user_id,
        service_id,
        answers,
        remark,
        govt_expense: govt_expense ? Number(govt_expense) : 0,
        service_charge: service_charge ? Number(service_charge) : 0,
        next_due_date: next_due_date || null,
        status: 'pending', // Bot submissions start as pending
      },
      client
    );

    return NextResponse.json({
      success: true,
      message: 'Submission created successfully',
      submission,
    }, { status: 201 });
  } catch (error: any) {
    console.error('API Error in POST /api/submissions:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
