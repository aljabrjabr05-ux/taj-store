(() => {
  "use strict";

  const app = document.getElementById("app");
  const nav = document.getElementById("nav");
  const installBtn = document.getElementById("installBtn");

  const KEY = "aljabr_accounting_v1";

  const emptyDB = {
    items: [],
    customers: [],
    sales: [],
    purchases: [],
    debts: [],
    moves: []
  };

  let db = loadDB();
  let deferredInstall = null;

  function loadDB() {
    try {
      const saved = localStorage.getItem(KEY);
      return saved ? { ...emptyDB, ...JSON.parse(saved) } : { ...emptyDB };
    } catch (e) {
      return { ...emptyDB };
    }
  }

  function saveDB() {
    localStorage.setItem(KEY, JSON.stringify(db));
  }

  function money(value) {
    const n = Number(value || 0);
    return n.toLocaleString("ar-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function id() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function layout(title, content) {
    app.innerHTML = `
      <section class="page">
        <div class="page-head">
          <div>
            <h1>${title}</h1>
            <p>نظام الجابر للمحاسبة</p>
          </div>
        </div>
        ${content}
      </section>
    `;
  }

  function empty(text) {
    return `
      <div class="empty">
        <div>📋</div>
        <p>${text}</p>
      </div>
    `;
  }

  function dashboard() {
    const sales = db.sales.reduce((s, x) => s + Number(x.total || 0), 0);
    const purchases = db.purchases.reduce((s, x) => s + Number(x.total || 0), 0);
    const debts = db.debts.reduce((s, x) => s + Number(x.amount || 0), 0);

    layout("الرئيسية", `
      <div class="cards">
        <div class="card">
          <span>💰 المبيعات</span>
          <strong>${money(sales)}</strong>
        </div>
        <div class="card">
          <span>🛒 المشتريات</span>
          <strong>${money(purchases)}</strong>
        </div>
        <div class="card">
          <span>👥 العملاء</span>
          <strong>${db.customers.length}</strong>
        </div>
        <div class="card">
          <span>📦 الأصناف</span>
          <strong>${db.items.length}</strong>
        </div>
        <div class="card">
          <span>📒 الديون</span>
          <strong>${money(debts)}</strong>
        </div>
      </div>

      <div class="panel">
        <h2>الوصول السريع</h2>
        <div class="quick">
          <button data-go="sales">➕ فاتورة بيع</button>
          <button data-go="purchases">🛒 فاتورة شراء</button>
          <button data-go="items">📦 إضافة صنف</button>
          <button data-go="customers">👤 إضافة عميل</button>
          <button data-go="debts">📒 تسجيل دين</button>
        </div>
      </div>

      <div class="panel">
        <h2>ملخص الحساب</h2>
        <div class="summary">
          <div>صافي الحركة</div>
          <strong>${money(sales - purchases)}</strong>
        </div>
      </div>
    `);
  }

  function salesPage() {
    layout("فاتورة بيع", `
      <div class="panel">
        <h2>فاتورة بيع جديدة</h2>

        <form id="salesForm" class="form">
          <label>العميل
            <select id="saleCustomer">
              <option value="">عميل نقدي</option>
              ${db.customers.map(c =>
                `<option value="${escapeHTML(c.id)}">${escapeHTML(c.name)}</option>`
              ).join("")}
            </select>
          </label>

          <label>الصنف
            <select id="saleItem">
              <option value="">اختر الصنف</option>
              ${db.items.map(i =>
                `<option value="${escapeHTML(i.id)}">${escapeHTML(i.name)} — ${money(i.price)}</option>`
              ).join("")}
            </select>
          </label>

          <label>الكمية
            <input id="saleQty" type="number" min="1" value="1">
          </label>

          <label>السعر
            <input id="salePrice" type="number" min="0" step="0.01" value="0">
          </label>

          <label>العملة
            <select id="saleCurrency">
              <option>USD</option>
              <option>TRY</option>
              <option>SYP</option>
              <option>EUR</option>
              <option>IQD</option>
            </select>
          </label>

          <button class="primary" type="submit">حفظ فاتورة البيع</button>
        </form>
      </div>

      <div class="panel">
        <h2>الفواتير السابقة</h2>
        ${db.sales.length ? `
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>العميل</th>
                  <th>الصنف</th>
                  <th>الكمية</th>
                  <th>الإجمالي</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${db.sales.slice().reverse().map(x => `
                  <tr>
                    <td>${x.date}</td>
                    <td>${escapeHTML(x.customerName || "نقدي")}</td>
                    <td>${escapeHTML(x.itemName)}</td>
                    <td>${x.qty}</td>
                    <td>${money(x.total)} ${escapeHTML(x.currency)}</td>
                    <td><button class="danger small" data-delete-sale="${x.id}">حذف</button></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        ` : empty("لا توجد فواتير بيع بعد")}
      </div>
    `);

    const item = document.getElementById("saleItem");
    const price = document.getElementById("salePrice");

    item.addEventListener("change", () => {
      const found = db.items.find(x => x.id === item.value);
      if (found) price.value = found.price;
    });

    document.getElementById("salesForm").addEventListener("submit", e => {
      e.preventDefault();

      const itemObj = db.items.find(x => x.id === item.value);
      const qty = Number(document.getElementById("saleQty").value);
      const unitPrice = Number(price.value);
      const currency = document.getElementById("saleCurrency").value;

      if (!itemObj) {
        alert("اختر صنفًا أولاً");
        return;
      }

      if (qty <= 0 || unitPrice < 0) {
        alert("تحقق من الكمية والسعر");
        return;
      }

      const customerId = document.getElementById("saleCustomer").value;
      const customer = db.customers.find(x => x.id === customerId);

      db.sales.push({
        id: id(),
        date: today(),
        customerName: customer ? customer.name : "نقدي",
        itemName: itemObj.name,
        qty,
        price: unitPrice,
        total: qty * unitPrice,
        currency
      });

      itemObj.stock = Math.max(0, Number(itemObj.stock || 0) - qty);

      saveDB();
      alert("تم حفظ فاتورة البيع بنجاح");
      salesPage();
    });

    app.querySelectorAll("[data-delete-sale]").forEach(btn => {
      btn.addEventListener("click", () => {
        db.sales = db.sales.filter(x => x.id !== btn.dataset.deleteSale);
        saveDB();
        salesPage();
      });
    });
  }

  function purchasesPage() {
    layout("فاتورة شراء", `
      <div class="panel">
        <h2>فاتورة شراء جديدة</h2>

        <form id="purchaseForm" class="form">
          <label>المورد
            <input id="purchaseSupplier" placeholder="اسم المورد">
          </label>

          <label>الصنف
            <select id="purchaseItem">
              <option value="">اختر الصنف</option>
              ${db.items.map(i =>
                `<option value="${i.id}">${escapeHTML(i.name)}</option>`
              ).join("")}
            </select>
          </label>

          <label>الكمية
            <input id="purchaseQty" type="number" min="1" value="1">
          </label>

          <label>سعر الشراء
            <input id="purchasePrice" type="number" min="0" step="0.01" value="0">
          </label>

          <label>العملة
            <select id="purchaseCurrency">
              <option>USD</option>
              <option>TRY</option>
              <option>SYP</option>
              <option>EUR</option>
              <option>IQD</option>
            </select>
          </label>

          <button class="primary" type="submit">حفظ فاتورة الشراء</button>
        </form>
      </div>

      <div class="panel">
        <h2>الفواتير السابقة</h2>
        ${db.purchases.length ? `
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>المورد</th>
                  <th>الصنف</th>
                  <th>الكمية</th>
                  <th>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                ${db.purchases.slice().reverse().map(x => `
                  <tr>
                    <td>${x.date}</td>
                    <td>${escapeHTML(x.supplier)}</td>
                    <td>${escapeHTML(x.itemName)}</td>
                    <td>${x.qty}</td>
                    <td>${money(x.total)} ${x.currency}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        ` : empty("لا توجد فواتير شراء بعد")}
      </div>
    `);

    document.getElementById("purchaseForm").addEventListener("submit", e => {
      e.preventDefault();

      const itemId = document.getElementById("purchaseItem").value;
      const itemObj = db.items.find(x => x.id === itemId);
      const qty = Number(document.getElementById("purchaseQty").value);
      const price = Number(document.getElementById("purchasePrice").value);

      if (!itemObj) {
        alert("اختر الصنف أولاً");
        return;
      }

      db.purchases.push({
        id: id(),
        date: today(),
        supplier: document.getElementById("purchaseSupplier").value || "غير محدد",
        itemName: itemObj.name,
        qty,
        price,
        total: qty * price,
        currency: document.getElementById("purchaseCurrency").value
      });

      itemObj.stock = Number(itemObj.stock || 0) + qty;

      saveDB();
      alert("تم حفظ فاتورة الشراء");
      purchasesPage();
    });
  }

  function itemsPage() {
    layout("الأصناف والمخزون", `
      <div class="panel">
        <h2>إضافة صنف</h2>

        <form id="itemForm" class="form">
          <label>اسم الصنف
            <input id="itemName" required placeholder="مثال: إسمنت">
          </label>

          <label>سعر البيع
            <input id="itemPrice" type="number" min="0" step="0.01" required>
          </label>

          <label>سعر الشراء
            <input id="itemBuy" type="number" min="0" step="0.01" value="0">
          </label>

          <label>الكمية الحالية
            <input id="itemStock" type="number" min="0" value="0">
          </label>

          <button class="primary" type="submit">إضافة الصنف</button>
        </form>
      </div>

      <div class="panel">
        <h2>قائمة الأصناف</h2>
        ${db.items.length ? `
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>الصنف</th>
                  <th>سعر البيع</th>
                  <th>سعر الشراء</th>
                  <th>المخزون</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${db.items.map(x => `
                  <tr>
                    <td>${escapeHTML(x.name)}</td>
                    <td>${money(x.price)}</td>
                    <td>${money(x.buy)}</td>
                    <td>${x.stock}</td>
                    <td><button class="danger small" data-delete-item="${x.id}">حذف</button></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        ` : empty("لم تتم إضافة أي أصناف")}
      </div>
    `);

    document.getElementById("itemForm").addEventListener("submit", e => {
      e.preventDefault();

      db.items.push({
        id: id(),
        name: document.getElementById("itemName").value.trim(),
        price: Number(document.getElementById("itemPrice").value),
        buy: Number(document.getElementById("itemBuy").value),
        stock: Number(document.getElementById("itemStock").value)
      });

      saveDB();
      alert("تمت إضافة الصنف");
      itemsPage();
    });

    app.querySelectorAll("[data-delete-item]").forEach(btn => {
      btn.addEventListener("click", () => {
        if (!confirm("هل تريد حذف هذا الصنف؟")) return;
        db.items = db.items.filter(x => x.id !== btn.dataset.deleteItem);
        saveDB();
        itemsPage();
      });
    });
  }

  function customersPage() {
    layout("العملاء", `
      <div class="panel">
        <h2>إضافة عميل</h2>

        <form id="customerForm" class="form">
          <label>اسم العميل
            <input id="customerName" required>
          </label>

          <label>رقم الهاتف
            <input id="customerPhone" type="tel">
          </label>

          <label>العنوان
            <input id="customerAddress">
          </label>

          <button class="primary" type="submit">إضافة العميل</button>
        </form>
      </div>

      <div class="panel">
        <h2>قائمة العملاء</h2>
        ${db.customers.length ? `
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>الهاتف</th>
                  <th>العنوان</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${db.customers.map(x => `
                  <tr>
                    <td>${escapeHTML(x.name)}</td>
                    <td>${escapeHTML(x.phone)}</td>
                    <td>${escapeHTML(x.address)}</td>
                    <td><button class="danger small" data-delete-customer="${x.id}">حذف</button></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        ` : empty("لا يوجد عملاء")}
      </div>
    `);

    document.getElementById("customerForm").addEventListener("submit", e => {
      e.preventDefault();

      db.customers.push({
        id: id(),
        name: document.getElementById("customerName").value.trim(),
        phone: document.getElementById("customerPhone").value.trim(),
        address: document.getElementById("customerAddress").value.trim()
      });

      saveDB();
      alert("تمت إضافة العميل");
      customersPage();
    });

    app.querySelectorAll("[data-delete-customer]").forEach(btn => {
      btn.addEventListener("click", () => {
        db.customers = db.customers.filter(x => x.id !== btn.dataset.deleteCustomer);
        saveDB();
        customersPage();
      });
    });
  }

  function debtsPage() {
    layout("دفتر الديون", `
      <div class="panel">
        <h2>تسجيل دين</h2>

        <form id="debtForm" class="form">
          <label>اسم الشخص
            <input id="debtName" required placeholder="مثال: أحمد">
          </label>

          <label>المبلغ
            <input id="debtAmount" type="number" min="0" step="0.01" required>
          </label>

          <label>العملة
            <select id="debtCurrency">
              <option>USD</option>
              <option>TRY</option>
              <option>SYP</option>
              <option>EUR</option>
              <option>IQD</option>
            </select>
          </label>

          <label>البيان
            <input id="debtNote" placeholder="مثال: ثمن مواد">
          </label>

          <button class="primary" type="submit">تسجيل الدين</button>
        </form>
      </div>

      <div class="panel">
        <h2>سجل الديون</h2>
        ${db.debts.length ? `
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>الشخص</th>
                  <th>المبلغ</th>
                  <th>البيان</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${db.debts.slice().reverse().map(x => `
                  <tr>
                    <td>${x.date}</td>
                    <td>${escapeHTML(x.name)}</td>
                    <td>${money(x.amount)} ${x.currency}</td>
                    <td>${escapeHTML(x.note)}</td>
                    <td><button class="danger small" data-delete-debt="${x.id}">حذف</button></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        ` : empty("لا توجد ديون مسجلة")}
      </div>
    `);

    document.getElementById("debtForm").addEventListener("submit", e => {
      e.preventDefault();

      db.debts.push({
        id: id(),
        date: today(),
        name: document.getElementById("debtName").value.trim(),
        amount: Number(document.getElementById("debtAmount").value),
        currency: document.getElementById("debtCurrency").value,
        note: document.getElementById("debtNote").value.trim()
      });

      saveDB();
      alert("تم تسجيل الدين");
      debtsPage();
    });

    app.querySelectorAll("[data-delete-debt]").forEach(btn => {
      btn.addEventListener("click", () => {
        db.debts = db.debts.filter(x => x.id !== btn.dataset.deleteDebt);
        saveDB();
        debtsPage();
      });
    });
  }

  function movesPage() {
    layout("الوارد والصادر", `
      <div class="panel">
        <h2>إضافة حركة</h2>

        <form id="moveForm" class="form">
          <label>نوع الحركة
            <select id="moveType">
              <option value="وارد">وارد</option>
              <option value="صادر">صادر</option>
            </select>
          </label>

          <label>البيان
            <input id="moveNote" required>
          </label>

          <label>المبلغ
            <input id="moveAmount" type="number" min="0" step="0.01" required>
          </label>

          <label>العملة
            <select id="moveCurrency">
              <option>USD</option>
              <option>TRY</option>
              <option>SYP</option>
              <option>EUR</option>
              <option>IQD</option>
            </select>
          </label>

          <button class="primary" type="submit">حفظ الحركة</button>
        </form>
      </div>

      <div class="panel">
        <h2>الحركات</h2>
        ${db.moves.length ? `
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>النوع</th>
                  <th>البيان</th>
                  <th>المبلغ</th>
                </tr>
              </thead>
              <tbody>
                ${db.moves.slice().reverse().map(x => `
                  <tr>
                    <td>${x.date}</td>
                    <td>${x.type}</td>
                    <td>${escapeHTML(x.note)}</td>
                    <td>${money(x.amount)} ${x.currency}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        ` : empty("لا توجد حركات")}
      </div>
    `);

    document.getElementById("moveForm").addEventListener("submit", e => {
      e.preventDefault();

      db.moves.push({
        id: id(),
        date: today(),
        type: document.getElementById("moveType").value,
        note: document.getElementById("moveNote").value.trim(),
        amount: Number(document.getElementById("moveAmount").value),
        currency: document.getElementById("moveCurrency").value
      });

      saveDB();
      alert("تم حفظ الحركة");
      movesPage();
    });
  }

  function reportsPage() {
    const sales = db.sales.reduce((s, x) => s + Number(x.total || 0), 0);
    const purchases = db.purchases.reduce((s, x) => s + Number(x.total || 0), 0);
    const incoming = db.moves
      .filter(x => x.type === "وارد")
      .reduce((s, x) => s + Number(x.amount || 0), 0);

    const outgoing = db.moves
      .filter(x => x.type === "صادر")
      .reduce((s, x) => s + Number(x.amount || 0), 0);

    layout("التقارير", `
      <div class="cards">
        <div class="card">
          <span>إجمالي المبيعات</span>
          <strong>${money(sales)}</strong>
        </div>

        <div class="card">
          <span>إجمالي المشتريات</span>
          <strong>${money(purchases)}</strong>
        </div>

        <div class="card">
          <span>الوارد</span>
          <strong>${money(incoming)}</strong>
        </div>

        <div class="card">
          <span>الصادر</span>
          <strong>${money(outgoing)}</strong>
        </div>
      </div>

      <div class="panel">
        <h2>حالة النظام</h2>
        <p>عدد الأصناف: <strong>${db.items.length}</strong></p>
        <p>عدد العملاء: <strong>${db.customers.length}</strong></p>
        <p>فواتير البيع: <strong>${db.sales.length}</strong></p>
        <p>فواتير الشراء: <strong>${db.purchases.length}</strong></p>
        <p>سجلات الديون: <strong>${db.debts.length}</strong></p>
      </div>

      <div class="panel">
        <button class="primary" id="exportData">تصدير نسخة احتياطية</button>
        <button class="secondary" id="clearData">مسح بيانات التطبيق</button>
      </div>
    `);

    document.getElementById("exportData").addEventListener("click", () => {
      const blob = new Blob(
        [JSON.stringify(db, null, 2)],
        { type: "application/json" }
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "aljabr-backup.json";
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById("clearData").addEventListener("click", () => {
      if (!confirm("سيتم حذف كل البيانات الموجودة على هذا الجهاز. هل أنت متأكد؟")) return;

      db = {
        items: [],
        customers: [],
        sales: [],
        purchases: [],
        debts: [],
        moves: []
      };

      saveDB();
      alert("تم مسح البيانات");
      dashboard();
    });
  }

  function openPage(page) {
    document.querySelectorAll("#nav button").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.page === page);
    });

    switch (page) {
      case "sales":
        salesPage();
        break;
      case "purchases":
        purchasesPage();
        break;
      case "items":
        itemsPage();
        break;
      case "customers":
        customersPage();
        break;
      case "debts":
        debtsPage();
        break;
      case "moves":
        movesPage();
        break;
      case "reports":
        reportsPage();
        break;
      default:
        dashboard();
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  nav.addEventListener("click", e => {
    const button = e.target.closest("[data-page]");
    if (!button) return;
    openPage(button.dataset.page);
  });

  app.addEventListener("click", e => {
    const button = e.target.closest("[data-go]");
    if (!button) return;
    openPage(button.dataset.go);
  });

  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    deferredInstall = e;

    if (installBtn) {
      installBtn.hidden = false;
    }
  });

  if (installBtn) {
    installBtn.addEventListener("click", async () => {
      if (!deferredInstall) return;

      deferredInstall.prompt();
      await deferredInstall.userChoice;
      deferredInstall = null;
      installBtn.hidden = true;
    });
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }

  openPage("dashboard");
})();
