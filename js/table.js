import { openEditModal, setClientToDelete, state } from './modal.js';

const contactTypeTranslations = {
  'Telephone': 'Телефон',
  'Email': 'Email',
  'Vk': 'Vk',
  'Facebook': 'Facebook',
  'Additional-contact': 'Доп. контакт'
};

export function getClientItem(clientObj, elements, clientsList, renderClientsTable, filterInp, getClientItem, sortClientsTable, switchSort) {
  const { deleteModal } = elements; // Получение deleteModal из elements
  const tr = document.createElement('tr');
  tr.classList.add('table__tr');
  const tdID = document.createElement('td');
  tdID.classList.add('table__td-id');
  const tdFIO = document.createElement('td');
  tdFIO.classList.add('table__td-FIO', 'flex');
  const tdCreationDate = document.createElement('td');
  tdCreationDate.classList.add('table__td-data', 'flex');
  const tdChangeDate = document.createElement('td');
  tdChangeDate.classList.add('table__td-data', 'flex');
  const tdContacts = document.createElement('td');
  tdContacts.classList.add('table__td-contacts', 'flex')
  const contactsContainer = document.createElement('div');
  contactsContainer.classList.add('contacts', 'flex');

  try {
    tdID.textContent = formatID(clientObj.id, '(max-width: 950px)' || '(max-width: 720px)');
    tdFIO.textContent = `${clientObj.surname} ${clientObj.name} ${clientObj.lastName ? clientObj.lastName : ''}`;
    tdCreationDate.innerHTML = formatDate(clientObj.createdAt);
    tdChangeDate.innerHTML = formatDate(clientObj.updatedAt);

    if (clientObj.contacts && clientObj.contacts.length > 0) {
      renderContacts(clientObj.contacts, contactsContainer);
    }
    tdContacts.appendChild(contactsContainer);
  } catch (error) {
    console.error('Ошибка при форматировании даты: ', error.message);
  }

  const btnEdit = document.createElement('button');
  btnEdit.classList.add('btn-reset', 'table__btn-edit', 'flex');
  btnEdit.innerHTML = `<img class="img-reset pencil-icon" src="./img/pencil.svg" aria-hidden="true" alt="Карандаш">Изменить`;
  btnEdit.addEventListener('click', async (e) => {
    e.preventDefault();
    state.isEditing = true;
    state.editingClientId = clientObj.id;

    // Заменить иконку карандаша на значок загрузки
    const originalIcon = btnEdit.querySelector('.pencil-icon');
    originalIcon.src = './img/load-small.svg';
    originalIcon.classList.add('loading-icon');

    // Установить таймаут для проверки стилей
    setTimeout(async () => {
      await openEditModal(clientObj, elements, clientsList, renderClientsTable, filterInp, getClientItem, sortClientsTable, switchSort); // Открытие модального окна для редактирования

      // Вернуть иконку карандаша после загрузки
      originalIcon.src = './img/pencil.svg';
      originalIcon.classList.remove('loading-icon');
    }, 3000);
  });

  const btnDelete = document.createElement('button');
  btnDelete.classList.add('btn-reset', 'table__btn-delete', 'flex');
  btnDelete.innerHTML = `<img class="img-reset delete-icon" src="./img/cancel.svg" aria-hidden="true" alt="Знак удалить">Удалить`;
  btnDelete.addEventListener('click', (e) => {
    e.preventDefault();
    setClientToDelete(clientObj.id); // Установить clientToDelete через функцию
    deleteModal.style.display = 'flex'; // Показать модальное окно подтверждения удаления
  });

  const tdActions = document.createElement('td');
  tdActions.classList.add('table__td-actions', 'flex');
  const actionsContainer = document.createElement('div');
  actionsContainer.classList.add('table__actions-btn', 'flex');
  actionsContainer.appendChild(btnEdit);
  actionsContainer.appendChild(btnDelete);
  tdActions.appendChild(actionsContainer);

  tr.append(tdID, tdFIO, tdCreationDate, tdChangeDate, tdContacts, tdActions);
  return tr;
}

// Функция для форматирования ID
export function formatID(id, mediaQueryStr) {
  let mediaQuery = window.matchMedia(mediaQueryStr);

  if (mediaQuery.matches) {
    const formattedID = (id.length <= 6) ? id : `${id.slice(0, 3)}...${id.slice(-3)}`;
    return formattedID;
  } else {
    return id;
  }
}

// Функция для форматирования даты
export function formatDate(date) {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  if (!(date instanceof Date) || isNaN(date)) {
    console.error('Invalid date parameter:', date); // Логирование некорректной даты
    return 'Invalid date'; // Возвращаем строку "Invalid date" вместо ошибки
  }

  let dd = date.getDate();
  if (dd < 10) dd = '0' + dd;

  let mm = date.getMonth() + 1;
  if (mm < 10) mm = '0' + mm;

  let yy = date.getFullYear();
  if (yy < 10) yy = '0' + yy;

  let hh = date.getHours();
  if (hh < 10) hh = '0' + hh;

  let min = date.getMinutes();
  if (min < 10) min = '0' + min;

  let time = hh + ':' + min;

  let data = dd + '.' + mm + '.' + yy + ' <span class="time">' + time + '</span>';
  return data;
}

