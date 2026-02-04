// src/api/authApi.ts
import { api } from './axios';

export interface LoginResult {
    accessToken: string;
    memberId: string;
}

interface LoginResponse {
    accessToken: string;
    member: {
        id: string;
        email: string;
        name: string;
    };
}

interface ApiResponse<T> {
    data: T;
}

export const socialLogin = async (provider: string, code: string): Promise<LoginResult> => {
    const response = await api.post<ApiResponse<LoginResponse>>('/v1/login', {
        provider: provider.toUpperCase(),
        authorizationCode: code,
    });

    const data = response.data.data;

    return {
        accessToken: data.accessToken,
        memberId: data.member.id,
    };
};

export interface UserInfo {
    memberId: string;
    email: string;
    name: string;
    provider: string;
    createdAt: string;
}

interface MemberResponse {
    id: string;
    email: string;
    name: string;
    provider: string;
    createdAt: string;
}

export const getUserInfo = async (token: string): Promise<UserInfo> => {
    if (!token) {
        throw new Error('No access token provided');
    }

    const response = await api.get<ApiResponse<MemberResponse>>('/v1/members/me', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const data = response.data.data;

    return {
        ...data,
        memberId: data.id,
    };
};

export const updateNickname = async (token: string, newNickname: string): Promise<UserInfo> => {
    if (!token) {
        throw new Error('No access token provided');
    }

    const response = await api.patch<ApiResponse<MemberResponse>>(
        '/v1/members/me',
        { name: newNickname },
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    const data = response.data.data;

    return {
        ...data,
        memberId: data.id,
    };
};
