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
      "<p>Таны харилцааны суурь тогтвортой байгаа нь сайшаалтай. Итгэлцэл бий, харилцаа тодорхой хэмжээнд эрүүл яваа гэсэн үг. Гэхдээ энэ нь та хоёрын ирээдүй бүрэн баталгаатай гэсэн үг биш. Багахан ан цавуудыг үл тоох үед тэдгээр нь аажмаар томорч, та хоёрын харилцаанд үл үзэгдэх ханан болж хувирдаг. Өдөр тутмын жижиг үл ойлголцлууд, баяр талархлаа хэлэлгүй өнгөрөх зуршил, эсвэл “би өөрийгөө тайлбарлах шаардлагагүй” гэсэн хандлага аажмаар хуримтлагдсаар итгэлцлийг сийрэгжүүлдэг.</p><p>❗️ Энэ түвшинд хамгийн том эрсдэл бол “бид хоёр зүгээр” гэсэн хийсвэр тайвшрал юм. Учир нь яг энэ үед та хоёр хамгийн амархан урьдчилан сэргийлж, харилцаагаа илүү бат бөх болгох боломжтой байдаг.</p><p>👉 Манай тайланд таны харилцаанд аль жижиг зуршлууд ирээдүйд red flag болж хувирах эрсдэлтэй, тэдгээрийг хэрхэн эерэг үйлдэл болгож өөрчлөхийг шат дараатай харуулсан.</p>"
    ],
    mid: [
      "<p>Таны харилцаанд хэд хэдэн анхааруулга өгч буй дохио илэрч эхэлжээ. Сунжирсан дуугүйдэл, жижиг шийдвэрийн үеийн үл ойлголцол, хил хязгаар тодорхой бус байдал зэрэг нь анхны түвшний red flag-ууд юм. Энэ шатанд харилцаа бүрэн нурсан биш ч, анхаарал хандуулахгүй бол итгэлцэл суларч, хайр халамжийн орон зайд үл ойлголцол давамгайлна. Та өөрийгөө заримдаа ганцаардсан, ойлгогдоогүй мэт мэдэрдэг байж болох ба нөгөө талдаа хамтрагч тань “яагаад намайг хүлээж авахгүй байна” гэх далд бухимдлаа авч явдаг.</p><p>❗️ Хэрэв энэ шатанд та хоёр хоёулаа ухамсаргүйгээр асуудлыг үл тоовол, ирээдүйд илүү ноцтой хэлбэрийн зөрчил болж хувирна.</p><p>👉 Бид таны хариулт дээр үндэслэн, харилцаанд яг ямар зан төлөв, ямар нөхцөл байдал хамгийн их зөрчил үүсгэж байгаа болон хэрхэн бууруулах алхмуудыг тусгай тайландаа багтаасан. Та энэ мэдээллийг харахгүй бол хаанаас эхлэхээ мэдэхгүйгээр цаг алдах магадлалтай.</p>"
    ],
    high: [
      "<p>Таны харилцаа өндөр эрсдэлийн түвшинд байна. Хяналт тогтоох оролдлого, доромжлол, айдас төрүүлэх орчин байнга мэдрэгддэг үү? Энэ бол зөвхөн жижиг маргаан биш, харин таны аюулгүй байдал, өөрийн үнэ цэнэ шууд эрсдэлд орж буйг илтгэнэ. Итгэлцэл эвдэрч, зөрчил “хэн ялж, хэн ялагдах вэ” гэсэн тэмцэлд шилжиж, хамт байхын оронд нэгнээ ялан дийлэхийн төлөө өрсөлдөөн болж хувирчээ. Энэ нөхцөлд олон хүн өөрийгөө буруутган, “би л зөв тэвчвэл бүх зүйл дээрдэнэ” гэж боддог ч бодит байдал эсрэгээрээ — илүү их доройтол хүлээж байдаг.</p><p>❗️ Энэ бол яаралтай анхаарал шаардсан үе шат. Хэрэв та яг одоо дорвитой өөрчлөлт хийхгүй бол харилцаа тань зөвхөн уналт руу чиглэнэ, харин сэтгэл зүй, ажил мэргэжил, гэр бүлийн амьдрал бүхэлдээ дагаж уруудна.</p><p>👉 Манай тайланд таны өгөгдөлд үндэслэн, ямар red flag хамгийн ноцтой түвшинд байгаа, түүнийг хэрхэн оношлох болон аюулгүй байдлаа хэрхэн хамгаалах алхмуудыг нарийн зааж өгсөн. Тайлангаа аваагүй л бол та яг одоо хаана хамгийн их хохирол амсч байгаагаа мэдэлгүй үлдэнэ.</p>"
    ]
  };

  const CLIFF_FUTURE = {
    low: [
      "<p>Таны оноо харьцангуй сайн түвшинд гарлаа. Энэ нь таны суурь ур чадвар, эрч хүчийн менежмент, шинэ мэдлэгт нээлттэй байдал тогтвортой байна гэсэн дохио. Та өдөр тутамдаа цагийг зөв зохион байгуулж, технологи, AI хэрэгслийг хэрэглэж чаддаг, сүлжээ тань ч боломжийн түвшинд байна. Гэхдээ энэ нь ирээдүйд ямар ч эрсдэлгүй гэсэн үг биш. Хөгжил дэвшил маш хурдан урагшилж байгаа өнөө үед “би зүгээр” гэсэн тайвшрал хамгийн том заналхийлэл болдог. Өнөөдөр сайн байгаа суурь чадвар маргааш хоцрогдсон болж хувирах эрсдэлтэй.</p><p>❗️ Та яг одооноос жижиг алхмуудаар өөрийгөө дараагийн түвшинд аваачих шаардлагатай. Хэрэв энэ боломжийг алдаж, зөвхөн өнөөдрийн тогтвортой байдлыг баримталбал 2–3 жилийн дараа таны карьерын замд ноцтой өрсөлдөгчид гарч ирэхэд та бэлэн биш байх магадлалтай.</p><p>👉 Бид таны өгөгдөл дээр тулгуурлан, аль ур чадвар танд хамгийн том давуу тал болж буй, харин аль нь сул хамгаалалттай байгаа болон ирээдүйд өрсөлдөх чадвараа хадгалахын тулд яг ямар алхам хийх ёстойг тусгай тайландаа багтаасан.</p>"
    ],
    mid: [
      "<p>Таны оноо дундаж түвшинд гарсан нь ирээдүйн сорилтод бэлтгэл хангалтгүй болж байгаагийн дохио. Та зарим суурь системийг алдаж байна — суралцах тогтолцоо сул, төвлөрсөн deep work цаг тогтмол биш, санхүүгийн дэр ч хангалтгүй. Шинэ технологи, автоматжуулалт дээр эргэлзэж, туршиж үзэхээс илүү айдас давамгайлж байгааг ч анзаарав. Энэ бол ирээдүйтэйгээ хөл нийлүүлэн алхахад том саад. Та одоо жижиг зүйл дээр эргэлзэж байгаа мэт боловч энэ эргэлзээ хуримтлагдсаар маргааш карьерынхаа хамгийн том боломжийг алдсан гэдгээ ойлгох үед хэтэрхий оройтсон байх магадлалтай.</p><p>❗️ Хэрэв та яг одоо тогтолцоогоо шинэчилж, суралцах хэв маягаа зохион байгуулахгүй бол ирээдүйн ажлын зах зээлд хөл алдах нь цаг хугацааны л асуудал.</p><p>👉 Манай тайланд таны өгөгдлийг нарийвчлан задлаад, аль ур чадварууд яг одоо танд хамгийн их дутагдаж байгаа, тэдгээрийг хэрхэн нөхөж ирээдүйд илүү баталгаатай алхах ёстойг шат дараатай харуулсан. Энэ мэдээллийг харахгүй бол та хаанаас эхлэхээ мэдэхгүй хэвээр үлдэнэ.</p>"
    ],
    high: [
      "<p>Таны оноо өндөр эрсдэлийн түвшинд байна. Энэ нь таны ирээдүйн карьер, ур чадварын бэлтгэл маш сул байгаагийн дохио. Эрч хүчийн мөчлөг алдагдсан, roadmap тодорхойгүй, төлөвлөгөөний хоёр дахь хувилбар (Plan B) огт байхгүй байна. Хэрэв энэ байдал үргэлжилбэл та зөвхөн шинэ боломжуудыг алдаад зогсохгүй, одоо байгаа ажлаа ч хадгалах баталгаа багасна. Энэ бол “би хожим суралцана” гэсэн өөрийгөө хуурсан тайвшралын аюултай шат. Нэг л өдөр зах зээлд таны ур чадвар үнэ цэнээ алдсан гэдгийг ойлгохдоо та өөрийгөө хоцрогдсон, сонголтгүй байдалд оруулсан байх магадлал өндөр.</p><p>❗️ Энэ бол яаралтай арга хэмжээ авах дохио. Хэрэв та яг одоо өөрийн карьерийн суурь чадваруудаа шинэчилж, сүлжээгээ өргөжүүлж, өөрийгөө илүү өрсөлдөхүйц болгож эхлэхгүй бол ойрын 1–2 жилд ирээдүйгээ алдах эрсдэлтэй.</p><p>👉 Бид таны өгөгдөл дээр үндэслэж, аль чадварууд тань бүрэн доголдсон, ямар алхмуудыг 72 цагийн дотор эхлүүлэх хэрэгтэй, мөн хэрхэн өөртөө урт хугацааны хамгаалалт бий болгох ёстойг тусгай тайландаа дэлгэрэнгүй гаргасан. Энэ тайлангаа аваагүй л бол та яг одоо хаана хамгийн их эрсдэлтэй байгаагаа мэдэлгүй үлдэнэ.</p>"
    ]
  };

  const CLIFF_MONEY = {
  low: [
    "<p>Таны оноо харьцангуй тогтвортой түвшинд гарсан нь таны санхүүгийн зуршлууд эрүүл суурьтай байгаагийн илрэл. Та орлого, зарлагаа тэнцвэртэй байлгахыг хичээдэг бөгөөд хуримтлалын эхлэл ч харагдаж байна. Гэхдээ энэ нь бүрэн санаа амарч болох дохио биш. Санхүү гэдэг бол тогтмол урсгал биш, гэнэтийн осол, өвчин, ажлын өөрчлөлт гээд тааварлашгүй эрсдэлд маш мэдрэмтгий систем. Өнөөдөр “зөв” ажиллаж байгаа мэт санагдсан зуршлууд тань ирээдүйд ханшийн өөрчлөлт, инфляци эсвэл нэг санхүүгийн том алдаанаас болоод хангалтгүй болж хувирч мэднэ.</p><p>❗️ Энэ шатанд хамгийн том эрсдэл бол “би зүгээр” гэсэн хийсвэр тайвшрал. Санхүүгийн хувьд тогтвортой байгаа үедээ л илүү хүчтэй хамгаалалт үүсгэх ёстой байдаг.</p><p>👉 Таны хариултууд дээр үндэслэж, бид танд ямар зуршилд тулгуурлан ирээдүйн санхүүгийн эрсдэлийг урьдчилан хааж болох, ямар нэмэлт алхам хийх хэрэгтэй талаар тусгай тайлан гаргасан. Тайлангаа харахгүй бол та яг хаана сул хамгаалалттай байгаагаа мэдэлгүй өнгөрнө.</p>"
  ],
  mid: [
    "<p>Таны санхүүгийн зуршлууд тодорхой хэмжээнд эрсдэлийн дохио өгч эхэлжээ. Төсөв тогтмол биш, заримдаа импульсээр худалдан авалт хийдэг, эсвэл өрийн дарамтаа бүрэн удирдаж чадахгүй байх нь ажиглагдаж байна. Энэ шатанд ихэнх хүмүүс өөрийгөө “би арай л муу биш” гэж тайвшруулдаг ч үнэн хэрэгтээ энэ бол хамгийн хуурамч аюулгүй үе шат юм. Учир нь энэ түвшнээс дээш гарвал санхүүгийн стресс хурц хэлбэрт шилжиж, хуримтлалын оронд өрөө нөхөж, шинэ боломжуудаас хоцрох болно. Та одоо ч өөрийн ирээдүйд нөөц бүрдүүлэхийн оронд “өнөөдрийг аргацааж буй” хэв маяг руу гулсах эрсдэлтэй байна.</p><p>❗️ Хэрэв энэ зан төлөв хэвээр үргэлжилбэл, ойрын 6–12 сард таны хувийн мөнгөний урсгал улам тогтворгүй болж, илүү өндөр хүүтэй өрийн дарамтад орох магадлалтай.</p><p>👉 Манай тайланд таны өгөгдлийг нарийвчлан задлаад, ямар зуршил таныг хамгийн их хойш татаж байгаа болон хэрхэн зогсоох, шинэ боломжид хөрвүүлэх алхмуудыг тодорхой зааж өгсөн. Үүнийг харахгүй бол та хаанаас эхлэхээ мэдэхгүйгээр цаашид цаг, мөнгө алдах эрсдэлтэй.</p>"
  ],
  high: [
    "<p>Таны санхүүгийн оноо өндөр эрсдэлийн түвшинд гарлаа. Энэ нь таны мөнгөний урсгал тогтворгүй, импульс худалдан авалт давамгайлсан, өрийн дарамт өсөж буйг илтгэнэ. Өнөөдөр та орлого олж байгаа ч, хүү, шимтгэл, төлбөрийн дарамтаас болоод ирээдүйн боломжоо өөрөө идэж байна гэсэн үг. Хамгийн аймшигтай нь энэ хэв маяг таны ирээдүйн 2–3 жилийн замыг шууд хааж, “би ажиллаж л байвал зүгээр” гэсэн хуурмаг ойлголтод хүргэнэ. Нэг л өдөр та өөрийгөө өрийн дарамтад орсон, хуримтлалгүй, сонголтгүй байдалд сэрж магадгүй.</p><p>❗️ Энэ бол яаралтай арга хэмжээ авах дохио. Хэрэв та яг одоо дорвитой өөрчлөлт хийхгүй бол таны санхүүгийн эрх чөлөө төдийгүй сэтгэл санаа, гэр бүлийн амьдрал хүртэл гүн уналтад орно.</p><p>👉 Бид таны өгөгдөл дээр үндэслэн, ямар зуршил, ямар шийдвэр танд хамгийн их хохирол авчирч байгаа, тэдгээрийг хэрхэн хурдан зогсоох, мөн санхүүгийн сахилга батыг хэрхэн сэргээхийг тусгай тайланд нарийн гаргасан. Тайлангаа аваагүй бол та яг одоо хаана “цус алдсаар” байгаагаа олж харахгүй.</p>"
  ]
  };

  const CLIFF = {
  low: [
    '<p>Танай оноо хамгийн доод түвшинд гарсан ч энэ нь бүх зүйл төгс гэсэн үг биш. Яг одоо танд эрч хүч хэвийн байгаа мэт санагдаж магадгүй, гэхдээ таны өдөр тутмын зуршлууд бага багаар хуримтлагдсаар ирээдүйд гэнэт хүнд цохилт өгөх эрсдэлтэй. Орой унтах цагийн тогтворгүй байдал, өдрийн турш кофе усаар орлуулах, ажлын дараа биеэ тайвшруулах цаг гаргахгүй байх зэрэг жижиг “нүдэнд үл үзэгдэх” зуршлууд эрсдэлийн суурь болдог.</p><p>❗️ Энэ үед хамгийн том алдаа бол “би зүгээр байна” гэж өөрийгөө хуурах явдал. Учир нь та яг энэ үеэс урьдчилан сэргийлэх жижиг алхам хийвэл ирээдүйн уналтыг бүрэн тойрох боломжтой.</p><p>👉 Таны хувьд ямар зуршил хамгийн эмзэг цэг болж байгааг бид оношилж, өдөр бүрийн жижиг өөрчлөлтөөр эрч хүчээ тогтвортой хадгалах алхмуудыг тусгай тайланд багтаасан.</p>'
  ],
  mid: [
    '<p>Таны оноо дундаж түвшинд байна. Энэ нь таны эрч хүч, төвлөрөл аль хэдийн тогтмол хэлбэлзэж байгаагийн дохио юм. Өдрийн дунд уналт хэвийн үзэгдэл болж, жижиг алдаа давтагдаж, ажил дууссаны дараа ч сэргэх хугацаа уртассан мэт мэдрэмж төрж байгаа биз дээ? Энэ шатанд ихэнх хүмүүс өөрийгөө “зүгээр” гэж бодсоор доройтол улам гүнзгийрдэг.</p><p>❗️ Хэрэв яг одоо жижиг өөрчлөлт хийхгүй бол ойрын 2–4 долоо хоногийн дотор бүтээмж, сэтгэл санаа, дотоод эрч хүч эрчимтэй унах магадлал маш өндөр.</p><p>👉 Бид таны өгөгдөл дээр тулгуурлан, ямар зан төлөв таныг хамгийн их ядрааж байгаа болон эхний 72 цагт хийх ёстой алхмуудыг тайланд дэлгэрэнгүй харуулсан. Үүнийг харахгүй бол та хаанаас эхлэхээ мэдэхгүй байсаар цаг алдах эрсдэлтэй.</p>'
  ],
  high: [
    '<p>Таны оноо ноцтой түвшинд байна. Сүүлийн саруудад хуримтлагдсан ядаргаа аль хэдийнээ таны өдөр тутмын амьдралд нөлөөлж эхэлжээ — өглөө бүрийн сэрүүлэг айдас төрүүлдэг, ажлын дараах сэргэлт бараг байхгүй, харилцаа хүртэл цуурч байгаа мэдрэмж төрж байна уу? Энэ бол түр зуурын ядралт биш, бүрэн шаталтын өмнөх шат. Энэ үеэс цааш явах юм бол таны биеийн дархлаа, сэтгэл санаа, ажил мэргэжил бүгд уналтад орно.</p><p>❗️ Та яг одоо энэ эрсдэлийг ойлгож, дараагийн алхмаа хийх ёстой. Бид таны өгөгдөл дээр үндэслэж, ямар зан төлөв, ямар зуршил танд хамгийн их аюул авчирч байгаа болон яаж буулгах алхмуудыг шат дараатай хийхийг тусгай тайланд бэлтгэсэн.</p><p>👉 Тайлангаа имэйлээр авч харахгүй бол та яг одоо хаана “шатаж” эхэлснээ мэдэлгүйгээр улам гүнзгийрүүлэх эрсдэлтэй.</p>'
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

    // Test ID үүсгэх функц
function generateTestId() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `LC-${yy}${mm}${dd}-${rand}`;
}

// === showSummaryCard() дотор, localStorage-д хадгалсны дараа:
const testId = generateTestId();
try {
  localStorage.setItem('lc_testId', testId);
  sessionStorage.setItem('testId', testId); // pay.html дээр хэрэглэхээр
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
if (target && text) target.innerHTML = text;
// хоосон бол бүү дар


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




