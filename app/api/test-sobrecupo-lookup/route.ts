// Test endpoint para verificar el fix de sobrecupo lookup
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { sobrecupoId } = await req.json();
    
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      return NextResponse.json({
        success: false,
        error: 'Airtable config missing'
      });
    }
    
    console.log('🧪 Testing sobrecupo lookup with ID:', sobrecupoId);
    
    // Buscar sobrecupo
    const sobrecupoResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Sobrecupos/${sobrecupoId}`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );
    
    if (!sobrecupoResponse.ok) {
      return NextResponse.json({
        success: false,
        error: `Sobrecupo not found: ${sobrecupoResponse.status}`,
        sobrecupoId
      });
    }
    
    const sobrecupoData = await sobrecupoResponse.json();
    const realDoctorId = sobrecupoData.fields?.Médico?.[0];
    
    console.log('✅ Sobrecupo data:', sobrecupoData);
    console.log('✅ Extracted doctor ID:', realDoctorId);
    
    // Buscar doctor
    let doctorData: any = null;
    if (realDoctorId) {
      const doctorResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Doctors/${realDoctorId}`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );
      
      if (doctorResponse.ok) {
        doctorData = await doctorResponse.json();
      }
    }
    
    return NextResponse.json({
      success: true,
      sobrecupoId,
      sobrecupoData: sobrecupoData.fields,
      extractedDoctorId: realDoctorId,
      doctorData: doctorData?.fields || null,
      doctorEmail: doctorData?.fields?.Email || 'NOT FOUND',
      doctorWhatsApp: doctorData?.fields?.WhatsApp || 'NOT FOUND'
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}