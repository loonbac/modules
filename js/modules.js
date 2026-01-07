/**
 * Korosoft Modules - Modules Management
 */
const Modules = (() => {
    let modules = [];
    let currentModule = null;
    let page = 1;
    let totalPages = 1;
    let filter = 'all';
    let search = '';

    const getAll = async (options = {}) => {
        const params = new URLSearchParams({
            page: options.page || page,
            filter: options.filter || filter,
            search: options.search ?? search,
            limit: 12
        });
        const data = await API.get(`/modules?${params}`);
        modules = data.modules || [];
        totalPages = data.totalPages || 1;
        page = data.page || 1;
        return data;
    };

    const getById = async (slug) => {
        const data = await API.get(`/modules/${slug}`);
        if (!data || !data.module) throw new Error('Datos del módulo inválidos');
        currentModule = data.module;
        return data.module;
    };

    const create = (data) => API.post('/modules', data);
    const update = (slug) => API.put(`/modules/${slug}`, {});
    const remove = (slug) => API.delete(`/modules/${slug}`);
    const getMyModules = () => API.get('/modules/mine');

    const renderModuleCard = (module) => `
        <article class="module-card" data-slug="${module.slug}">
            <div class="module-card-image">
                ${module.thumbnail
            ? `<img src="${module.thumbnail}" alt="${module.name}" loading="lazy">`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`
        }
            </div>
            <div class="module-card-content">
                <h3 class="module-card-title">${module.name}</h3>
                <p class="module-card-author">por ${module.author?.username || 'Anónimo'}</p>
                <p class="module-card-desc">${module.description || ''}</p>
            </div>
            <div class="module-card-footer">
                <span class="module-card-version">v${module.version}</span>
                <span class="module-card-downloads">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    ${module.downloads || 0}
                </span>
            </div>
        </article>
    `;

    const renderModulesList = async (containerId, options = {}) => {
        const container = document.getElementById(containerId);
        const loading = document.getElementById('modules-loading');
        const empty = document.getElementById('modules-empty');
        const pagination = document.getElementById('modules-pagination');

        if (loading) loading.classList.remove('hidden');
        if (empty) empty.classList.add('hidden');
        if (container) container.innerHTML = '';

        try {
            await getAll(options);
            if (loading) loading.classList.add('hidden');

            if (modules.length === 0) {
                if (empty) empty.classList.remove('hidden');
                if (pagination) pagination.classList.add('hidden');
            } else {
                container.innerHTML = modules.map(renderModuleCard).join('');
                if (pagination) {
                    pagination.classList.remove('hidden');
                    document.getElementById('pagination-info').textContent = `Página ${page} de ${totalPages}`;
                    document.getElementById('prev-page').disabled = page <= 1;
                    document.getElementById('next-page').disabled = page >= totalPages;
                }
                // Add click listeners
                container.querySelectorAll('.module-card').forEach(card => {
                    card.addEventListener('click', () => App.navigateTo('module-detail', { slug: card.dataset.slug }));
                });
            }
        } catch (error) {
            if (loading) loading.classList.add('hidden');
            Toast.error('Error al cargar módulos');
        }
    };

    const renderModuleDetail = async (slug) => {
        const container = document.getElementById('module-detail-content');
        container.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Cargando...</p></div>';

        try {
            if (!slug) throw new Error('Slug no proporcionado');

            // Use the module returned by updated getById
            const m = await getById(slug);
            const currentUser = Auth.getUser();
            const isAuthor = currentUser && m.author && currentUser.id === m.author.id;

            container.innerHTML = `
                <div class="module-detail-main">
                    <div class="module-detail-header">
                        <h1 class="module-detail-title">${m.name}</h1>
                        <p class="module-detail-author">por <a href="#">${m.author?.username || 'Anónimo'}</a></p>
                        ${isAuthor ? `
                            <a href="#" class="section-link" id="edit-module-btn" style="display: inline-flex; margin-top: 0.75rem;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                                Editar Módulo
                            </a>
                        ` : ''}
                    </div>
                    ${m.images?.length ? `
                        <div class="module-detail-images">
                            ${m.images.map(img => `<div class="module-detail-image"><img src="${img}" alt="Screenshot"></div>`).join('')}
                        </div>
                    ` : ''}
                    <div class="module-detail-docs">${(typeof marked !== 'undefined' && marked.parse) ? marked.parse(m.documentation || '') : (m.documentation || '')}</div>
                </div>
                <aside class="module-detail-sidebar">
                    <div class="module-sidebar-card">
                        <h4>Información</h4>
                        <div class="module-sidebar-info">
                            <div class="module-sidebar-info-item"><span class="module-sidebar-info-label">Versión</span><span class="module-sidebar-info-value">${m.version}</span></div>
                            <div class="module-sidebar-info-item"><span class="module-sidebar-info-label">Descargas</span><span class="module-sidebar-info-value">${m.downloads || 0}</span></div>
                            <div class="module-sidebar-info-item"><span class="module-sidebar-info-label">Actualizado</span><span class="module-sidebar-info-value">${new Date(m.updated_at).toLocaleDateString('es')}</span></div>
                        </div>
                    </div>
                </aside>
            `;

            // Add edit button listener if author
            if (isAuthor) {
                document.getElementById('edit-module-btn')?.addEventListener('click', () => navigateToEditPage(m));
            }
        } catch (error) {
            console.error('Render details error:', error);
            container.innerHTML = `<div class="empty-state"><h3 class="empty-title">Módulo no encontrado</h3><p class="text-muted" style="font-size:0.9rem;margin-top:0.5rem;">${error.message || ''}</p></div>`;
        }
    };

    const navigateToEditPage = (module) => {
        window.editingModule = module;
        App.navigateTo('edit-module', { slug: module.slug });
    };

    const initEditPage = async (slug) => {
        let module = window.editingModule;
        if (!module || module.slug !== slug) {
            try {
                module = await getById(slug);
            } catch (error) {
                Toast.error('Error al cargar módulo');
                App.navigateTo('my-modules');
                return;
            }
        }

        document.getElementById('edit-module-slug').value = module.slug;
        document.getElementById('edit-module-name').textContent = module.name;
        document.getElementById('edit-module-version').textContent = module.version;

        const githubLink = document.getElementById('edit-module-github');
        if (githubLink && module.github_url) {
            githubLink.href = module.github_url;
            githubLink.textContent = module.github_url.replace('https://github.com/', '');
        }

        document.getElementById('edit-cancel-btn').onclick = () => App.navigateTo('my-modules');
        document.getElementById('edit-back-link').onclick = (e) => { e.preventDefault(); App.navigateTo('my-modules'); };

        document.getElementById('edit-submit-btn').onclick = async () => {
            const submitBtn = document.getElementById('edit-submit-btn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Sincronizando...';

            try {
                const result = await update(module.slug);
                Toast.success(result.message || '¡Módulo sincronizado!');
                window.editingModule = null;
                App.navigateTo('my-modules');
            } catch (error) {
                Toast.error(error.message || 'Error al sincronizar');
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"></path></svg> Sincronizar desde GitHub`;
            }
        };
    };

    const incrementVersion = (version) => {
        const parts = version.split('.').map(Number);
        parts[2] = (parts[2] || 0) + 1;
        return parts.join('.');
    };

    const renderMyModules = async () => {
        const container = document.getElementById('my-modules-list');
        const empty = document.getElementById('my-modules-empty');
        container.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Cargando...</p></div>';

        try {
            const data = await getMyModules();
            const myModules = data.modules || [];

            if (myModules.length === 0) {
                container.innerHTML = '';
                empty.classList.remove('hidden');
            } else {
                empty.classList.add('hidden');
                container.innerHTML = myModules.map(m => `
                    <div class="my-module-item" data-slug="${m.slug}">
                        <div class="my-module-image">
                            ${m.thumbnail ? `<img src="${m.thumbnail}" alt="${m.name}">` : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`}
                        </div>
                        <div class="my-module-info">
                            <h3 class="my-module-title">${m.name}</h3>
                            <div class="my-module-meta">
                                <span>v${m.version}</span>
                                <span>${m.downloads || 0} descargas</span>
                            </div>
                        </div>
                        <div class="my-module-actions">
                            <button class="btn btn-ghost edit-module" data-slug="${m.slug}">Editar</button>
                            <button class="btn btn-danger delete-module" data-slug="${m.slug}">Eliminar</button>
                        </div>
                    </div>
                `).join('');

                container.querySelectorAll('.delete-module').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        if (confirm('¿Eliminar este módulo?')) {
                            try {
                                await remove(btn.dataset.slug);
                                Toast.success('Módulo eliminado');
                                renderMyModules();
                            } catch { Toast.error('Error al eliminar'); }
                        }
                    });
                });

                // Edit button - open modal directly
                container.querySelectorAll('.edit-module').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        try {
                            const m = await getById(btn.dataset.slug);
                            navigateToEditPage(m);
                        } catch (error) {
                            Toast.error('Error al cargar módulo');
                        }
                    });
                });

                // Click on module item to view details
                container.querySelectorAll('.my-module-item').forEach(item => {
                    item.addEventListener('click', () => {
                        App.navigateTo('module-detail', { slug: item.dataset.slug });
                    });
                    item.style.cursor = 'pointer';
                });
            }
        } catch (error) {
            container.innerHTML = '<div class="empty-state"><h3 class="empty-title">Error al cargar</h3></div>';
        }
    };

    return { getAll, getById, create, update, remove, getMyModules, renderModulesList, renderModuleDetail, renderMyModules, initEditPage, setFilter: (f) => filter = f, setSearch: (s) => search = s, setPage: (p) => page = p, getPage: () => page };
})();

window.Modules = Modules;
