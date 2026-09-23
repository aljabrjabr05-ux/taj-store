"use strict";

const app = document.getElementById("app");
const nav = document.getElementById("nav");

function page(title, text) {
  app.innerHTML = `
    <section class="page">
      <div class="panel">
        <h1>${title}</h1>
        <p>${text}</p>
      </div>
    </section>
  `;
}

function openPage(name) {
  switch (name) {
    case "dashboard":
      page("الرئيسية", "مرحبًا بك في الجابر للمحاسبة");
      break;

    case "sales":
      page("فاتورة بيع", "هنا سيتم إنشاء فاتورة بيع جديدة");
      break;

    case "purchases":
      page("فاتورة شراء", "هنا سيتم إنشاء فاتورة شراء جديدة");
      break;

    case "items":
      page("الأصناف", "هنا إدارة الأصناف والمخزون");
      break;

    case "customers":
      page("العملاء", "هنا إدارة العملاء");
      break;

    case "debts":
      page("الديون", "هنا دفتر الديون");
      break;

    case "moves":
      page("الوارد والصادر", "هنا تسجيل الوارد والصادر");
      break;

    case "reports":
      page("التقارير", "هنا تقارير المحاسبة");
      break;

    default:
      page("الجابر للمحاسبة", "اختر قسمًا من القائمة");
  }
}

nav.addEventListener("click", function (event) {
  const button = event.target.closest("[data-page]");

  if (!button) return;

  openPage(button.dataset.page);
});

openPage("dashboard");