export function addContactIcon(container, iconClass, src, alt, contactInfo) {
  if (contactInfo) {
    const contactDiv = document.createElement('div');
    const sanitizedIconClass = iconClass.replace(/\s+/g, '-'); // Заменяем пробелы на дефисы
    contactDiv.classList.add(sanitizedIconClass);
    contactDiv.innerHTML = `<img class="${sanitizedIconClass}" src="${src}" aria-hidden="true" alt="${alt}">`;
    contactDiv.removeAttribute('title'); // Удаляем атрибут title
    container.appendChild(contactDiv);
    return contactDiv;
  }
}

// Показ и скрытие контактов
function showContactTooltip(event, type, value) {
  let tooltip = document.querySelector('.contact-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.classList.add('contact-tooltip');
    document.body.appendChild(tooltip);
  }
  const translatedType = contactTypeTranslations[type] || type;
  tooltip.innerHTML = `<span class="contact-type">${translatedType}:</span> ${value}`;
  tooltip.style.display = 'block';
  const rect = event.target.getBoundingClientRect();
  tooltip.style.left = `${rect.left + window.scrollX + rect.width / 2 - tooltip.offsetWidth / 2}px`;
  tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight - 10}px`; // Позиционирование сверху
}

function hideContactTooltip() {
  const tooltip = document.querySelector('.contact-tooltip');
  if (tooltip) {
    tooltip.style.display = 'none';
  }
}

// Отрисовка контактов
function renderContacts(contacts, contactsCell) {
  contactsCell.innerHTML = '';
  const maxVisibleContacts = 4;

  // Отображаем до 4 контактов
  contacts.slice(0, maxVisibleContacts).forEach(contact => {
    addContactIconWithTooltip(contactsCell, contact);
  });

  // Если контактов больше 4, отображаем количество скрытых контактов
  if (contacts.length > maxVisibleContacts) {
    const hiddenCount = contacts.length - maxVisibleContacts;
    const moreContacts = document.createElement('div');
    moreContacts.classList.add('more-contacts', 'flex', 'btn-reset');
    moreContacts.textContent = `+${hiddenCount}`;
    moreContacts.addEventListener('click', () => {
      contactsCell.innerHTML = '';
      contacts.forEach(contact => {
        addContactIconWithTooltip(contactsCell, contact);
      });
    });
    contactsCell.appendChild(moreContacts);
  }
}

// Добавление иконки контакта с подсказкой
function addContactIconWithTooltip(container, contact) {
  const contactIcon = document.createElement('img');
  contactIcon.src = getContactIcon(contact.type);
  contactIcon.alt = contact.type;
  contactIcon.classList.add('contact-icon');
  contactIcon.addEventListener('mouseover', (e) => showContactTooltip(e, contact.type, contact.value));
  contactIcon.addEventListener('mouseout', hideContactTooltip);
  container.appendChild(contactIcon);
}

// Получение иконки контакта
function getContactIcon(type) {
  switch (type) {
    case 'Telephone':
      return './img/telephone.svg';
    case 'Email':
      return './img/email.svg';
    case 'Vk':
      return './img/vk.svg';
    case 'Facebook':
      return './img/facebook.svg';
    case 'Additional-contact':
      return './img/additional-contact.svg';
  }
}

// Валидация формы для фильтрации
export function checkFirstLetter(value) {
  if (value !== '') {
    return value.replace(/[a-zа-я]+/gi, (match) => match[0].toUpperCase() + match.substr(1));
  }
  return value;
}

// Сортировка таблицы
export function sortClientsTable(arr, prop, switchSort) {
  return arr.sort((a, b) => (switchSort ? a[prop] > b[prop] : a[prop] < b[prop]) ? -1 : 1);
}

// Фильтрация таблицы
export function filterClientsTable(arr, prop, value) {
  let result = [],
    copy = [...arr];

  for (const item of copy) {
    if (String(item[prop]).includes(value) == true) result.push(item);
  }

  return result;
}

// Отрисовка таблицы (рендеринг)
export function renderClientsTable(clientsArr, filterInp, getClientItem, sortClientsTable, switchSort, elements, clientsList) {
  const clientsTable = document.getElementById('clients-table');
  let filteredClients = [...clientsArr];
  const filterValue = filterInp.value.trim().toLowerCase();

  filteredClients.forEach(client => {
    client.fio = `${client.surname} ${client.name} ${client.lastName ? client.lastName : ''}`.toLowerCase();
  });

  if (filterValue !== '') {
    filteredClients = [
      ...filterClientsTable(clientsArr, 'id', filterValue),
      ...filterClientsTable(clientsArr, 'createdAt', filterValue),
      ...filterClientsTable(clientsArr, 'lastName', filterValue),
      ...filterClientsTable(clientsArr, 'fio', filterValue)
    ];
    filteredClients = [...new Set(filteredClients)]; // Удаление дубликатов
  };

  clientsTable.innerHTML = '';
  sortClientsTable(filteredClients, switchSort);

  filteredClients.forEach(client => {
    const newTR = getClientItem(client, elements, clientsList, renderClientsTable, filterInp, getClientItem, sortClientsTable, switchSort); // Передача elements и clientsList
    clientsTable.append(newTR);
  });
}




