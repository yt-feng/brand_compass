(() => {
  const DATA = window.BRAND_COMPASS_DATA || { ARCHETYPES: {}, QUESTIONS: [] };
  const PACK = window.PROMPT_PACK || { modules: [], guide: { writingRules: [], samplePromptTypes: [] } };
  const RUNTIME = window.BRAND_COMPASS_RUNTIME || {};
  const { ARCHETYPES, QUESTIONS } = DATA;
  const PROMPT_MODULES = PACK.modules || [];
  const PROMPT_GUIDE = PACK.guide || { writingRules: [], samplePromptTypes: [] };

  const state = { answers: {}, lastReport: null, activePromptId: PROMPT_MODULES[0]?.prompts?.[0]?.id || '' };
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const el = id => document.getElementById(id);

  const toolsEl = el('tools');
  const quizEl = el('quiz');
  const studioEl = el('studio');
  const libraryEl = el('library');
  const sourcesEl = el('sources');
  const resultEl = el('result');

  function boot() {
    try {
      initTabs();
      renderTools();
      renderQuiz();
      renderStudio();
      renderLibrary();
      renderSources();
    } catch (error) {
      toolsEl.innerHTML = `<div class="error-card"><h2>页面加载失败</h2><p>${escapeHtml(error.message)}</p><p>请刷新页面，或检查浏览器控制台。</p></div>`;
      console.error(error);
    }
  }

  function initTabs() {
    $$('.tab').forEach(btn => btn.addEventListener('click', () => openTab(btn.dataset.tab)));
  }

  function openTab(tab) {
    $$('.tab').forEach(x => x.classList.toggle('active', x.dataset.tab === tab));
    $$('.tab-panel').forEach(p => p.classList.add('hidden'));
    resultEl.classList.add('hidden');
    el(tab)?.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function promptOptions() {
    return PROMPT_MODULES.flatMap(m => m.prompts.map(p => `<option value="${p.id}">${m.title}｜${p.title}</option>`)).join('');
  }

  function findPrompt(id) {
    for (const m of PROMPT_MODULES) {
      const p = m.prompts.find(x => x.id === id);
      if (p) return { module: m, prompt: p };
    }
    return { module: PROMPT_MODULES[0], prompt: PROMPT_MODULES[0]?.prompts?.[0] };
  }

  function renderTools() {
    const cards = PROMPT_MODULES.map(m => `
      <article class="tool-card">
        <div><p class="eyebrow">${m.prompts.length} tools</p><h3>${m.title}</h3><p>${m.description}</p></div>
        <button class="ghost useModule" data-id="${m.prompts[0].id}">使用这个模块</button>
      </article>`).join('');

    toolsEl.innerHTML = `
      <div class="topbar">
        <div><p class="eyebrow">AI Toolkit</p><h2>品牌策划工具包</h2><p class="muted">不是资料展示，而是可直接调用 DeepSeek 的工具包。填写品牌信息，选择任务，马上生成可交付方案。</p></div>
        <button class="primary" id="goQuiz">先做原型测试</button>
      </div>
      <div class="toolkit-grid">
        <form class="quick-panel" id="quickForm">
          <h3>一键生成策划方案</h3>
          <label>品牌名称<input id="quickBrand" placeholder="例如：繁荣学社" /></label>
          <label>行业/品类<input id="quickIndustry" placeholder="例如：AI品牌策划 / 个人品牌咨询" /></label>
          <label>目标人群<input id="quickAudience" placeholder="例如：创始人、品牌策划师、营销负责人" /></label>
          <label>核心卖点<input id="quickPoint" placeholder="例如：原型测试 + AI 策略生成" /></label>
          <label>选择工具<select id="quickPrompt">${promptOptions()}</select></label>
          <label>补充背景<textarea id="quickContext" rows="6" placeholder="粘贴品牌资料、竞品情况、产品信息，或从原型报告带入"></textarea></label>
          <details class="key-box"><summary>DeepSeek API Key 设置</summary><input id="quickKey" type="password" placeholder="sk-...；优先使用 GitHub Actions 注入的 Secret" /><p class="muted">检测到 Secret 注入：${RUNTIME.deepseekApiKey ? '是' : '否'}。若未注入，可临时填入 Key，仅保存在本机浏览器。</p></details>
          <div class="actions"><button type="button" class="ghost" id="quickLoadReport">载入原型报告</button><button type="button" class="ghost" id="quickPreview">预览提示词</button><button class="primary" type="submit">调用 DeepSeek 生成</button></div>
        </form>
        <div class="ai-output big-output"><div class="output-head"><strong>生成结果</strong><button class="ghost mini" id="quickCopy">复制</button></div><pre id="quickOutput">请选择一个工具并点击生成。常用入口：品牌定位、Slogan、竞品分析、视觉VI、活动策划、传播策略、危机回应、三年规划。</pre></div>
      </div>
      <h3 class="section-title">10 大工具模块</h3>
      <div class="tools-grid">${cards}</div>`;

    $('#goQuiz').onclick = () => openTab('quiz');
    $('#quickPrompt').value = state.activePromptId;
    $('#quickKey').value = localStorage.getItem('deepseek_api_key') || '';
    $$('.useModule', toolsEl).forEach(btn => btn.onclick = () => { $('#quickPrompt').value = btn.dataset.id; $('#quickForm').scrollIntoView({ behavior: 'smooth' }); });
    $('#quickLoadReport').onclick = () => { $('#quickContext').value = state.lastReport?.markdown || '还没有生成原型报告。请先到“原型测试”完成问卷，或直接填写品牌背景。'; };
    $('#quickPreview').onclick = () => { $('#quickOutput').textContent = composePrompt('quick'); };
    $('#quickCopy').onclick = async () => copyText($('#quickOutput').textContent);
    $('#quickForm').onsubmit = e => runDeepSeek(e, 'quick');
  }

  function renderQuiz() {
    const answered = Object.keys(state.answers).length;
    const percent = QUESTIONS.length ? Math.round(answered / QUESTIONS.length * 100) : 0;
    if (!QUESTIONS.length) {
      quizEl.innerHTML = '<div class="error-card"><h2>问卷数据未加载</h2><p>请检查 src/data.js 是否正常加载。</p></div>';
      return;
    }
    quizEl.innerHTML = `<div class="topbar"><div><p class="eyebrow">Archetype Test</p><h2>人格原型问卷</h2><p class="muted">回答 48 道品牌情境题，生成原型报告，并可带入 DeepSeek 工具包。</p></div><div class="progress"><span>${answered}/${QUESTIONS.length}</span><div><i style="width:${percent}%"></i></div></div></div><div class="questions">${QUESTIONS.map(q=>`<article class="question ${q.source==='supplement'?'supplement':''}"><div class="q-title"><b>${q.id}</b><span>${q.text}</span></div><div class="options">${q.options.map(([key,text,archetype])=>`<label class="option ${state.answers[q.id]===archetype?'selected':''}"><input type="radio" name="q${q.id}" value="${archetype}" ${state.answers[q.id]===archetype?'checked':''}/><strong>${key}</strong><span>${text}</span></label>`).join('')}</div></article>`).join('')}</div><div class="actions sticky-actions"><button class="ghost" id="fillSample">填入样例：探索者 + 平凡人</button><button class="primary" id="submit" ${answered<QUESTIONS.length?'disabled':''}>生成原型报告</button></div>`;
    $$('input[type="radio"]', quizEl).forEach(input => input.addEventListener('change', e => { state.answers[Number(e.target.name.replace('q',''))] = e.target.value; renderQuiz(); }));
    $('#fillSample', quizEl).onclick = fillSample;
    $('#submit', quizEl).onclick = showReport;
  }

  function fillSample() {
    QUESTIONS.forEach(q => {
      const hit = q.options.find(o => o[2] === 'explorer') || q.options.find(o => o[2] === 'everyman') || q.options[0];
      state.answers[q.id] = hit[2];
    });
    renderQuiz();
  }

  function score() {
    const scores = Object.fromEntries(Object.keys(ARCHETYPES).map(k => [k, 0]));
    Object.values(state.answers).forEach(k => { if (scores[k] !== undefined) scores[k]++; });
    const ranked = Object.entries(scores).sort((a,b) => b[1] - a[1]);
    const quadrants = {};
    ranked.forEach(([k,v]) => { const q = ARCHETYPES[k].quadrant; quadrants[q] = (quadrants[q] || 0) + v; });
    return { ranked, quadrants };
  }

  function buildReport(primary, secondary, ranked, quadrants) {
    const p = ARCHETYPES[primary], s = ARCHETYPES[secondary];
    const topScores = ranked.map(([k,v]) => `- ${ARCHETYPES[k].name}: ${v}`).join('\n');
    const qText = Object.entries(quadrants).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`- ${k}: ${v}`).join('\n');
    return `# 超级个人品牌原型报告：${p.name} + ${s.name}\n\n> ${p.tagline}；同时保留 ${s.name} 的底色。\n\n## 01 核心结论\n\n你的主原型是 **${p.name}（${p.en}）**，次原型是 **${s.name}（${s.en}）**。你的品牌应通过「${p.keywords.slice(0,3).join('、')}」建立鲜明方向，同时用「${s.keywords.slice(0,3).join('、')}」让用户愿意靠近。\n\n## 02 原型精髓\n\n### ${p.name}\n${p.gift}。\n\n### ${s.name}\n${s.gift}。\n\n### 平衡状态\n当 ${p.name} 的力量与 ${s.name} 的特质结合时，品牌会既有方向感，也有可亲近度。\n\n### 失衡风险\n- ${p.name}：${p.shadow}\n- ${s.name}：${s.shadow}\n\n## 03 品牌策略启示\n\n### 表达风格\n${p.voice}；同时保留 ${s.voice}。\n\n### 市场角色\n你适合成为某个领域的「方向感提供者」：用行动、体验和方法证明这条路值得走。\n\n### 产品与内容\n将新能力转化为更容易理解、更容易开始、更容易坚持的产品体验；内容上用故事呈现场景，用证据降低疑虑。\n\n## 04 创始人 DNA\n\n- 把直觉沉淀为方法论\n- 把用户语言纳入产品定义\n- 为高频决策建立清晰判断原则\n- 警惕为了追新而分散资源\n\n## 05 行动建议\n\n1. 写出 3 条品牌原则：什么机会可以追，什么机会必须放弃。\n2. 把用户真实语言整理成品牌词库。\n3. 每次产品更新都回答：它带来了什么新可能？它是否更容易被用户使用？\n4. 建立探索看板：新场景、新人群、新渠道、新风险。\n5. 将这份报告带入“工具包”，继续生成定位、Slogan、视觉、传播和活动方案。\n\n## 06 评分明细\n\n${topScores}\n\n## 07 象限倾向\n\n${qText}\n`;
  }

  function showReport() {
    const { ranked, quadrants } = score();
    const primary = ranked[0][0];
    const secondary = ranked.find(([k]) => k !== primary)[0];
    const md = buildReport(primary, secondary, ranked, quadrants);
    const p = ARCHETYPES[primary], s = ARCHETYPES[secondary];
    state.lastReport = { primary, secondary, markdown: md, title: `${p.name} + ${s.name}` };
    $$('.tab-panel').forEach(p => p.classList.add('hidden'));
    resultEl.classList.remove('hidden');
    resultEl.innerHTML = `<div class="report-cover"><p class="eyebrow">Founder Archetype Report</p><h2>${p.name} <span>+</span> ${s.name}</h2><p>${p.tagline}｜${s.tagline}</p></div><div class="actions"><button class="primary" id="print">打印 / 保存 PDF</button><button class="ghost" id="copy">复制 Markdown</button><button class="ghost" id="download">下载 Markdown</button><button class="ghost" id="toTools">带入工具包</button><button class="ghost" id="backQuiz">重新测试</button></div><article class="markdown">${markdownToHtml(md)}</article>`;
    $('#print').onclick = () => window.print();
    $('#copy').onclick = () => copyText(md);
    $('#download').onclick = () => downloadText(`原型报告_${p.name}_${s.name}.md`, md);
    $('#toTools').onclick = () => { openTab('tools'); $('#quickContext').value = md; };
    $('#backQuiz').onclick = () => openTab('quiz');
  }

  function renderStudio() {
    studioEl.innerHTML = `<div class="topbar"><div><p class="eyebrow">Free Studio</p><h2>自由工作台</h2><p class="muted">适合把较长背景、原型报告、竞品资料一起交给 DeepSeek。</p></div></div>
      <form id="studioForm" class="studio-form">
        <label>品牌名称<input id="brandName" placeholder="品牌名称" /></label>
        <label>行业 / 品类<input id="industry" placeholder="行业/品类" /></label>
        <label>目标人群<input id="audience" placeholder="目标人群" /></label>
        <label>核心卖点<input id="sellingPoint" placeholder="核心卖点" /></label>
        <label>选择任务<select id="promptSelect">${promptOptions()}</select></label>
        <label>DeepSeek API Key<input id="apiKey" type="password" placeholder="sk-...；可选" /></label>
        <label class="wide">品牌上下文<textarea id="brandContext" rows="10"></textarea></label>
        <div class="actions wide"><button type="button" class="ghost" id="loadReport">载入原型报告</button><button type="button" class="ghost" id="previewPrompt">预览提示词</button><button class="primary" type="submit">生成策划方案</button></div>
      </form><div class="ai-output"><div class="output-head"><strong>输出结果</strong><button class="ghost mini" id="copyOutput">复制</button></div><pre id="aiOutput">等待生成。</pre></div>`;
    $('#apiKey').value = localStorage.getItem('deepseek_api_key') || '';
    $('#promptSelect').value = state.activePromptId;
    $('#loadReport').onclick = () => { $('#brandContext').value = state.lastReport?.markdown || ''; };
    $('#previewPrompt').onclick = () => { $('#aiOutput').textContent = composePrompt('studio'); };
    $('#copyOutput').onclick = () => copyText($('#aiOutput').textContent);
    $('#studioForm').onsubmit = e => runDeepSeek(e, 'studio');
  }

  function values(mode) {
    if (mode === 'quick') return {
      brandName: $('#quickBrand').value || '[品牌名称]', industry: $('#quickIndustry').value || '[行业/品类]', audience: $('#quickAudience').value || '[目标人群]', sellingPoint: $('#quickPoint').value || '[核心卖点]', context: $('#quickContext').value || '', promptId: $('#quickPrompt').value, key: $('#quickKey').value.trim(), out: $('#quickOutput')
    };
    return {
      brandName: $('#brandName').value || '[品牌名称]', industry: $('#industry').value || '[行业/品类]', audience: $('#audience').value || '[目标人群]', sellingPoint: $('#sellingPoint').value || '[核心卖点]', context: $('#brandContext').value || '', promptId: $('#promptSelect').value, key: $('#apiKey').value.trim(), out: $('#aiOutput')
    };
  }

  function composePrompt(mode = 'quick') {
    const v = values(mode);
    const pick = findPrompt(v.promptId);
    state.activePromptId = v.promptId;
    return `你是“品牌罗盘 AI 工具包”，同时具备品牌战略顾问、个人品牌原型分析师、营销策划总监、创意总监能力。\n\n请基于以下信息，完成一个可直接交付的中文品牌策划方案。\n\n## 品牌基础信息\n- 品牌名称：${v.brandName}\n- 行业/品类：${v.industry}\n- 目标人群：${v.audience}\n- 核心卖点：${v.sellingPoint}\n\n## 当前工具\n${pick.module.title} / ${pick.prompt.title}\n\n## 工具指令\n${pick.prompt.template}\n\n## 品牌上下文\n${v.context || '暂无补充背景，请基于以上信息合理假设。'}\n\n## 输出要求\n1. 先给“最终可用版本”，再给“策略说明”。\n2. 不要泛泛而谈，要结合品牌基础信息和上下文。\n3. 结果要可复制给客户、团队或设计师执行。\n4. 信息不足时，列出合理假设和需要补充的问题。`;
  }

  async function runDeepSeek(e, mode) {
    e.preventDefault();
    const v = values(mode);
    if (v.key) localStorage.setItem('deepseek_api_key', v.key);
    const apiKey = v.key || RUNTIME.deepseekApiKey || localStorage.getItem('deepseek_api_key');
    if (!apiKey) {
      v.out.textContent = '未检测到 DeepSeek API Key。请在 Key 设置里填入，或在 GitHub Actions Secret 中设置 DEEPSEEK_API_KEY 并重新部署。';
      return;
    }
    v.out.textContent = '正在调用 DeepSeek，请稍候...';
    try {
      const res = await fetch(RUNTIME.deepseekEndpoint || 'https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: RUNTIME.deepseekModel || 'deepseek-chat', messages: [ { role: 'system', content: '你是资深品牌战略顾问和营销策划专家。' }, { role: 'user', content: composePrompt(mode) } ], temperature: 0.72 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
      v.out.textContent = data.choices?.[0]?.message?.content || JSON.stringify(data, null, 2);
    } catch (err) {
      v.out.textContent = `调用失败：${err.message}\n\n若浏览器提示 CORS 或网络错误，说明静态 GitHub Pages 不能稳定直连 DeepSeek。下一步应改成 Cloudflare Worker / Vercel Function 代理，让前端调用你的代理接口。`;
    }
  }

  function renderLibrary() {
    libraryEl.innerHTML = `<div class="topbar"><div><p class="eyebrow">Prompt Library</p><h2>提示词库</h2><p class="muted">10 大模块、50 个品牌策划高频工具，可搜索、复制、带入工具包。</p></div><input class="search" id="promptSearch" placeholder="搜索：slogan / 竞品 / VI / 危机..." /></div><div id="promptList" class="prompt-list"></div>`;
    const render = (kw='') => {
      const keyword = kw.trim().toLowerCase();
      $('#promptList').innerHTML = PROMPT_MODULES.map(m => {
        const prompts = m.prompts.filter(p => (m.title + p.title + p.template).toLowerCase().includes(keyword));
        if (!prompts.length) return '';
        return `<article class="module-card"><h3>${m.title}</h3><p>${m.description}</p>${prompts.map(p=>`<details><summary>${p.title}</summary><pre>${escapeHtml(p.template)}</pre><div class="actions"><button class="ghost mini usePrompt" data-id="${p.id}">带入工具包</button><button class="ghost mini copyPrompt" data-id="${p.id}">复制</button></div></details>`).join('')}</article>`;
      }).join('');
      $$('.usePrompt', libraryEl).forEach(btn => btn.onclick = () => { openTab('tools'); $('#quickPrompt').value = btn.dataset.id; });
      $$('.copyPrompt', libraryEl).forEach(btn => btn.onclick = () => copyText(findPrompt(btn.dataset.id).prompt.template));
    };
    $('#promptSearch').oninput = e => render(e.target.value);
    render();
  }

  function renderSources() {
    sourcesEl.innerHTML = `<div class="topbar"><div><p class="eyebrow">Source Library</p><h2>资料库</h2><p class="muted">资料已结构化保存，但主要入口是“工具包”。</p></div></div><div class="source-grid">
      <a class="source-card" href="data/source_pdfs/品牌罗盘人格原型.json" target="_blank"><strong>品牌罗盘人格原型.json</strong><span>43页问卷结构化数据。</span></a>
      <a class="source-card" href="data/source_pdfs/原型报告_探索者_平凡人.json" target="_blank"><strong>原型报告_探索者_平凡人.json</strong><span>13页报告结构化数据。</span></a>
      <a class="source-card" href="data/source_docs/品牌策划专用AI提示词包.json" target="_blank"><strong>品牌策划专用AI提示词包.json</strong><span>DOCX 结构化数据。</span></a>
      <a class="source-card" href="src/promptPack.js" target="_blank"><strong>promptPack.js</strong><span>网站工具包使用的提示词数据。</span></a>
    </div><article class="module-card"><h3>提示词写法方法论</h3>${(PROMPT_GUIDE.writingRules || []).map(x=>`<p><strong>${x.title}：</strong>${x.text}</p>`).join('')}<p><strong>常见示例：</strong>${(PROMPT_GUIDE.samplePromptTypes || []).join('、')}</p></article>`;
  }

  function markdownToHtml(md) {
    return md.replace(/^# (.*)$/gm,'<h1>$1</h1>').replace(/^## (.*)$/gm,'<h2>$1</h2>').replace(/^### (.*)$/gm,'<h3>$1</h3>').replace(/^> (.*)$/gm,'<blockquote>$1</blockquote>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').split('\n').map(line => {
      if(!line.trim()) return '';
      if(line.startsWith('<')) return line;
      if(line.startsWith('- ')) return `<li>${line.slice(2)}</li>`;
      if(/^\d+\. /.test(line)) return `<li>${line.replace(/^\d+\. /,'')}</li>`;
      return `<p>${line}</p>`;
    }).join('\n').replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`);
  }

  function escapeHtml(str) { return String(str).replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s])); }
  async function copyText(text) { await navigator.clipboard.writeText(text); alert('已复制'); }
  function downloadText(filename, content) { const blob = new Blob([content], {type:'text/markdown;charset=utf-8'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
