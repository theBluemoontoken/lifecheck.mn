document.addEventListener("DOMContentLoaded", () => {
  const intro = document.querySelector(".intro");
  const testSection = document.querySelector(".test");
  const resultSection = document.querySelector(".result");
  const startBtn = document.querySelector(".start-btn");
  const questions = document.querySelectorAll(".question-card");
  const tooltip = document.getElementById("wizard-comment");
  const progressText = document.getElementById("progress-text");

  let currentIndex = 0;
  let scores = { lowcarb: 0, balanced: 0, cleanse: 0 };

  const wizardComments = [
  "Сонголт бүр чинь чамайг гэрэл рүү ойртуулах уу, эсвэл харанхуйд түлхэх үү гэдгийг шийднэ.",
  "Энэ асуултад өгсөн хариулт чинь чиний сэтгэлийн жинхэнэ галыг илчилнэ.",
  "Хэрэв чи энэ асуултаас зугтвал хувь заяа чинь өөрөө чамаас зугтах болно.",
  "Олон үг шаардлагагүй… зөвхөн чиний хариулт л жинхэнэ үнэнийг хэлнэ.",
  "Эндээс чи өөрийн амьдралын гунигт эсвэл баатарлаг замыг харна.",
  "Чи бодлоо нууж чадна гэж үү? Гэвч миний бөмбөлөг бүхнийг хардаг.",
  "Энэ бол зүгээр нэг асуулт биш, энэ бол чиний сорилын эртний түлхүүр юм.",
  "Хариултаа болгоомжтой сонго — уулсын чимээгүй байдал чамайг сонсож байна.",
  "Зүрх чинь худлаа хэлдэггүй. Харин чи сонсох зоригтой юу?",
  "Энэ бол эцсийн сорилын өмнөх сүүдэр. Бодож, хариулаад цааш алх."
  ];

  const guides = {
    lowcarb: {
      title: "🔥 Гүзээгээ Шатаа — 20 хуудас Low-Carb гарын авлага",
      img: "../images/lowcarb.png",
      content: `“50гр-ын дүрэм”-ээр эхлээд нүүрс усаа эрс багасгаж, мах, өндөг, ногоо түшиглэсэн хялбар төлөвлөгөө.
      Хүнсний дэлгүүрт юу авахаа мэдэхгүй байна уу? Cheat sheet-ээрээ гар дорхоосоо хараад ав.
      7 хоногийн өглөө, өдөр, оройн цэс хүртэл бэлэн!`,
      pr: "✨ Хэрэв чи өнөөдрөөс л “гүзээгээ шатаах” зоригтой алхам хийх гэж байгаа бол энэ судар бол чиний хамгийн хүчтэй зэвсэг."
    },
    balanced: {
      title: "🥗 Идээд л Тур — 18 хуудас Calorie Deficit гарын авлага",
      img: "../images/caloriedeficit.png",
      content: `Хоолоо хасах биш, зөв хэмжээгээр идэхэд л жин буурдаг гэдгийг шинжлэх ухаанаар баталсан аргачлал.
      Өдөрт хэдэн калори шатаадаг, хэдийг идэж болохоо тооцоод, өлсгөлөнгүйгээр аажмаар тураарай.
      Фитнес заалгүйгээр хөдөлгөөнөө нэмэх, апп-аар тооцоолох гээд бүх заль мэхийг оруулсан.`,
      pr: "✨ “Хоолоо идээд л турдаг юм байна гэдэг чинь миний хайж байсан арга шүү!” гэж хэлэх мөч ойртож байна."
    },
    cleanse: {
      title: "💧 Хөнгөрөх Философи — 15 хуудас Cleansing гарын авлага",
      img: "../images/cleanse.png",
      content: `Гэдэс бөглөрөл, хаван, хий — бүгд эрч хүч, сэтгэл санаанд шууд нөлөөлдөг.
      Энэ судар нь 3–5 хоногийн хөтөлбөрөөр ус, ширхэглэг, пробиотикоор гэдсийг цэвэрлэх арга замыг багтаасан.
      “Цэвэр бие = Цэвэр тархи” гэдэг философиор хөнгөн, тайван мэдрэмжийг өгөх зорилготой.`,
      pr: "✨ Биеэ цэвэрлэхээр зөвхөн гэдэс чинь биш — тархи, сэтгэл чинь хүртэл хөнгөрдөг."
    }
  };

  // Start button
  startBtn.addEventListener("click", () => {
  intro.classList.add("hidden");
  testSection.classList.remove("hidden");
  showQuestion(currentIndex);

  // ✅ Scroll always to top of test section
  testSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

  // Show question
  function showQuestion(index) {
    questions.forEach((q, i) => {
      q.style.display = i === index ? "block" : "none";
    });
    if (wizardComments[index]) {
      tooltip.textContent = wizardComments[index];
    }
    progressText.textContent = `Сорилын ${index + 1}-р алхам `;
  }

  // Answer buttons
  questions.forEach((q, idx) => {
    q.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        scores[btn.dataset.score]++;
        currentIndex++;
        if (currentIndex < questions.length) {
          showQuestion(currentIndex);
        } else {
          showResult();
        }
      });
    });
  });

  // Show result
  function showResult() {
  const overlay = document.querySelector(".result-overlay");
  const overlayCrystal = overlay.querySelector(".overlay-crystal");
  const overlayText = overlay.querySelector(".overlay-text");

  testSection.classList.add("hidden");
  resultSection.classList.add("hidden");
  overlay.classList.add("show");
  overlayCrystal.classList.add("animate");
  overlayText.textContent = "Зөгнөлийг тайлж байна...";

  setTimeout(() => {
    overlayText.textContent = "Судруудыг бэлдэж байна...";
  }, 2500);

  setTimeout(() => {
    overlay.classList.remove("show");
    overlayCrystal.classList.remove("animate");

    renderResultContent(); 

    resultSection.classList.remove("hidden");
    resultSection.classList.add("show");
    resultSection.scrollIntoView({ behavior: "smooth" });

  }, 5000);
}

