let extractedColors = [];

document.addEventListener('DOMContentLoaded', function() {
    setupForm();
});

function setupForm() {
    const form = document.getElementById('uploadForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
        
        const fileInput = document.getElementById('imageInput');
        if (fileInput) {
            fileInput.addEventListener('change', handleFileSelect);
        }
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const label = document.getElementById('fileLabel');
    if (label) {
        label.textContent = `Выбран: ${file.name}`;
        label.classList.add('file-selected');
    }
    
    showImagePreview(file);
}

function showImagePreview(file) {
    const previewArea = document.querySelector('.image-preview');
    if (!previewArea) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        previewArea.innerHTML = `
            <img src="${e.target.result}" alt="Превью">
            <p>Размер: ${(file.size / 1024 / 1024).toFixed(2)} MB</p>
        `;
        previewArea.classList.add('has-preview');
    };
    reader.readAsDataURL(file);
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const imageInput = document.getElementById('imageInput');
    
    if (!imageInput.files || imageInput.files.length === 0) {
        showNotification('Выберите изображение', 'error');
        return;
    }
    
    const file = imageInput.files[0];
    
    const validationResult = validateImageFile(file);
    if (!validationResult.valid) {
        showNotification(validationResult.message, 'error');
        return;
    }
    
    const count = parseInt(document.getElementById('colorCount').value);
    if (count < 1 || count > 20) {
        showNotification('Количество цветов должно быть от 1 до 10', 'error');
        return;
    }
    
    const submitButton = document.getElementById('submitButton');
    const originalText = submitButton.innerHTML;
    
    submitButton.innerHTML = '<span class="loading-spinner"></span>Загрузка и обработка...';
    submitButton.disabled = true;
    
    showProgressBar();
    
    try {
        const uploadFormData = new FormData();
        uploadFormData.append('image', file);
        uploadFormData.append('count', count);
        
        const csrfToken = getCookie('csrftoken');
        
        const response = await fetch('/api/image/extract/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken,
            },
            body: uploadFormData,
            credentials: 'same-origin'
        });
        
        if (response.status === 405) {
            throw new Error('Метод POST не разрешен. Пожалуйста, проверьте настройки сервера.');
        }
        
        if (response.status === 429) {
            const data = await response.json();
            throw new Error(data.error || 'Превышен лимит запросов. Попробуйте позже.');
        }
        
        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        extractedColors = data.colors || [];
        displayExtractedColors();
        
        showNotification(`Успешно извлечено ${data.count} цветов из ${data.filename}`, 'success');
        
        updateProgressBar(100, 'Завершено');
        
        setTimeout(() => {
            hideProgressBar();
        }, 1000);
        
    } catch (error) {
        console.error('Ошибка при извлечении цветов:', error);
        hideProgressBar();
        
        if (error.message.includes('405') || error.message.includes('не разрешен')) {
            showNotification('Ошибка сервера: Метод POST не разрешен для этого URL', 'error');
        } else {
            showNotification(`Ошибка: ${error.message}`, 'error');
        }
    } finally {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

function validateImageFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        return {
            valid: false,
            message: 'Поддерживаются только JPG, PNG, GIF и WEBP изображения'
        };
    }
    
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        return {
            valid: false,
            message: `Размер изображения не должен превышать 10MB`
        };
    }
    
    return { valid: true, message: '' };
}

