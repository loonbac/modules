/**
 * Korosoft Modules - Upload Module (GitHub-based)
 */
const Upload = (() => {
    const init = () => {
        const form = document.getElementById('upload-form');

        // Form submit
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();

            const githubUrl = document.getElementById('github-url').value.trim();
            if (!githubUrl) {
                Toast.error('La URL de GitHub es requerida');
                return;
            }

            const submitBtn = document.getElementById('submit-btn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Registrando...';

            try {
                const data = {
                    github_url: githubUrl,
                    documentation: document.getElementById('module-docs')?.value || ''
                };

                const response = await Modules.create(data);
                Toast.success('¡Módulo registrado!');
                form.reset();

                // Show webhook setup modal if webhook info is available
                if (response.webhook_setup) {
                    showWebhookSetupModal(response.webhook_setup, response.module?.name || 'tu módulo');
                } else {
                    App.navigateTo('my-modules');
                }
            } catch (error) {
                Toast.error(error.message || 'Error al registrar');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg> Registrar Módulo`;
            }
        });
    };

    const showWebhookSetupModal = (webhookSetup, moduleName) => {
        // Create modal HTML
        const modalHtml = `
            <div class="modal active" id="webhook-modal" style="z-index: 10000;">
                <div class="modal-backdrop" id="webhook-modal-backdrop"></div>
                <div class="modal-container" style="max-width: 600px;">
                    <div class="modal-content">
                        <h2 style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 28px; height: 28px;">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                            <span style="color: var(--color-warning);">¡Paso Importante!</span>
                        </h2>
                        
                        <p style="margin-bottom: 1.5rem; color: var(--color-text-muted);">
                            Para que tu módulo <strong>${moduleName}</strong> se actualice automáticamente cuando hagas push a GitHub, 
                            debes configurar un webhook en tu repositorio.
                        </p>

                        <div style="background: var(--color-bg-tertiary); border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem;">
                            <h4 style="margin-bottom: 1rem; color: var(--color-accent);">Configuración del Webhook</h4>
                            
                            <div style="margin-bottom: 1rem;">
                                <label style="font-size: 0.875rem; color: var(--color-text-muted); display: block; margin-bottom: 0.25rem;">Payload URL:</label>
                                <div style="display: flex; gap: 0.5rem;">
                                    <input type="text" readonly value="${webhookSetup.url}" 
                                        style="flex: 1; padding: 0.75rem; background: var(--color-bg-secondary); border: 1px solid var(--color-border); border-radius: 6px; font-family: 'JetBrains Mono', monospace; font-size: 0.875rem; color: var(--color-text);">
                                    <button type="button" onclick="copyToClipboard('${webhookSetup.url}', this)" class="btn btn-ghost" style="padding: 0.75rem;">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            <div style="margin-bottom: 1rem;">
                                <label style="font-size: 0.875rem; color: var(--color-text-muted); display: block; margin-bottom: 0.25rem;">Secret:</label>
                                <div style="display: flex; gap: 0.5rem;">
                                    <input type="text" readonly value="${webhookSetup.secret}" id="webhook-secret-input"
                                        style="flex: 1; padding: 0.75rem; background: var(--color-bg-secondary); border: 1px solid var(--color-border); border-radius: 6px; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: var(--color-text);">
                                    <button type="button" onclick="copyToClipboard('${webhookSetup.secret}', this)" class="btn btn-ghost" style="padding: 0.75rem;">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            <div>
                                <label style="font-size: 0.875rem; color: var(--color-text-muted); display: block; margin-bottom: 0.25rem;">Content-type:</label>
                                <code style="padding: 0.75rem; display: block; background: var(--color-bg-secondary); border: 1px solid var(--color-border); border-radius: 6px; font-family: 'JetBrains Mono', monospace; font-size: 0.875rem;">${webhookSetup.content_type}</code>
                            </div>
                        </div>

                        <div style="background: rgba(236, 72, 153, 0.1); border: 1px solid rgba(236, 72, 153, 0.3); border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
                            <h5 style="color: var(--color-accent); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                                Instrucciones
                            </h5>
                            <ol style="margin: 0; padding-left: 1.25rem; color: var(--color-text-muted); font-size: 0.875rem; line-height: 1.6;">
                                <li>Ve a tu repositorio en GitHub</li>
                                <li>Settings → Webhooks → Add webhook</li>
                                <li>Pega la <strong>Payload URL</strong> y el <strong>Secret</strong></li>
                                <li>Selecciona Content-type: <strong>application/json</strong></li>
                                <li>En "Which events?" selecciona <strong>Just the push event</strong></li>
                                <li>Haz clic en <strong>Add webhook</strong></li>
                            </ol>
                        </div>

                        <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
                            <p style="margin: 0; color: var(--color-warning); font-size: 0.875rem;">
                                <strong>⚠️ Importante:</strong> Guarda el Secret ahora. No podrás verlo de nuevo después de cerrar este diálogo.
                            </p>
                        </div>

                        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                            <button type="button" onclick="closeWebhookModal()" class="btn btn-primary">
                                Entendido, ir a Mis Módulos
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Close on backdrop click
        document.getElementById('webhook-modal-backdrop').addEventListener('click', closeWebhookModal);
    };

    // Global functions for modal
    window.copyToClipboard = async (text, btn) => {
        try {
            await navigator.clipboard.writeText(text);
            const originalHtml = btn.innerHTML;
            btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            setTimeout(() => btn.innerHTML = originalHtml, 1500);
            Toast.success('¡Copiado!');
        } catch (err) {
            Toast.error('Error al copiar');
        }
    };

    window.closeWebhookModal = () => {
        const modal = document.getElementById('webhook-modal');
        if (modal) {
            modal.remove();
        }
        App.navigateTo('my-modules');
    };

    return { init };
})();

window.Upload = Upload;
