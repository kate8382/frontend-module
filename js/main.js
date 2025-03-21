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
    // fetch(`http://localhost:3000/api/clients/${clientId}`)
    //   .then(response => {
    //     if (!response.ok) {
    //       throw new Error('Client not found');
    //     }
    //     return response.json();
    //   })
    //   .then(client => {
    //     openEditModal(client, elements, clientsList, renderClientsTable, filterInp, getClientItem, sortClientsTable, switchSort);
    //   })
    //   .catch(error => {
    //     console.error(`Client with ID ${clientId} not found:`, error);
    //   });
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
      const query = filterInp.value.trim().toLowerCase();
      if (query) {
        const items = await getAutocompleteItems(query);
        renderAutocompleteList(items);
      } else {
        autocompleteList.innerHTML = '';
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
        const selectedItem = items[index].textContent;
        filterInp.value = selectedItem;
        autocompleteList.innerHTML = '';
        highlightTableRow(selectedItem);
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
      li.textContent = item;
      autocompleteList.appendChild(li);
    });
  }

  // Функция для выделения строки таблицы
  function highlightTableRow(text) {
    const rows = document.querySelectorAll('.table__tr');
    rows.forEach(row => {
      row.classList.remove('highlight');
      if (row.textContent.toLowerCase().includes(text.toLowerCase())) {
        row.classList.add('highlight');
      }
    });
  }

  // Фильтрация с задержкой
  // let filterTimeout;
  // filterInp.addEventListener('input', () => {
  //   clearTimeout(filterTimeout);
  //   filterTimeout = setTimeout(() => {
  //     filterInp.value = checkFirstLetter(filterInp.value);
  //     renderClientsTable(clientsList, filterInp, (client) => getClientItem(client, elements, clientsList, renderClientsTable, filterInp, getClientItem, sortClientsTable, switchSort), sortClientsTable, switchSort, elements, clientsList);
  //   }, 300);
  // });

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
