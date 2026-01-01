let palettesData = {};

function randomColor() {
    const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    document.getElementById('colorInput').value = randomColor;
    document.getElementById('colorPicker').value = randomColor;

    hideError();
}

async function generatePalette() {
    const baseColor = document.getElementById('colorInput').value;

    if (!baseColor) {
        showError('Введите цвет');
        return;
    }

    let cleanColor = baseColor;
    if (cleanColor.startsWith('#')) {
        cleanColor = cleanColor.substring(1);
    }

    if (!/^[0-9A-F]{6}$/i.test(cleanColor)) {
        showError('Введите цвет в формате #FFFFFF');
        return;
    }

    try {
        const response = await fetch(`/api/palettes/generate/?base=${cleanColor}`);//url
        if (!response.ok) {
            throw new Error(`Ошибка: ${response.status}`);
        }
        const data = await response.json();

        palettesData = data;
        displayPalettes(data);
        hideError();
    } catch (e) {
        console.error(e);
        showError('Не удалось загрузить палитру');
    }
}

async function generateRandomAll() {
    try {
        const response = await fetch('/api/palettes/random/');//url
        if (!response.ok) {
            throw new Error(`Ошибка: ${response.status}`);
        }
        const data = await response.json();

        palettesData = data;
        displayPalettes(data);
        hideError();
    } catch (e) {
        console.error(e);
        showError('Не удалось загрузить случайные палитры');
    }
}

async function generateRandom(type) {
    try {
        const response = await fetch('/api/palettes/random/');//url
        if (!response.ok) {
            throw new Error(`Ошибка: ${response.status}`);
        }
        const data = await response.json();

        palettesData = data;

        displaySinglePalette(type, data[type]);
        hideError();
    } catch (e) {
        console.error(e);
        showError(`Не удалось загрузить палитру ${type}`);
    }
}

// save
async function savePalette(type) {
    const colors = palettesData[type];
    if (!colors || !Array.isArray(colors)) {
        showError(`Нет данных для сохранения ${type}`);
        return;
    }

    const paletteNameInput = document.getElementById(`${type}Name`);
    const paletteName = paletteNameInput.value || `${type}_${new Date().toLocaleString()}`;

    if (!paletteName) {
        alert('Имя палитры не может быть пустым');
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
        alert(`Палитра ${paletteName} сохранена!`);
    } catch (e) {
        console.error(e);
        showError(`Не удалось сохранить палитру ${paletteName}`);
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
// display
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

        hexContainer.textContent = colors.join(', ');
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

                hexContainer.textContent = colors.join(', ');
            }
        }
    }
}

// COPY
function copyColor(color) {
    navigator.clipboard.writeText(color);
    alert(`Цвет ${color} скопирован!`);
}

function copyAll(type) {
    const hexContainer = document.getElementById(`${type}-hex`);
    if (hexContainer) {
        const colorsText = hexContainer.textContent;
        if (colorsText) {
            navigator.clipboard.writeText(colorsText)
                .then(() => {
                    alert(`Цвета ${type} скопированы!`);
                })
                .catch(err => {
                    console.error('Ошибка копирования: ', err);
                    alert('Не удалось скопировать цвета');
                });
        } else {
            alert(`Нет цветов для ${type}`);
        }
    } else {
        alert(`Не найден контейнер для ${type}`);
    }
}

// SHOW
function showError(message) {
    let errorDiv = document.getElementById('error');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'error';
        errorDiv.style.color = 'red';
        errorDiv.style.marginTop = '10px';
        document.body.insertBefore(errorDiv, document.body.firstChild);
    }
    errorDiv.textContent = message;
}

function hideError() {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
        errorDiv.textContent = '';
    }
}

// showSavedPalettes
async function showSavedPalettes() {
    if (!username) {
        showError('Вы не авторизованы');
        return;
    }

    try {
        const response = await fetch(`/api/palettes/${username}/`); //url
        if (!response.ok) {
            throw new Error(`Ошибка: ${response.status}`);
        }
        const palettes = await response.json();

        showPalettesPopup(username, palettes);
    } catch (e) {
        console.error(e);
        showError('Не удалось загрузить сохранённые палитры');
    }
}

function showPalettesPopup(username, palettes) {
    const oldPopup = document.getElementById('palettes-popup');
    if (oldPopup) oldPopup.remove();

    const popup = document.createElement('div');
    popup.id = 'palettes-popup';
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border: 1px solid #ccc;
        border-radius: 5px;
        z-index: 1000;
        width: 600px;
        max-height: 80vh;
        overflow-y: auto;
    `;

    popup.innerHTML = `
        <h2>Сохранённые палитры</h2>
        <div>
            <p><strong>Пользователь:</strong> ${username}</p>
            <p><strong>Аватар:</strong> <img src="${avatar}"></p>
        </div>
        <div id="saved-palettes-list">
            ${palettes.map(p => `
                <div style="border: 1px solid #eee; padding: 10px; margin: 5px 0;" data-palette-id="${p.id}">
                    <strong>${p.name}</strong>
                    <div>
                        ${p.colors.map(c => `
                            <span class="color-box" style="background-color: ${c};" title="${c}"></span>
                        `).join('')}
                    </div>
                    <button onclick="deletePalette(${p.id})">Удалить</button>
                </div>
            `).join('')}
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
    if (!username) {
        showError('Вы не авторизованы');
        return;
    }

    try {
        const response = await fetch(`/api/palettes/${username}/${paletteId}/delete/`, { //url
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
        const item = popup.querySelector(`[data-palette-id="${paletteId}"]`);
        if (item) {
            item.remove();
        }

        alert('Палитра удалена');
    } catch (e) {
        console.error(e);
        showError('Не удалось удалить палитру');
    }
}