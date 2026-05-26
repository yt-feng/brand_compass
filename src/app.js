const { ARCHETYPES, QUESTIONS } = window.BRAND_COMPASS_DATA;
const state = { answers: {} };
const quizEl = document.querySelector('#quiz');
const resultEl = document.querySelector('#result');

function renderQuiz(){
  const answered = Object.keys(state.answers).length;
  const percent = Math.round(answered / QUESTIONS.length * 100);
  quizEl.innerHTML = `<div class="topbar"><div><p class="eyebrow">Brand Compass Test</p><h2>人格原型问卷</h2></div><div class="progress"><span>${answered}/${QUESTIONS.length}</span><div><i style="width:${percent}%"></i></div></div></div><div class="questions">${QUESTIONS.map(q=>`<article class="question ${q.source==='supplement'?'supplement':''}"><div class="q-title"><b>${q.id}</b><span>${q.text}</span></div><div class="options">${q.options.map(([key,text,archetype])=>`<label class="option ${state.answers[q.id]===archetype?'selected':''}"><input type="radio" name="q${q.id}" value="${archetype}" ${state.answers[q.id]===archetype?'checked':''}/><strong>${key}</strong><span>${text}</span></label>`).join('')}</div></article>`).join('')}</div><div class="actions sticky-actions"><button class="ghost" id="fillSample">填入样例：探索者 + 平凡人</button><button class="primary" id="submit" ${answered<QUESTIONS.length?'disabled':''}>生成原型报告</button></div>`;
  quizEl.querySelectorAll('input[type="radio"]').forEach(input=>input.addEventListener('change',e=>{state.answers[Number(e.target.name.replace('q',''))]=e.target.value;renderQuiz()}));
  quizEl.querySelector('#fillSample').onclick = fillSample;
  quizEl.querySelector('#submit').onclick = showReport;
}

function fillSample(){
  QUESTIONS.forEach(q=>{const hit=q.options.find(o=>o[2]==='explorer')||q.options.find(o=>o[2]==='everyman')||q.options[0];state.answers[q.id]=hit[2]});
  renderQuiz(); window.scrollTo({top:0,behavior:'smooth'});
}

function score(){
  const scores=Object.fromEntries(Object.keys(ARCHETYPES).map(k=>[k,0]));
  Object.values(state.answers).forEach(k=>scores[k]++);
  const ranked=Object.entries(scores).sort((a,b)=>b[1]-a[1]);
  const quadrants={}; ranked.forEach(([k,v])=>{const q=ARCHETYPES[k].quadrant;quadrants[q]=(quadrants[q]||0)+v});
  return {scores, ranked, quadrants};
}

