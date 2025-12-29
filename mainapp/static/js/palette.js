let currentColors = [];

function randomColor() {
    const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    document.getElementById('baseColor').value = randomColor;
}

async function generatePalette() {
    let baseColor = document.getElementById('baseColor').value;

    if (!baseColor || baseColor === '#' || baseColor.length < 4) {
        alert('Введите валидный цвет (например, #FF5733)');
        return;
    }

    if (baseColor.startsWith('#')) {
        baseColor = baseColor.substring(1);
    }

    if (baseColor.length !== 6) {
        alert('Цвет должен быть в формате #FFFFFF');
        return;
    }

    const response = await fetch(`/api/palettes/generate/?base=${baseColor}`);
    const data = await response.json();

    displayAllTypes(data);
}

function displayAllTypes(data) {
    console.log("displayAllTypes", data);
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '';

    for (const [type, colors] of Object.entries(data)) {
        if (type === 'base_color') continue;

        const section = document.createElement('div');
        section.className = 'palette-section';

        // Создаем заголовок
        const title = document.createElement('h3');
        title.textContent = type.charAt(0).toUpperCase() + type.slice(1) + ':';
        section.appendChild(title);

        // Отображаем цвета
        colors.forEach(color => {
            const box = document.createElement('div');
            box.className = 'color-box';
            box.style.backgroundColor = color;
            box.title = color;
            
            const hexText = document.createElement('span');
            hexText.className = 'color-hex';
            hexText.textContent = color;
            hexText.style.color = getContrastColor(color);
            box.appendChild(hexText);
            
            section.appendChild(box);
        });

        // Добавляем элементы для сохранения ТОЛЬКО для авторизованных пользователей
        if (username && username !== 'None') {
            section.appendChild(document.createElement('br'));
            section.appendChild(document.createElement('br'));

            // Поле ввода названия
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.placeholder = `Название палитры (${type})`;
            nameInput.id = `name_${type}`;
            nameInput.className = 'palette-name-input';
            section.appendChild(nameInput);

            // Кнопка "Сохранить"
            const saveButton = document.createElement('button');
            saveButton.textContent = `Сохранить ${type}`;
            saveButton.className = 'save-palette-btn';
            
            // Добавляем обработчик клика
            saveButton.onclick = function() {
                console.log('Кнопка сохранения нажата!', type);
                const name = nameInput.value;
                if (!name) {
                    alert('Введите название палитры');
                    return;
                }
                savePalette(colors, name, type);
            };

            section.appendChild(saveButton);
        }

        resultDiv.appendChild(section);
    }
}

async function savePalette(colors, name, type) {
    console.log('savePalette вызвана', { colors, name, type, username });
    
    if (!username || username === 'None') {
        alert('Для сохранения палитры необходимо авторизоваться');
        return;
    }

    try {
        console.log('Отправка POST запроса...');
        
        // Получаем CSRF токен из куки
        const csrfToken = getCookie('csrftoken');
        console.log('CSRF Token:', csrfToken);
        
        const response = await fetch(`/api/palettes/${username}/save/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,  // Добавляем CSRF токен
            },
            body: JSON.stringify({
                name: name,
                colors: colors,
                palette_type: type
            })
        });

        console.log('Response status:', response.status);
        
        if (response.ok) {
            const responseData = await response.json();
            console.log('Response data:', responseData);
            alert('Палитра сохранена!');
        } else {
            const errorData = await response.json();
            console.error('Ошибка при сохранении:', errorData);
            alert('Ошибка при сохранении палитры: ' + (errorData.detail || errorData.error || 'Неизвестная ошибка'));
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Произошла ошибка при отправке запроса');
    }
}

// Функция для получения CSRF токена из куки
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

function getContrastColor(hexColor) {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
}