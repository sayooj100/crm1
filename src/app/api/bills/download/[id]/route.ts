import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBillById } from '@/lib/services/bills';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = await createClient();
    
    // Enforce dashboard session authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response('Unauthorized access. Please login first.', { status: 401 });
    }

    // Retrieve bill records with customer and service joins
    const bill = await getBillById(id, supabase);
    if (!bill) {
      return new Response('Requested bill record not found.', { status: 404 });
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

    const formattedData = {
      govt_fee: Number(bill.govt_fee).toFixed(2),
      service_charge: Number(bill.service_charge).toFixed(2),
      extra_fee: Number(bill.extra_fee).toFixed(2),
      remarks: bill.remarks || 'None',
      total: Number(bill.total).toFixed(2),
      user_name: bill.submission?.user?.company_name
        ? `${bill.submission.user.owner_name} (${bill.submission.user.company_name})`
        : bill.submission?.user?.owner_name || 'Customer',
      service_name: bill.submission?.service?.name || 'Filing Service',
      date: new Date(bill.created_at).toLocaleDateString('en-IN', {
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
        'Content-Disposition': `attachment; filename=Bill_${bill.id}.docx`,
      },
    });
  } catch (error: any) {
    console.error('Error generating document:', error);
    return new Response(error.message || 'Error occurred during generation', { status: 500 });
  }
}
