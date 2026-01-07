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
    const update = (slug, formData) => API.uploadPut(`/modules/${slug}`, formData);
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
            const data = await getById(slug);
            const m = currentModule;

            if (!m) {
                throw new Error('Módulo no encontrado');
            }

            const currentUser = Auth.getUser();
            const isAuthor = currentUser && m.author && currentUser.id === m.author.id;

            container.innerHTML = `
                <div class="module-detail-main">
                    <div class="module-detail-header">
                        <h1 class="module-detail-title">${m.name}</h1>
                        <p class="module-detail-author">por <a href="#">${m.author?.username || 'Anónimo'}</a></p>
                        ${isAuthor ? `
                            <button class="btn btn-secondary" id="edit-module-btn" style="margin-top: 1rem;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;margin-right:0.5rem;">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                                Editar Módulo
                            </button>
                        ` : ''}
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

            // Add edit button listener if author
            if (isAuthor) {
                document.getElementById('edit-module-btn')?.addEventListener('click', () => openEditModal(m));
            }
        } catch (error) {
            container.innerHTML = '<div class="empty-state"><h3 class="empty-title">Módulo no encontrado</h3></div>';
        }
    };

    const openEditModal = (module) => {
        // Create edit modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'edit-module-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content" style="max-width: 600px;">
                <button class="modal-close" id="close-edit-modal">&times;</button>
                <h2 class="modal-title">Editar Módulo</h2>
                <form id="edit-module-form">
                    <div class="form-group">
                        <label class="form-label">Nombre</label>
                        <input type="text" class="form-input" id="edit-name" value="${module.name}" readonly style="opacity: 0.7;">
                        <span class="form-hint">El nombre no se puede cambiar</span>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Nueva Versión *</label>
                        <input type="text" class="form-input" id="edit-version" value="${module.version}" required pattern="^\\d+\\.\\d+\\.\\d+$">
                        <span class="form-hint">Incrementa la versión (ej: ${incrementVersion(module.version)})</span>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Descripción</label>
                        <textarea class="form-textarea" id="edit-description" rows="3">${module.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Documentación (Markdown)</label>
                        <textarea class="form-textarea code" id="edit-documentation" rows="10">${module.documentation || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Nuevo archivo ZIP (opcional)</label>
                        <input type="file" class="form-input" id="edit-file" accept=".zip" style="padding: 0.5rem;">
                        <span class="form-hint">Solo si quieres actualizar el código del módulo</span>
                    </div>
                    <div class="form-actions" style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                        <button type="button" class="btn btn-ghost" id="cancel-edit-btn">Cancelar</button>
                        <button type="submit" class="btn btn-primary" id="save-edit-btn">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        // Close modal handlers
        const closeModal = () => modal.remove();
        modal.querySelector('.modal-overlay').addEventListener('click', closeModal);
        modal.querySelector('#close-edit-modal').addEventListener('click', closeModal);
        modal.querySelector('#cancel-edit-btn').addEventListener('click', closeModal);

        // Form submit
        modal.querySelector('#edit-module-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const saveBtn = modal.querySelector('#save-edit-btn');
            saveBtn.disabled = true;
            saveBtn.textContent = 'Guardando...';

            try {
                const formData = new FormData();
                formData.append('version', modal.querySelector('#edit-version').value);
                formData.append('description', modal.querySelector('#edit-description').value);
                formData.append('documentation', modal.querySelector('#edit-documentation').value);

                const fileInput = modal.querySelector('#edit-file');
                if (fileInput.files[0]) {
                    formData.append('file', fileInput.files[0]);
                }

                await update(module.slug, formData);
                Toast.success('¡Módulo actualizado!');
                closeModal();
                renderModuleDetail(module.slug); // Refresh detail view
            } catch (error) {
                Toast.error(error.message || 'Error al actualizar');
                saveBtn.disabled = false;
                saveBtn.textContent = 'Guardar Cambios';
            }
        });
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

                // Edit button - navigate to module detail
                container.querySelectorAll('.edit-module').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        App.navigateTo('module-detail', { slug: btn.dataset.slug });
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

    return { getAll, getById, create, update, remove, getMyModules, renderModulesList, renderModuleDetail, renderMyModules, setFilter: (f) => filter = f, setSearch: (s) => search = s, setPage: (p) => page = p, getPage: () => page };
})();

window.Modules = Modules;
