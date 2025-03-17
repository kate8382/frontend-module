// Обработчик добавления контактов
export function setupAddContactHandler(btnAddContact, formContacts) {
  btnAddContact.addEventListener('click', function (e) {
    e.preventDefault();
    addContactHandler(formContacts, btnAddContact);
  });
}

// Добавление обработчика событий для инпутов контактов
export function setupContactInputHandler(formContacts) {
  formContacts.addEventListener('input', (e) => {
    if (e.target.classList.contains('input-contacts')) {
      const contactDiv = e.target.closest('.contact-div');
      const deleteBtn = contactDiv.querySelector('.delete-contact');
      toggleDeleteButton(e.target, deleteBtn);
    }
  });
}

// Добавление контакта
export function addContactHandler(formContacts, btnAddContact) {
  const contactDivs = formContacts.querySelectorAll('.contact-div');

  if (contactDivs.length < 10) {
    const newContactDiv = document.createElement('div');
    newContactDiv.classList.add('contacts-label', 'flex', 'contact-div');

    newContactDiv.innerHTML =
      `<select class="contacts-select" name="contacts">
        <option value="Telephone">Телефон</option>
        <option value="Email">Email</option>
        <option value="Vk">Vk</option>
        <option value="Facebook">Facebook</option>
        <option value="Additional-contact">Доп. контакт</option>
      </select>
      <input class="input-contacts" id="inp-contacts" type="text" placeholder="Введите данные контакта">
      <button class="btn-reset delete-contact">
        <img class="delete-icon" src="./img/cancel_grey.svg" aria-hidden="true" alt="Знак удалить">
      </button>`;

    formContacts.insertBefore(newContactDiv, btnAddContact);

    const deleteBtn = newContactDiv.querySelector('.delete-contact');
    const inputContact = newContactDiv.querySelector('.input-contacts');

    // Скрываем кнопку удаления, если инпут пуст
    toggleDeleteButton(inputContact, deleteBtn);

    deleteBtn.addEventListener('click', () => {
      newContactDiv.remove();

      if (formContacts.querySelectorAll('.contact-div').length < 10) {
        btnAddContact.style.display = 'flex';
      }
    });

    inputContact.addEventListener('input', () => {
      toggleDeleteButton(inputContact, deleteBtn);
    });

    applySelectStyles(newContactDiv.querySelector('.contacts-select'));

    if (formContacts.querySelectorAll('.contact-div').length >= 10) {
      btnAddContact.style.display = 'none';
    }
  } else {
    alert('Вы ввели максимальное количество контактов - 10!');
  }
}

// Применение стилей к селекту
export function applySelectStyles(select) {
  if (!select) return;
  select.style.backgroundImage = 'url("./img/arrow-select-down.svg")';
  select.style.pointerEvents = 'auto'; // Чтобы стрелочка не блокировала клики по селекту

  // Добавляем обработчик событий для изменения стрелочки
  select.addEventListener('click', () => {
    if (select.style.backgroundImage.includes('arrow-select-down.svg')) {
      select.style.backgroundImage = 'url("./img/arrow-select-up.svg")';
    } else {
      select.style.backgroundImage = 'url("./img/arrow-select-down.svg")';
    }
  });
}

// Добавление кнопки удаления контакта
export function toggleDeleteButton(inputContact, deleteBtn) {
  if (inputContact.value.trim() !== '') {
    deleteBtn.style.display = 'flex';
    inputContact.classList.remove('full-width');
  } else {
    deleteBtn.style.display = 'none';
    inputContact.classList.add('full-width');
  }
}

// Валидация контактов
export function validateContacts(formContacts) {
  let isValid = true;
  const contactDivs = formContacts.querySelectorAll('.contact-div');

  const phoneRegex = /^\+7\s\(\d{2,3}\)\s\d{2,3}-\d{2}-\d{2}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const urlRegex = /^(https?:\/\/)?(www\.)?(facebook\.com|vk\.com)\/[a-zA-Z0-9(.?)?]/;

  for (const contactDiv of contactDivs) {
    const select = contactDiv.querySelector('.contacts-select');
    const input = contactDiv.querySelector('.input-contacts');
    const inputValue = input.value.trim();
    const contactType = select.value;

    let validationPassed = false;

    if (contactType === 'Telephone') {
      validationPassed = phoneRegex.test(inputValue);
    } else if (contactType === 'Email') {
      validationPassed = emailRegex.test(inputValue);
    } else if (contactType === 'Vk' || contactType === 'Facebook') {
      validationPassed = urlRegex.test(inputValue);
    } else if (contactType === 'Additional-contact') {
      validationPassed = phoneRegex.test(inputValue) || emailRegex.test(inputValue) || urlRegex.test(inputValue);
    };

    if (!validationPassed) {
      isValid = false;
      input.classList.add('error');
    } else {
      input.classList.remove('error');
    };
  };

  return isValid;
}

// Сообщение об ошибке
export function showError(message) {
  // Проверяем, есть ли уже сообщение об ошибке, чтобы не создавать дубликаты
  if (document.querySelector('.error-message')) return;

  const errorElement = document.createElement('div');
  errorElement.classList.add('error-message');
  errorElement.textContent = message;
  const form = document.getElementById('form');
  form.insertBefore(errorElement, form.querySelector('.form__btn-group'));

  // Добавляем слушатели событий к инпутам и селектам для удаления ошибки при исправлении
  const inputs = form.querySelectorAll('.input-contacts');
  inputs.forEach(input => {
    input.addEventListener('input', () => clearErrorOnInput());
  });
  const selects = form.querySelectorAll('.contacts-select');
  selects.forEach(select => {
    select.addEventListener('change', () => clearErrorOnInput());
  });
}

export function clearErrorOnInput() {
  const form = document.getElementById('form');
  const errorElement = document.querySelector('.error-message');
  const inputs = form.querySelectorAll('.input-contacts');

  let allValid = true;

  inputs.forEach(input => {
    if (input.classList.contains('error') && input.value.trim() !== '') {
      allValid = false;
    }
  });

  if (allValid) {
    removeErrorMessage();
  }
}

// Функция для удаления сообщения об ошибке
export function removeErrorMessage() {
  const errorElement = document.querySelector('.error-message');
  if (errorElement) {
    errorElement.remove();
  }
}
