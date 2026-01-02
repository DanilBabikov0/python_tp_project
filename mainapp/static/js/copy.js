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