function displayExtractedColors() {
    const colorsContainer = document.getElementById('colors');
    const hexContainer = document.getElementById('hex');
    
    if (!colorsContainer || !hexContainer) {
        console.error('Контейнеры для цветов не найдены');
        return;
    }
    
    colorsContainer.innerHTML = '';
    hexContainer.innerHTML = '';
    
    extractedColors.forEach((color, index) => {
        const colorBox = document.createElement('div');
        colorBox.className = 'color-box';
        colorBox.style.backgroundColor = color;
        colorBox.title = `${color}`;
        colorBox.setAttribute('data-color', color);
        colorBox.onclick = () => copyColor(color);
        colorsContainer.appendChild(colorBox);
        
        const hexSpan = document.createElement('span');
        hexSpan.textContent = color;
        hexSpan.title = `Нажмите для копирования: ${color}`;
        hexSpan.style.cursor = 'pointer';
        hexSpan.onclick = () => copyColor(color);
        hexContainer.appendChild(hexSpan);
    });
    
    const paletteSection = document.querySelector('.palette-section');
    if (paletteSection) {
        paletteSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function showProgressBar() {
    const progressBar = document.getElementById('upload-progress');
    if (progressBar) {
        progressBar.style.display = 'block';
        progressBar.innerHTML = `
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <div class="progress-text">0%</div>
            </div>
        `;
    }
}

function updateProgressBar(percent, text) {
    const progressBar = document.getElementById('upload-progress');
    if (progressBar) {
        const fill = progressBar.querySelector('.progress-fill');
        const textEl = progressBar.querySelector('.progress-text');
        if (fill) fill.style.width = `${percent}%`;
        if (textEl) textEl.textContent = text || `${percent}%`;
    }
}

function hideProgressBar() {
    const progressBar = document.getElementById('upload-progress');
    if (progressBar) {
        progressBar.style.display = 'none';
    }
}

function copyColor(color) {
    navigator.clipboard.writeText(color)
        .then(() => {
            showNotification(`Цвет ${color} скопирован в буфер обмена!`);
        })
        .catch(err => {
            console.error('Ошибка копирования:', err);
            showNotification(`Цвет ${color} скопирован!`);
        });
}

// Копирование всех цветов
function copyAll() {
    if (extractedColors.length === 0) {
        showNotification('Нет цветов для копирования', 'error');
        return;
    }
    
    const colorsText = extractedColors.join(', ');
    navigator.clipboard.writeText(colorsText)
        .then(() => {
            showNotification(`Все ${extractedColors.length} цветов скопированы!`);
        })
        .catch(err => {
            console.error('Ошибка копирования:', err);
            showNotification('Не удалось скопировать цвета', 'error');
        });
}

// Вспомогательные функции
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function showNotification(message, type = 'info') {
    const oldNotification = document.querySelector('.notification');
    if (oldNotification) {
        oldNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 4000);
}

// Загрузка сохраненных палитр изображений
async function loadImagePalettes() {
    try {
        const response = await fetch(`/api/image/${username}/`);
        if (!response.ok) {
            throw new Error(`Ошибка: ${response.status}`);
        }
        const palettes = await response.json();

        showPalettesPopup(palettes);
    } catch (e) {
        console.error(e);
        showNotification('Не удалось загрузить сохранённые палитры', 'error');
    }
}

// Показать попап с сохраненными палитрами (с превью)
function showPalettesPopup(palettes) {
    const oldPopup = document.getElementById('palettes-popup');
    if (oldPopup) oldPopup.remove();

    const popup = document.createElement('div');
    popup.id = 'palettes-popup';
    
    popup.innerHTML = `
        <h2>Сохранённые палитры</h2>
        <div class="user-info">
            <img src="${avatar || '/static/img/default-avatar.png'}" alt="Аватар">
            <p><strong>Пользователь:</strong> ${username}</p>
        </div>
        <div id="saved-palettes-list">
            ${palettes.length > 0 ? palettes.map(p => `
                <div data-palette-id="${p.id}" class="saved-palette-item">
                    <div class="palette-header">
                        <strong>${p.image_name}</strong>
                        <div class="palette-buttons">
                            <button class="delete-btn" onclick="deleteImagePalette(${p.id})">
                                <img src="/static/img/delete.png" alt="Delete"> Удалить
                            </button>
                        </div>
                    </div>
                    ${p.preview ? `<img src="${p.preview}" alt="Превью изображения" class="palette-preview">` : ''}
                    <div class="palette-colors">
                        ${p.colors.map(c => `
                            <span class="color-box" style="background-color: ${c};" title="${c}" onclick="copyColor('${c}')"></span>
                        `).join('')}
                    </div>
                    <button class="saved-copy-button" onclick="copySavedImagePalette(${p.id}, '${p.image_name.replace(/'/g, "\\'")}')">
                        <img src="/static/img/copy.png" alt="Copy">Скопировать все
                    </button>
                </div>
            `).join('') : '<p>Нет сохраненных палитр</p>'}
        </div>
        <button onclick="closePalettesPopup()" class="close-popup-btn">Закрыть</button>
    `;
    document.body.appendChild(popup);
}

// Закрыть попап
function closePalettesPopup() {
    const popup = document.getElementById('palettes-popup');
    if (popup) popup.remove();
}

// Удалить палитру изображения (без подтверждения)
async function deleteImagePalette(paletteId) {
    try {
        const response = await fetch(`/api/image/${username}/${paletteId}/delete/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
            }
        });

        if (!response.ok) {
            throw new Error(`Ошибка: ${response.status}`);
        }

        // Удаляем элемент из DOM
        const popup = document.getElementById('palettes-popup');
        if (popup) {
            const item = popup.querySelector(`[data-palette-id="${paletteId}"]`);
            if (item) {
                item.remove();
            }

            const list = popup.querySelector('#saved-palettes-list');
            if (list.children.length === 0) {
                list.innerHTML = '<p>Нет сохраненных палитр</p>';
            }
        }

        showNotification('Палитра удалена');
    } catch (e) {
        console.error(e);
        showNotification('Не удалось удалить палитру', 'error');
    }
}

// Копировать все цвета из сохраненной палитры изображения
function copySavedImagePalette(paletteId, paletteName) {
    const popup = document.getElementById('palettes-popup');
    if (!popup) return;
    
    const paletteDiv = popup.querySelector(`[data-palette-id="${paletteId}"]`);
    if (!paletteDiv) return;
    
    const colorBoxes = paletteDiv.querySelectorAll('.palette-colors .color-box');
    const colors = Array.from(colorBoxes).map(box => box.title);
    
    if (colors.length > 0) {
        const colorsText = colors.join(', ');
        navigator.clipboard.writeText(colorsText)
            .then(() => {
                showNotification(`Цвета палитры "${paletteName}" скопированы!`);
            })
            .catch(err => {
                console.error('Ошибка копирования:', err);
                showNotification('Не удалось скопировать цвета', 'error');
            });
    } else {
        showNotification('В палитре нет цветов для копирования', 'error');
    }
}