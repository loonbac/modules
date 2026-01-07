/**
 * Korosoft Modules - Main Application
 */

// Toast notifications
const Toast = (() => {
    const container = document.getElementById('toast-container');
    const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    };

    const show = (message, type = 'info', duration = 4000) => {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        `;
        container.appendChild(toast);
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        });
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    };

    return {
        success: (msg) => show(msg, 'success'),
        error: (msg) => show(msg, 'error'),
        warning: (msg) => show(msg, 'warning'),
        info: (msg) => show(msg, 'info')
    };
})();
window.Toast = Toast;

// Main App
const App = (() => {
    let currentPage = 'home';
    let pageParams = {};

    const pages = ['home', 'modules', 'module-detail', 'edit-module', 'upload', 'my-modules', 'settings'];
    const authPages = ['upload', 'my-modules', 'settings', 'edit-module'];

    const navigateTo = (page, params = {}) => {
        if (authPages.includes(page) && !Auth.isLoggedIn()) {
            openAuthModal('login');
            return;
        }
        currentPage = page;
        pageParams = params;

        // Update page visibility
        pages.forEach(p => {
            const el = document.getElementById(`page-${p}`);
            if (el) el.classList.toggle('active', p === page);
        });

        // Update nav
        document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });

        // Close mobile menu
        document.getElementById('mobile-menu')?.classList.remove('open');

        // Page-specific logic
        switch (page) {
            case 'modules':
                Modules.renderModulesList('all-modules');
                break;
            case 'module-detail':
                if (params.slug) Modules.renderModuleDetail(params.slug);
                break;
            case 'edit-module':
                if (params.slug) Modules.initEditPage(params.slug);
                break;
            case 'my-modules':
                Modules.renderMyModules();
                break;
            case 'home':
                loadFeaturedModules();
                loadStats();
                break;
            case 'settings':
                loadSettings();
                break;
        }

        window.scrollTo(0, 0);
    };

    const loadFeaturedModules = async () => {
        try {
            const data = await API.get('/modules?filter=popular&limit=6');
            const container = document.getElementById('featured-modules');
            if (data.modules?.length) {
                container.innerHTML = data.modules.map(m => `
                    <article class="module-card" data-slug="${m.slug}">
                        <div class="module-card-image">
                            ${m.thumbnail ? `<img src="${m.thumbnail}" alt="${m.name}">` : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`}
                        </div>
                        <div class="module-card-content">
                            <h3 class="module-card-title">${m.name}</h3>
                            <p class="module-card-author">por ${m.author?.username || 'Anónimo'}</p>
                            <p class="module-card-desc">${m.description || ''}</p>
                        </div>
                        <div class="module-card-footer">
                            <span class="module-card-version">v${m.version}</span>
                            <span class="module-card-downloads"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>${m.downloads || 0}</span>
                        </div>
                    </article>
                `).join('');
                container.querySelectorAll('.module-card').forEach(card => {
                    card.addEventListener('click', () => navigateTo('module-detail', { slug: card.dataset.slug }));
                });
            }
        } catch { }
    };

    const loadStats = async () => {
        try {
            const data = await API.get('/stats');
            document.getElementById('stat-modules').textContent = data.modules || 0;
            document.getElementById('stat-developers').textContent = data.developers || 0;
            document.getElementById('stat-downloads').textContent = data.downloads || 0;
        } catch { }
    };

    const loadSettings = () => {
        const user = Auth.getUser();
        if (user) {
            document.getElementById('settings-username').value = user.username;
            document.getElementById('settings-email').value = user.email;
        }
    };

    const openAuthModal = (tab = 'login') => {
        const modal = document.getElementById('auth-modal');
        modal.classList.add('open');
        switchAuthTab(tab);
    };

    const closeAuthModal = () => {
        document.getElementById('auth-modal').classList.remove('open');
        document.getElementById('login-form').reset();
        document.getElementById('register-form').reset();
        document.getElementById('login-error').classList.add('hidden');
        document.getElementById('register-error').classList.add('hidden');
    };

    const switchAuthTab = (tab) => {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
        document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
        document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
    };

    const initEventListeners = () => {
        // Navigation links
        document.querySelectorAll('[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo(link.dataset.page);
            });
        });

        // Theme toggle
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            const html = document.documentElement;
            const newTheme = html.dataset.theme === 'dark' ? 'light' : 'dark';
            html.dataset.theme = newTheme;
            localStorage.setItem('theme', newTheme);
        });

        // Mobile menu
        document.getElementById('mobile-menu-toggle')?.addEventListener('click', () => {
            document.getElementById('mobile-menu').classList.toggle('open');
        });

        // User dropdown
        document.getElementById('user-menu-trigger')?.addEventListener('click', () => {
            document.getElementById('user-menu').classList.toggle('open');
        });
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#user-menu')) {
                document.getElementById('user-menu')?.classList.remove('open');
            }
        });

        // Auth modal buttons
        ['login-btn', 'mobile-login-btn'].forEach(id => {
            document.getElementById(id)?.addEventListener('click', () => openAuthModal('login'));
        });
        ['register-btn', 'mobile-register-btn', 'hero-register-btn'].forEach(id => {
            document.getElementById(id)?.addEventListener('click', () => openAuthModal('register'));
        });

        document.getElementById('auth-modal-close')?.addEventListener('click', closeAuthModal);
        document.getElementById('auth-modal-backdrop')?.addEventListener('click', closeAuthModal);

        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => switchAuthTab(tab.dataset.tab));
        });

        // Login form
        document.getElementById('login-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('login-submit');
            const error = document.getElementById('login-error');
            btn.disabled = true;
            btn.textContent = 'Cargando...';
            error.classList.add('hidden');

            try {
                await Auth.login(
                    document.getElementById('login-email').value,
                    document.getElementById('login-password').value
                );
                closeAuthModal();
                Toast.success('¡Bienvenido!');
            } catch (err) {
                error.textContent = err.message || 'Credenciales inválidas';
                error.classList.remove('hidden');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Iniciar Sesión';
            }
        });

        // Register form
        document.getElementById('register-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('register-submit');
            const error = document.getElementById('register-error');
            const password = document.getElementById('register-password').value;
            const confirm = document.getElementById('register-confirm').value;

            if (password !== confirm) {
                error.textContent = 'Las contraseñas no coinciden';
                error.classList.remove('hidden');
                return;
            }

            btn.disabled = true;
            btn.textContent = 'Cargando...';
            error.classList.add('hidden');

            try {
                await Auth.register(
                    document.getElementById('register-username').value,
                    document.getElementById('register-email').value,
                    password
                );
                closeAuthModal();
                Toast.success('¡Cuenta creada!');
            } catch (err) {
                error.textContent = err.message || 'Error al registrar';
                error.classList.remove('hidden');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Crear Cuenta';
            }
        });

        // Logout
        ['logout-btn', 'mobile-logout-btn'].forEach(id => {
            document.getElementById(id)?.addEventListener('click', () => Auth.logout());
        });

        // Password toggles
        document.querySelectorAll('.password-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = document.getElementById(btn.dataset.target);
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                btn.classList.toggle('show', isPassword);
            });
        });

        // Search
        let searchTimeout;
        document.getElementById('search-input')?.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                Modules.setSearch(e.target.value);
                Modules.setPage(1);
                Modules.renderModulesList('all-modules');
            }, 300);
        });

        // Filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                Modules.setFilter(btn.dataset.filter);
                Modules.setPage(1);
                Modules.renderModulesList('all-modules');
            });
        });

        // Pagination
        document.getElementById('prev-page')?.addEventListener('click', () => {
            const page = Modules.getPage();
            if (page > 1) {
                Modules.setPage(page - 1);
                Modules.renderModulesList('all-modules');
            }
        });
        document.getElementById('next-page')?.addEventListener('click', () => {
            Modules.setPage(Modules.getPage() + 1);
            Modules.renderModulesList('all-modules');
        });

        // Settings forms
        document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await Auth.updateProfile(document.getElementById('settings-username').value);
                Toast.success('Perfil actualizado');
            } catch (err) {
                Toast.error(err.message || 'Error al actualizar');
            }
        });

        document.getElementById('password-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPass = document.getElementById('new-password').value;
            if (newPass !== document.getElementById('confirm-password').value) {
                Toast.error('Las contraseñas no coinciden');
                return;
            }
            try {
                await Auth.changePassword(document.getElementById('current-password').value, newPass);
                Toast.success('Contraseña cambiada');
                e.target.reset();
            } catch (err) {
                Toast.error(err.message || 'Error al cambiar');
            }
        });

        document.getElementById('delete-account-btn')?.addEventListener('click', async () => {
            if (confirm('¿Estás seguro? Esta acción es irreversible.')) {
                try {
                    await Auth.deleteAccount();
                    Auth.logout();
                    Toast.success('Cuenta eliminada');
                } catch (err) {
                    Toast.error(err.message || 'Error al eliminar');
                }
            }
        });
    };

    const createSakuraPetals = () => {
        const container = document.getElementById('sakura-petals');
        if (!container) return;
        for (let i = 0; i < 15; i++) {
            const petal = document.createElement('div');
            petal.className = 'sakura-petal';
            petal.style.cssText = `
                position: absolute;
                width: ${8 + Math.random() * 12}px;
                height: ${8 + Math.random() * 12}px;
                background: linear-gradient(135deg, #FBCFE8, #F9A8D4);
                border-radius: 50% 0 50% 50%;
                left: ${Math.random() * 100}%;
                top: -20px;
                opacity: ${0.4 + Math.random() * 0.4};
                animation: fall ${8 + Math.random() * 8}s linear infinite;
                animation-delay: ${Math.random() * 8}s;
            `;
            container.appendChild(petal);
        }

        if (!document.getElementById('sakura-keyframes')) {
            const style = document.createElement('style');
            style.id = 'sakura-keyframes';
            style.textContent = `
                @keyframes fall {
                    0% { transform: translateY(0) rotate(0deg) translateX(0); }
                    100% { transform: translateY(100vh) rotate(720deg) translateX(100px); }
                }
            `;
            document.head.appendChild(style);
        }
    };

    const init = async () => {
        // Theme
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.dataset.theme = savedTheme;

        // Check auth
        await Auth.checkAuth();
        Auth.updateUI();

        // Init modules
        initEventListeners();
        Upload.init();
        createSakuraPetals();

        // Navigate to initial page
        navigateTo('home');
        loadStats();
        loadFeaturedModules();

        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('hide');
        }, 500);
    };

    return { init, navigateTo };
})();

window.App = App;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', App.init);
