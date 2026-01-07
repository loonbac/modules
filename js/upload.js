/**
 * Korosoft Modules - Upload Module
 */
const Upload = (() => {
    let moduleFile = null;
    let imageFiles = [];

    const init = () => {
        const form = document.getElementById('upload-form');
        const moduleZone = document.getElementById('module-upload-zone');
        const moduleInput = document.getElementById('module-file');
        const imagesZone = document.getElementById('images-upload-zone');
        const imagesInput = document.getElementById('module-images');
        const descInput = document.getElementById('module-description');
        const descCount = document.getElementById('desc-count');
        const removeFileBtn = document.getElementById('remove-file');

        // Description counter
        descInput?.addEventListener('input', () => {
            descCount.textContent = descInput.value.length;
        });

        // Module file upload
        const handleModuleFile = (file) => {
            if (!file || !file.name.endsWith('.zip')) {
                Toast.error('Solo se permiten archivos .zip');
                return;
            }
            if (file.size > 16 * 1024 * 1024) {
                Toast.error('El archivo es muy grande (máx 16MB)');
                return;
            }
            moduleFile = file;
            document.getElementById('uploaded-file').classList.remove('hidden');
            document.getElementById('uploaded-file-name').textContent = file.name;
            moduleZone.classList.add('hidden');
        };

        moduleInput?.addEventListener('change', (e) => handleModuleFile(e.target.files[0]));

        moduleZone?.addEventListener('dragover', (e) => {
            e.preventDefault();
            moduleZone.classList.add('dragover');
        });
        moduleZone?.addEventListener('dragleave', () => moduleZone.classList.remove('dragover'));
        moduleZone?.addEventListener('drop', (e) => {
            e.preventDefault();
            moduleZone.classList.remove('dragover');
            handleModuleFile(e.dataTransfer.files[0]);
        });

        removeFileBtn?.addEventListener('click', () => {
            moduleFile = null;
            moduleInput.value = '';
            document.getElementById('uploaded-file').classList.add('hidden');
            moduleZone.classList.remove('hidden');
        });

        // Images upload
        const handleImageFiles = (files) => {
            const validTypes = ['image/png', 'image/jpeg', 'image/gif'];
            const newFiles = Array.from(files).filter(f => {
                if (!validTypes.includes(f.type)) { Toast.error(`${f.name}: tipo no válido`); return false; }
                if (f.size > 5 * 1024 * 1024) { Toast.error(`${f.name}: muy grande (máx 5MB)`); return false; }
                return true;
            });
            if (imageFiles.length + newFiles.length > 5) {
                Toast.error('Máximo 5 imágenes');
                return;
            }
            imageFiles = [...imageFiles, ...newFiles];
            renderImagePreviews();
        };

        const renderImagePreviews = () => {
            const grid = document.getElementById('image-preview-grid');
            grid.innerHTML = imageFiles.map((file, i) => `
                <div class="image-preview" data-index="${i}">
                    <img src="${URL.createObjectURL(file)}" alt="Preview">
                    <button type="button" class="image-preview-remove" data-index="${i}">&times;</button>
                </div>
            `).join('');

            grid.querySelectorAll('.image-preview-remove').forEach(btn => {
                btn.addEventListener('click', () => {
                    imageFiles.splice(parseInt(btn.dataset.index), 1);
                    renderImagePreviews();
                });
            });
        };

        imagesInput?.addEventListener('change', (e) => handleImageFiles(e.target.files));

        imagesZone?.addEventListener('dragover', (e) => {
            e.preventDefault();
            imagesZone.classList.add('dragover');
        });
        imagesZone?.addEventListener('dragleave', () => imagesZone.classList.remove('dragover'));
        imagesZone?.addEventListener('drop', (e) => {
            e.preventDefault();
            imagesZone.classList.remove('dragover');
            handleImageFiles(e.dataTransfer.files);
        });

        // Form submit
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Manual validation for file
            if (!moduleFile) {
                Toast.error('Debes seleccionar un archivo ZIP del módulo');
                return;
            }

            const submitBtn = document.getElementById('submit-btn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Subiendo...';

            try {
                const formData = new FormData();
                formData.append('name', document.getElementById('module-name').value);
                formData.append('display_name', document.getElementById('module-display-name').value);
                formData.append('version', document.getElementById('module-version').value);
                formData.append('category', document.getElementById('module-category').value);
                formData.append('description', document.getElementById('module-description').value);
                formData.append('icon', document.getElementById('module-icon').value);
                formData.append('gradient', document.getElementById('module-gradient').value);
                formData.append('dependencies', document.getElementById('module-dependencies').value);
                formData.append('documentation', document.getElementById('module-docs').value);

                if (moduleFile) formData.append('file', moduleFile);
                imageFiles.forEach((f, i) => formData.append(`image_${i}`, f));

                await Modules.create(formData);
                Toast.success('¡Módulo publicado!');
                form.reset();
                moduleFile = null;
                imageFiles = [];
                document.getElementById('uploaded-file').classList.add('hidden');
                document.getElementById('module-upload-zone').classList.remove('hidden');
                document.getElementById('image-preview-grid').innerHTML = '';
                App.navigateTo('my-modules');
            } catch (error) {
                Toast.error(error.message || 'Error al publicar');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg> Publicar Módulo';
            }
        });
    };

    return { init };
})();

window.Upload = Upload;
