(() => {
  const form = document.getElementById('announcement-filters');
  if (!form) return;
  const search = form.elements.q;
  const topic = form.elements.konu;
  const year = form.elements.yil;
  const rows = [...document.querySelectorAll('[data-archive-item]')];
  const count = document.getElementById('archive-result-count');
  const empty = document.getElementById('archive-empty');
  const normalize = value => value.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');
  function restore() {
    const params = new URLSearchParams(location.search);
    search.value = params.get('q') || '';
    topic.value = params.get('konu') || '';
    year.value = params.get('yil') || '';
  }
  function apply(updateURL = true) {
    const query = normalize(search.value.trim());
    let matches = 0;
    for (const row of rows) {
      const show = (!query || normalize(row.dataset.title).includes(query)) && (!topic.value || row.dataset.topic === topic.value) && (!year.value || row.dataset.year === year.value);
      row.hidden = !show;
      if (show) matches++;
    }
    count.textContent = `${matches} duyuru`;
    empty.hidden = matches !== 0;
    if (updateURL) {
      const url = new URL(location.href);
      for (const [key, value] of [['q', search.value], ['konu', topic.value], ['yil', year.value]]) {
        value ? url.searchParams.set(key, value) : url.searchParams.delete(key);
      }
      history.replaceState(null, '', url.pathname + url.search + url.hash);
    }
  }
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('input', () => apply());
  form.addEventListener('change', () => apply());
  form.addEventListener('reset', () => setTimeout(() => apply(), 0));
  window.addEventListener('popstate', () => { restore(); apply(false); });
  window.addEventListener('pageshow', () => { restore(); apply(false); });
  restore(); apply(false);
})();
(() => {
  const dialog = document.querySelector('[data-pdf-dialog]');
  if (!dialog || typeof dialog.showModal !== 'function' || navigator.pdfViewerEnabled === false) return;

  const documents = dialog.closest('.announcement-documents');
  const button = documents.querySelector('[data-pdf-open]');
  const direct = documents.querySelector('[data-pdf-direct]');
  const preview = dialog.querySelector('[data-pdf-preview]');
  const pdf = new URL(direct.href);
  if (pdf.protocol !== 'https:' || pdf.origin === window.location.origin) return;

  button.hidden = false;
  button.addEventListener('click', () => {
    dialog.showModal();
    const frame = document.createElement('iframe');
    frame.title = 'Duyurunun PDF belgesi';
    frame.referrerPolicy = 'no-referrer';
    frame.setAttribute('credentialless', '');
    frame.src = pdf.href;
    preview.append(frame);
  });
  dialog.addEventListener('close', () => {
    preview.replaceChildren();
    button.focus();
  });
})();
(() => {
  const section = document.getElementById('contact-intake');
  if (!section) return;
  const form = document.getElementById('contact-form');
  const result = document.getElementById('contact-result');
  fetch('/api/durum', { headers: { Accept: 'application/json' } })
    .then(response => response.ok ? response.json() : null)
    .then(data => { if (data && data.inquiries === true) section.hidden = false; })
    .catch(() => {});
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Gönderiliyor…';
    result.textContent = 'Talebiniz gönderiliyor.';
    result.classList.remove('is-error');
    try {
      const response = await fetch('/api/iletisim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', Accept: 'application/json' },
        body: new URLSearchParams(new FormData(form)).toString()
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Talep kaydedilemedi. Lütfen yeniden deneyin veya e-posta ile ulaşın.');
      if (!data.referans) throw new Error('Kayıt numarası alınamadı. Lütfen iletişim ekibiyle görüşün.');
      result.textContent = `Talebiniz kaydedildi. Başvuru numaranız: ${data.referans}. Yanıt için e-posta adresiniz kullanılacaktır.`;
      form.reset();
    } catch (error) {
      result.textContent = error instanceof SyntaxError ? 'İletişim servisine ulaşılamadı. Lütfen yeniden deneyin veya e-posta ile ulaşın.' : error.message;
      result.classList.add('is-error');
    } finally {
      button.disabled = false;
      button.textContent = 'Talebi gönder ↗';
      result.focus();
    }
  });
})();
