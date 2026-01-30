/**
 * Korosoft Modules - Authentication
 */
const Auth = (() => {
    let user = null;

    const getUser = () => user;
    const isLoggedIn = () => !!user && !!API.getToken();

    const setUser = (userData) => {
        user = userData;
        if (userData) {
            localStorage.setItem('user', JSON.stringify(userData));
        } else {
            localStorage.removeItem('user');
        }
    };

    const register = async (username, email, password) => {
        const data = await API.post('/auth/register', { username, email, password });
        if (data.access_token) {
            API.setToken(data.access_token);
            setUser(data.user);
            updateUI();
        }
        return data;
    };

    const login = async (email, password) => {
        const data = await API.post('/auth/login', { email, password });
        if (data.access_token) {
            API.setToken(data.access_token);
            setUser(data.user);
            updateUI();
        }
        return data;
    };

    const logout = () => {
        API.post('/auth/logout').catch(() => { });
        API.clearToken();
        setUser(null);
        updateUI();
        App.navigateTo('home');
        Toast.success('Sesión cerrada');
    };

    const checkAuth = async () => {
        const token = API.getToken();
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
            try {
                user = JSON.parse(savedUser);
                // Validate token
                const data = await API.get('/auth/me');
                if (data.user) {
                    setUser(data.user);
                }
            } catch {
                API.clearToken();
                setUser(null);
            }
        }
    };

    const updateProfile = async (username) => {
        const data = await API.put('/auth/me', { username });
        if (data.user) setUser(data.user);
        updateUI();
        return data;
    };

    const changePassword = async (currentPassword, newPassword) => {
        return API.put('/auth/password', { current_password: currentPassword, new_password: newPassword });
    };

    const deleteAccount = async () => {
        await API.delete('/auth/me');
        logout();
    };

    const updateUI = () => {
        const authButtons = document.getElementById('auth-buttons');
        const userMenu = document.getElementById('user-menu');
        const authOnlyElements = document.querySelectorAll('.auth-only');
        const guestOnlyElements = document.querySelectorAll('.guest-only');

        if (isLoggedIn()) {
            authButtons?.classList.add('hidden');
            userMenu?.classList.remove('hidden');
            authOnlyElements.forEach(el => el.classList.remove('hidden'));
            guestOnlyElements.forEach(el => el.classList.add('hidden'));

            // Update user info
            const userName = document.getElementById('user-name');
            const userAvatar = document.getElementById('user-avatar');
            if (userName) userName.textContent = user.username;
            if (userAvatar) userAvatar.textContent = user.username.charAt(0).toUpperCase();
        } else {
            authButtons?.classList.remove('hidden');
            userMenu?.classList.add('hidden');
            authOnlyElements.forEach(el => el.classList.add('hidden'));
            guestOnlyElements.forEach(el => el.classList.remove('hidden'));
        }
    };

    // Listen for logout events
    window.addEventListener('auth:logout', () => {
        setUser(null);
        updateUI();
    });

    return {
        getUser, isLoggedIn, setUser,
        register, login, logout, checkAuth,
        updateProfile, changePassword, deleteAccount,
        updateUI
    };
})();

window.Auth = Auth;