function renderResultContent() {
  resultSection.innerHTML = `
    <div class="container">
      <div class="result-animation fade-in" style="animation-delay:0s">
  <img src="../images/crystal.png" alt="Crystal Ball" class="crystal result-crystal">
  <h2>Шидэт бөмбөлөгийн үр дүн гарлаа 🔮</h2>
  <p class="result-subtitle">Чамд зориулагдсан шидэт гарын авлага бол...</p>
</div>
    </div>
  `;
  const container = resultSection.querySelector(".container");

  const maxType = Object.keys(scores).reduce((a, b) =>
    scores[a] > scores[b] ? a : b
  );
  const bonusTypes = Object.keys(scores).filter(t => t !== maxType);

  const main = guides[maxType];
  container.innerHTML += `
    <div class="main-scroll result-block fade-in" style="animation-delay:0.5s">
      <img src="${main.img}" alt="${main.title}" class="book-cover">
      <div class="result-info">
        <h3>${main.title}</h3>
        <p>${main.content}</p>
        <p class="pr-text">${main.pr}</p>
      </div>
    </div>
  `;

  container.innerHTML += `<h3 class="bonus-title fade-in" style="animation-delay:1s">Нэмээд 2-ийг үнэгүй ав 🎁</h3><div class="bonus-scrolls"></div>`;
  const bonusWrap = container.querySelector(".bonus-scrolls");

  bonusTypes.forEach((type, i) => {
    const g = guides[type];
    bonusWrap.innerHTML += `
      <div class="result-block fade-in" style="animation-delay:${1.5 + i * 0.5}s">
        <img src="${g.img}" alt="${g.title}" class="book-cover">
        <div class="result-info">
          <h4>${g.title}</h4>
          <p>${g.content}</p>
          <p class="pr-text">${g.pr}</p>
        </div>
      </div>
    `;
  });

  container.innerHTML += `
  <div class="email-claim fade-in" style="animation-delay:${1.5 + bonusTypes.length * 0.5}s">
    <label for="email-input">📧 Имэйлээ оруул, шидэт гарын авлагуудыш чамд илгээнэ.</label>
    <input type="email" id="email-input" placeholder="name@email.com" class="email-input">
    <button class="cta claim-btn">Шидэт гарын авлагуудыг авах</button>
  </div>
`;
}

});

