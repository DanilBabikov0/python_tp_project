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