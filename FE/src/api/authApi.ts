// src/api/authApi.ts

export interface LoginResult {
    accessToken: string;
    memberId: string;
}

export const socialLogin = async (provider: string, code: string): Promise<LoginResult> => {
    const response = await fetch('/api/v1/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // 쿠키(RefreshToken) 처리를 위해 필수
        body: JSON.stringify({
            provider: provider.toUpperCase(),
            authorizationCode: code,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '로그인 처리에 실패했습니다.');
    }

    const json = await response.json();
    const data = json.data;

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
    createdAt: string; // LocalDateTime
}

export const getUserInfo = async (token: string): Promise<UserInfo> => {
    if (!token) {
        throw new Error('No access token provided');
    }

    const response = await fetch('/api/v1/members/me', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error('Failed to fetch user info');
    }

    const json = await response.json();
    const data = json.data;

    return {
        ...data,
        memberId: data.id,
    };
};

export const updateNickname = async (token: string, newNickname: string): Promise<UserInfo> => {
    if (!token) {
        throw new Error('No access token provided');
    }

    const response = await fetch('/api/v1/members/me', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
            name: newNickname,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '닉네임 변경에 실패했습니다.');
    }

    const json = await response.json();
    const data = json.data;

    return {
        ...data,
        memberId: data.id,
    };
};
