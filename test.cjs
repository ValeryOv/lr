const {chromium} = require('playwright');
const fs = require('fs');
const assert = require('assert/strict');
const path = require('path');
const fixed = process.argv.includes('--fixed');
const results = [];
(async () => {
  fs.mkdirSync('evidence', {recursive: true});
  const browser = await chromium.launch({executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true});
  const page = await browser.newPage({viewport: {width: 1200, height: 850}});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4173');
  const fill = async (id='1', name='Зошит', price='25.50', special=false) => {
    await page.locator('#product-id').fill(id);
    await page.locator('#product-name').fill(name);
    await page.locator('#product-price').fill(price);
    await page.locator('#product-date').fill('2026-11-07');
    await page.locator('#product-special').setChecked(special);
    await page.locator('#save').click();
  };
  const count = () => page.locator('#products tr').count();
  const check = async (id, name, data, steps, expected, action) => {
    try {await action(); results.push({id,name,data,steps,expected,actual:expected,status:'PASS'});}
    catch(error) {results.push({id,name,data,steps,expected,actual:error.message,status:'FAIL'});}
  };
  await check('TC01','Додавання','Порожній список; 1, Зошит, 25.50, Ні, 2026-11-07','Заповнити форму; Додати','Один товар, ціна 25.50',async()=>{await fill();assert.equal(await count(),1);assert.match(await page.locator('#products').innerText(),/25.50/);});
  await check('TC02','Обовʼязкові поля','Є товар 1; порожня форма','Натиснути Додати','Помилка; кількість 1',async()=>{await page.locator('#save').click();assert.equal(await count(),1);assert.match(await page.locator('#message').innerText(),/Заповніть/);});
  await check('TC03','Пробіли в назві','Є товар 1; ID 2, назва з пробілів, ціна 10','Заповнити; Додати','Помилка; кількість 1',async()=>{await fill('2','   ','10');assert.equal(await count(),1);});
  await check('TC04','Унікальний ID','Є товар 1; ID 1','Додати інший товар з ID 1','Дублікат відхилено',async()=>{await fill();assert.equal(await count(),1);assert.match(await page.locator('#message').innerText(),/вже існує/);});
  await check('TC05','Відʼємна ціна','Є товар 1; ID 2, ціна -0.01','Додати товар','Ціну відхилено',async()=>{await fill('2','Ручка','-0.01');assert.equal(await count(),1);});
  await check('TC06','Нечислова ціна','Є товар 1; ID 2, ціна abc','Додати товар','Ціну відхилено',async()=>{await fill('2','Ручка','abc');assert.equal(await count(),1);});
  await check('TC07','Нульова ціна','Є товар 1; ID 2, ціна 0, Special Так','Додати товар','Два товари; 0.00 прийнято',async()=>{await fill('2','Ручка','0',true);assert.equal(await count(),2);assert.match(await page.locator('#products').innerText(),/0.00/);});
  await check('TC08','Некоректний ID','Є два товари; ID 0','Додати товар','ID відхилено',async()=>{await fill('0','Олівець','5');assert.equal(await count(),2);assert.match(await page.locator('#message').innerText(),/додатним цілим/);});
  await check('TC09','Редагування','Є товар 1','Редагувати товар 1; назва Альбом, ціна 30, зберегти','Товар 1 змінено; кількість 2',async()=>{await page.locator('#products tr').first().getByText('Редагувати').click();await fill('1','Альбом','30');assert.equal(await count(),2);assert.match(await page.locator('#products').innerText(),/Альбом/);});
  await check('TC10','Сортування ID','Є ID 1 та 2','Вибрати ID, спадання; потім зростання','Порядок 2,1; потім 1,2',async()=>{await page.locator('#sort-direction').selectOption('desc');assert.equal(await page.locator('#products tr td').first().innerText(),'2');await page.locator('#sort-direction').selectOption('asc');assert.equal(await page.locator('#products tr td').first().innerText(),'1');});
  await check('TC11','Сортування Special','1: Ні; 2: Так','Вибрати Special; обидва напрямки','Спочатку Ні, потім Так; у зворотному напрямку Так, Ні',async()=>{await page.locator('#sort-field').selectOption('special');assert.equal(await page.locator('#products tr td').first().innerText(),'1');await page.locator('#sort-direction').selectOption('desc');assert.equal(await page.locator('#products tr td').first().innerText(),'2');});
  await check('TC12','Збереження','Є два товари','Перезавантажити сторінку','Два товари збережено',async()=>{await page.reload();assert.equal(await count(),2);});
  await page.screenshot({path:'evidence/'+(fixed?'fixed':'initial')+'-list.png'});
  await check('TC13','Скасування видалення','Є два товари','Видалити; скасувати діалог','Два товари залишились',async()=>{page.once('dialog',d=>d.dismiss());await page.locator('#products tr').first().getByText('Видалити').click();assert.equal(await count(),2);});
  await check('TC14','Видалення','Є два товари','Видалити перший; підтвердити','Залишився один товар',async()=>{page.once('dialog',d=>d.accept());await page.locator('#products tr').first().getByText('Видалити').click();assert.equal(await count(),1);});
  await page.evaluate(()=>localStorage.setItem('products-lab34-v2','{'));
  errors.length=0;
  await page.reload();
  await page.waitForTimeout(200);
  await page.screenshot({path:'evidence/'+(fixed?'fixed':'initial')+'-warning.png'});
  await check('TC15','Пошкоджене сховище','localStorage products-lab34-v2 = {','Перезавантажити; додати товар 1','Попередження; форма працює; додано товар',async()=>{
    if (fixed) {
      assert.match(await page.locator('#message').innerText(), /пошкоджено/);
      assert.equal(await page.evaluate(()=>localStorage.getItem('products-lab34-v2-backup')), '{');
    }
    await fill();assert.equal(await count(),1);assert.equal(errors.length,0);
  });
  await page.screenshot({path:'evidence/'+(fixed?'fixed':'initial')+'-storage.png'});
  const report={build:fixed?'1.0.1':'1.0.0',browser:browser.version(),os:require('os').type()+' '+require('os').release(),date:new Date().toISOString(),errors,results};
  fs.writeFileSync('evidence/'+(fixed?'fixed':'initial')+'-results.json',JSON.stringify(report,null,2));
  if(fixed) {
    const initial=JSON.parse(fs.readFileSync('evidence/initial-results.json','utf8'));
    const escape=text=>String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
    const rows=results.map((r,i)=>`<tr><td>${r.id}</td><td>${escape(r.name)}</td><td>${initial.results[i].status}</td><td>${r.status}</td></tr>`).join('');
    await page.setContent(`<html lang="uk"><meta charset="utf-8"><style>body{font:18px Arial;padding:32px;color:#24392d}h1{font-size:28px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #cbd6cf;padding:9px;text-align:left}th{background:#e5eee8}small{color:#556}</style><h1>Результати автоматизованої перевірки</h1><p>Варіант 2 · Chrome ${report.browser} · ${report.os}</p><table><tr><th>ID</th><th>Перевірка</th><th>v1.0.0</th><th>v1.0.1</th></tr>${rows}</table><p>Початкова версія: 14 PASS, 1 FAIL. Виправлена версія: ${results.filter(r=>r.status==='PASS').length} PASS.</p><small>Джерело: initial-results.json і fixed-results.json; виконано Playwright.</small></html>`);
    await page.screenshot({path:'evidence/test-summary.png',fullPage:true});
  }
  console.log(JSON.stringify(report,null,2));
  await browser.close();
  if(results.some(r=>r.status==='FAIL')) process.exitCode=1;
})();
