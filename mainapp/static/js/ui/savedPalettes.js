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