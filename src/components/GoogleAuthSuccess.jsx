import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./GoogleAuthSuccess.css";
import { API_BASE } from '../config';

const GoogleAuthSuccess = ({ onLogin }) => {

    const location = useLocation();
    const navigate = useNavigate();

    const hasProcessed = useRef(false);

    useEffect(() => {

        if (hasProcessed.current) {
            return;
        }

        hasProcessed.current = true;

        const processGoogleLogin = async () => {

            try {

                const params = new URLSearchParams(
                    location.search
                );

                const token = params.get("token");

                if (!token) {
                    console.error(
                        "Google login token not found"
                    );
                    navigate("/login", {
                        replace: true,
                    });
                    return;
                }

                localStorage.setItem(
                    "token",
                    token
                );

                const response = await fetch(
                    `${API_BASE}/api/auth/profile`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data =
                    await response.json();

                if (!response.ok) {
                    console.error(
                        "Google authentication failed:",
                        data.message
                    );
                    localStorage.removeItem("token");
                    navigate("/login", {
                        replace: true,
                    });
                    return;
                }

                onLogin(data.user);

                navigate("/", {
                    replace: true,
                });

            } catch (error) {
                console.error(
                    "Google authentication error:",
                    error
                );
                localStorage.removeItem("token");
                navigate("/login", {
                    replace: true,
                });
            }

        };

        processGoogleLogin();

    }, [location.search, navigate, onLogin]);

    return (
        <div className="google-auth-success">

            <div className="google-auth-card">

                <div className="google-auth-logo">
                    <span className="google-auth-dot">●</span>
                    shopora
                </div>

                <div className="google-auth-spinner-wrap">
                    <div className="google-auth-spinner"></div>
                </div>

                <p className="google-auth-text">Signing you in...</p>

            </div>

        </div>
    );
};

export default GoogleAuthSuccess;