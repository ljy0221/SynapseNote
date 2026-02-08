/**
 * Detects if the current OS is macOS.
 * @returns {boolean} True if the OS is macOS, false otherwise.
 */
export const isMac = (): boolean => {
    // 1. Electron 환경인 경우: main process에서 전달된 platform 정보 사용
    if (typeof window !== 'undefined' && window.electronAPI?.platform) {
        return window.electronAPI.platform === 'darwin';
    }

    // 2. 웹 환경(브라우저)인 경우: navigator 사용 (Legacy support)
    if (typeof navigator !== 'undefined') {
        const platform = navigator.platform.toLowerCase();
        const userAgent = navigator.userAgent.toLowerCase();
        return platform.includes('mac') || userAgent.includes('mac');
    }

    return false;
};
