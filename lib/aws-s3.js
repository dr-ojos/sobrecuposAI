// lib/aws-s3.js
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Configuración del cliente S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

// Función para subir imagen a S3
export const uploadImageToS3 = async (buffer, fileName, contentType) => {
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
      ServerSideEncryption: 'AES256', // Encriptación automática
      CacheControl: 'max-age=31536000', // Cache por 1 año
    });

    const result = await s3Client.send(command);
    
    // URL pública de la imagen (funciona solo si el bucket permite acceso público)
    const imageUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFileName}`;
    
    console.log('✅ Imagen subida exitosamente a S3:', imageUrl);
    
    return {
      success: true,
      url: imageUrl,
      key: uniqueFileName,
      bucket: BUCKET_NAME,
      etag: result.ETag
    };
    
  } catch (error) {
    console.error('❌ Error subiendo imagen a S3:', error);
    throw new Error(`Error subiendo imagen: ${error.message}`);
  }
};

// Función para eliminar imagen de S3
export const deleteImageFromS3 = async (imageUrl) => {
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

// Función para validar configuración
export const validateS3Config = () => {
  const requiredVars = {
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
  };

  const missing = Object.entries(requiredVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Variables de entorno faltantes: ${missing.join(', ')}`);
  }

  return true;
};