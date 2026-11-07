const KEY = 'products-lab34-v2';
const form = document.querySelector('#product-form');
const idInput = document.querySelector('#product-id');
const nameInput = document.querySelector('#product-name');
const priceInput = document.querySelector('#product-price');
const dateInput = document.querySelector('#product-date');
const specialInput = document.querySelector('#product-special');
const message = document.querySelector('#message');
let editingId = null;
let products = [];
let storageError = false;
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || '[]');
  if (!Array.isArray(saved) || saved.some(item => !item || !Number.isSafeInteger(item.id) || item.id < 1 || typeof item.name !== 'string' || typeof item.price !== 'number' || !Number.isFinite(item.price) || item.price < 0 || typeof item.special !== 'boolean' || typeof item.date !== 'string')) throw new Error('Дані пошкоджено');
  products = saved;
} catch {
  localStorage.setItem(KEY + '-backup', localStorage.getItem(KEY) || '');
  localStorage.removeItem(KEY);
  storageError = true;
}

function showMessage(text, error = false) {
  message.textContent = text;
  message.className = error ? 'error' : '';
}

function resetForm() {
  form.reset();
  dateInput.value = new Date().toLocaleDateString('en-CA');
  editingId = null;
  document.querySelector('#form-title').textContent = 'Додати товар';
  document.querySelector('#save').textContent = 'Додати товар';
  document.querySelector('#cancel').hidden = true;
}

function draw() {
  const field = document.querySelector('#sort-field').value;
  const direction = document.querySelector('#sort-direction').value === 'asc' ? 1 : -1;
  const sorted = [...products].sort((a, b) => direction * (a[field] - b[field]) || a.id - b.id);
  const body = document.querySelector('#products');
  body.replaceChildren();
  for (const product of sorted) {
    const row = document.createElement('tr');
    for (const value of [product.id, product.name, product.price.toFixed(2), product.special ? 'Так' : 'Ні', product.date]) {
      const cell = document.createElement('td');
      cell.textContent = value;
      if (row.children.length === 3) cell.className = product.special ? 'badge-cell yes' : 'badge-cell';
      row.append(cell);
    }
    const actions = document.createElement('td');
    const edit = document.createElement('button');
    edit.textContent = 'Редагувати';
    edit.className = 'secondary';
    edit.addEventListener('click', () => editProduct(product.id));
    const remove = document.createElement('button');
    remove.textContent = 'Видалити';
    remove.className = 'delete';
    remove.addEventListener('click', () => deleteProduct(product.id));
    actions.append(edit, remove);
    row.append(actions);
    body.append(row);
  }
  document.querySelector('#count').textContent = products.length;
  document.querySelector('#empty').hidden = products.length > 0;
}

function store(nextProducts) {
  localStorage.setItem(KEY, JSON.stringify(nextProducts));
  products = nextProducts;
  draw();
}

function editProduct(id) {
  const product = products.find(item => item.id === id);
  editingId = id;
  idInput.value = product.id;
  nameInput.value = product.name;
  priceInput.value = product.price.toFixed(2);
  dateInput.value = product.date;
  specialInput.checked = product.special;
  document.querySelector('#form-title').textContent = 'Редагувати товар';
  document.querySelector('#save').textContent = 'Зберегти зміни';
  document.querySelector('#cancel').hidden = false;
  showMessage('Редагування товару №' + id);
  idInput.focus();
}

function deleteProduct(id) {
  if (!confirm('Видалити товар №' + id + '?')) return;
  store(products.filter(product => product.id !== id));
  if (editingId === id) resetForm();
  showMessage('Товар видалено.');
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const idText = idInput.value.trim();
  const name = nameInput.value.trim();
  const priceText = priceInput.value.trim();
  const date = dateInput.value;
  if (!idText || !name || !priceText || !date) return showMessage('Заповніть усі обов’язкові поля.', true);
  const id = Number(idText);
  const price = Number(priceText.replace(',', '.'));
  if (!/^\d+$/.test(idText) || !Number.isSafeInteger(id) || id < 1) return showMessage('ID має бути додатним цілим числом.', true);
  if (name.length > 100) return showMessage('Назва має містити до 100 символів.', true);
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(priceText) || !Number.isFinite(price) || price < 0) return showMessage('Ціна має бути невід’ємним числом, до двох знаків після коми.', true);
  if (products.some(product => product.id === id && product.id !== editingId)) return showMessage('Товар із таким ID вже існує.', true);
  const product = {id, name, price, special: specialInput.checked, date};
  const next = editingId === null ? [...products, product] : products.map(item => item.id === editingId ? product : item);
  const wasEditing = editingId !== null;
  store(next);
  resetForm();
  showMessage(wasEditing ? 'Зміни збережено.' : 'Товар додано.');
});
document.querySelector('#cancel').addEventListener('click', () => {resetForm(); showMessage('Редагування скасовано.');});
document.querySelector('#sort-field').addEventListener('change', draw);
document.querySelector('#sort-direction').addEventListener('change', draw);
document.querySelector('#reset').addEventListener('click', () => {
  if (!confirm('Очистити всі товари?')) return;
  store([]);
  resetForm();
  showMessage('Список очищено.');
});
resetForm();
draw();
if (storageError) showMessage('Збережені дані пошкоджено. Створено резервну копію; список очищено.', true);
