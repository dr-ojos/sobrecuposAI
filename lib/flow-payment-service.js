// lib/flow-payment-service.js
import crypto from 'crypto';

class FlowPaymentService {
  constructor() {
    this.apiKey = process.env.FLOW_API_KEY;
    this.secretKey = process.env.FLOW_SECRET_KEY;
    this.baseUrl = process.env.FLOW_ENVIRONMENT === 'production' 
      ? 'https://api.flow.cl/payment/v1'
      : 'https://api-sandbox.flow.cl/payment/v1';
    this.webUrl = process.env.FLOW_ENVIRONMENT === 'production'
      ? 'https://pay.flow.cl'
      : 'https://sandbox.flow.cl';
  }

  /**
   * Genera la firma requerida por Flow
   */
  generateSignature(params, method = 'GET') {
    // Ordenar parámetros alfabéticamente
    const sortedParams = Object.keys(params)
      .filter(key => params[key] !== null && params[key] !== undefined)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');

    const stringToSign = `${method}&${sortedParams}&${this.secretKey}`;
    
    return crypto
      .createHash('sha256')
      .update(stringToSign, 'utf8')
      .digest('hex');
  }

  /**
   * Crea una orden de pago en Flow
   */
  async createPaymentOrder({
    commerceOrder,
    subject,
    currency = 'CLP',
    amount,
    email,
    paymentMethod = 9, // 9 = Todos los medios
    urlConfirmation,
    urlReturn
  }) {
    try {
      console.log('🔄 [FLOW] Creando orden de pago...');

      const params = {
        apiKey: this.apiKey,
        commerceOrder,
        subject,
        currency,
        amount: parseInt(amount),
        email,
        paymentMethod,
        urlConfirmation,
        urlReturn
      };

      // Generar firma
      const signature = this.generateSignature(params, 'POST');
      params.s = signature;

      console.log('🔑 [FLOW] Parámetros de pago:', {
        ...params,
        s: signature.substring(0, 10) + '...'
      });

      const response = await fetch(`${this.baseUrl}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params)
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ [FLOW] Error creating payment order:', result);
        throw new Error(result.message || 'Error creando orden de pago');
      }

      console.log('✅ [FLOW] Orden creada exitosamente:', result);

      // Construir URL de pago
      const paymentUrl = `${this.webUrl}/${result.token}`;

      return {
        success: true,
        token: result.token,
        url: paymentUrl,
        flowOrder: result.flowOrder
      };

    } catch (error) {
      console.error('❌ [FLOW] Error en createPaymentOrder:', error);
      throw error;
    }
  }

  /**
   * Obtiene el estado de un pago
   */
  async getPaymentStatus(token) {
    try {
      console.log('🔍 [FLOW] Consultando estado del pago:', token);

      const params = {
        apiKey: this.apiKey,
        token
      };

      const signature = this.generateSignature(params, 'GET');
      params.s = signature;

      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${this.baseUrl}/getStatus?${queryString}`);

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ [FLOW] Error getting payment status:', result);
        throw new Error(result.message || 'Error consultando estado del pago');
      }

      console.log('✅ [FLOW] Estado del pago:', result);

      return {
        success: true,
        status: result.status,
        commerceOrder: result.commerceOrder,
        amount: result.amount,
        payer: result.payer,
        paymentData: result.paymentData
      };

    } catch (error) {
      console.error('❌ [FLOW] Error en getPaymentStatus:', error);
      throw error;
    }
  }

  /**
   * Valida la confirmación de pago desde Flow
   */
  validatePaymentConfirmation(params) {
    try {
      console.log('🔐 [FLOW] Validando confirmación de pago...');

      const { s: receivedSignature, ...paymentParams } = params;
      const calculatedSignature = this.generateSignature(paymentParams, 'POST');

      const isValid = receivedSignature === calculatedSignature;

      console.log('🔐 [FLOW] Validación de firma:', {
        received: receivedSignature?.substring(0, 10) + '...',
        calculated: calculatedSignature?.substring(0, 10) + '...',
        isValid
      });

      return {
        isValid,
        paymentData: isValid ? paymentParams : null
      };

    } catch (error) {
      console.error('❌ [FLOW] Error validando confirmación:', error);
      return { isValid: false, paymentData: null };
    }
  }
}

export default FlowPaymentService;