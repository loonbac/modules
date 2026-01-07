/**
 * Korosoft Modules - Authentication Module
 */
const Auth = (() => {
    let currentUser = null;
    const listeners = [];

    const subscribe = (fn) => { listeners.push(fn); return () => listeners.splice(listeners.indexOf(fn), 1); };
    const notify = () => listeners.forEach(fn => fn(currentUser));

    const setUser = (user) => { currentUser = user; notify(); updateUI(); };
    const getUser = () => currentUser;
    const isLoggedIn = () => !!currentUser;

    const updateUI = () => {
        const authOnly = document.querySelectorAll('.auth-only');
        const guestOnly = document.querySelectorAll('.guest-only');

        if (currentUser) {
            authOnly.forEach(el => el.classList.remove('hidden'));
            guestOnly.forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('#user-avatar, #mobile-user-avatar').forEach(el => el.textContent = currentUser.username.charAt(0).toUpperCase());
            document.querySelectorAll('#user-name, #mobile-user-name').forEach(el => el.textContent = currentUser.username);
        } else {
            authOnly.forEach(el => el.classList.add('hidden'));
            guestOnly.forEach(el => el.classList.remove('hidden'));
        }
    };

    const login = async (email, password) => {
        const data = await API.post('/auth/login', { email, password });
        if (data.access_token) API.setToken(data.access_token);
        if (data.user) setUser(data.user);
        return data;
    };

    const register = async (username, email, password) => {
        const data = await API.post('/auth/register', { username, email, password });
        if (data.access_token) API.setToken(data.access_token);
        if (data.user) setUser(data.user);
        return data;
    };

    const logout = async () => {
        try { await API.post('/auth/logout', {}); } catch { }
        API.clearToken();
        setUser(null);
        App.navigateTo('home');
    };

    const checkAuth = async () => {
        const token = API.getToken();
        if (!token) return false;
        try {
            const data = await API.get('/auth/me');
            if (data.user) { setUser(data.user); return true; }
            return false;
        } catch {
            API.clearToken();
            return false;
        }
    };

    const updateProfile = (username) => API.put('/auth/me', { username });
    const changePassword = (currentPassword, newPassword) => API.put('/auth/password', { currentPassword, newPassword });
    const deleteAccount = () => API.delete('/auth/me');

    // Listen for logout events
    window.addEventListener('auth:logout', logout);

    return { subscribe, getUser, isLoggedIn, login, register, logout, checkAuth, updateProfile, changePassword, deleteAccount, updateUI };
})();

window.Auth = Auth;