// Countdown эхлүүлэх функц
function startCountdown(duration, display) {
  let timer = duration, minutes, seconds;
  const interval = setInterval(() => {
    minutes = Math.floor(timer / 60);
    seconds = timer % 60;

    display.textContent =
      `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    if (--timer < 0) {
      clearInterval(interval);
      display.textContent = "⏳ Дууссан";
    }
  }, 1000);
}

// Claim товч → Confirmation Popup
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".claim-btn");
  if (btn) {
    const emailValue = document.getElementById("email-input").value.trim();
    if (!emailValue) {
      alert("Эхлээд email оруулна уу!");
      return;
    }

    // Wizard ID
    const date = new Date();
    const yyMMdd = date.toISOString().slice(2, 10).replace(/-/g, "");
    const rand = Math.floor(1000 + Math.random() * 9000);
    const wizardId = `WIZ-${yyMMdd}-${rand}`;

    sessionStorage.setItem("wizardId", wizardId);
    sessionStorage.setItem("wizardEmail", emailValue);

    document.getElementById("wizard-confirm-email").textContent = emailValue;
    document.getElementById("wizardConfirmPopup").classList.add("show"); // ✨ show class ашигла
    window._wizardId = wizardId;
  }
});

// Буцах
document.getElementById("wizardCancelBtn").addEventListener("click", () => {
  document.getElementById("wizardConfirmPopup").classList.remove("show");
});

// ✅ QPay invoice үүсгэх
document.getElementById("wizardProceedBtn").addEventListener("click", async () => {
  document.getElementById("wizardConfirmPopup").classList.remove("show");

  const wizardId = window._wizardId;
  const email = sessionStorage.getItem("wizardEmail");
  const payPopup = document.querySelector(".pay-popup");
  const qrImg = payPopup.querySelector(".qr-img");
  const payNumEl = document.getElementById("pay-number");
  const payEmailEl = document.getElementById("pay-email");

  if (!email) {
    alert("⚠️ Имэйл олдсонгүй. Дахин оролдоно уу!");
    return;
  }

  payEmailEl.textContent = email;
  payNumEl.textContent = wizardId;

  try {
    const resp = await fetch("https://api.lifecheck.mn/api/qpayCreateInvoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        amount: 9900,
        testKey: "wizard",
        testId: wizardId,
        riskLevel: "wizard",
      }),
    });

    const data = await resp.json();
    console.log("🔎 Invoice response:", data);

    if (data.ok && data.invoice?.qr_image) {

    // 🆕 Invoice ID хадгалах
localStorage.setItem("lc_invoice_id", data.invoice.invoice_id || "");

  // QR зурагаа харуулах
  qrImg.src = `data:image/png;base64,${data.invoice.qr_image}`;

  // 🏦 Банк аппуудын icon-уудыг харуулах
  renderBankIcons(data.invoice);

  // ⬇️ ЭНЭ МӨР НЭМ — QR үе шатанд бүрэн карт харагдуулна
  document.querySelector(".pay-popup .pay-content")?.classList.remove("solo");

  // 🧾 Invoice number-г харуулахгүй, зөвхөн wizard ID-г үлдээе
  console.log("🧾 Invoice created:", data.invoice?.sender_invoice_no || "no sender_invoice_no");

} else {
  console.error("❌ Invoice error:", data);
  alert("⚠️ QPay invoice үүсгэхэд алдаа гарлаа!");
}


  } catch (err) {
    console.error("❌ Fetch error:", err);
    alert("⚠️ QPay холбоход алдаа гарлаа!");
  }

  payPopup.classList.remove("hidden");
});


// === ❌ Төлбөрийн popup хаах товч ===
document.addEventListener("click", (e) => {
  const closeBtn = e.target.closest(".close-btn");
  if (closeBtn) {
    document.querySelector(".pay-popup").classList.add("hidden");
  }
});

// popup гадна дархад хаах
document.querySelector(".pay-popup").addEventListener("click", (e) => {
  if (e.target.classList.contains("pay-popup")) {
    e.target.classList.add("hidden");
  }
});

// 🏦 QPay банк апп icon render хийх функц
function renderBankIcons(invoice){
  const icons = invoice?.urls || [];
  const bankDiv = document.getElementById("bank-icons");
  if (!bankDiv) return;
  bankDiv.innerHTML = "";
  icons.forEach(u=>{
    const img=document.createElement("img");
    img.src=u.logo;
    img.alt=u.name;
    img.title=u.name;
    img.style.width="50px";
    img.style.height="50px";
    img.style.cursor="pointer";
    img.style.borderRadius="12px";
    img.style.boxShadow="0 2px 6px rgba(0,0,0,0.1)";
    img.onclick = () => {
  // 🆕 Төлбөр эхэлснийг тэмдэглэнэ (QR биш, icon дарсан кейс)
  localStorage.setItem("lc_pay_started", "1");
  window.open(u.link, "_blank");
};
    bankDiv.appendChild(img);
  });
  const payContent = document.querySelector(".pay-popup .pay-content");
  payContent?.classList.remove("solo");
}

// === WaitReport урсгал (loading → success) ===
(function () {
  const loading  = document.getElementById("loading-block");
  const success  = document.getElementById("success-block");

  function getPopupContent() {
  return document.querySelector(".pay-popup .pay-content") || document.querySelector(".pay-content");
}

function showLoading() {
  const payContent = getPopupContent();
  if (!payContent) return;
  payContent.classList.add("solo", "state-loading");
  payContent.classList.remove("state-success");
}

function showSuccess() {
  const payContent = getPopupContent();
  if (!payContent) return;
  payContent.classList.add("solo", "state-success");
  payContent.classList.remove("state-loading");
  try {
    localStorage.removeItem("lc_pay_started");
    localStorage.removeItem("lc_invoice_id");
  } catch (_) {}
}


  async function waitReportOnce() {
    const invoiceId = localStorage.getItem("lc_invoice_id");
    if (!invoiceId) return;
    showLoading();
    try {
      const res = await fetch(`https://api.lifecheck.mn/api/waitReport?invoice=${encodeURIComponent(invoiceId)}`, {
        method: "GET",
        headers: { "Cache-Control": "no-store" },
      });
      const data = await res.json();
      if (data && data.sent) {
        showSuccess();
      } else if (loading) {
        loading.innerHTML = `<p>Тайланг илгээж байна. Та meantime имэйлээ шалгаарай.</p>`;
      }
    } catch {
      if (loading) loading.innerHTML = `<p>Сервертэй холбогдоход алдаа гарлаа. Та имэйлээ шалгана уу.</p>`;
    }
  }

  let tried = false;
  function triggerOnce() {
    if (tried) return;
    if (localStorage.getItem("lc_pay_started") !== "1") return;
    tried = true;
    waitReportOnce();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      const inv = localStorage.getItem("lc_invoice_id");
      if (inv && !localStorage.getItem("lc_pay_started")) {
        localStorage.setItem("lc_pay_started", "1");
      }
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") triggerOnce();
  });
  window.addEventListener("focus", triggerOnce);
})();








