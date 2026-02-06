import React from 'react';
import { SynapseLogo } from '../logo/SynapseLogo';

export const WebRestrictedOverlay: React.FC = () => {
    const handleDownload = () => {
        // TODO: Replace with actual download link when available
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const downloadUrl = isMac
            ? 'https://github.com/S14P11B102/Synapse-Desktop/releases/latest'
            : 'https://github.com/S14P11B102/Synapse-Desktop/releases/latest';
        window.open(downloadUrl, '_blank');
    };

    const handleOpenApp = () => {
        // Attempt to open the app via custom protocol
        window.location.href = 'synapse://home';
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            width: '100vw',
            backgroundColor: 'var(--color-bg)',
            color: 'var(--font-color)',
            textAlign: 'center',
            position: 'fixed', // Ensure it covers everything
            top: 0,
            left: 0,
            zIndex: 9999
        }}>
            <div style={{ marginBottom: '40px' }}>
                <SynapseLogo width={120} height={120} />
            </div>

            <h1 style={{ fontSize: '2.5rem', marginBottom: '16px', fontWeight: 'bold' }}>
                Synapse 데스크톱 앱에서<br />
                더 강력한 기능을 경험하세요
            </h1>

            <p style={{ fontSize: '1.1rem', opacity: 0.7, marginBottom: '48px', lineHeight: '1.6', maxWidth: '600px' }}>
                웹 버전은 제한된 기능만 제공합니다.<br />
                최적의 경험을 위해 데스크톱 앱을 사용해 주세요.
            </p>

            <div style={{ display: 'flex', gap: '16px', flexDirection: 'column', width: '100%', maxWidth: '300px' }}>
                <button
                    onClick={handleDownload}
                    style={{
                        padding: '16px 32px',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        backgroundColor: 'var(--color-main)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                >
                    앱 다운로드
                </button>

                <button
                    onClick={handleOpenApp}
                    style={{
                        padding: '14px 32px',
                        fontSize: '1rem',
                        backgroundColor: 'transparent',
                        color: 'var(--font-color)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        opacity: 0.8
                    }}
                >
                    이미 앱이 있어요 (앱 열기)
                </button>
            </div>
        </div>
    );
};
