import { NextRequest, NextResponse } from 'next/server';
import { isBotAuthorized, getBotSupabaseClient } from '@/lib/api-auth';
import { listServices } from '@/lib/services/services';

export async function GET(request: NextRequest) {
  try {
    // 1. Verify Bot Authorization
    if (!isBotAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Instantiate RLS-bypassing client for the bot
    const client = getBotSupabaseClient();

    // 3. Fetch services (only active ones)
    const services = await listServices(client);
    const activeServices = services.filter((s: any) => s.active);

    return NextResponse.json({
      success: true,
      count: activeServices.length,
      services: activeServices,
    });
  } catch (error: any) {
    console.error('API Error in GET /api/services:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
