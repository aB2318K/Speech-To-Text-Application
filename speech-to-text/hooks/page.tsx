import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const tokenExpiration = localStorage.getItem('tokenExpiration');
        const isTokenValid = token && tokenExpiration && Date.now() < parseInt(tokenExpiration, 10);
        if(isTokenValid) {
            setIsAuthenticated(true);
        }
        else {
            setIsAuthenticated(false);
            router.push('/login');
        }
    }, [router])

    return isAuthenticated;
}

const useLogout = () => {
    const router = useRouter();

    const logout = useCallback(() => {
        // Remove token and userID from localStorage
        localStorage.removeItem("token");
        localStorage.removeItem("userID");
        localStorage.removeItem("tokenExpiration")
        // Redirect the user to the login page
        router.push("/login");
    }, [router]);

    return logout;
};

export { useAuth, useLogout };