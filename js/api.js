export async function getClientsServer(clientIds = []) {
  try {
    const requests = clientIds.length > 0
      ? clientIds.map(id => fetch(`http://localhost:3000/api/clients/${id}`))
      : [fetch('http://localhost:3000/api/clients')];

    const responses = await Promise.all(requests);
    const data = await Promise.all(responses.map(response => {
      if (!response.ok) {
        throw new Error(`Failed to fetch client${clientIds.length > 0 ? ` with ID ${response.url.split('/').pop()}` : 's'}`);
      }
      return response.json();
    }));

    console.log('Fetched clients data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching clients:', error);
    return null;
  }
}

export async function addClientServer(client) {
  let response = await fetch('http://localhost:3000/api/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(client)
  });
  let data = await response.json();

  return data;
}

export async function updateClientServer(id, client) {
  let response = await fetch(`http://localhost:3000/api/clients/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(client)
  });
  let data = await response.json();

  return data;
}

export async function deleteClientServer(id) {
  let response = await fetch(`http://localhost:3000/api/clients/${id}`, {
    method: 'DELETE',
  });
  let data = await response.json();

  return data;
}

// Autocomplit
export async function getAutocompleteItems(query) {
  try {
    const response = await fetch(`http://localhost:3000/api/clients/autocomplete?query=${query}`);
    if (!response.ok) {
      throw new Error('Failed to fetch autocomplete items');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching autocomplete items:', error);
    return [];
  }
}
