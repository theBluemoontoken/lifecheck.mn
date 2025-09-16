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

// Claim товч дарахад popup нээж, email дамжуулна + countdown эхлүүлнэ
document.addEventListener("click", e => {
  if (e.target.classList.contains("claim-btn")) {
    const emailValue = document.getElementById("email-input").value.trim();

    if (!emailValue) {
      alert("📧 Имэйлээ оруулна уу!");
      return;
    }

    const popup = document.querySelector(".pay-popup");
    popup.classList.remove("hidden");

    document.getElementById("pay-email").textContent = emailValue;

    const advNumber = "LCW-" + new Date().getTime().toString().slice(-6);
    document.getElementById("pay-number").textContent = advNumber;

    const countdownDisplay = document.getElementById("countdown");
    startCountdown(15 * 60, countdownDisplay);
  }
  if (e.target.classList.contains("close-btn")) {
    document.querySelector(".pay-popup").classList.add("hidden");
  }
});
// Туршилтын илгээх товч
document.getElementById("test-send").addEventListener("click", () => {
  const email = document.getElementById("email-input").value.trim();
  if (!email) {
    alert("Эхлээд email оруулна уу!");
    return;
  }

  fetch("/api/sendWizardReport", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  })
    .then(res => res.json())
    .then(data => {
      if (data.ok) {
        alert("✅ Туршилтын PDF амжилттай илгээгдлээ: " + email);
      } else {
        alert("❌ Илгээхэд алдаа гарлаа");
      }
    })
    .catch(err => {
      console.error("Send error:", err);
      alert("❌ Илгээхэд алдаа гарлаа");
    });
});

