import { getClientsServer } from './api.js';
import { checkFirstLetter, renderClientsTable, sortClientsTable, getClientItem } from './table.js';
import { initializeModalElements, setupModalEventListeners, openEditModal } from './modal.js';

(async function () {
  'use strict'

  // 1. Данные
  const loadingIndicator = document.getElementById('loading-indicator');
  const clientsTable = document.getElementById('clients-table');
  loadingIndicator.style.display = 'flex';
  clientsTable.classList.add('load');

  // Установить таймаут для проверки стилей
  setTimeout(() => {
    if (loadingIndicator.style.display === 'flex') {
      console.warn('Loading is taking longer than expected...');
    }
  }, 5000);

  let serverData = await getClientsServer();
  let clientsList = serverData[0] || []; // Обработка случая, когда serverData равно null
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

  // Фильтрация с задержкой
  let filterTimeout;
  filterInp.addEventListener('input', () => {
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(() => {
      filterInp.value = checkFirstLetter(filterInp.value);
      renderClientsTable(clientsList, filterInp, (client) => getClientItem(client, elements, clientsList, renderClientsTable, filterInp, getClientItem, sortClientsTable, switchSort), sortClientsTable, switchSort, elements, clientsList);
    }, 300);
  });

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
