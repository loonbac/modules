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
        currentModule = data.module;
        return data;
    };

    const create = (formData) => API.upload('/modules', formData);
    const update = (slug, formData) => API.upload(`/modules/${slug}`, formData);
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
            await getById(slug);
            const m = currentModule;
            container.innerHTML = `
                <div class="module-detail-main">
                    <div class="module-detail-header">
                        <h1 class="module-detail-title">${m.name}</h1>
                        <p class="module-detail-author">por <a href="#">${m.author?.username || 'Anónimo'}</a></p>
                    </div>
                    ${m.images?.length ? `
                        <div class="module-detail-images">
                            ${m.images.map(img => `<div class="module-detail-image"><img src="${img}" alt="Screenshot"></div>`).join('')}
                        </div>
                    ` : ''}
                    <div class="module-detail-docs">${marked ? marked.parse(m.documentation || '') : m.documentation || ''}</div>
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
                    <a href="${API.BASE_URL || 'https://modules-api.loonbac-dev.moe'}/modules/${slug}/download" class="btn btn-primary btn-block" download>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        Descargar
                    </a>
                </aside>
            `;
        } catch (error) {
            container.innerHTML = '<div class="empty-state"><h3 class="empty-title">Módulo no encontrado</h3></div>';
        }
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
            }
        } catch (error) {
            container.innerHTML = '<div class="empty-state"><h3 class="empty-title">Error al cargar</h3></div>';
        }
    };

    return { getAll, getById, create, update, remove, getMyModules, renderModulesList, renderModuleDetail, renderMyModules, setFilter: (f) => filter = f, setSearch: (s) => search = s, setPage: (p) => page = p, getPage: () => page };
})();

window.Modules = Modules;
