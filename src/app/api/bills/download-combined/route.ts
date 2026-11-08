import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest
) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get('ids');
  
  if (!idsParam) {
    return new Response('No bill IDs provided', { status: 400 });
  }
  
  const ids = idsParam.split(',');

  try {
    const supabase = await createClient();
    
    // Enforce dashboard session authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response('Unauthorized access. Please login first.', { status: 401 });
    }

    // Fetch all requested bills
    const { data: bills, error } = await supabase
      .from('bills')
      .select(`
        *,
        submission:submissions(
          *,
          user:users(*),
          service:services(*)
        )
      `)
      .in('id', ids);

    if (error || !bills || bills.length === 0) {
      return new Response('Requested bill records not found.', { status: 404 });
    }

    const templatePath = path.join(process.cwd(), 'public', 'invoice_template.docx');
    if (!fs.existsSync(templatePath)) {
      return new Response(
        'Word template file not found at public/invoice_template.docx. Please upload your template file to start downloads.',
        { status: 404 }
      );
    }

    // Process Word file in memory
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Consolidate totals and names
    let totalGovt = 0;
    let totalService = 0;
    let totalExtra = 0;
    let finalTotal = 0;
    let serviceNames: string[] = [];
    
    bills.forEach(bill => {
      totalGovt += Number(bill.govt_fee);
      totalService += Number(bill.service_charge);
      totalExtra += Number(bill.extra_fee);
      finalTotal += Number(bill.total);
      if (bill.submission?.service?.name) {
        serviceNames.push(bill.submission.service.name);
      }
    });
    
    const uniqueServiceNames = Array.from(new Set(serviceNames)).join(', ');
    
    // Take the user from the first bill
    const firstBill = bills[0];

    const formattedData = {
      govt_fee: totalGovt.toFixed(2),
      service_charge: totalService.toFixed(2),
      extra_fee: totalExtra.toFixed(2),
      remarks: 'Consolidated Bill for multiple services.',
      total: finalTotal.toFixed(2),
      user_name: firstBill.submission?.user?.company_name
        ? `${firstBill.submission.user.owner_name} (${firstBill.submission.user.company_name})`
        : firstBill.submission?.user?.owner_name || 'Customer',
      service_name: uniqueServiceNames || 'Filing Services',
      date: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    };

    // Render template placeholders
    doc.render(formattedData);

    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    return new Response(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename=Consolidated_Bill.docx`,
      },
    });
  } catch (error: any) {
    console.error('Error generating consolidated document:', error);
    return new Response(error.message || 'Error occurred during generation', { status: 500 });
  }
}
