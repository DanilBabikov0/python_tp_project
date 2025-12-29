let currentColors = [];

function randomColor() {
    const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    document.getElementById('baseColor').value = randomColor;
}

async function generatePalette() {
    let baseColor = document.getElementById('baseColor').value;

    if (!baseColor || baseColor === '#' || baseColor.length < 4) {
        alert('Введите корректный цвет (например, #FF5733)');
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
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '';

    for (const [type, colors] of Object.entries(data)) {
        if (type === 'base_color') continue;

        const section = document.createElement('div');
        section.className = 'palette-section';

        const saveButton = document.createElement('button');
        saveButton.textContent = `Сохранить ${type}`;
        saveButton.onclick = () => savePalette(type, colors);

        section.appendChild(saveButton);
        section.appendChild(document.createElement('br'));

        section.innerHTML += `<h3>${type.charAt(0).toUpperCase() + type.slice(1)}:</h3>`;

        colors.forEach(color => {
            const box = document.createElement('div');
            box.className = 'color-box';
            box.style.backgroundColor = color;
            box.title = color;
            section.appendChild(box);
        });

        resultDiv.appendChild(section);
    }
}

async function savePalette(type, colors) {
    if (!colors || colors.length === 0) {
        alert('Нет цветов для сохранения');
        return;
    }

    const name = prompt(`Введите название палитры (${type}):`);
    if (!name) return;

    const response = await fetch(`/api/palettes/{{ user.username }}/create/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify({
            name: name,
            colors: colors
        })
    });

    if (response.ok) {
        alert('Палитра сохранена!');
    } else {
        alert('Ошибка при сохранении');
    }
}

async function extractColors() {
    const fileInput = document.getElementById('imageUpload');
    const file = fileInput.files[0];
    if (!file) {
        alert('Выберите изображение');
        return;
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('count', 5);

    const response = await fetch('/api/palettes/extract/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
        }
    });

    const data = await response.json();
    currentColors = data.colors;
    displayColors(data.colors);
}

function displayColors(colors) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '<h3>Результат:</h3>';

    colors.forEach(color => {
        const box = document.createElement('div');
        box.className = 'color-box';
        box.style.backgroundColor = color;
        box.title = color;
        resultDiv.appendChild(box);
    });
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