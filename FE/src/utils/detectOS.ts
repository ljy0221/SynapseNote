/**
 * Detects if the current OS is macOS.
 * @returns {boolean} True if the OS is macOS, false otherwise.
 */
export const isMac = (): boolean => {
    if (typeof navigator === 'undefined') {
        return false;
    }
    const platform = navigator.platform.toLowerCase();
    const userAgent = navigator.userAgent.toLowerCase(); // Check userAgent for broader compatibility including iPads which often report as MacIntel

    return platform.includes('mac') || userAgent.includes('mac');
};
