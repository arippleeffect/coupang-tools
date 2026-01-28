/**
 * Login Toast Component
 *
 * Toast message with link to Coupang Wing login
 */

import React from 'react';

export function LoginToast({ onOpenLogin }: { onOpenLogin: () => void }) {
  return (
    <>
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 2147483647,
          background: '#1a73e8',
          color: '#fff',
          padding: '16px 20px',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,.3)',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          fontSize: '14px',
          lineHeight: '1.5',
          minWidth: '300px',
          maxWidth: '400px',
          animation: 'slideIn 0.15s ease-out',
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: '15px',
            marginBottom: '8px',
          }}
        >
          쿠팡윙 로그인이 필요합니다
        </div>
        <div style={{ marginBottom: '12px', opacity: 0.95 }}>
          상품 정보를 불러오려면 쿠팡윙에 로그인해주세요.
        </div>
        <button
          onClick={onOpenLogin}
          style={{
            background: '#fff',
            color: '#1a73e8',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <span>쿠팡윙 로그인</span>
          <span style={{ fontSize: '16px' }}>→</span>
        </button>
      </div>
    </>
  );
}
