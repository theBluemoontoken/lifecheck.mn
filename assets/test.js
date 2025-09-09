document.addEventListener('DOMContentLoaded', () => {
// Lucide icons (аюулгүй дуудлага)
if (window.lucide?.createIcons) lucide.createIcons();

const steps = document.querySelectorAll('.question-step'); // intro + бүх асуултууд
const summary = document.querySelector('.summary');
const overlay = document.getElementById('loading-overlay');
const progressBar = overlay?.querySelector('.progress-bar .progress');
const checklistItems = overlay?.querySelectorAll('.checklist li') || [];
const startBtn = document.querySelector('.start-btn');
let current = 0;


// === Payment config (placeholder) ===
const PAY = {
amount: 6900, // ₮
memo: 'LifeCheck Report', // төлбөрийн тайлбар
link: 'https://pay.lifecheck.mn/tx/DEMO-LINK' // дараа нь бодит холбоосоор солино
};


// ===== Test-specific copy & cliffhangers (injected) =====
function getCurrentTestKey(){
const rootEl = document.querySelector('main[data-test]') || document.querySelector('body[data-test]');
const key = rootEl?.dataset?.test
|| (location.pathname.includes('burnout') ? 'burnout'
: location.pathname.includes('redflags') ? 'redflags'
: location.pathname.includes('future') ? 'future'
: location.pathname.includes('money') ? 'money'
: 'generic');
return key;
}


// Тест эхлэх үед түлхүүрийг localStorage-д хадгалах
if (startBtn) {
startBtn.addEventListener('click', () => {
const k = getCurrentTestKey();
try { localStorage.setItem('lc_test', k); } catch(e){}
showStep(1);
});
}

  const TEST_COPY = {
    burnout: {
      summaryTitle: "Burnout test/Далд ядаргааны үнэлгээний товч тайлан",
      trustFooter: 'Энэхүү үнэлгээ нь ДЭМБ-ын burnout framework (2020)-тай нийцсэн • <a href="#">Нууцлал</a>',
      riskLabels: { low:"Бага эрсдэл", mid:"Дунд эрсдэл", high:"Өндөр эрсдэл", severe:"Маш өндөр эрсдэл" }
    },
    redflags: {
      summaryTitle: "Relationship Red Flags/Харилцааны эрсдэлийн үнэлгээний товч тайлан",
      trustFooter: 'Энэхүү үнэлгээ нь сэтгэл судлалын red flag framework (Harvard Family Study, 2019)-ийг үндэслэсэн • <a href="#">Нууцлал</a>',
      riskLabels: { low:"Тогтвортой", mid:"Анхаарах шаардлагатай", high:"Эрсдэл өндөр", severe:"Яаралтай анхаарах" }
    },
    future: {
      summaryTitle: "Future Readiness/Ирээдүйн чадамжийн үнэлгээний товч тайлан",
      trustFooter: 'Энэхүү үнэлгээ нь World Economic Forum (2023)-ын 2030 ур чадварын жагсаалтад тулгуурласан • <a href="#">Нууцлал</a>',
      riskLabels: { low:"Бэлэн", mid:"Сайжруулах шаардлагатай", high:"Эрсдэлтэй", severe:"Маш эрсдэлтэй" }
    },
    money: {
    summaryTitle: "Money Mindset/Мөнгөний сэтгэлгээний үнэлгээний товч тайлан",
    trustFooter: 'Энэхүү үнэлгээ нь зан үйлийн санхүү ба хувь хүний санхүүгийн (PF) богино хэмжүүрүүдэд тулгуурласан • <a href="#">Нууцлал</a>',
    riskLabels: {
    low: "Санхүүгийн тогтвортой",
    mid: "Сайжруулах шаардлагатай",
    high: "Эрсдэлтэй",
    severe: "Маш эрсдэлтэй"
      }
    },
    generic: {
      summaryTitle: "Үнэлгээ — дүн",
      trustFooter: '<a href="#">Нууцлал</a>',
      riskLabels: { low:"Бага эрсдэл", mid:"Дунд эрсдэл", high:"Өндөр эрсдэл", severe:"Маш өндөр эрсдэл" }
    }
  };

  // Пер-тест cliffhangers (low/medium/high)
  const CLIFF_REDFLAGS = {
    low: [
      "Таны харилцааны суурь тогтвортой харагдаж байна. Энэ давуу байдлыг хадгалахын тулд хил хязгаараа тодорхой хэлдэг, баяр талархлаа илэрхийлдэг жижиг дасгалуудыг тогтмолжуулаарай...",
      "Итгэлцэл болон харилцаа холбоо сайн түвшинд. Дараагийн шат нь зөрчлийг \"ялалт\" бус \"нийт ашиг\"-аар шийдэх өдөр тутмын хэлцэл хийх дадал юм...",
      "Тэнцвэр хэвийн. Гэхдээ завгүй үеэр та чимээгүй тэвчих хандлагатай болдог байж магадгүй. Сард 1 удаа mini‑retrospective уулзалт хийх нь эрсдэлийг доогуур барина..."
    ],
    mid: [
      "Зарим red flag хааяа илэрч байна: сунжирсан дуугүйдэл, жижиг шийдвэр дээр үл ойлголцол. Эхний нэг алхам — “TIME OUT + 24h rule”-ийг тохиролцож мөрдөх...",
      "Хил хязгаарын хэрэгжилт тогтворгүй байна. \"Болохгүй зүйлсийн богино жагсаалт\"-ыг хамтдаа бичиж, гэрийн харагдах газарт байрлуулах нь хурдан үр дүнтэй...",
      "Ил тод байдал дутмаг үе давтагдаж байна. Долоо хоногт нэг удаа 20 минутын “байдлын шалгалт” (mood, energy, хэрэгцээ) хийдэг хурал нэвтрүүл..."
    ],
    high: [
      "Эрсдэл өндөр: хяналт тогтоох оролдлого, доромжлол, тогтмол айдас мэдрэгдэж болно. Аюулгүй байдлаа нэн тэргүүнд тавь. “Нэн шаардлагатай тусламжийн жагсаалт”-тай бол...",
      "Итгэлцэл эвдэрч, зөрчил \"ялалт-айлдалт\" логикоор явж байна. “Зогсоо → Сэргээн сонсох → Дүгнэлт” 3 алхмыг гаднаас (коуч/зууч) дэмжүүлж хэрэгжүүл...",
      "Тогтмол стресс үүсгэгч хүчин зүйлс байна. 30 хоногийн турш “үл доромжлох/үл шоглох” гэрээ байгуулж, зөрчлийн үед автоматаар амралтын горим руу шилждэг протокол тохир..."
    ]
  };

  const CLIFF_FUTURE = {
    low: [
      "Та суурь чадвар болон эрч хүчийн менежментээр давуу талтай. Одоо бага зэрэг \"өргөжүүлэх\": сард 1 микропроект, 1 олон нийтэд үзүүлэх ажлыг төлөвлө...",
      "Дижитал ба AI хэрэгслийн хэрэглээ сайн байна. Автоматжуулалт дээр 1 жижиг workflow-г (calendar → task → note) бүрэн хаадаг болго...",
      "Сүлжээ тогтвортой. Дараагийн шат — сард 1 удаа салбарын хүний ажлыг нийтэд магтаж, 2 холбоосыг бэхжүүлэх..."
    ],
    mid: [
      "Зарим суурь системүүд дутуу байна: суралцах тогтолцоо, deep‑work цонх. Долоо хоног бүр 2×50 мин таслалгүй цаг баталгаажуул...",
      "AI/automation хэрэглэх итгэл багасаж байна. 1 ажлаа (жишээ: имэйл хураангуй, репорт тайлан) AI-д даатгаж, зөвхөн fact‑check хийдэг протокол гарга...",
      "Санхүүгийн дэр сул байна. “3 сарын дэр” зорилго тавьж, долоо хоног бүр хадгаламжаа автоматжуул..."
    ],
    high: [
      "Эрсдэлтэй: эрч хүчийн мөчлөг алдагдсан, roadmap тодорхойгүй. 72 цагт “эрч хүч → зорилго → 1 хариуцлага түнш” гурвыг тогтоож эхэл...",
      "Runway богино, Plan B байхгүй. Зах зээлд хурдан танигдах 14 хоногийн портфолио спринтийг (жишээ: 3 бүтээл + 1 нийтлэл) төлөвлө...",
      "Цагийн менежмент системгүй. Бүх ажилд INBOX → WEEKLY PLAN → DAILY 3 зорилго гэх ганц зам хэрэглэж эхэл..."
    ]
  };

  const CLIFF_MONEY = {
  low: [
    "Таны мөнгөний сахилга бат сайн харагдаж байна. Одоо ашгаа өсгөх хамгийн хурдан алхам — орлогоо төрөлжүүлэх жижиг туршилтыг (1 side-income микропроект) эхлүүлэх...",
    "Санхүүгийн дэр боломжийн түвшинд. Хуримтлалаа автоматаар өсгөхийн тулд «орлого ормогц 20% → хадгаламж» дүрмийг банкны тогтмол шилжүүлгээр идэвхжүүл...",
    "Хэрэглээ тэнцвэртэй. Дараагийн шат: ‘төлөвлөсөн таашаал’ багц — сард 1 удаа сэтгэл хөдлөлийн худалдан авалтаа төлөвлөж, үлдсэнийг хөрөнгө оруулалт руу шилжүүл..."
  ],
  mid: [
    "Зарим зуршил орлогын өсөлтийг удаашруулж байна: төсөв тогтмол биш, импульс зарцуулалт үе үе давтагддаг. Эхний 14 хоногт «0-based төсөв» туршиж зангаа тогтворжуул...",
    "Өрийн ачаалал дунд түвшинд. ‘Snowball’ аргаар жижиг өрнөөс эхлэн хурдан хаах нь таны зардлын урсгалыг 30–60 хоногт мэдэгдэхүйц сулруулна...",
    "Орлого нэг эх үүсвэрт төвлөрсөн. Эрсдэлийг бууруулахын тулд долоо хоногт 2 цагийг орлого төрөлжүүлэх микротуршилтдаа (freelance/task/дуудлагын ажил) зориулаарай..."
  ],
  high: [
    "Мөнгөн урсгал тогтворгүй: импульс худалдан авалт ба зээлийн хүү таны ирээдүйн боломжийг идэж байна. 72 цагт: бүх зээлийн хүү, шимтгэлийн жагсаалтыг гаргаж, хамгийн өндөр хүүтэйг зогсоох/дахин санхүүжүүлэх төлөвлөгөө гарга...",
    "Санхүүгийн дэр байхгүйтэй ойролцоо. 30 хоногийн ‘автомат 10% хадгаламж’ + зардлын 3 ангилал (шаардлагатай / өсөлт / таашаал) руу шилжүүлж, бодит үлдэгдэл рүү харах зуршил нэвтрүүл...",
    "Эрсдэлийг үүрч байгаа ч өгөөж авах систем алга. Хөрөнгө өсгөх эхний protocol: индекс сан + өөр дээрээ реинвест (ур чадвар, сертификат) — сар бүр бага ч гэсэн тогтмол хий..."
  ]
  };

  const CLIFF = {
  low: [
    "Эрсдэл бага түвшинд байна. Гэхдээ энэ нь баталгаа биш—өдөр тутмын жижиг сонголтууд таныг хамгаалж эсвэл аажмаар ядрааж болно. Хэрэв зарим өдрүүдэд эрч хүч уналдаг бол энэ нь хуримтлалын анхны дохио байж мэднэ. Таны хувьд одоо хамгийн зөв алхам бол …",
    "Нийт зураглал тогтвортой харагдаж байгаа ч урт суулт, завсаргүй онлайн цаг, хэт кофе уух зэрэг жижиг зуршлууд нөлөөлж эхэлжээ. Одооноос богино амралтын цонхоо тогтмолжуулж чадвал энэ түвшнээ тогтоон барих боломжтой. Эхний энгийн өөрчлөлт бол …",
    "Эрсдэл бага. Ихэнх хүн энэ үедээ өөртөө анхаарахгүй өнгөрөөдөг тул хэдхэн долоо хоногийн дараа мэдэгдэхүйц уналт гардаг. Та урьдчилан сэргийлэх давуу талтай үе шатандаа байна. Тогтвортой байлгахын тулд өдөр бүр хийх нэг жижиг алхам бол …",
    "Одоогоор асуудал хурц биш ч, нойрны тогтвортой байдал, ус уух горим, өглөөний анхаарал төвлөрөл зэрэгт бага зэргийн хэлбэлзэл ажиглагдаж магадгүй. Эдгээрийг өнөөдрөөс багахан засвал ирээдүйн өндөр эрсдэлийг бүрэн тойрох боломжтой. Хамгийн түрүүнд …",
    "Амьдралын хэв маяг тань ихэнхийг тань хамгаалж байна. Гэхдээ завгүй үе эхлэхэд үргэлжлээд явчихдаг жижиг зуршлууд л эрсдэлийг өсгөдөг. Энэ давуу байдлаа хадгалахын тулд долоо хоногт 2–3 удаа хийх нэг энгийн дадлыг нэмэх нь …"
  ],
  mid: [
    "Дунд түвшний эрсдэл илэрлээ. Нойрны чанар жоохон эвдэрч, өдрийн дундах уналт тогтмолжиж, жижиг алдаанууд нэмэгдэж байж магадгүй. Энэ шатанд ихэнх хүн өөрийгөө зүгээр гэж бодсоор цаг алддаг. Таны хувьд дордохоос өмнө тогтворжуулах хамгийн зөв алхам бол …",
    "Эрч хүчийн хэлбэлзэл ихэсч, төвлөрөл амархан сарниж, ажлын дараа сэргэх хугацаа уртассан шинж харагдаж байна. Бага зэрэг өөрчлөлт хийснээр 1–2 долоо хоногт мэдэгдэхүйц сайжрал гарч болдог. Эхлээд өдрийн мөчлөгөө зөөлөн дахин тохируулахын тулд …",
    "Эрсдэл мэдэгдэхүйц байна. Хүн бүрийн өдөөгч өөр боловч таных тайван цагийг танаж, сэтгэл санааг тогтворгүй болгож байна. Хэрвээ одоо зангилаа цэгүүдээ оноод зөв дарааллаар засч чадвал хурдан буулгаж чадна. Хамгийн түрүүнд хийх зүйл бол …",
    "Нойрны тасалдал, оройн цагаар утсаа удаан ашиглах, тасралтгүй ажиллаад амралт алгасах хэв маяг тань хуримтлал үүсгэж байна. Энэ үед том өөрчлөлт шаардахгүй—жижиг гурван алхам хангалттай. Эхний алхмыг зөв эхлүүлэхийн тулд …",
    "Сэргэлтийн цонх богиносож, өглөөний эхний 90 минут хамгийн чухал болж байна. Тэр завсар буруу эхэлбэл бүтэн өдөр нөлөөлдөг. Энэ мөчийг хамгаалж чадвал эрсдэл буурч эхэлнэ. Таны хувьд хамгийн үр дүнтэй эхлэл бол …"
  ],
  high: [
    "Өндөр эрсдэл илэрлээ. Хуримтлагдсан ядаргаа, төвлөрөл сулрах, нойр тасалдах шинжүүд тогтмолжиж, ажлын дарамтад илүү эмзэг болсон байна. Энэ нь зүгээр нэг завгүй үе бус—сэргэлтийн мөчлөг тань алдагдаж эхэлснийг илтгэнэ. Одоо хамгийн чухлаас нь эхлэхгүй бол …",
    "Оноо өндөр байна. Хэрвээ одоо арга хэмжээ авахгүй бол ойрын 2–4 долоо хоногт бүтээмж, сэтгэл санаанд огцом уналт гарах эрсдэлтэй. Гэхдээ зөв дарааллаар эхлүүлбэл 72 цагийн дотор ч мэдэгдэхүйц өөрчлөлт гарч болдог. Эхний алхам нь …",
    "Амралтыг золиослох, олон даалгаврыг зэрэг эхлүүлэх, оройн цагаар тархи тайвшруулахгүй байх хэв маяг байдал даамжруулж байна. Энэ үед том зорилго тогтоохоос илүү эрсдэлийг зөөлөн буулгах зохион байгуулалт хэрэгтэй. Юуны өмнө …",
    "Таны сэтгэл санаа болон бие махбод аль аль нь «хуримтлалын горим»-д оржээ: өглөө сэргэлт удаашрах, өдрийн төгсгөлд туйлдах, харилцаанд тэвчээр багасах мэдрэмж төрж болно. Энэ үед зүгээр л тэсэх бус, ухаалгаар буулгах стратеги шаардлагатай. Тэр стратегийн эхний хэсэг бол …",
    "Сэргэлтийн мөчлөг тасалдаж, өөрийгөө шахах тактик богино хугацаанд ажилладаг ч удах тусам илүү их үнэтэй тусдаг. Таны хувьд доголдсон хэсгийг түргэн сэргээх «бага ба тогтвортой» зарчим хамгийн найдвартай. Эхний 72 цагт хийвэл сайн үр дүн өгөх зүйл нь …"
  ]
  };


  // Карт олох helper (.question-card илүү, үгүй бол .test-card)
  const findCard = (root) => root?.querySelector?.('.question-card') || root?.querySelector?.('.test-card') || root;

  // Нийт асуултын тоо (data-step-тэйг тоолно)
  const totalQuestions = document.querySelectorAll('.question-step[data-step]').length;

  // Тухайн step-ийн Next/Finish товчийг радиогоор синк хийх
  function syncButtonsForStep(stepIndex){
    const stepEl = steps[stepIndex];
    const cardEl = findCard(stepEl);
    if (!cardEl) return;
    const hasPick = !!cardEl.querySelector('input[type="radio"]:checked');
    const nextBtn = cardEl.querySelector('.next');
    const finBtn  = cardEl.querySelector('.finish');
    if (nextBtn) nextBtn.disabled = !hasPick;
    if (finBtn)  finBtn.disabled  = !hasPick;
  }

  function showStep(n){
    steps.forEach(s => s.classList.remove('active'));
    steps[n]?.classList.add('active');
    current = n;

    // Progress + badge
    const stepEl = steps[n];
    const card   = findCard(stepEl);
    const fill   = card?.querySelector('.progress-fill');
    const badge  = card?.querySelector('.q-badge');
    const stepIndex = Number(stepEl?.dataset.step || 0); // intro-д 0

    if (fill && stepIndex) {
      const percent = Math.max(0, Math.min(100, Math.round(((stepIndex-1) / totalQuestions) * 100)));
      fill.style.width = percent + '%';
    }
    if (badge && stepIndex) {
      badge.textContent = `Асуулт ${stepIndex} / ${totalQuestions}`;
    }

    // Радио сонголттой эсэхээр Next/Finish-ийг синк
    syncButtonsForStep(n);
  }

  // Эхлэх
  if (startBtn) startBtn.addEventListener('click', () => showStep(1));

  // Дараах
  document.querySelectorAll('.next').forEach(btn => {
    btn.addEventListener('click', () => {
      const isFinish = btn.textContent.trim().includes('Дуусгах') || btn.classList.contains('finish');
      if (isFinish) { runOverlayAndGoSummary(); return; }
      if (current < steps.length - 1) showStep(current + 1);
    });
  });

  // Буцах
  document.querySelectorAll('.prev').forEach(btn => {
    btn.addEventListener('click', () => {
      if (current > 0) showStep(current - 1);
    });
  });

  // Радио сонгох үед Next/Finish идэвхжүүлэх
  document.querySelectorAll('.question-step input[type=radio]').forEach(input => {
    input.addEventListener('change', () => {
      const stepEl = input.closest('.question-step');
      const idx = Array.from(steps).indexOf(stepEl);
      syncButtonsForStep(idx);
    });
  });

  // Тусдаа finish товч (байвал)
  const finishBtn = document.querySelector('.button.finish');
  if (finishBtn) {
    finishBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (finishBtn.disabled) return;
      runOverlayAndGoSummary();
    });
  }

  // Overlay → X sec → Summary
  function runOverlayAndGoSummary(){
    steps.forEach(s => s.classList.remove('active'));
    if (!overlay) { showSummaryCard(); return; }

    overlay.classList.remove('hidden');

    // ⏱ Урт/богино хугацааг HTML-ээс data-duration-оор удирдана (default: 5000ms)
    const duration = Number(overlay?.dataset.duration || 5000);

    // ✅ Сүүлчийн мөрийг уншихад 0.8с зав үлдээнэ
    const TAIL_HOLD_MS = 2500;

    // Checklist-ийн тоогоор автоматаар тааруулна (default 3)
    const stepsCount = (checklistItems && checklistItems.length) ? checklistItems.length : 3;

    // ⏳ Сүүлчийн ✓-ийг duration - TAIL_HOLD_MS дээр дуусгахаар интервал тооцоолно
    const tickMs = Math.max(300, Math.floor((duration - TAIL_HOLD_MS) / stepsCount));

    let stepTick = 0;
    const interval = setInterval(() => {
      stepTick++;
      const pct = Math.min(100, Math.round((stepTick / stepsCount) * 100));
      if (progressBar) progressBar.style.width = pct + '%';
      if (checklistItems[stepTick - 1]) checklistItems[stepTick - 1].classList.add('done');

      if (stepTick >= stepsCount) clearInterval(interval);
    }, tickMs);

    // 🧘 Төгсгөлд нь багахан “амьсгалын зав” үлдээгээд дараа нь хаана
    setTimeout(() => {
      overlay.classList.add('hidden');
      showSummaryCard();
    }, duration);
  }

  function pickCliff(level, testKey){
  const pools = {
    burnout: CLIFF,
    redflags: CLIFF_REDFLAGS,
    future: CLIFF_FUTURE,
    money: CLIFF_MONEY,
    generic: CLIFF
  };
  const tk = pools[testKey] ? testKey : 'generic';
  const fb = (level === 'severe') ? 'high' : level;

  const tryPick = (pool, lvl) => (pool && pool[lvl] && pool[lvl].length)
      ? pool[lvl][Math.floor(Math.random()*pool[lvl].length)]
      : "";

  // 1) primary
  let txt = tryPick(pools[tk], level);
  if (txt) return txt;

  // 2) same test fallback (severe→high)
  txt = tryPick(pools[tk], fb);
  if (txt) return txt;

  // 3) generic, same level
  txt = tryPick(pools.generic, level);
  if (txt) return txt;

  // 4) generic fallback (severe→high)
  return tryPick(pools.generic, fb) || "";
}


  function showSummaryCard() {
    if (!summary) return;

    // 1) Оноо тооцоолол
    const allQuestions = Array.from(document.querySelectorAll('.question-step[data-step]'));
    const answers = allQuestions.map(step => {
      const checked = step.querySelector('input[type="radio"]:checked');
      return checked ? Number(checked.value) : null;
    });
    const answered = answers.filter(v => v !== null);
    const totalQuestions = allQuestions.length;
    const sum = answered.reduce((a,b)=>a+b, 0);
    const max = totalQuestions * 4; // value 0..4 гэж үзсэн
    const pct = max ? Math.round((sum / max) * 100) : 0;

    // 2) Эрсдэлийн түвшин (хуучин 4 түвшний label/өнгөө хадгална)
    const severity = (p) => {
      if (p < 25)  return { key:'low',    label:'Бага эрсдэл',     cls:'risk--low',
        cliff:'Эрсдэл бага ч тогтвортой хэвшлээ хадгалах нь чухал.' };
      if (p < 50)  return { key:'mid',    label:'Дунд эрсдэл',     cls:'risk--mid',
        cliff:'Анхны шинж тэмдгүүд ажиглагдаж байна. Одоо нэг жижиг тохируулга хийхэд хангалттай.' };
      if (p < 75)  return { key:'high',   label:'Өндөр эрсдэл',    cls:'risk--high',
        cliff:'Шатах эрсдэл эрчимтэй нэмэгдэж байна. Тодорхой төлөвлөгөө шаардлагатай.' };
      return         { key:'severe', label:'Маш өндөр эрсдэл', cls:'risk--severe',
        cliff:'Яаралтай эрсдэлийг бууруулах төлөвлөгөө хэрэгтэй.' };
    };
    const sev = severity(pct);

    try {
    const testKey = getCurrentTestKey();
    localStorage.setItem('lc_test', testKey);
    localStorage.setItem('lc_risk', sev.key);           // low | mid | high | severe
    localStorage.setItem('lc_score', String(pct));      // 0..100
    } catch (_) {}

    // Test-specific overrides
    const testKey = getCurrentTestKey();
    const COPY = TEST_COPY[testKey] || TEST_COPY.generic;

    // Title & footer & badge (if present)
    const titleEl = summary.querySelector('.summary-title');
    if (titleEl) titleEl.textContent = COPY.summaryTitle;
    const footEl = summary.querySelector('.summary-footer');
    if (footEl) footEl.innerHTML = COPY.trustFooter;

    // Risk label override
    const rl = COPY.riskLabels || {};
    const labelMap = { low: rl.low, mid: rl.mid, high: rl.high, severe: rl.severe };

    // 3) Risk meter дүүргэлт + score badge
    const meter = summary.querySelector('.risk-meter .fill');
    const badge = summary.querySelector('#score-badge');
    if (meter) requestAnimationFrame(()=>{ meter.style.width = pct + '%'; });
    if (badge) badge.textContent = `${pct}%`;

    // 4) Text-үүд
    const scoreEl = summary.querySelector('.score');
    const riskEl  = summary.querySelector('.risk');
    const cliffEl = summary.querySelector('.cliffhanger');

    if (scoreEl) scoreEl.textContent = `Нийт оноо: ${sum} / ${max}`;
    if (riskEl) {
      const riskLabel = labelMap[sev.key] || sev.label;
      riskEl.textContent = riskLabel;
      riskEl.classList.remove('risk--low','risk--mid','risk--high','risk--severe');
      riskEl.classList.add(sev.cls);
    }
    if (cliffEl) cliffEl.textContent = sev.cliff;

    // === 3-түвшний cliffhanger (per-test) → .analysis-excerpt p дээр ===
    let level;
    if (pct < 25)      level = 'low';     // 0–24%
    else if (pct < 50) level = 'mid';     // 25–49%
    else if (pct < 75) level = 'high';    // 50–74%
    else               level = 'severe';  // 75–100%

    const target = summary.querySelector('.analysis-excerpt p') || cliffEl;
const text = pickCliff(level, testKey);
if (target && text) target.textContent = text; // хоосон бол бүү дар


    // 5) Countdown (HTML атрибутаас уншина, default 10 минут)
    const mins = Number(summary.dataset.offerMinutes || 10);
    const deadlineKey = 'lc_offer_deadline_' + testKey;
    let deadline = Number(localStorage.getItem(deadlineKey));
    const now = Date.now();
    // өмнөх хуучин deadline байхгүй бол шинээр тогтооно
    if (!deadline || deadline < now) {
      deadline = now + mins * 60 * 1000;
      localStorage.setItem(deadlineKey, String(deadline));
    }

    const timerEl = document.getElementById('offer-timer');
    function tick(){
      const left = Math.max(0, deadline - Date.now());
      const mm = Math.floor(left/60000);
      const ss = Math.floor((left%60000)/1000);
      if (timerEl) timerEl.textContent = `${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
      if (left <= 0) clearInterval(intId);
    }
    const intId = setInterval(tick, 1000); tick();

    // 7) Асуултуудыг нууж, summary-г үзүүлэх
    steps.forEach(s => s.classList.remove('active'));
    summary.style.display = 'block';
    summary.classList.add('fade-in');
    summary.scrollIntoView({ behavior: 'smooth' });
    saveDomainScores(testKey);
  }

  // Init — эхний active-ийг хүндэлнэ, байхгүй бол 0-оос
  if (steps.length) {
    const activeIndex = Array.from(steps).findIndex(s => s.classList.contains('active'));
    showStep(activeIndex >= 0 ? activeIndex : 0);
  }
});

// Modal logic
const modal = document.getElementById("payModal");

// "Цааш унших →" (anchor .read-more) дээр дарахад modal нээх
document.addEventListener("click", e => {
  if(e.target.matches(".read-more")){
    e.preventDefault?.();
    modal?.classList.remove("hidden");
  }
});

// === ADDED: #open-paywall (button) дээр дарахад modal нээх ===
document.addEventListener("click", e => {
  const btn = e.target.closest("#open-paywall");
  if (btn) {
    e.preventDefault?.();
    modal?.classList.remove("hidden");
  }
});
// === /ADDED ===

// Close (✕ товч)
document.addEventListener("click", (e) => {
  if (e.target.closest(".close-modal")) {
    modal?.classList.add("hidden");
  }
});
// Backdrop дээр дарахад хаах
modal?.addEventListener("click", (e) => {
  if (e.target === modal) modal.classList.add("hidden");
});


// Background дээр дарахад хаах
modal?.addEventListener("click", e => {
  if(e.target === modal){
    modal.classList.add("hidden");
  }
});

// hamburger menu logic
const hamburger = document.querySelector('.hamburger');
const dropdown = document.querySelector('.dropdown-menu');

if (hamburger && dropdown) {
  hamburger.addEventListener('click', () => {
    dropdown.classList.toggle('open');
  });

  // гадна дарвал хаах
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });
}

// Текстүүдийн жагсаалт
const tips = [
  "😊 Өнөөдрийн зөвлөмж: 5 минут алх",
  "💧 Ус уухаа бүү мартаарай",
  "🛌 Шөнөдөө 7-8 цаг унтаарай",
  "📵 30 минут дэлгэцнээс холдоод амраарай",
  "🌳 Байгальд гарч агаарт алхаарай"
];

const tipEl = document.getElementById("header-tip");
let tipIndex = 0;

// 5 секунд тутамд солигдоно
setInterval(() => {
  tipEl && (tipEl.style.opacity = 0);
  setTimeout(() => {
    tipIndex = (tipIndex + 1) % tips.length;
    if (tipEl) {
      tipEl.textContent = tips[tipIndex];
      tipEl.style.opacity = 1;
    }
  }, 500); // fade out дараа текст солигдоно
}, 5000);

// ========== Why LifeCheck scroll reveal ==========
(function(){
  const items = document.querySelectorAll('.why-item');
  if (!items.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        obs.unobserve(entry.target); // нэг л удаа анимейтлэнэ
      }
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

  items.forEach(el => observer.observe(el));
})();


// === payModal form submit → pay.html рүү шилжүүлнэ ===
const payForm = document.querySelector('#payModal .lead-form');
if (payForm) {
payForm.addEventListener('submit', (e) => {
e.preventDefault();


const email = payForm.querySelector('input[type="email"]').value.trim();
if (!email) return; // хоосон бол зогсооно


try { localStorage.setItem('lc_email', email); } catch(_) {}


// localStorage-д хадгалсан түлхүүрийг эсвэл getCurrentTestKey-г ашиглана
let testKey = 'burnout';
try {
testKey = localStorage.getItem('lc_test') || getCurrentTestKey();
} catch(e) {}


window.location.href = `../pay.html?test=${testKey}`;
});
}


// test.js  (#payModal .lead-form submit дотор)
try { localStorage.setItem('lc_test', testKey); } catch(_) {}

// Dynamic headline rotator (Hero)
(function(){
  const dyn = document.getElementById('dyn');
  if(!dyn) return;
  const slides = Array.from(dyn.children);
  let i = 0;
  setInterval(()=>{
    slides[i].classList.remove('show');
    i = (i + 1) % slides.length;
    slides[i].classList.add('show');
  }, 2500);
})();

// ===== Domain Breakdown Calculation =====
const DOMAIN_MAP = {
  burnout: {
    energy:   ["q1","q2"],
    sleep:    ["q5","q12","q14","q15"],
    mood:     ["q8","q9","q10"],
    focus:    ["q3","q4","q6","q7","q11","q13"]
  },
  redflags: {
    trust: ["q1","q2","q3"],
    respect: ["q4","q5","q6"],
    comms: ["q7","q8","q9"],
    safety: ["q10","q11","q12","q13","q14","q15"]
  },
  money: {
    budget: ["q1","q3","q8","q15"],
    debt: ["q6","q7","q9","q10"],
    saving: ["q2","q4","q11","q12"],
    income: ["q5","q13","q14"]
  },
  future: {
    skills: ["q1","q2","q3"],
    health: ["q4","q5","q6"],
    network: ["q7","q8","q9"],
    finance: ["q10","q11","q12","q13","q14","q15"]
  }
};

function calculateDomainScores(testKey){
  const map = DOMAIN_MAP[testKey];
  if (!map) return [];

  const result = [];
  for (const [domainKey, questions] of Object.entries(map)) {
    let sum = 0;
    questions.forEach(q => {
      const input = document.querySelector(`input[name="${q}"]:checked`);
      if (input) sum += Number(input.value || 0);
    });
    const max = questions.length * 4; // max value = 4
    const pct = max ? Math.round((sum / max) * 100) : 0;
    result.push({ domainKey, scorePct: pct });
  }
  return result;
}

function saveDomainScores(testKey){
  try {
    const scores = calculateDomainScores(testKey);
    localStorage.setItem("lc_domainsScore", JSON.stringify(scores));
  } catch(e) { console.error("Domain calc error", e); }
}




