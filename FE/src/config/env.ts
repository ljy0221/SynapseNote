export interface AppConfig {
    VITE_API_BASE_URL: string;
    VITE_GOOGLE_CLIENT_ID: string;
    VITE_GOOGLE_REDIRECT_URI: string;
    VITE_GOOGLE_PRODUCTION_REDIRECT_URI: string;
    VITE_GOOGLE_WEB_REDIRECT_URI: string;
    VITE_GITHUB_CLIENT_ID: string;
    VITE_GITHUB_REDIRECT_URI: string;
    VITE_GITHUB_PRODUCTION_REDIRECT_URI: string;
    VITE_GITHUB_WEB_CLIENT_ID: string;
    VITE_GITHUB_WEB_REDIRECT_URI: string;
    VITE_WS_URL: string;
    VITE_TURN_URL: string;
    VITE_TURN_USERNAME: string;
    VITE_TURN_CREDENTIAL: string;
    DEV: boolean;
}

const getEnv = (key: keyof AppConfig): any => {
    // 1. Runtime Config (Docker/EC2)
    if (typeof window !== 'undefined' && (window as any).config && (window as any).config[key]) {
        return (window as any).config[key];
    }
    // 2. Build-time Config (Local/Electron/Vite)
    return import.meta.env[key];
};

export const env: AppConfig = {
    VITE_API_BASE_URL: getEnv('VITE_API_BASE_URL') || 'https://i14b102.p.ssafy.io/backend/api',
    VITE_GOOGLE_CLIENT_ID: getEnv('VITE_GOOGLE_CLIENT_ID'),
    VITE_GOOGLE_REDIRECT_URI: getEnv('VITE_GOOGLE_REDIRECT_URI'),
    VITE_GOOGLE_PRODUCTION_REDIRECT_URI: getEnv('VITE_GOOGLE_PRODUCTION_REDIRECT_URI'),
    VITE_GOOGLE_WEB_REDIRECT_URI: getEnv('VITE_GOOGLE_WEB_REDIRECT_URI'),
    VITE_GITHUB_CLIENT_ID: getEnv('VITE_GITHUB_CLIENT_ID'),
    VITE_GITHUB_REDIRECT_URI: getEnv('VITE_GITHUB_REDIRECT_URI'),
    VITE_GITHUB_PRODUCTION_REDIRECT_URI: getEnv('VITE_GITHUB_PRODUCTION_REDIRECT_URI'),
    VITE_GITHUB_WEB_CLIENT_ID: getEnv('VITE_GITHUB_WEB_CLIENT_ID'),
    VITE_GITHUB_WEB_REDIRECT_URI: getEnv('VITE_GITHUB_WEB_REDIRECT_URI'),
    VITE_WS_URL: getEnv('VITE_WS_URL'),
    VITE_TURN_URL: getEnv('VITE_TURN_URL'),
    VITE_TURN_USERNAME: getEnv('VITE_TURN_USERNAME'),
    VITE_TURN_CREDENTIAL: getEnv('VITE_TURN_CREDENTIAL'),
    DEV: import.meta.env.DEV, // Special case for Vite internal vars
};

