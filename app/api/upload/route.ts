// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { uploadImageToS3, deleteImageFromS3, validateS3Config, S3UploadResult } from "@/lib/aws-s3";

// Types for upload API
interface UploadResponse {
  success: boolean;
  url: string;
  message: string;
  airtableUpdated: boolean;
  metadata: {
    bucket: string;
    key: string;
    size: number;
    type: string;
    etag?: string;
  };
}

interface UploadErrorResponse {
  error: string;
  details?: string;
}

interface ConfigResponse {
  status: string;
  bucket?: string;
  region?: string;
  timestamp: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse | UploadErrorResponse>> {
  try {
    // Validar configuración AWS
    validateS3Config();

    const formData = await request.formData();
    const file = formData.get('photo') as File | null;
    const doctorId = formData.get('doctorId') as string | null;
    const oldImageUrl = formData.get('oldImageUrl') as string | null;
    
    if (!file) {
      return NextResponse.json({ error: "No se encontró archivo" }, { status: 400 });
    }

    if (!doctorId) {
      return NextResponse.json({ error: "ID de médico requerido" }, { status: 400 });
    }

    // Validaciones robustas
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json({ 
        error: "Tipo de archivo no permitido. Solo JPG, PNG y WebP" 
      }, { status: 400 });
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `Archivo muy grande. Tamaño: ${(file.size / 1024 / 1024).toFixed(2)}MB. Máximo: 5MB` 
      }, { status: 400 });
    }

    console.log(`📤 Procesando upload para médico ${doctorId}:`);
    console.log(`   📁 Archivo: ${file.name}`);
    console.log(`   📊 Tamaño: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   🎨 Tipo: ${file.type}`);

    // Convertir archivo a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Subir a AWS S3
    const uploadResult: S3UploadResult = await uploadImageToS3(buffer, file.name, file.type);
    
    if (!uploadResult.success) {
      throw new Error('Error en la subida a S3');
    }

    // Eliminar imagen anterior si existe y es de S3
    if (oldImageUrl && oldImageUrl.includes('.s3.') && oldImageUrl.includes('amazonaws.com')) {
      console.log('🗑️ Eliminando imagen anterior...');
      const deleted = await deleteImageFromS3(oldImageUrl);
      if (deleted) {
        console.log('✅ Imagen anterior eliminada');
      } else {
        console.log('⚠️ No se pudo eliminar imagen anterior');
      }
    }

    // Actualizar perfil médico en Airtable con la nueva URL
    let airtableUpdated = false;
    try {
      console.log(`🔄 Actualizando perfil médico ${doctorId} con nueva URL: ${uploadResult.url}`);
      const updateRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/doctors`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: doctorId,
          PhotoURL: uploadResult.url
        })
      });

      if (updateRes.ok) {
        const updateData = await updateRes.json();
        console.log('✅ Perfil médico actualizado en Airtable:', updateData);
        airtableUpdated = true;
      } else {
        const errorData = await updateRes.text();
        console.error('⚠️ Error actualizando perfil en Airtable:', errorData);
      }
    } catch (updateError) {
      console.error('⚠️ Error actualizando Airtable:', updateError);
      // No fallar la subida por esto
    }
    
    return NextResponse.json({ 
      success: true, 
      url: uploadResult.url,
      message: "Imagen subida correctamente a AWS S3",
      airtableUpdated,
      metadata: {
        bucket: uploadResult.bucket,
        key: uploadResult.key,
        size: file.size,
        type: file.type,
        etag: uploadResult.etag
      }
    });
    
  } catch (error) {
    console.error('❌ Error general subiendo imagen:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    // Errores específicos AWS
    if (errorMessage.includes('AWS')) {
      return NextResponse.json({ 
        error: "Error de configuración AWS", 
        details: errorMessage 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      error: "Error subiendo imagen", 
      details: errorMessage 
    }, { status: 500 });
  }
}

// GET: Endpoint para verificar configuración (opcional)
export async function GET(): Promise<NextResponse<ConfigResponse | UploadErrorResponse>> {
  try {
    validateS3Config();
    
    return NextResponse.json({ 
      status: "AWS S3 configurado correctamente",
      bucket: process.env.AWS_S3_BUCKET_NAME,
      region: process.env.AWS_REGION,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ 
      error: "Error de configuración AWS", 
      details: errorMessage 
    }, { status: 500 });
  }
}