/**
 * Korosoft Modules - Main Application
 */

// Toast notifications
const Toast = (() => {
    const container = document.getElementById('toast-container');
    const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
    };

    const show = (message, type = 'success', duration = 4000) => {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        `;
        container.appendChild(toast);
        toast.querySelector('.toast-close').onclick = () => { toast.classList.add('hide'); setTimeout(() => toast.remove(), 300); };
        setTimeout(() => { toast.classList.add('hide'); setTimeout(() => toast.remove(), 300); }, duration);
    };

    return {
        success: (msg) => show(msg, 'success'),
        error: (msg) => show(msg, 'error'),
        warning: (msg) => show(msg, 'warning')
    };
})();
window.Toast = Toast;

// Main App
const App = (() => {
    let currentPage = 'home';
    let pollInterval = null;
    const authPages = ['upload', 'my-modules', 'settings'];

    const navigateTo = (page, params = {}) => {
        if (authPages.includes(page) && !Auth.isLoggedIn()) {
            openModal();
            return;
        }

        // Hide all pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`page-${page}`)?.classList.add('active');

        // Update nav
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });

        currentPage = page;
        window.scrollTo(0, 0);

        // Page-specific logic
        switch (page) {
            case 'home': loadHome(); break;
            case 'modules': loadModules(); break;
            case 'module-detail': loadModuleDetail(params.slug); break;
            case 'my-modules': loadMyModules(); break;
            case 'upload': resetUploadForm(); break;
            case 'settings': loadSettings(); break;
        }
    };

    // ===== HOME =====
    const loadHome = async () => {
        try {
            const stats = await API.get('/stats');
            document.getElementById('stat-modules').textContent = stats.modules || 0;
            document.getElementById('stat-developers').textContent = stats.developers || 0;
            document.getElementById('stat-downloads').textContent = stats.downloads || 0;
        } catch { }

        try {
            const data = await API.get('/modules?limit=6&filter=popular');
            renderModulesGrid('featured-modules', data.modules || []);
        } catch { }
    };

    // ===== MODULES =====
    let searchTimeout;
    const loadModules = async (search = '') => {
        const container = document.getElementById('all-modules');
        const empty = document.getElementById('modules-empty');
        container.innerHTML = '<div class="loading-placeholder">Cargando...</div>';

        try {
            const params = new URLSearchParams({ limit: 20 });
            if (search) params.append('search', search);
            const data = await API.get(`/modules?${params}`);

            if (data.modules?.length) {
                renderModulesGrid('all-modules', data.modules);
                empty.classList.add('hidden');
            } else {
                container.innerHTML = '';
                empty.classList.remove('hidden');
            }
        } catch {
            container.innerHTML = '<div class="loading-placeholder">Error al cargar</div>';
        }
    };

    const renderModulesGrid = (containerId, modules) => {
        const container = document.getElementById(containerId);
        if (!modules.length) {
            container.innerHTML = '<div class="loading-placeholder">No hay módulos</div>';
            return;
        }

        container.innerHTML = modules.map(m => `
            <article class="module-card" data-slug="${m.slug}">
                <div class="module-card-image">
                    ${m.thumbnail ? `<img src="${m.thumbnail}" alt="${m.name}">` :
                `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`}
                </div>
                <div class="module-card-content">
                    <h3 class="module-card-title">${m.name}</h3>
                    <p class="module-card-author">por ${m.author?.username || 'Anónimo'}</p>
                    <p class="module-card-desc">${m.description || ''}</p>
                </div>
                <div class="module-card-footer">
                    <span class="module-card-version">v${m.version}</span>
                    <span class="module-card-downloads">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        ${m.downloads || 0}
                    </span>
                </div>
            </article>
        `).join('');

        container.querySelectorAll('.module-card').forEach(card => {
            card.onclick = () => navigateTo('module-detail', { slug: card.dataset.slug });
        });
    };

    // ===== MODULE DETAIL =====
    const loadModuleDetail = async (slug) => {
        const container = document.getElementById('module-detail-content');
        container.innerHTML = '<div class="loading-placeholder">Cargando...</div>';

        try {
            const data = await API.get(`/modules/${slug}`);
            const m = data.module;
            const isAuthor = Auth.isLoggedIn() && Auth.getUser()?.id === m.author?.id;

            container.innerHTML = `
                <div class="module-detail">
                    <h1>${m.display_name || m.name}</h1>
                    <p class="module-card-author">por ${m.author?.username || 'Anónimo'} · v${m.version}</p>
                    <p style="margin: 1rem 0; color: var(--color-text-muted);">${m.description || ''}</p>
                    ${m.github_url ? `<a href="${m.github_url}" target="_blank" class="btn btn-outline" style="margin-top: 1rem;">Ver en GitHub</a>` : ''}
                    ${isAuthor ? `<button id="sync-module" class="btn btn-primary" style="margin-left: 0.5rem;">Sincronizar</button>` : ''}
                    ${m.documentation ? `<div class="module-docs" style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--color-border);">${m.documentation}</div>` : ''}
                </div>
            `;

            if (isAuthor) {
                document.getElementById('sync-module')?.addEventListener('click', async () => {
                    try {
                        await API.put(`/modules/${slug}`, {});
                        Toast.success('Módulo sincronizado');
                        loadModuleDetail(slug);
                    } catch (e) {
                        Toast.error(e.message || 'Error al sincronizar');
                    }
                });
            }
        } catch {
            container.innerHTML = '<div class="empty-state"><p>Módulo no encontrado</p></div>';
        }
    };

    // ===== MY MODULES =====
    const loadMyModules = async () => {
        const container = document.getElementById('my-modules-list');
        const empty = document.getElementById('my-modules-empty');
        container.innerHTML = '<div class="loading-placeholder">Cargando...</div>';

        try {
            const data = await API.get('/modules/mine');
            const modules = data.modules || [];

            if (modules.length) {
                empty.classList.add('hidden');
                container.innerHTML = modules.map(m => `
                    <div class="my-module-card" data-slug="${m.slug}">
                        <div class="my-module-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                        </div>
                        <div class="my-module-info">
                            <div class="my-module-name">${m.name}</div>
                            <div class="my-module-meta">
                                <span>v${m.version}</span>
                                <span>${m.downloads || 0} descargas</span>
                            </div>
                        </div>
                        <div class="my-module-actions">
                            <button class="btn btn-ghost btn-sync" data-slug="${m.slug}">Sincronizar</button>
                            <button class="btn btn-danger btn-delete" data-slug="${m.slug}">Eliminar</button>
                        </div>
                    </div>
                `).join('');

                // Event listeners
                container.querySelectorAll('.my-module-card').forEach(card => {
                    card.onclick = (e) => {
                        if (!e.target.closest('button')) {
                            navigateTo('module-detail', { slug: card.dataset.slug });
                        }
                    };
                });

                container.querySelectorAll('.btn-sync').forEach(btn => {
                    btn.onclick = async (e) => {
                        e.stopPropagation();
                        try {
                            await API.put(`/modules/${btn.dataset.slug}`, {});
                            Toast.success('Sincronizado');
                            loadMyModules();
                        } catch (err) {
                            Toast.error(err.message || 'Error');
                        }
                    };
                });

                container.querySelectorAll('.btn-delete').forEach(btn => {
                    btn.onclick = async (e) => {
                        e.stopPropagation();
                        if (confirm('¿Eliminar este módulo?')) {
                            try {
                                await API.delete(`/modules/${btn.dataset.slug}`);
                                Toast.success('Eliminado');
                                loadMyModules();
                            } catch (err) {
                                Toast.error(err.message || 'Error');
                            }
                        }
                    };
                });
            } else {
                container.innerHTML = '';
                empty.classList.remove('hidden');
            }
        } catch {
            container.innerHTML = '<div class="loading-placeholder">Error al cargar</div>';
        }
    };

    // ===== UPLOAD =====
    const resetUploadForm = () => {
        stopPolling();
        document.getElementById('upload-form').reset();
        document.getElementById('upload-form').style.display = 'block';
        document.getElementById('webhook-section').classList.add('hidden');
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('submit-btn');
        const githubUrl = document.getElementById('github-url').value.trim();

        if (!githubUrl) {
            Toast.error('URL requerida');
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<div class="spinner"></div> Registrando...';

        try {
            const response = await API.post('/modules', {
                github_url: githubUrl,
                documentation: document.getElementById('module-docs')?.value || ''
            });

            Toast.success('¡Módulo registrado!');

            if (response.webhook_setup) {
                showWebhookSetup(response);
            } else {
                navigateTo('my-modules');
            }
        } catch (error) {
            Toast.error(error.message || 'Error al registrar');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg> Registrar Módulo';
        }
    };

    const showWebhookSetup = (response) => {
        document.getElementById('upload-form').style.display = 'none';

        const section = document.getElementById('webhook-section');
        section.classList.remove('hidden');

        document.getElementById('webhook-module-name').textContent = response.module?.name || 'tu módulo';
        document.getElementById('webhook-url').value = response.webhook_setup.url;
        document.getElementById('webhook-secret').value = response.webhook_setup.secret;

        section.scrollIntoView({ behavior: 'smooth' });

        // Start polling for verification
        if (response.module?.slug) {
            startPolling(response.module.slug);
        }
    };

    const startPolling = (slug) => {
        const statusEl = document.getElementById('webhook-status');
        let attempts = 0;
        const maxAttempts = 60;

        pollInterval = setInterval(async () => {
            attempts++;
            try {
                const data = await API.get(`/modules/${slug}/webhook-status`);
                if (data.verified) {
                    stopPolling();
                    statusEl.innerHTML = `
                        <div class="status-success">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            <span>¡Webhook verificado! Las actualizaciones automáticas están activas.</span>
                        </div>
                    `;
                    Toast.success('¡Webhook configurado correctamente!');
                }
            } catch { }

            if (attempts >= maxAttempts) {
                stopPolling();
                statusEl.innerHTML = `
                    <div class="status-error">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <span>Tiempo agotado. Puedes configurar el webhook más tarde.</span>
                    </div>
                `;
            }
        }, 2000);
    };

    const stopPolling = () => {
        if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
        }
    };

    // ===== SETTINGS =====
    const loadSettings = () => {
        const user = Auth.getUser();
        if (user) {
            document.getElementById('settings-username').value = user.username || '';
            document.getElementById('settings-email').value = user.email || '';
        }
    };

    // ===== MODAL =====
    const openModal = (tab = 'login') => {
        document.getElementById('auth-modal').classList.add('open');
        switchTab(tab);
    };

    const closeModal = () => {
        document.getElementById('auth-modal').classList.remove('open');
        document.getElementById('login-form').reset();
        document.getElementById('register-form').reset();
        document.querySelectorAll('.form-error').forEach(e => e.classList.add('hidden'));
    };

    const switchTab = (tab) => {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
        document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
        document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
    };

    // ===== SAKURA PETALS =====
    const createSakura = () => {
        const container = document.getElementById('sakura-container');
        for (let i = 0; i < 20; i++) {
            const petal = document.createElement('div');
            petal.className = 'sakura-petal';
            petal.style.cssText = `
                width: ${6 + Math.random() * 10}px;
                height: ${6 + Math.random() * 10}px;
                left: ${Math.random() * 100}%;
                animation-duration: ${10 + Math.random() * 10}s;
                animation-delay: ${Math.random() * 10}s;
            `;
            container.appendChild(petal);
        }
    };

    // ===== COPY BUTTONS =====
    const initCopyButtons = () => {
        document.querySelectorAll('.btn-copy').forEach(btn => {
            btn.onclick = async () => {
                const input = document.getElementById(btn.dataset.target);
                if (!input) return;
                try {
                    await navigator.clipboard.writeText(input.value);
                    btn.classList.add('copied');
                    Toast.success('¡Copiado!');
                    setTimeout(() => btn.classList.remove('copied'), 1500);
                } catch {
                    Toast.error('Error al copiar');
                }
            };
        });
    };

    // ===== INIT =====
    const init = async () => {
        // Theme
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.dataset.theme = savedTheme;

        // Check auth
        await Auth.checkAuth();
        Auth.updateUI();

        // Sakura
        createSakura();

        // Copy buttons
        initCopyButtons();

        // Navigation
        document.querySelectorAll('[data-page]').forEach(link => {
            link.onclick = (e) => {
                e.preventDefault();
                navigateTo(link.dataset.page);
            };
        });

        // Theme toggle
        document.getElementById('theme-toggle').onclick = () => {
            const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
            document.documentElement.dataset.theme = theme;
            localStorage.setItem('theme', theme);
        };

        // User menu
        document.getElementById('user-trigger')?.addEventListener('click', () => {
            document.getElementById('user-menu').classList.toggle('open');
        });
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#user-menu')) {
                document.getElementById('user-menu')?.classList.remove('open');
            }
        });

        // Auth modal
        document.getElementById('login-btn').onclick = () => openModal('login');
        document.getElementById('register-btn').onclick = () => openModal('register');
        document.getElementById('hero-register')?.addEventListener('click', () => openModal('register'));
        document.getElementById('modal-close').onclick = closeModal;
        document.getElementById('modal-backdrop').onclick = closeModal;
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.onclick = () => switchTab(tab.dataset.tab);
        });

        // Login
        document.getElementById('login-form').onsubmit = async (e) => {
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
                closeModal();
                Toast.success('¡Bienvenido!');
            } catch (err) {
                error.textContent = err.message || 'Credenciales inválidas';
                error.classList.remove('hidden');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Iniciar Sesión';
            }
        };

        // Register
        document.getElementById('register-form').onsubmit = async (e) => {
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
                closeModal();
                Toast.success('¡Cuenta creada!');
            } catch (err) {
                error.textContent = err.message || 'Error al registrar';
                error.classList.remove('hidden');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Crear Cuenta';
            }
        };

        // Logout
        document.getElementById('logout-btn').onclick = () => Auth.logout();

        // Upload form
        document.getElementById('upload-form').onsubmit = handleUpload;
        document.getElementById('upload-another')?.addEventListener('click', resetUploadForm);

        // Search
        document.getElementById('search-input')?.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => loadModules(e.target.value), 300);
        });

        // Settings
        document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await Auth.updateProfile(document.getElementById('settings-username').value);
                Toast.success('Perfil actualizado');
            } catch (err) {
                Toast.error(err.message || 'Error');
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
                Toast.error(err.message || 'Error');
            }
        });

        document.getElementById('delete-account')?.addEventListener('click', async () => {
            if (confirm('¿Estás seguro? Esta acción es irreversible.')) {
                try {
                    await Auth.deleteAccount();
                    Toast.success('Cuenta eliminada');
                } catch (err) {
                    Toast.error(err.message || 'Error');
                }
            }
        });

        // Load home
        navigateTo('home');
    };

    return { init, navigateTo };
})();

window.App = App;

// Start
document.addEventListener('DOMContentLoaded', App.init);
