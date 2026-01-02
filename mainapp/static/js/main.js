let palettesData = {};
let savedPalettes = {};

// При загрузке страницы сразу генерируем случайные палитры
document.addEventListener('DOMContentLoaded', function() {
    generateRandomAll();
});

document.getElementById('colorPicker').addEventListener('input', function() {
    document.getElementById('colorInput').value = this.value;
});

document.getElementById('colorInput').addEventListener('input', function() {
    const color = this.value;
    if (/^#[0-9A-F]{6}$/i.test(color)) {
        document.getElementById('colorPicker').value = color;
    }
});

function randomColor() {
    const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    document.getElementById('colorInput').value = randomColor;
    document.getElementById('colorPicker').value = randomColor;
}

async function generatePalette() {
    const baseColor = document.getElementById('colorInput').value;

    if (!baseColor) {
        showNotification('Введите цвет', 'error');
        return;
    }

    let cleanColor = baseColor;
    if (cleanColor.startsWith('#')) {
        cleanColor = cleanColor.substring(1);
    }

    if (!/^[0-9A-F]{6}$/i.test(cleanColor)) {
        showNotification('Введите цвет в формате #FFFFFF', 'error');
        return;
    }

    try {
        const response = await fetch(`/api/palettes/generate/?base=${cleanColor}`);
        if (!response.ok) {
            throw new Error(`Ошибка: ${response.status}`);
        }
        const data = await response.json();

        palettesData = data;
        displayPalettes(data);
    } catch (e) {
        console.error(e);
        showNotification('Не удалось загрузить палитру', 'error');
    }
}

async function generateRandomAll() {
    try {
        const response = await fetch('/api/palettes/random/');
        if (!response.ok) {
            throw new Error(`Ошибка: ${response.status}`);
        }
        const data = await response.json();

        palettesData = data;
        displayPalettes(data);
    } catch (e) {
        console.error(e);
        showNotification('Не удалось загрузить случайные палитры', 'error');
    }
}

async function generateRandom(type) {
    try {
        const response = await fetch('/api/palettes/random/');
        if (!response.ok) {
            throw new Error(`Ошибка: ${response.status}`);
        }
        const data = await response.json();

        palettesData = data;
        displaySinglePalette(type, data[type]);
        
        // Сбрасываем состояние кнопки сохранения только если пользователь авторизован
        if (username) {
            resetSaveButton(type);
        }
    } catch (e) {
        console.error(e);
        showNotification(`Не удалось загрузить палитру ${type}`, 'error');
    }
}

function resetSaveButton(type) {
    const saveButton = document.getElementById(`save-${type}`);
    if (saveButton) {
        saveButton.classList.remove('saved');
        saveButton.innerHTML = '<img src="/static/img/save.png" alt="Save">Сохранить';
        if (savedPalettes[type]) {
            delete savedPalettes[type];
        }
    }
}

function showNotification(message, type = 'info') {
    // Удаляем старое уведомление, если есть
    const oldNotification = document.querySelector('.notification');
    if (oldNotification) {
        oldNotification.remove();
    }
    
    // Создаем новое уведомление
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Показываем уведомление
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Скрываем через 3 секунды
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

async function savePalette(type) {
    // Проверяем авторизацию
    if (!username) {
        showNotification('Вы не авторизованы. Авторизуйтесь для сохранения палитр.', 'error');
        return;
    }
    
    const colors = palettesData[type];
    const saveButton = document.getElementById(`save-${type}`);
    
    if (!saveButton) {
        showNotification('Кнопка сохранения не найдена', 'error');
        return;
    }
    
    // Если палитра уже сохранена - удаляем ее
    if (saveButton.classList.contains('saved') && savedPalettes[type]) {
        await deletePaletteById(savedPalettes[type].id, type);
        return;
    }
    
    if (!colors || !Array.isArray(colors)) {
        showNotification(`Нет данных для сохранения ${type}`, 'error');
        return;
    }

    const paletteNameInput = document.getElementById(`${type}Name`);
    const paletteName = paletteNameInput.value || `${type}_${new Date().toLocaleString()}`;

    if (!paletteName) {
        showNotification('Имя палитры не может быть пустым', 'error');
        return;
    }

    const payload = {
        name: paletteName,
        colors: colors
    };

    try {
        const response = await fetch(`/api/palettes/${username}/save/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Ошибка: ${response.status}`);
        }

        const result = await response.json();
        
        // Сохраняем информацию о сохраненной палитре
        savedPalettes[type] = {
            id: result.id,
            colors: colors
        };
        
        // Меняем состояние кнопки
        saveButton.classList.add('saved');
        saveButton.innerHTML = '<img src="/static/img/save.png" alt="Saved">Сохранено';
        
        showNotification(`Палитра "${paletteName}" сохранена!`);
    } catch (e) {
        console.error(e);
        showNotification(`Не удалось сохранить палитру ${paletteName}`, 'error');
    }
}

