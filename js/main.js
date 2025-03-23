import { getClientsServer, getAutocompleteItems } from './api.js';
import { checkFirstLetter, renderClientsTable, sortClientsTable, getClientItem } from './table.js';
import { initializeModalElements, setupModalEventListeners, openEditModal } from './modal.js';

(async function () {
  'use strict'

  // 1. Данные
  const loadingIndicator = document.getElementById('loading-indicator');
  const clientsTable = document.getElementById('clients-table');
  const autocompleteList = document.getElementById('autocomplete-list'); // Добавьте это определение
  loadingIndicator.style.display = 'flex';
  clientsTable.classList.add('load');

  // Установить таймаут для проверки стилей
  setTimeout(() => {
    if (loadingIndicator.style.display === 'flex') {
      console.warn('Loading is taking longer than expected...');
    }
  }, 5000);

  let serverData = await getClientsServer();
  let clientsList = serverData ? serverData[0] : []; // Обработка случая, когда serverData равно null
  let switchSort = true; // Переменная для отслеживания порядка сортировки

  // Скрыть индикатор загрузки и показать таблицу после загрузки данных
  loadingIndicator.style.display = 'none';
  clientsTable.classList.remove('load');

  if (serverData) {
    clientsList = serverData[0];
  };

  // Создание элементов
  const elements = initializeModalElements();
  const filterInp = document.getElementById('filter-input'); // Определение переменной filterInp

  // Настройка обработчиков событий для модальных окон
  setupModalEventListeners(elements, clientsList, renderClientsTable, filterInp, getClientItem, sortClientsTable, switchSort);

  // Отрисовка таблицы
  renderClientsTable(clientsList, filterInp, (client) => getClientItem(client, elements, clientsList, renderClientsTable, filterInp, getClientItem, sortClientsTable, switchSort), sortClientsTable, switchSort, elements, clientsList);

  // Функция для обработки hash-части URL
  function handleHashChange() {
    const hash = window.location.hash;
    if (hash) {
      const clientId = hash.substring(1); // Удаляем символ #
      const client = clientsList.find(client => client.id === clientId);
      if (client) {
        openEditModal(client, elements, clientsList, renderClientsTable, filterInp, getClientItem, sortClientsTable, switchSort);
      } else {
        console.error(`Client with ID ${clientId} not found`);
      }
    }
  }

  // Проверка hash-части URL при загрузке страницы
  handleHashChange();

  // Добавление обработчика события hashchange
  window.addEventListener('hashchange', handleHashChange);

  // Фильтрация с задержкой и автодополнение
  let filterTimeout;
  filterInp.addEventListener('input', async () => {
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(async () => {
      const query = checkFirstLetter(filterInp.value.trim().toLowerCase());
      if (query) {
        const items = await getAutocompleteItems(query);
        renderAutocompleteList(items);
        autocompleteList.style.visibility = 'visible'; // Показать список автодополнения
      } else {
        autocompleteList.innerHTML = '';
        autocompleteList.style.visibility = 'hidden'; // Скрыть список автодополнения
      }
    }, 300);
  });

  // Обработчик для выбора элемента из списка автодополнения
  autocompleteList.addEventListener('click', (e) => {
    if (e.target.tagName === 'LI') {
      const selectedItem = e.target.textContent;
      filterInp.value = selectedItem;
      autocompleteList.innerHTML = '';
      highlightTableRow(selectedItem);
      filterInp.value = ''; // Очистить поле ввода фильтрации
      autocompleteList.style.visibility = 'hidden'; // Скрыть список автодополнения
    }
  });

  // Обработчик для выбора элемента с помощью клавиатуры
  filterInp.addEventListener('keydown', (e) => {
    const items = autocompleteList.querySelectorAll('li');
    let index = Array.from(items).findIndex(item => item.classList.contains('selected'));

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (index < items.length - 1) {
        index++;
      } else {
        index = 0;
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (index > 0) {
        index--;
      } else {
        index = items.length - 1;
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (index >= 0) {
        const selectedItem = items[index].textContent; // Логирование выбранного элемента
        filterInp.value = selectedItem;
        autocompleteList.innerHTML = '';
        autocompleteList.style.visibility = 'hidden'; // Скрыть список автодополнения
        // Выделение строки таблицы
        highlightTableRow(selectedItem);
        filterInp.value = ''; // Очистить поле ввода фильтрации
      } else {
        // Если клиент не найден, очистить поле ввода фильтрации
        filterInp.value = '';
        autocompleteList.innerHTML = '';
        autocompleteList.style.visibility = 'hidden'; // Скрыть список автодополнения
      }
    }

    items.forEach(item => item.classList.remove('selected'));
    if (index >= 0) {
      items[index].classList.add('selected');
    }
  });

  // Функция для отображения списка автодополнения
  function renderAutocompleteList(items) {
    autocompleteList.innerHTML = '';
    items.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.surname} ${item.name} ${item.lastName}`;
      autocompleteList.appendChild(li);
    });
  }

  // Функция для выделения строки таблицы и скрытия остальных строк
  function highlightTableRow(selectedItem) {
    const rows = document.querySelectorAll('.table__tr');
    let found = false;
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      const fullName = `${cells[1].textContent} ${cells[2].textContent} ${cells[3].textContent}`;
      if (fullName.toLowerCase().includes(selectedItem.toLowerCase())) {
        row.style.display = ''; // Показать строку
        row.classList.add('highlight');
        found = true;
      } else {
        row.style.display = 'none'; // Скрыть строку
        row.classList.remove('highlight');
      }
    });
    if (!found) {
      rows.forEach(row => row.style.display = ''); // Показать все строки, если ничего не найдено
    }
  }

  // Сортировка
  document.getElementById('sort-ID').addEventListener('click', () => {
    switchSort = !switchSort;
    sortClientsTable(clientsList, 'id', switchSort);
    renderClientsTable(clientsList, filterInp, (client) => getClientItem(client, elements, clientsList, renderClientsTable, filterInp, getClientItem, sortClientsTable, switchSort), sortClientsTable, switchSort, elements, clientsList);
  });

  document.getElementById('sort-FIO').addEventListener('click', () => {
    switchSort = !switchSort;
    sortClientsTable(clientsList, 'surname', switchSort);
    renderClientsTable(clientsList, filterInp, (client) => getClientItem(client, elements, clientsList, renderClientsTable, filterInp, getClientItem, sortClientsTable, switchSort), sortClientsTable, switchSort, elements, clientsList);
  });

  document.getElementById('sort-create').addEventListener('click', () => {
    switchSort = !switchSort;
    sortClientsTable(clientsList, 'createdAt', switchSort);
    renderClientsTable(clientsList, filterInp, (client) => getClientItem(client, elements, clientsList, renderClientsTable, filterInp, getClientItem, sortClientsTable, switchSort), sortClientsTable, switchSort, elements, clientsList);
  });

  document.getElementById('sort-change').addEventListener('click', () => {
    switchSort = !switchSort;
    sortClientsTable(clientsList, 'updatedAt', switchSort);
    renderClientsTable(clientsList, filterInp, (client) => getClientItem(client, elements, clientsList, renderClientsTable, filterInp, getClientItem, sortClientsTable, switchSort), sortClientsTable, switchSort, elements, clientsList);
  });

})();
