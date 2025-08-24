'use client';
import React, { useState, useEffect } from 'react';

export default function DebugPago() {
  const [logs, setLogs] = useState([]);
  
  const addLog = (message) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };
  
  useEffect(() => {
    addLog('✅ Component mounted successfully');
    addLog('✅ JavaScript is executing');
    addLog('✅ Console logs are working');
  }, []);
  
  const testPaymentConfirm = async () => {
    try {
      addLog('🚀 Testing /api/payment/confirm call...');
      
      const testData = {
        transactionId: 'TEST123',
        sessionId: 'session-test',
        paymentData: {
          patientName: 'Test Patient',
          doctorId: 'test-id',
          doctorName: 'Dr. Test',
          motivo: 'Test motivo'
        },
        isSimulated: true
      };
      
      addLog(`📤 Sending data: ${JSON.stringify(testData, null, 2)}`);
      
      const response = await fetch('/api/payment/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });
      
      addLog(`📥 Response status: ${response.status}`);
      addLog(`📥 Response ok: ${response.ok}`);
      
      const result = await response.text();
      addLog(`📥 Response body: ${result}`);
      
    } catch (error) {
      addLog(`❌ Error: ${error.message}`);
      addLog(`❌ Stack: ${error.stack}`);
    }
  };
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🚨 DEBUG PAGO - JavaScript Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => addLog('Button clicked!')}
          style={{ padding: '10px', marginRight: '10px' }}
        >
          Test Console Log
        </button>
        
        <button 
          onClick={testPaymentConfirm}
          style={{ padding: '10px', background: 'red', color: 'white' }}
        >
          🚨 Test Payment Confirm
        </button>
      </div>
      
      <div style={{ 
        border: '1px solid #ccc', 
        padding: '10px', 
        background: '#f5f5f5',
        maxHeight: '400px',
        overflowY: 'scroll'
      }}>
        <h3>📊 Real-time Logs:</h3>
        {logs.length === 0 && <p>❌ No logs - JavaScript may not be working</p>}
        {logs.map((log, i) => (
          <div key={i} style={{ marginBottom: '5px', fontSize: '12px' }}>
            {log}
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '20px', padding: '10px', background: '#e1f5fe' }}>
        <h3>💡 Instructions:</h3>
        <ol>
          <li>If you see logs above, JavaScript is working</li>
          <li>Click "Test Console Log" - should add a log</li>
          <li>Click "Test Payment Confirm" - should call the API</li>
          <li>Check Vercel logs for the API call</li>
          <li>If nothing works, there's a fundamental JS issue</li>
        </ol>
      </div>
    </div>
  );
}