async function deletePaletteById(paletteId, type = null) {
    if (!username) {
        showNotification('Вы не авторизованы', 'error');
        return;
    }

    try {
        const response = await fetch(`/api/palettes/${username}/${paletteId}/delete/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
            }
        });

        if (!response.ok) {
            throw new Error(`Ошибка: ${response.status}`);
        }

        // Если передан тип, сбрасываем кнопку
        if (type && savedPalettes[type]) {
            const saveButton = document.getElementById(`save-${type}`);
            if (saveButton) {
                saveButton.classList.remove('saved');
                saveButton.innerHTML = '<img src="/static/img/save.png" alt="Save">Сохранить';
            }
            delete savedPalettes[type];
        }
        
        // Если открыт попап с сохраненными палитрами, обновляем его
        const popup = document.getElementById('palettes-popup');
        if (popup) {
            const item = popup.querySelector(`[data-palette-id="${paletteId}"]`);
            if (item) {
                item.remove();
            }
            
            // Если больше нет палитр, показываем сообщение
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

function displaySinglePalette(type, colors) {
    const colorsContainer = document.getElementById(`${type}-colors`);
    const hexContainer = document.getElementById(`${type}-hex`);

    if (colorsContainer && hexContainer && colors && Array.isArray(colors)) {
        colorsContainer.innerHTML = '';
        hexContainer.innerHTML = '';

        colors.forEach(color => {
            const box = document.createElement('div');
            box.className = 'color-box';
            box.style.backgroundColor = color;
            box.title = color;
            box.onclick = () => copyColor(color);
            colorsContainer.appendChild(box);
        });

        hexContainer.innerHTML = colors.map(color => 
            `<span>${color}</span>`
        ).join('');
    }
}

function displayPalettes(data) {
    for (const type of ['monochromatic', 'analogous', 'complementary', 'triadic']) {
        const colorsContainer = document.getElementById(`${type}-colors`);
        const hexContainer = document.getElementById(`${type}-hex`);

        if (colorsContainer && hexContainer) {
            colorsContainer.innerHTML = '';
            hexContainer.innerHTML = '';

            const colors = data[type];
            if (colors && Array.isArray(colors)) {
                colors.forEach(color => {
                    const box = document.createElement('div');
                    box.className = 'color-box';
                    box.style.backgroundColor = color;
                    box.title = color;
                    box.onclick = () => copyColor(color);
                    colorsContainer.appendChild(box);
                });

                hexContainer.innerHTML = colors.map(color => 
                    `<span>${color}</span>`
                ).join('');
            }
        }
        
        // Сбрасываем состояние кнопок сохранения только для авторизованных пользователей
        if (username) {
            resetSaveButton(type);
        }
    }
}

// COPY
function copyColor(color) {
    navigator.clipboard.writeText(color)
        .then(() => {
            showNotification(`Цвет ${color} скопирован!`);
        })
        .catch(err => {
            console.error('Ошибка копирования: ', err);
            showNotification('Не удалось скопировать цвет', 'error');
        });
}

function copyAll(type) {
    const hexContainer = document.getElementById(`${type}-hex`);
    if (hexContainer) {
        const colorsText = hexContainer.textContent;
        if (colorsText) {
            navigator.clipboard.writeText(colorsText)
                .then(() => {
                    showNotification(`Цвета ${type} скопированы!`);
                })
                .catch(err => {
                    console.error('Ошибка копирования: ', err);
                    showNotification('Не удалось скопировать цвета', 'error');
                });
        } else {
            showNotification(`Нет цветов для ${type}`, 'error');
        }
    } else {
        showNotification(`Не найден контейнер для ${type}`, 'error');
    }
}

// Функция для копирования всех цветов из сохраненной палитры
function copySavedPalette(paletteId, paletteName) {
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
                console.error('Ошибка копирования: ', err);
                showNotification('Не удалось скопировать цвета', 'error');
            });
    } else {
        showNotification('В палитре нет цветов для копирования', 'error');
    }
}

// showSavedPalettes
async function showSavedPalettes() {
    if (!username) {
        showNotification('Вы не авторизованы', 'error');
        return;
    }

    try {
        const response = await fetch(`/api/palettes/${username}/`);
        if (!response.ok) {
            throw new Error(`Ошибка: ${response.status}`);
        }
        const palettes = await response.json();

        showPalettesPopup(username, palettes);
    } catch (e) {
        console.error(e);
        showNotification('Не удалось загрузить сохранённые палитры', 'error');
    }
}

function showPalettesPopup(username, palettes) {
    const oldPopup = document.getElementById('palettes-popup');
    if (oldPopup) oldPopup.remove();

    const popup = document.createElement('div');
    popup.id = 'palettes-popup';
    
    popup.innerHTML = `
        <h2>Сохранённые палитры</h2>
        <div class="user-info">
            <img src="${avatar}" alt="Аватар">
            <p><strong>Пользователь:</strong> ${username}</p>
        </div>
        <div id="saved-palettes-list">
            ${palettes.length > 0 ? palettes.map(p => `
                <div data-palette-id="${p.id}">
                    <strong>${p.name}</strong>
                    <div class="palette-buttons">
                        <button class="delete-btn" onclick="deletePalette(${p.id})">Удалить</button>
                    </div>
                    <div class="palette-colors">
                        ${p.colors.map(c => `
                            <span class="color-box" style="background-color: ${c};" title="${c}" onclick="copyColor('${c}')"></span>
                        `).join('')}
                    </div>
                    <button class="saved-copy-button" onclick="copySavedPalette(${p.id}, '${p.name.replace(/'/g, "\\'")}')">
                        <img src="/static/img/copy.png" alt="Copy">Скопировать все
                    </button>
                </div>
            `).join('') : '<p>Нет сохраненных палитр</p>'}
        </div>
        <button onclick="closePalettesPopup()">Закрыть</button>
    `;
    document.body.appendChild(popup);
}

function closePalettesPopup() {
    const popup = document.getElementById('palettes-popup');
    if (popup) popup.remove();
}

async function deletePalette(paletteId) {
    await deletePaletteById(paletteId);
}