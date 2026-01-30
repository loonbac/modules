/**
 * Korosoft Modules - Upload Module (GitHub-based)
 */
const Upload = (() => {
    let pollInterval = null;

    const init = () => {
        const form = document.getElementById('upload-form');
        const webhookSection = document.getElementById('webhook-setup-section');
        const uploadAnotherBtn = document.getElementById('upload-another-btn');

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

                // Show webhook setup section if webhook info is available
                if (response.webhook_setup && webhookSection) {
                    // Hide the form
                    form.style.display = 'none';

                    // Populate webhook info
                    const moduleName = response.module?.name || 'tu módulo';
                    const moduleSlug = response.module?.slug;

                    document.getElementById('webhook-module-name').textContent = moduleName;
                    document.getElementById('webhook-url').value = response.webhook_setup.url;
                    document.getElementById('webhook-secret').value = response.webhook_setup.secret;

                    // Show the webhook section
                    webhookSection.classList.remove('hidden');

                    // Scroll to the section
                    webhookSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

                    // Start polling for webhook verification
                    if (moduleSlug) {
                        startWebhookVerificationPolling(moduleSlug);
                    }
                } else {
                    form.reset();
                    App.navigateTo('my-modules');
                }
            } catch (error) {
                Toast.error(error.message || 'Error al registrar');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg> Registrar Módulo`;
            }
        });

        // Upload another button - reset form and hide webhook section
        uploadAnotherBtn?.addEventListener('click', () => {
            stopPolling();
            form.reset();
            form.style.display = 'block';
            webhookSection.classList.add('hidden');
            resetVerificationStatus();
            document.getElementById('github-url').focus();
        });

        // Copy buttons
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const targetId = btn.dataset.target;
                const input = document.getElementById(targetId);
                if (!input) return;

                try {
                    await navigator.clipboard.writeText(input.value);
                    const originalHtml = btn.innerHTML;
                    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                    Toast.success('¡Copiado!');
                    setTimeout(() => btn.innerHTML = originalHtml, 1500);
                } catch (err) {
                    Toast.error('Error al copiar');
                }
            });
        });
    };

    const startWebhookVerificationPolling = (slug) => {
        const statusEl = document.getElementById('webhook-verification-status');
        if (statusEl) {
            statusEl.classList.remove('hidden');
            statusEl.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--color-warning);">
                    <div class="spinner" style="width: 18px; height: 18px; border-width: 2px;"></div>
                    <span>Esperando verificación del webhook de GitHub...</span>
                </div>
            `;
        }

        let attempts = 0;
        const maxAttempts = 60; // 60 * 2 seconds = 2 minutes max

        pollInterval = setInterval(async () => {
            attempts++;

            try {
                const response = await API.get(`/modules/${slug}/webhook-status`);

                if (response.verified) {
                    stopPolling();
                    if (statusEl) {
                        statusEl.innerHTML = `
                            <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--color-success);">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                                <span>¡Webhook verificado correctamente! GitHub puede enviar actualizaciones.</span>
                            </div>
                        `;
                    }
                    Toast.success('¡Webhook configurado correctamente!');
                }
            } catch (error) {
                console.log('Polling error:', error);
            }

            if (attempts >= maxAttempts) {
                stopPolling();
                if (statusEl) {
                    statusEl.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--color-text-muted);">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <span>Tiempo de espera agotado. Puedes configurar el webhook más tarde.</span>
                        </div>
                    `;
                }
            }
        }, 2000); // Check every 2 seconds
    };

    const stopPolling = () => {
        if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
        }
    };

    const resetVerificationStatus = () => {
        const statusEl = document.getElementById('webhook-verification-status');
        if (statusEl) {
            statusEl.classList.add('hidden');
            statusEl.innerHTML = '';
        }
    };

    return { init };
})();

window.Upload = Upload;
