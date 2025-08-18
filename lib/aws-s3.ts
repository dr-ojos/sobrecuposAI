// lib/aws-s3.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Types for S3 operations
export interface S3UploadResult {
  success: boolean;
  url: string;
  key: string;
  bucket: string;
  etag?: string;
}

export interface S3Config {
  AWS_REGION?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_S3_BUCKET_NAME?: string;
}

// Configuración del cliente S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

// Función para subir imagen a S3
export const uploadImageToS3 = async (
  buffer: Buffer, 
  fileName: string, 
  contentType: string
): Promise<S3UploadResult> => {
  try {
    // Generar nombre único con timestamp
    const timestamp = Date.now();
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `doctors/${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

    console.log(`📤 Subiendo imagen a S3: ${uniqueFileName}`);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueFileName,
      Body: buffer,
      ContentType: contentType,
      // Metadata para organización
      Metadata: {
        'original-name': fileName,
        'upload-date': new Date().toISOString(),
        'type': 'doctor-profile'
      },
      // Configuraciones de S3
      CacheControl: 'max-age=31536000', // Cache por 1 año
    });

    const result = await s3Client.send(command);
    
    // Generar URL firmada para acceso temporal (válida por 7 días)
    const getObjectCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueFileName,
    });
    
    const signedUrl = await getSignedUrl(s3Client, getObjectCommand, { 
      expiresIn: 7 * 24 * 60 * 60 // 7 días en segundos
    });
    
    console.log('✅ Imagen subida exitosamente a S3 con URL firmada');
    
    return {
      success: true,
      url: signedUrl,
      key: uniqueFileName,
      bucket: BUCKET_NAME,
      etag: result.ETag
    };
    
  } catch (error) {
    console.error('❌ Error subiendo imagen a S3:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    throw new Error(`Error subiendo imagen: ${errorMessage}`);
  }
};

// Función para eliminar imagen de S3
export const deleteImageFromS3 = async (imageUrl: string): Promise<boolean> => {
  try {
    // Extraer la key del URL
    const urlParts = imageUrl.split('/');
    const key = urlParts.slice(-2).join('/'); // doctors/filename.jpg
    
    if (!key.startsWith('doctors/')) {
      console.warn('⚠️ URL no válida para eliminación:', imageUrl);
      return false;
    }

    console.log(`🗑️ Eliminando imagen de S3: ${key}`);

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    console.log('✅ Imagen eliminada de S3:', key);
    return true;
    
  } catch (error) {
    console.error('❌ Error eliminando imagen de S3:', error);
    return false;
  }
};

// Función para generar URL firmada de imagen existente
export const getSignedImageUrl = async (imageUrl: string): Promise<string> => {
  try {
    // Extraer la key del URL existente
    const urlParts = imageUrl.split('/');
    const key = urlParts.slice(-2).join('/'); // doctors/filename.jpg
    
    if (!key.startsWith('doctors/')) {
      console.warn('⚠️ URL no válida para generar signed URL:', imageUrl);
      return imageUrl; // Retornar URL original si no es válida
    }

    const getObjectCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    const signedUrl = await getSignedUrl(s3Client, getObjectCommand, { 
      expiresIn: 7 * 24 * 60 * 60 // 7 días en segundos
    });
    
    console.log('✅ URL firmada generada para imagen existente');
    return signedUrl;
    
  } catch (error) {
    console.error('❌ Error generando URL firmada:', error);
    return imageUrl; // Fallback a URL original
  }
};

// Función para validar configuración
export const validateS3Config = (): boolean => {
  const requiredVars: S3Config = {
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
  };

  const missing = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Variables de entorno faltantes: ${missing.join(', ')}`);
  }

  return true;
};