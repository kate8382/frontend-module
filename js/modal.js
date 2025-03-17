import { deleteClientServer, updateClientServer, addClientServer, getClientsServer } from './api.js';
import { checkFirstLetter, formatID } from './table.js';
import { addContactHandler, toggleDeleteButton, setupAddContactHandler, applySelectStyles, validateContacts, showError, setupContactInputHandler, clearErrorOnInput, removeErrorMessage } from './contacts.js';

// Флаги как обьект состояния
export const state = {
  isEditing: false,
  editingClientId: null,
  originalCreatedAt: null,
  clientToDelete: null
};

// Установка клиента для удаления
export function setClientToDelete(id) {
  state.clientToDelete = id;
}

export function initializeModalElements() {
  const modalElement = document.getElementById('modal');
  const closeBtn = document.getElementsByClassName('close')[0];
  const saveBtn = document.getElementById('save');
  const cancelBtn = document.getElementById('cancel');
  const form = document.getElementById('form');
  const surnameInp = document.getElementById('inp-surname');
  const nameInp = document.getElementById('inp-name');
  const lastnameInp = document.getElementById('inp-lastname');
  const btnAddContact = document.getElementById('add-contact');
  const formContacts = document.getElementById('form-contacts');
  const deleteModal = document.getElementById('delete-modal');
  const confirmDeleteBtn = document.getElementById('confirm-delete');
  const cancelDeleteBtn = document.getElementById('cancel-delete');
  const deleteCloseBtn = document.getElementsByClassName('delete-modal__close')[0];

  return {
    modalElement,
    closeBtn,
    saveBtn,
    cancelBtn,
    form,
    surnameInp,
    nameInp,
    lastnameInp,
    btnAddContact,
    formContacts,
    deleteModal,
    confirmDeleteBtn,
    cancelDeleteBtn,
    deleteCloseBtn
  };
}

