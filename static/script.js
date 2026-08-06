(() => {
  const gradeSelect   = document.getElementById('grade');
  const subjectSelect = document.getElementById('subject');
  const examToggle    = document.getElementById('examToggle');
  const startBtn       = document.getElementById('startBtn');
  const chat            = document.getElementById('chat');
  const emptyState     = document.getElementById('emptyState');
  const composer        = document.getElementById('composer');
  const input             = document.getElementById('input');
  const sendBtn          = document.getElementById('sendBtn');
  const pageTitle       = document.getElementById('pageTitle');
  const pageMeta        = document.getElementById('pageMeta');

  let examType = 'ВПР';
  let history = [];      // [{role: 'user'|'model', text}]
  let busy = false;

  const VPR_GRADES = [4, 5, 6, 7, 8];
  const OLYMPIAD_GRADES = [4, 5, 6, 7, 8, 9, 10, 11];

  function fillGrades() {
    const grades = examType === 'ВПР' ? VPR_GRADES : OLYMPIAD_GRADES;
    const prev = Number(gradeSelect.value) || 7;
    gradeSelect.innerHTML = grades.map(g => `<option value="${g}">${g} класс</option>`).join('');
    gradeSelect.value = grades.includes(prev) ? prev : 7;
  }
  fillGrades();

  examToggle.addEventListener('click', (e) => {
    const btn = e.target.closest('.toggle__btn');
    if (!btn) return;
    examToggle.querySelectorAll('.toggle__btn').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    examType = btn.dataset.value;
    fillGrades();
  });

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // Очень лёгкий markdown: **жирный**, `код`, переносы строк уже через white-space:pre-wrap
  function renderBody(text) {
    let safe = escapeHtml(text);
    safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/`([^`]+)`/g, '<code>$1</code>');
    return safe;
  }

  function addMessage(role, text) {
    emptyState.remove();
    const wrap = document.createElement('div');
    wrap.className = `msg msg--${role}`;
    const label = role === 'user' ? 'Ты' : `<span class="check">✓</span> Репетитор`;
    wrap.innerHTML = `
      <div class="msg__label">${label}</div>
      <div class="msg__body">${renderBody(text)}</div>
    `;
    chat.appendChild(wrap);
    chat.scrollTop = chat.scrollHeight;
    return wrap;
  }

  function showThinking() {
    const el = document.createElement('div');
    el.className = 'thinking';
    el.id = 'thinkingIndicator';
    el.innerHTML = '<span></span><span></span><span></span>';
    chat.appendChild(el);
    chat.scrollTop = chat.scrollHeight;
  }
  function hideThinking() {
    document.getElementById('thinkingIndicator')?.remove();
  }

  function setBusy(v) {
    busy = v;
    input.disabled = v || !startBtn.dataset.started;
    sendBtn.disabled = v || !startBtn.dataset.started || !input.value.trim();
  }

  async function callApi() {
    const payload = {
      subject: subjectSelect.value,
      exam_type: examType,
      grade: Number(gradeSelect.value),
      history,
    };
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Неизвестная ошибка' }));
      throw new Error(err.detail || `Ошибка ${res.status}`);
    }
    return res.json();
  }

  async function startLesson() {
    chat.innerHTML = '';
    history = [];
    startBtn.dataset.started = '1';
    pageTitle.textContent = `${subjectSelect.value} · ${examType}`;
    pageMeta.textContent = `${gradeSelect.value} класс`;
    input.disabled = false;
    input.focus();
    setBusy(true);
    showThinking();
    try {
      const { reply } = await callApi();
      hideThinking();
      addMessage('model', reply);
      history.push({ role: 'model', text: reply });
    } catch (e) {
      hideThinking();
      addMessage('model', `Не получилось получить задание. ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  startBtn.addEventListener('click', startLesson);

  input.addEventListener('input', () => {
    sendBtn.disabled = busy || !input.value.trim();
  });

  composer.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || busy) return;
    addMessage('user', text);
    history.push({ role: 'user', text });
    input.value = '';
    setBusy(true);
    showThinking();
    try {
      const { reply } = await callApi();
      hideThinking();
      addMessage('model', reply);
      history.push({ role: 'model', text: reply });
    } catch (e) {
      hideThinking();
      addMessage('model', `Ошибка: ${e.message}`);
    } finally {
      setBusy(false);
    }
  });
})();
