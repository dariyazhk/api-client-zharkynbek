// Lab 6: native fetch, async/await, query parameters, detail request, Promise.all.
const API = 'https://jsonplaceholder.typicode.com';
const cards = document.querySelector('#cards');
const statusBox = document.querySelector('#status');
const details = document.querySelector('#details');
const authorSelect = document.querySelector('#author');
const loadButton = document.querySelector('#load');
const allButton = document.querySelector('#all');

function setStatus(message, isError = false) {
  statusBox.textContent = message;
  statusBox.style.color = isError ? '#b42318' : '#486d70';
}

async function request(path) {
  const response = await fetch(`${API}${path}`);
  if (!response.ok) throw new Error(`Ошибка сервера: HTTP ${response.status}`);
  return await response.json();
}

function makeCard(post, author) {
  const article = document.createElement('article');
  const title = document.createElement('h3');
  title.textContent = post.title;
  const text = document.createElement('p');
  text.textContent = `${post.body.slice(0, 100)}…`;
  const by = document.createElement('p');
  by.textContent = `Автор: ${author?.name ?? `ID ${post.userId}`}`;
  const button = document.createElement('button');
  button.textContent = 'Подробнее';
  button.addEventListener('click', () => showDetails(post.id));
  article.append(title, text, by, button);
  return article;
}

async function loadPosts(userId = '') {
  setStatus('Загрузка данных…');
  cards.replaceChildren();
  details.hidden = true;
  loadButton.disabled = true;
  allButton.disabled = true;
  try {
    // Query parameter is sent to the server, not used to filter existing cards.
    const params = new URLSearchParams({ _limit: '9' });
    if (userId) params.set('userId', userId);
    // Two independent requests start at the same time.
    const [posts, users] = await Promise.all([
      request(`/posts?${params.toString()}`),
      request('/users')
    ]);
    const authors = new Map(users.map(user => [user.id, user]));
    posts.forEach(post => cards.append(makeCard(post, authors.get(post.userId))));
    setStatus(`Загружено записей: ${posts.length}. Данные получены из двух запросов параллельно.`);
  } catch (error) {
    setStatus(`Не удалось загрузить записи. Проверь интернет. ${error.message}`, true);
  } finally {
    loadButton.disabled = false;
    allButton.disabled = false;
  }
}

async function showDetails(id) {
  details.hidden = false;
  details.replaceChildren();
  const loading = document.createElement('p');
  loading.textContent = 'Загрузка подробностей…';
  details.append(loading);
  try {
    // Second API request by item ID.
    const post = await request(`/posts/${id}`);
    const title = document.createElement('h3');
    title.textContent = post.title;
    const body = document.createElement('p');
    body.textContent = post.body;
    const meta = document.createElement('small');
    meta.textContent = `Запись #${post.id} · Автор #${post.userId}`;
    const close = document.createElement('button');
    close.textContent = 'Закрыть';
    close.addEventListener('click', () => { details.hidden = true; });
    details.replaceChildren(title, body, meta, document.createElement('br'), close);
    details.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (error) {
    details.textContent = `Ошибка загрузки подробностей: ${error.message}`;
  }
}

loadButton.addEventListener('click', () => loadPosts(authorSelect.value));
allButton.addEventListener('click', () => loadPosts());
loadPosts();
