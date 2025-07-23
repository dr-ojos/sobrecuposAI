// app/components/LoadingScreen.js
'use client';

export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="logo-container-loading">
          <div className="logo-text-loading">
            <span className="logo-main-loading">Sobrecupos</span>
            <span className="logo-ai-loading">AI</span>
          </div>
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .loading-screen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, 
            #f8faff 0%, 
            #e8f2ff 30%, 
            #dde9ff 60%, 
            #f0f8ff 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .loading-content {
          text-align: center;
        }

        .logo-container-loading {
          animation: fadeInScale 0.6s ease-out;
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .logo-text-loading {
          font-size: 3.5rem;
          font-weight: 800;
          letter-spacing: -1px;
          display: inline-flex;
          align-items: baseline;
          gap: 0.3rem;
          margin-bottom: 2rem;
        }

        .logo-main-loading {
          background: linear-gradient(135deg, #1d1d1f 0%, #424245 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .logo-ai-loading {
          background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-size: 0.85em;
          font-weight: 900;
        }

        .loading-dots {
          display: flex;
          gap: 8px;
          justify-content: center;
        }

        .loading-dots span {
          width: 12px;
          height: 12px;
          background: #007aff;
          border-radius: 50%;
          animation: pulse 1.4s infinite;
          opacity: 0.7;
        }

        .loading-dots span:nth-child(1) {
          animation-delay: 0s;
        }

        .loading-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .loading-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes pulse {
          0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @media (max-width: 480px) {
          .logo-text-loading {
            font-size: 2.5rem;
          }
        }
      `}</style>
    </div>
  );
}