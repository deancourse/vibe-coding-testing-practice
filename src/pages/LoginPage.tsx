import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AxiosError } from 'axios';



export const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [apiError, setApiError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login, isAuthenticated, authExpiredMessage, clearAuthExpiredMessage } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            // 登入成功後，統一導向到 /dashboard
            // 不再記住用戶登出前的頁面，避免重新登入後回到 admin 等其他頁面
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        if (authExpiredMessage) {
            setApiError(authExpiredMessage);
            clearAuthExpiredMessage();
        }
    }, [authExpiredMessage, clearAuthExpiredMessage]);

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setEmailError('請輸入有效的 Email 格式');
            return false;
        }
        setEmailError('');
        return true;
    };

    const validatePassword = (password: string): boolean => {
        // Password must be at least 8 characters with letters and numbers
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);

        if (password.length < 8) {
            setPasswordError('密碼必須至少 8 個字元');
            return false;
        }
        if (!hasLetter || !hasNumber) {
            setPasswordError('密碼必須包含英文字母和數字');
            return false;
        }
        setPasswordError('');
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setApiError('');

        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);

        if (!isEmailValid || !isPasswordValid) {
            return;
        }

        setIsLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard', { replace: true });
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            const message = axiosError.response?.data?.message || '登入失敗，請稍後再試';
            setApiError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <div className="login-icon">🔐</div>
                    <h1>歡迎回來</h1>
                    <p>請登入以繼續</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {apiError && (
                        <div className="error-banner" role="alert">
                            <span className="error-icon">⚠️</span>
                            {apiError}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">電子郵件</label>
                        <input
                            type="text"
                            id="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            className={emailError ? 'error' : ''}
                            autoComplete="email"
                        />
                        {emailError && <span className="field-error">{emailError}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">密碼</label>
                        <input
                            type="password"
                            id="password"
                            placeholder="至少 8 個字元，需包含英數"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            className={passwordError ? 'error' : ''}
                            autoComplete="current-password"
                        />
                        {passwordError && <span className="field-error">{passwordError}</span>}
                    </div>

                    <button type="submit" className="login-button" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <span className="button-spinner" />
                                登入中...
                            </>
                        ) : (
                            '登入'
                        )}
                    </button>
                </form>

                {!import.meta.env.VITE_API_URL && (
                    <div className="login-footer">
                        <p>測試帳號：任意 email 格式 / 密碼需包含英數且8位以上</p>
                    </div>
                )}
            </div>
        </div>
    );
};
