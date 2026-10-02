(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const progress = document.createElement('div');
  progress.className = 'motion-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.prepend(progress);
  let scrollScheduled = false;
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    scrollScheduled = false;
  };
  window.addEventListener('scroll', () => {
    if (!scrollScheduled) {
      scrollScheduled = true;
      requestAnimationFrame(updateProgress);
    }
  }, { passive: true });
  window.addEventListener('resize', updateProgress, { passive: true });
  updateProgress();

  if (!reducedMotion && 'IntersectionObserver' in window) {
    const revealItems = document.querySelectorAll(
      '.section-head,.market-picture,.vision-card,.method-card,.step,.support-card,.showcase-grid figure,.learning-map-grid>div,.delivery-grid article,.bonus-card,.community-gallery figure,.time-row,.story,.team-card,.faq details'
    );
    revealItems.forEach((item, index) => {
      item.classList.add('mrk-reveal');
      item.style.setProperty('--reveal-delay', `${(index % 3) * 70}ms`);
    });
    document.documentElement.classList.add('motion-ready');
    const revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      }
    }, { threshold: .08, rootMargin: '0px 0px -5% 0px' });
    revealItems.forEach(item => revealObserver.observe(item));
  }

  if (!reducedMotion && 'IntersectionObserver' in window) {
    const proof = document.querySelector('.proof');
    const proofNumbers = [...document.querySelectorAll('.proof-number')];
    if (proof && proofNumbers.length) {
      const observer = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();
        const started = performance.now();
        const duration = 1100;
        const originals = proofNumbers.map(element => {
          const textNode = [...element.childNodes].find(node => node.nodeType === Node.TEXT_NODE);
          const original = textNode?.textContent || '';
          const match = original.match(/^([\d,]+)(.*)$/);
          return { textNode, original, value: match ? Number(match[1].replaceAll(',', '')) : 0, suffix: match?.[2] || '' };
        });
        const tick = now => {
          const amount = Math.min(1, (now - started) / duration);
          const eased = 1 - Math.pow(1 - amount, 3);
          originals.forEach(({ textNode, original, value, suffix }) => {
            if (!textNode) return;
            textNode.textContent = amount === 1 ? original : `${Math.round(value * eased).toLocaleString('ja-JP')}${suffix}`;
          });
          if (amount < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }, { threshold: .35 });
      observer.observe(proof);
    }
  }

  const detailDialog = document.createElement('dialog');
  detailDialog.className = 'mrk-dialog';
  detailDialog.id = 'mrk-detail-dialog';
  detailDialog.setAttribute('aria-label', 'MRKサロンの詳しい内容');
  const detailClose = document.createElement('button');
  detailClose.type = 'button';
  detailClose.className = 'mrk-dialog-close';
  detailClose.setAttribute('aria-label', '閉じる');
  detailClose.textContent = '×';
  const detailBody = document.createElement('div');
  detailBody.className = 'mrk-dialog-body';
  detailDialog.append(detailClose, detailBody);
  document.body.append(detailDialog);
  detailClose.addEventListener('click', () => detailDialog.close());

  const lightbox = document.createElement('dialog');
  lightbox.className = 'mrk-dialog mrk-lightbox';
  lightbox.setAttribute('aria-label', '画像を拡大して表示');
  const lightboxClose = detailClose.cloneNode(true);
  const lightboxFigure = document.createElement('figure');
  lightboxFigure.className = 'mrk-lightbox-figure';
  const lightboxImage = document.createElement('img');
  const lightboxCaption = document.createElement('figcaption');
  const lightboxOpenOriginal = document.createElement('a');
  lightboxOpenOriginal.className = 'mrk-lightbox-open';
  lightboxOpenOriginal.target = '_blank';
  lightboxOpenOriginal.rel = 'noopener';
  lightboxOpenOriginal.textContent = '元画像を開いて拡大する ↗';
  lightboxFigure.append(lightboxImage, lightboxCaption, lightboxOpenOriginal);
  lightbox.append(lightboxClose, lightboxFigure);
  document.body.append(lightbox);
  lightboxClose.addEventListener('click', () => lightbox.close());

  let previousFocus = null;
  for (const dialog of [detailDialog, lightbox]) {
    dialog.addEventListener('close', () => {
      document.body.classList.remove('mrk-modal-open');
      previousFocus?.focus();
    });
    dialog.addEventListener('click', event => {
      if (event.target === dialog) dialog.close();
    });
  }
  const openDialog = (dialog, trigger) => {
    previousFocus = trigger;
    document.body.classList.add('mrk-modal-open');
    dialog.showModal();
    dialog.querySelector('.mrk-dialog-close')?.focus();
  };
  const appendText = (parent, tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    parent.append(element);
    return element;
  };
  const showDetail = (trigger, { kicker, title, description, points, slide, note }) => {
    detailBody.replaceChildren();
    appendText(detailBody, 'div', 'mrk-dialog-kicker', kicker);
    appendText(detailBody, 'h2', '', title);
    appendText(detailBody, 'p', '', description);
    const list = document.createElement('ul');
    list.className = 'mrk-dialog-list';
    points.forEach(point => appendText(list, 'li', '', point));
    detailBody.append(list);
    if (slide) {
      const figure = document.createElement('figure');
      figure.className = 'mrk-dialog-slide';
      const image = document.createElement('img');
      image.src = slide;
      image.alt = `${title}を説明した営業資料のページ`;
      image.loading = 'lazy';
      const zoom = document.createElement('a');
      zoom.href = slide;
      zoom.target = '_blank';
      zoom.rel = 'noopener';
      zoom.setAttribute('aria-label', `${title}の営業資料を元画像で開く`);
      zoom.append(image);
      figure.append(zoom);
      appendText(figure, 'figcaption', 'mrk-slide-zoom-label', '画像を拡大して読む ↗');
      detailBody.append(figure);
    }
    appendText(detailBody, 'p', 'mrk-dialog-note', note);
    const cta = document.createElement('a');
    cta.href = '#reply';
    cta.className = 'mrk-dialog-cta';
    cta.textContent = 'LINEに「MRK」と返信する方法を見る ↗';
    cta.addEventListener('click', () => detailDialog.close());
    detailBody.append(cta);
    openDialog(detailDialog, trigger);
  };

  const salesSlides = ['sales-service-63.png', 'sales-service-64.png', 'sales-service-65.png', 'sales-service-66.png', 'sales-service-67.png', 'sales-service-68.png', 'sales-service-70.png', 'sales-deck-curriculum.png'];
  document.querySelectorAll('.support-card').forEach((card, index) => {
    const content = card.querySelector('.support-content');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'support-more';
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', detailDialog.id);
    button.innerHTML = '営業資料で詳しく見る <span aria-hidden="true">↗</span>';
    content?.append(button);
    button.addEventListener('click', () => showDetail(button, {
      kicker: `SUPPORT ${String(index + 1).padStart(2, '0')}`,
      title: card.querySelector('h3')?.textContent?.trim() || 'MRKのサポート',
      description: card.querySelector('p')?.textContent?.trim() || '',
      points: [...card.querySelectorAll('.support-details li')].map(li => li.textContent.trim()),
      slide: `assets/${salesSlides[index]}`,
      note: '掲載画像は営業資料の説明図です。実際の会員画面やサポート画面を示すものではありません。内容・条件は個別面談でご確認ください。'
    }));
  });

  const lessonPoints = [
    ['モテるための3つの柱', '女性心理の理解', '外見改善・清潔感', '自信のつくり方'],
    ['with攻略', 'Pairs攻略', 'タップル攻略', '東カレ攻略'],
    ['写真構成の答え', '写真撮影マニュアル', '失敗しないプロフィール', 'プロフィール添削の実例'],
    ['メッセージの教科書', 'LINEの続け方', '電話の教科書', '実践音声・添削例'],
    ['初回デート完全攻略', '2回目デート攻略', 'デートスポット100選', 'デートの振り返り方'],
    ['告白のベストタイミング', 'お持ち帰りの考え方', '交際後の関係構築', '長続きする恋愛術']
  ];
  document.querySelectorAll('.learning-map-grid > div').forEach((tile, index) => {
    const title = tile.querySelector('strong')?.textContent?.replace(/\s+/g, '') || '学習テーマ';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'lesson-trigger';
    button.setAttribute('aria-label', `${title}の教材内容を見る`);
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', detailDialog.id);
    while (tile.firstChild) button.append(tile.firstChild);
    tile.append(button);
    button.addEventListener('click', () => showDetail(button, {
      kicker: `MRK METHOD LIBRARY / ${String(index + 1).padStart(2, '0')}`,
      title,
      description: '営業資料に掲載された、この領域の学習テーマです。必要な内容を予習・復習し、活動中の課題に合わせて見直します。',
      points: lessonPoints[index],
      slide: null,
      note: '営業資料の掲載内容を紹介しています。実際の教材一覧画面ではありません。収録内容・利用条件は面談でご確認ください。'
    }));
  });

  document.querySelectorAll('.market-picture a[href^="assets/"],.showcase-grid a[href^="assets/"],.case-gallery-grid a[href^="assets/"]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const image = link.querySelector('img');
      lightboxImage.src = link.getAttribute('href');
      lightboxImage.alt = image?.alt || '営業資料の画像';
      lightboxCaption.textContent = image?.alt || '営業資料の画像';
      lightboxOpenOriginal.href = link.getAttribute('href');
      openDialog(lightbox, link);
    });
  });
})();
