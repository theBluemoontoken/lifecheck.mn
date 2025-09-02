// /assets/report.js
import { COVER_SHEET_TEMPLATE, REPORT_CONTENT } from './reportContent.js';

const qs = new URLSearchParams(location.search);

/* 1) Cover өгөгдөл — бодит логикоос populate хийх:
   - name/email: localStorage эсвэл төлбөрийн формоос
   - testName/testKey: query эсвэл өмнөх хуудсаас
   - score/riskLevel/topAnswers: танай test.js-ээс
*/
const cover = { ...COVER_SHEET_TEMPLATE,
  name:  localStorage.getItem('lc_name')  || "",
  email: localStorage.getItem('lc_email') || "",
  testName: qs.get('testName') || "LifeCheck Test",
  score: qs.get('score') || "",
  riskLevel: (qs.get('risk') || "").toLowerCase(),  // "low|mid|high|severe"
  date: new Date().toLocaleDateString("mn-MN")
};

// top answers-ыг localStorage эсвэл query-оор дамжуулж болно
const ta = localStorage.getItem('lc_topAnswers');
cover.topAnswers = ta ? JSON.parse(ta) : [];

/* 2) Тестийн түлхүүр:
   - URL: ?test=money (burnout|redflags|future|money)
*/
const testKey = (qs.get('test') || "burnout").toLowerCase();
const riskKey = cover.riskLevel || "low";

const block = REPORT_CONTENT?.[testKey]?.[riskKey] || {
  analysis:"", advice:"", conclusion:"", motivation:"", disclaimer:""
};

/* 3) Cover-д текст хийх */
const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v || "—"; };
setTxt('cov-testName', cover.testName);
setTxt('cov-name',     cover.name);
setTxt('cov-email',    cover.email);
setTxt('cov-date',     cover.date);
setTxt('cov-score',    cover.score);

const riskEl = document.getElementById('cov-risk');
if (riskEl){
  const map = { low:'risk--low', mid:'risk--mid', high:'risk--high', severe:'risk--severe' };
  riskEl.textContent = (cover.riskLevel || "—").toUpperCase();
  riskEl.classList.add('pill');
  if (map[riskKey]) riskEl.classList.add(map[riskKey]);
}

const list = document.getElementById('cov-topAnswers');
if (list){
  list.innerHTML = "";
  (cover.topAnswers || []).slice(0,3).forEach(t=>{
    const li = document.createElement('li'); li.textContent = t; list.appendChild(li);
  });
  if (!cover.topAnswers?.length){
    const li = document.createElement('li'); li.textContent = "—"; list.appendChild(li);
  }
}

/* 4) Report контентыг хийх (Word-оос хуулж тавьсны дараа автоматаар дуудагдана) */
const htmlSet = (id, v) => { const el = document.getElementById(id); if (el) el.innerHTML = v || ""; };
htmlSet('rp-analysis',   block.analysis);
htmlSet('rp-advice',     block.advice);
htmlSet('rp-conclusion', block.conclusion);
htmlSet('rp-motivation', block.motivation);
htmlSet('rp-disclaimer', block.disclaimer);
