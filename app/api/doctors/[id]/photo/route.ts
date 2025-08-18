import { NextRequest, NextResponse } from 'next/server';
import { getSignedImageUrl } from '@/lib/aws-s3';
import { Doctor } from '@/types/doctor';

// Types for photo API
interface PhotoResponse {
  signedUrl: string | null;
}

interface PhotoErrorResponse {
  error: string;
  details?: string;
}

interface DoctorPhotoParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest, 
  { params }: any
): Promise<NextResponse<PhotoResponse | PhotoErrorResponse>> {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'Doctor ID requerido' }, { status: 400 });
    }

    // Obtener datos del doctor
    const doctorRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/doctors/${id}`);
    
    if (!doctorRes.ok) {
      return NextResponse.json({ error: 'Doctor no encontrado' }, { status: 404 });
    }

    const doctorData: Doctor = await doctorRes.json();
    const photoURL = doctorData.fields?.PhotoURL;

    if (!photoURL) {
      return NextResponse.json({ signedUrl: null });
    }

    // Si ya es una URL firmada (contiene X-Amz-Algorithm), devolverla tal como está
    if (photoURL.includes('X-Amz-Algorithm')) {
      return NextResponse.json({ signedUrl: photoURL });
    }

    // Si es URL de S3 no firmada, generar URL firmada
    if (photoURL.includes('s3.') && photoURL.includes('amazonaws.com')) {
      const signedUrl = await getSignedImageUrl(photoURL);
      return NextResponse.json({ signedUrl });
    }

    // Para URLs externas, devolver tal como están
    return NextResponse.json({ signedUrl: photoURL });

  } catch (error) {
    console.error('Error generando URL firmada:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ 
      error: 'Error generando URL de imagen',
      details: errorMessage 
    }, { status: 500 });
  }
}