function buildMarkdown(primary, secondary, ranked, quadrants){
  const p=ARCHETYPES[primary], s=ARCHETYPES[secondary];
  const topScores=ranked.map(([k,v])=>`- ${ARCHETYPES[k].name}: ${v}`).join('\n');
  const qText=Object.entries(quadrants).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`- ${k}: ${v}`).join('\n');
  return `# 超级个人品牌原型报告：${p.name} + ${s.name}\n\n> ${p.tagline}；同时保留 ${s.name} 的底色。\n\n## 01 概要\n\n你的主原型是 **${p.name}（${p.en}）**，次原型是 **${s.name}（${s.en}）**。这意味着你的品牌不是单纯追求声量，而是通过「${p.keywords.slice(0,3).join('、')}」建立鲜明方向，同时用「${s.keywords.slice(0,3).join('、')}」让更多人愿意靠近和参与。\n\n## 02 写在前面\n\n在拥挤市场里，真正稀缺的不是更漂亮的口号，而是一套稳定的识别方式：你如何判断机会、处理危机、对待用户、带领团队，以及希望世界记住你的哪一种价值。\n\n这份报告把问卷答案转译为品牌人格，不是为了贴标签，而是帮助你把创始人的行为偏好、表达方式与商业策略统一起来。\n\n## 03 原型的精髓\n\n### ${p.name}之核\n${p.gift}。\n\n### ${s.name}之心\n${s.gift}。\n\n### 平衡状态\n当 ${p.name} 的力量与 ${s.name} 的温度结合时，你的品牌会既有方向感，也有可亲近度：既能开路，也能让人跟上。\n\n### 失衡状态\n- ${p.name} 阴影：${p.shadow}\n- ${s.name} 阴影：${s.shadow}\n\n## 04 对于品牌的启示\n\n### 表达风格\n${p.voice}；同时保留 ${s.voice} 的亲近感。你的表达应避免空泛形容，优先讲具体场景、具体选择和具体承诺。\n\n### 市场角色\n你适合成为某个领域的「方向感提供者」：不是用权威压人，而是用行动和体验证明，为什么这条路值得走。\n\n### 美学特质\n视觉上建议使用清晰留白、可靠结构和可识别的符号系统；主视觉可以保留一点探索感或人情味，避免过度冰冷。\n\n### 对团队而言\n团队需要知道：探索不是随意变动，而是有目的地寻找新答案；亲和不是降低标准，而是让标准被更多人理解。\n\n## 05 创始人 DNA\n\n### 需要培养的行为\n- 把直觉沉淀为方法论\n- 把用户语言纳入产品定义\n- 为高频决策建立简单清晰的判断原则\n\n### 需要警惕的阴影\n- 为了追新而不断改变方向\n- 因为想被大众接受而削弱锋芒\n- 把亲和误解为没有边界\n\n### 使命句建议\n**我们把未知的可能性，转化为普通人也能安心使用的产品与体验。**\n\n## 06 优势与软肋\n\n### 优势\n- 能快速感知新趋势、新场景和新用户语言\n- 具有把前沿能力普及化的潜力\n- 容易建立真实、接地气、可参与的用户关系\n- 适合做社群、内容、产品共创和新市场拓展\n\n### 软肋\n- 容易在探索中分散资源\n- 过度亲和可能导致品牌不够锋利\n- 决策若缺少边界，会让团队感觉方向频繁变化\n- 需要把灵感和用户反馈转化为稳定机制\n\n## 07 品牌罗盘\n\n### 人（WHO / WHOM）\n- 创始人声音：${p.voice}，兼具 ${s.voice}\n- 理想受众：愿意尝试新方案，但仍重视真实、实用和安全感的人\n- 团队文化：好奇、坦诚、重视效率，也重视普通用户的真实反馈\n\n### 货（WHAT）\n- 核心特质：${p.keywords[0]}、${p.keywords[1]}、${s.keywords[0]}、${s.keywords[1]}\n- 产品设计：让新能力变得更容易理解、更容易开始、更容易坚持\n- 内容策略：用故事呈现场景，用证据降低疑虑，用用户语言完成转译\n\n### 场（WHERE）\n- 市场定位：前沿能力的大众化入口\n- 线下空间：像一个可以被体验的实验室与社区客厅\n- 线上空间：教程、案例、共创、问答和真实反馈并重\n\n## 08 行动建议\n\n1. 写出 3 条品牌原则：什么机会可以追，什么机会必须放弃。\n2. 把用户真实语言整理成「品牌词库」，替代内部黑话。\n3. 每次产品更新都回答：它带来了什么新可能？它是否更容易被普通人使用？\n4. 建立探索看板：新场景、新人群、新渠道、新风险。\n5. 用一个月做一次品牌复盘：表达是否仍然真实，方向是否仍然清晰。\n\n## 09 评分明细\n\n${topScores}\n\n## 10 象限倾向\n\n${qText}\n`;
}

function showReport(){
  const { ranked, quadrants } = score();
  const primary=ranked[0][0], secondary=ranked.find(([k])=>k!==primary)[0];
  const md=buildMarkdown(primary,secondary,ranked,quadrants);
  const p=ARCHETYPES[primary], s=ARCHETYPES[secondary];
  quizEl.classList.add('hidden'); resultEl.classList.remove('hidden');
  resultEl.innerHTML=`<div class="report-cover"><p class="eyebrow">Founder Archetype Report</p><h2>${p.name} <span>+</span> ${s.name}</h2><p>${p.tagline}｜${s.tagline}</p></div><div class="actions"><button class="primary" id="print">打印 / 保存 PDF</button><button class="ghost" id="copy">复制 Markdown</button><button class="ghost" id="download">下载 Markdown</button><button class="ghost" id="back">重新测试</button></div><article class="markdown">${markdownToHtml(md)}</article>`;
  resultEl.querySelector('#print').onclick=()=>window.print();
  resultEl.querySelector('#copy').onclick=async()=>{await navigator.clipboard.writeText(md);alert('已复制报告 Markdown')};
  resultEl.querySelector('#download').onclick=()=>downloadText(`原型报告_${p.name}_${s.name}.md`,md);
  resultEl.querySelector('#back').onclick=()=>{resultEl.classList.add('hidden');quizEl.classList.remove('hidden')};
  window.scrollTo({top:0,behavior:'smooth'});
}

function markdownToHtml(md){return md.replace(/^# (.*)$/gm,'<h1>$1</h1>').replace(/^## (.*)$/gm,'<h2>$1</h2>').replace(/^### (.*)$/gm,'<h3>$1</h3>').replace(/^> (.*)$/gm,'<blockquote>$1</blockquote>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').split('\n').map(line=>{if(!line.trim())return'';if(line.startsWith('<'))return line;if(line.startsWith('- '))return`<li>${line.slice(2)}</li>`;if(/^\d+\. /.test(line))return`<li>${line.replace(/^\d+\. /,'')}</li>`;return`<p>${line}</p>`}).join('\n').replace(/(<li>.*<\/li>\n?)+/g,m=>`<ul>${m}</ul>`)}
function downloadText(filename,content){const blob=new Blob([content],{type:'text/markdown;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url)}
renderQuiz();
