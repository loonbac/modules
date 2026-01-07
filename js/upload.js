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

                await Modules.create(data);
                Toast.success('¡Módulo registrado!');
                form.reset();
                App.navigateTo('my-modules');
            } catch (error) {
                Toast.error(error.message || 'Error al registrar');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg> Registrar Módulo`;
            }
        });
    };

    return { init };
})();

window.Upload = Upload;