// Установка обработчиков событий для модального окна
export function setupModalEventListeners(elements, clientsList, renderClientsTable, filterInp, getClientItem, sortClientsTable, switchSort) {
  const {
    modalElement,
    closeBtn,
    saveBtn,
    cancelBtn,
    form,
    surnameInp,
    nameInp,
    lastnameInp,
    btnAddContact,
    formContacts,
    deleteModal,
    confirmDeleteBtn,
    cancelDeleteBtn,
    deleteCloseBtn
  } = elements;

  // Открытие модального окна для нового клиента
  document.getElementById('main-btn').addEventListener('click', () => {
    modalElement.style.display = 'flex';
    state.isEditing = false;
    state.editingClientId = null;
    state.originalCreatedAt = null; // Сброс оригинальной даты создания
    form.reset();

    // Очистка плейсхолдеров перед применением
    resetInputStyles(surnameInp);
    resetInputStyles(nameInp);
    resetInputStyles(lastnameInp);

    // Применение плейсхолдеров с звездочками для нового клиента
    addPlaceholderWithStar(surnameInp, 'Фамилия*');
    addPlaceholderWithStar(nameInp, 'Имя*');
    addPlaceholderWithStar(lastnameInp, 'Отчество');

    Array.from(formContacts.children).forEach(child => {
      if (child !== btnAddContact) {
        child.remove();
      }
    });
    saveBtn.disabled = false;
    document.querySelector('.modal__title').textContent = 'Новый клиент';

    // Удаление сообщения об ошибке при открытии модального окна
    removeErrorMessage();

    // Установить надпись и поведение кнопки cancelBtn для нового клиента
    cancelBtn.textContent = 'Отмена';
    cancelBtn.onclick = (e) => {
      e.preventDefault();
      modalElement.style.display = 'none';
      resetInputStyles(surnameInp, nameInp, lastnameInp);
      window.location.hash = ''; // Удаляем hash-часть URL при закрытии модального окна
    };

    // Добавление обработчика событий для инпутов контактов
    setupContactInputHandler(formContacts);
  });

  // Добавление контактов
  setupAddContactHandler(btnAddContact, formContacts);

  // Закрытие модального окна
  closeBtn.addEventListener('click', () => {
    modalElement.style.display = 'none';
    resetInputStyles(surnameInp, nameInp, lastnameInp);
    window.location.hash = ''; // Удаляем hash-часть URL при закрытии модального окна
  });

  // Закрытие окна подтверждения удаления
  deleteCloseBtn.addEventListener('click', () => {
    deleteModal.style.display = 'none';
  });

  // Обработчики для модального окна подтверждения удаления
  confirmDeleteBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      const clientExists = clientsList.some(client => client.id === state.clientToDelete);
      if (!clientExists) {
        throw new Error('Client not found');
      }
      await deleteClientServer(state.clientToDelete);
      clientsList = clientsList.filter(client => client.id !== state.clientToDelete);
      renderClientsTable(clientsList, filterInp, getClientItem, sortClientsTable, switchSort, elements, clientsList);
      state.clientToDelete = null;
      deleteModal.style.display = 'none';
      window.location.hash = ''; // Удаляем hash-часть URL при закрытии модального окна
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  });

  cancelDeleteBtn.addEventListener('click', () => {
    state.clientToDelete = null;
    deleteModal.style.display = 'none';
  });

  // Объединенный обработчик для закрытия модальных окон при клике за их пределами
  window.onclick = ((e) => {
    if (e.target === modalElement) {
      modalElement.style.display = 'none';
      resetInputStyles(surnameInp, nameInp, lastnameInp);
      window.location.hash = ''; // Удаляем hash-часть URL при закрытии модального окна
    } else if (e.target === deleteModal) {
      deleteModal.style.display = 'none';
    }
  });

  // Добавление обработчика событий для инпутов контактов
  setupContactInputHandler(formContacts);

  // Добавление обработчика для кнопки cancel
  cancelBtn.addEventListener('click', () => {
    form.reset();
    Array.from(formContacts.children).forEach(child => {
      if (child !== btnAddContact) {
        child.remove();
      }
    });
    modalElement.style.display = 'none';
    resetInputStyles(surnameInp, nameInp, lastnameInp);
    window.location.hash = ''; // Удаляем hash-часть URL при закрытии модального окна
  });

  // Добавление обработчика для кнопки save
  saveBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    // Проверка валидности формы и контактов
    if (!form.checkValidity() || !validateContacts(formContacts)) {
      form.reportValidity();
      showError('Ошибка: новая модель организационной деятельности предполагает независимые способы реализации поставленных обществом задач!');
      return;
    }

    // Показать индикатор загрузки на кнопке save
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<img class="loading-icon" src="./img/load-save.svg" aria-hidden="true" alt="Загрузка..."> Сохранить`;
    form.style.pointerEvents = 'none'; // Блокируем форму и форму контактов
    // Сохранение изменений или добавление нового клиента
    setTimeout(async () => {
      if (state.isEditing) {
        await saveClientChanges(elements, clientsList, renderClientsTable, filterInp, getClientItem, sortClientsTable, switchSort);
      } else {
        await addNewClient(elements, clientsList, renderClientsTable, filterInp, getClientItem, sortClientsTable, switchSort);
      }

      // Убрать индикатор загрузки с кнопки save
      saveBtn.innerHTML = 'Сохранить';
      form.style.pointerEvents = 'auto'; // Разблокируем форму и форму контактов
    }, 3000);
  });
}

async function addNewClient(elements, clientsList, renderClientsTable, filterInp, getClientItem, sortClientsTable, switchSort) {
  const {
    modalElement,
    form,
    surnameInp,
    nameInp,
    lastnameInp,
    formContacts
  } = elements;

  const newClient = {
    surname: checkFirstLetter(surnameInp.value.trim()),
    name: checkFirstLetter(nameInp.value.trim()),
    lastName: checkFirstLetter(lastnameInp.value.trim()),
    createdAt: new Date().toISOString(), // Используем ISO строку без форматирования
    updatedAt: '', // Оставляем пустым до тех пор, пока клиента не отредактируют
    contacts: []
  };

  const contactDivs = formContacts.querySelectorAll('.contact-div');
  contactDivs.forEach(contactDiv => {
    const select = contactDiv.querySelector('.contacts-select');
    const input = contactDiv.querySelector('.input-contacts');
    if (input.value.trim() !== '') {
      newClient.contacts.push({
        type: select.value,
        value: input.value.trim()
      });
    }
  });

  try {
    const newClientFromServer = await addClientServer(newClient);
    clientsList.push(newClientFromServer); // Добавление нового клиента в список клиентов

    renderClientsTable(clientsList, filterInp, getClientItem, sortClientsTable, switchSort, elements, clientsList);
    modalElement.style.display = 'none';
    window.location.hash = ''; // Удаляем hash-часть URL при закрытии модального окна
  } catch (error) {
    console.error('Error saving client data:', error);
  }
}

async function saveClientChanges(elements, clientsList, renderClientsTable, filterInp, getClientItem, sortClientsTable, switchSort) {
  const {
    modalElement,
    form,
    surnameInp,
    nameInp,
    lastnameInp,
    formContacts
  } = elements;

  if (!state.editingClientId) {
    console.error('Editing client ID is null or undefined');
    return;
  }

  const updatedClient = {
    surname: surnameInp.value.trim(),
    name: nameInp.value.trim(),
    lastName: lastnameInp.value.trim(),
    contacts: []
  };

  const contactDivs = formContacts.querySelectorAll('.contact-div');
  contactDivs.forEach(contactDiv => {
    const select = contactDiv.querySelector('.contacts-select');
    const input = contactDiv.querySelector('.input-contacts');
    if (input.value.trim() !== '') {
      updatedClient.contacts.push({
        type: select.value,
        value: input.value.trim()
      });
    }
  });

  try {
    const updatedClientFromServer = await updateClientServer(state.editingClientId, updatedClient);
    const clientIndex = clientsList.findIndex(client => client.id === state.editingClientId);
    if (clientIndex !== -1) {
      clientsList[clientIndex] = updatedClientFromServer;
    }

    renderClientsTable(clientsList, filterInp, getClientItem, sortClientsTable, switchSort, elements, clientsList);
    modalElement.style.display = 'none';
    window.location.hash = ''; // Удаляем hash-часть URL при закрытии модального окна
  } catch (error) {
    console.error('Error updating client data:', error);
  }
}

export async function openEditModal(clientObj, elements, clientsList, renderClientsTable, filterInp, getClientItem, sortClientsTable, switchSort) {
  const {
    modalElement,
    saveBtn,
    cancelBtn,
    formContacts,
    btnAddContact,
    surnameInp,
    nameInp,
    lastnameInp,
    deleteModal
  } = elements;

  try {
    const client = await getClientsServer([clientObj.id]); // Используем getClientsServer для получения данных клиента
    const clientData = client[0]; // Получаем данные клиента из массива

    surnameInp.value = checkFirstLetter(clientData.surname);
    nameInp.value = checkFirstLetter(clientData.name);
    lastnameInp.value = checkFirstLetter(clientData.lastName);
    state.originalCreatedAt = clientData.createdAt; // Сохраняем оригинальную дату создания
    state.editingClientId = clientData.id; // Устанавливаем идентификатор редактируемого клиента

    Array.from(formContacts.children).forEach(child => {
      if (child !== btnAddContact) {
        child.remove();
      }
    });

    if (clientData.contacts && clientData.contacts.length > 0) {
      clientData.contacts.forEach(contact => {
        const newContactDiv = document.createElement('div');
        newContactDiv.classList.add('contacts-label', 'flex', 'contact-div');

        newContactDiv.innerHTML =
          `<select class="contacts-select" name="contacts">
             <option value="Telephone" ${contact.type === 'Telephone' ? 'selected' : ''}>Телефон</option>
             <option value="Email" ${contact.type === 'Email' ? 'selected' : ''}>Email</option>
             <option value="Vk" ${contact.type === 'Vk' ? 'selected' : ''}>Vk</option>
             <option value="Facebook" ${contact.type === 'Facebook' ? 'selected' : ''}>Facebook</option>
             <option value="Additional-contact" ${contact.type === 'Additional-contact' ? 'selected' : ''}>Доп. контакт</option>
           </select>
           <input class="input-contacts" type="text" value="${contact.value}" required>
           <button class="btn-reset delete-contact">
             <img class="delete-icon" src="./img/cancel_grey.svg" aria-hidden="true" alt="Знак удалить">
           </button>`;

        formContacts.insertBefore(newContactDiv, btnAddContact);
        newContactDiv.querySelector('.delete-contact').addEventListener('click', () => {
          newContactDiv.remove();
          if (formContacts.querySelectorAll('.contact-div').length < 10) {
            btnAddContact.style.display = 'flex';
          }
        });

        // Применение стилей к селектам
        applySelectStyles(newContactDiv.querySelector('.contacts-select'));

        // Отображение кнопки delete-contact при наличии значения
        const inputContact = newContactDiv.querySelector('.input-contacts');
        toggleDeleteButton(inputContact, newContactDiv.querySelector('.delete-contact'));
      });
    } else {
      addContactHandler(formContacts, btnAddContact);
    }

    formContacts.appendChild(btnAddContact);

    // Скрыть кнопку добавления контакта, если уже 10 контактов
    if (clientData.contacts.length >= 10) {
      btnAddContact.style.display = 'none';
    }

    // Изменение заголовка модального окна
    const formattedID = formatID(clientData.id, '(max-width: 720px)');
    const modalTitle = document.querySelector('.modal__title');
    modalTitle.innerHTML = `Изменить данные <span class="modal__title-id">ID: ${formattedID}</span>`;

    // Очистка плейсхолдеров перед применением
    resetInputStyles(surnameInp);
    resetInputStyles(nameInp);
    resetInputStyles(lastnameInp);

    // Применение плейсхолдеров над полями ввода для редактирования клиента
    movePlaceholderAbove(surnameInp, 'Фамилия*');
    movePlaceholderAbove(nameInp, 'Имя*');
    movePlaceholderAbove(lastnameInp, 'Отчество');

    // Установить переменную isEditing в true
    state.isEditing = true;

    // Изменение поведения кнопки cancel только при редактировании
    cancelBtn.textContent = 'Удалить клиента';
    cancelBtn.onclick = (e) => {
      e.preventDefault();
      state.clientToDelete = clientData.id;
      deleteModal.style.display = 'flex'; // Показать модальное окно подтверждения удаления
    };

    modalElement.style.display = 'flex'; // Отображение модального окна
    saveBtn.disabled = false; // Убедитесь, что кнопка save активна

    // Добавление обработчика событий для инпутов контактов
    setupContactInputHandler(formContacts);
    clearErrorOnInput();
  } catch (error) {
    console.error('Error fetching client data:', error);
  }
}

// Функции, связанные с модальными окнами
export function addPlaceholderWithStar(input, text, fontSize = '14px') {
  const container = document.createElement('div');
  container.style.position = 'relative';

  const placeholder = document.createElement('span');
  placeholder.innerHTML = text.replace('*', '<span class="star">*</span>');
  placeholder.style.color = '#B0B0B0';
  placeholder.style.fontSize = fontSize;
  placeholder.style.position = 'absolute';
  placeholder.style.top = '50%';
  placeholder.style.left = '2px';
  placeholder.style.transform = 'translateY(-50%)';
  placeholder.style.pointerEvents = 'none';

  container.appendChild(placeholder);
  input.parentNode.insertBefore(container, input);
  container.appendChild(input);

  input.addEventListener('input', () => {
    if (input.value.trim() !== '') {
      placeholder.style.display = 'none';
    } else {
      placeholder.style.display = 'inline';
    }
  });
}

export function movePlaceholderAbove(input, text, fontSize = '10px') {
  if (!text) return; // Проверка на наличие text
  const container = document.createElement('div');
  container.style.position = 'relative';

  const placeholder = document.createElement('span');
  placeholder.innerHTML = text.replace('*', '<span class="star">*</span>');
  placeholder.style.color = '#B0B0B0';
  placeholder.style.fontSize = fontSize;
  placeholder.style.position = 'absolute';
  placeholder.style.top = '-10px';
  placeholder.style.left = '3px';
  placeholder.style.pointerEvents = 'none';

  container.appendChild(placeholder);
  input.parentNode.insertBefore(container, input);
  container.appendChild(input);
}

export function resetInputStyles(input) {
  const container = input.parentNode;
  if (container && container.firstChild.tagName === 'SPAN') {
    container.parentNode.insertBefore(input, container);
    container.remove();
  }
}
