import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserInfo, UserInfo } from '../api/authApi';
import { useToast } from './ToastContext';

interface UserContextType {
    userInfo: UserInfo | null;
    isLoading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => void;
    refreshUserInfo: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    const fetchUserInfo = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setUserInfo(null);
                return;
            }
            const info = await getUserInfo();
            setUserInfo(info);
        } catch (error) {
            console.error('Failed to fetch user info:', error);
            // 토큰이 만료되었거나 유효하지 않은 경우 로그아웃 처리 등을 고려할 수 있음
            // 여기서는 단순히 에러 토스트만 띄우지 않고, 조용히 실패 처리하거나 
            // 필요시 토큰 삭제 로직을 추가할 수 있음.
            // 보안상 토큰이 유효하지 않으면 삭제하는 것이 좋음.
            // localStorage.removeItem('authToken');
            // setUserInfo(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUserInfo();
    }, []);

    const login = async (token: string) => {
        localStorage.setItem('authToken', token);
        await fetchUserInfo();
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setUserInfo(null);
        // 필요시 백엔드 로그아웃 API 호출 추가
        showToast('로그아웃 되었습니다.');
    };

    const refreshUserInfo = async () => {
        await fetchUserInfo();
    };

    return (
        <UserContext.Provider value={{ userInfo, isLoading, login, logout, refreshUserInfo }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
