/* Truyện Đêm Khuya — Linora Yoga
   Dữ liệu: du-lieu.js (window.TRUYEN, window.CHU_DE), sinh bởi 4-dung/cong-cu/xay-app.py */
(() => {
  const T = window.TRUYEN || [];
  const CD = window.CHU_DE || {};
  const $ = id => document.getElementById(id);

  /* ---------- lưu trên máy ---------- */
  const luu = {
    doc(k, md) { try { const v = localStorage.getItem('tdk-' + k); return v == null ? md : JSON.parse(v); } catch (e) { return md; } },
    ghi(k, v) { try { localStorage.setItem('tdk-' + k, JSON.stringify(v)); } catch (e) {} },
  };
  let daNghe = new Set(luu.doc('da-nghe', []));
  let thich = new Set(luu.doc('thich', []));
  let giong = luu.doc('giong', 'vn');        // vn | en | en-vn
  let nhacBat = luu.doc('nhac', true);
  let loc = 'tat-ca';

  const so2 = n => String(n).padStart(2, '0');
  const timSo = so => T.findIndex(t => t.so === so);

  /* ---------- TỦ TRUYỆN ---------- */
  function veLoc() {
    const ds = [['tat-ca', 'Tất cả'], ...Object.entries(CD), ['thich', '♥ Bé thích']];
    $('loc').innerHTML = ds.map(([k, v]) => `<button data-k="${k}" aria-pressed="${k === loc}">${v}</button>`).join('');
  }
  function veLuoi() {
    let ds = T;
    if (loc === 'thich') ds = T.filter(t => thich.has(t.so));
    else if (loc !== 'tat-ca') ds = T.filter(t => t.chuDe === loc);
    $('luoi').innerHTML = ds.length ? ds.map(t => `
      <div class="the" role="button" tabindex="0" data-so="${t.so}" aria-label="${t.tenVn}">
        <img src="${t.bia}" alt="" loading="lazy" width="360" height="480">
        ${daNghe.has(t.so) ? '<span class="da-nghe">✓ Đã nghe</span>' : ''}
        <button class="tim ${thich.has(t.so) ? 'co' : ''}" data-tim="${t.so}" aria-label="Thích"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg></button>
        <div class="chu-the"><div class="so">Truyện ${t.so}</div><div class="ten">${t.tenVn}</div></div>
      </div>`).join('') : '<p class="trong">Chưa có truyện nào. Bấm ♥ trong truyện để lưu truyện bé thích.</p>';
  }
  let goiY = null;
  function veToiNay(doi) {
    const chua = T.filter(t => !daNghe.has(t.so));
    const nguon = chua.length ? chua : T;
    if (!goiY || doi || daNghe.has(goiY.so) && chua.length) {
      let m; do { m = nguon[Math.floor(Math.random() * nguon.length)]; } while (nguon.length > 1 && goiY && m.so === goiY.so);
      goiY = m;
    }
    const t = goiY;
    $('toiNay').innerHTML = `
      <img src="${t.bia}" alt="">
      <div>
        <div class="nhan">Truyện tối nay</div>
        <h2>${t.tenVn}</h2>
        <p class="en-nho">${t.tenEn}</p>
        <div class="hang-nut">
          <button class="nut-vang" data-mo="${t.so}"><svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:currentColor;stroke:none"><path d="M8 5v14l11-7z"/></svg>Nghe truyện</button>
          <button class="nut-vien" id="doiTruyen">Truyện khác</button>
        </div>
      </div>`;
  }
  function veTu() { veLoc(); veLuoi(); veToiNay(); }

  $('loc').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    loc = b.dataset.k; veLoc(); veLuoi();
  });
  $('luoi').addEventListener('click', e => {
    const tim = e.target.closest('[data-tim]');
    if (tim) { e.stopPropagation(); doiThich(+tim.dataset.tim); veLuoi(); return; }
    const c = e.target.closest('[data-so]'); if (c) moTruyen(+c.dataset.so);
  });
  $('luoi').addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.dataset.so) moTruyen(+e.target.dataset.so);
  });
  $('toiNay').addEventListener('click', e => {
    if (e.target.closest('#doiTruyen')) { veToiNay(true); return; }
    const b = e.target.closest('[data-mo]'); if (b) moTruyen(+b.dataset.mo, true);
  });
  function doiThich(so) {
    thich.has(so) ? thich.delete(so) : thich.add(so);
    luu.ghi('thich', [...thich]);
  }

  /* ---------- ĐỌC TRUYỆN ---------- */
  const am = new Audio();
  am.preload = 'auto';
  let tr = null;          // truyện đang đọc
  let buoc = 0;           // chỉ số dòng (tên, k1.., bài học)
  let luot = 0;           // lượt ngôn ngữ trong 1 dòng (en-vn: 0 = en, 1 = vn)
  let dangDoc = false;
  let caTrang = false;
  let hen = null;
  let khoaMan = null;

  const danhSachNN = () => giong === 'en-vn' ? ['en', 'vn'] : [giong];

  function moTruyen(so, tuDoc) {
    const i = timSo(so); if (i < 0) return;
    tr = T[i]; buoc = 0; luot = 0; caTrang = false;
    $('tu').classList.add('an'); $('doc').classList.remove('an');
    $('ket').classList.add('an'); $('caiDat').classList.add('an');
    $('tenDoc').textContent = `${tr.so}. ${tr.tenVn}`;
    $('nutThich').classList.toggle('co', thich.has(tr.so));
    $('truyenTruoc').disabled = i === 0;
    $('truyenTiep').disabled = i === T.length - 1;
    $('cham').innerHTML = tr.dong.map(() => '<i></i>').join('');
    if (location.hash !== '#truyen-' + so2(so)) history.pushState(null, '', '#truyen-' + so2(so));
    tr.trang.forEach(p => { const im = new Image(); im.src = p.anh; });   // tải trước các trang
    hienBuoc(true);
    if (tuDoc) phat();
    else dungDoc();
  }

  function veTuTruyen() {
    dungDoc(); tatNhac();
    $('doc').classList.add('an'); $('tu').classList.remove('an');
    if (location.hash) history.pushState(null, '', location.pathname);
    veTu();
  }

  /* đặt trang + phóng khung theo bước hiện tại */
  let anhDangHien = '';
  function hienBuoc(ngay) {
    const d = tr.dong[buoc];
    const p = tr.trang[d.trang];
    const img = $('anhTrang');
    if (anhDangHien !== p.anh) { img.src = p.anh; anhDangHien = p.anh; }
    datCoKhung();
    const el = $('trang');
    if (ngay) { el.style.transition = 'none'; requestAnimationFrame(() => el.style.transition = ''); }
    el.style.transform = caTrang || d.khung < 0 ? 'none' : phongKhung(p.khung[d.khung], p.chac);
    $('nutCaTrang').textContent = caTrang || d.khung < 0 ? 'Phóng to khung' : 'Xem cả trang';
    $('nutCaTrang').classList.toggle('an', d.khung < 0);
    // lời
    $('soKhung').textContent = d.khung === -1 ? 'Tên truyện' : d.khung === -2 ? 'Bài học' : 'Khung ' + d.id.slice(1);
    $('loiVn').innerHTML = boChu(d.vn);
    $('loiEn').innerHTML = boChu(d.en);
    [...$('cham').children].forEach((c, i) => c.classList.toggle('nay', i === buoc));
    $('loiVn').classList.remove('dang-doc'); $('loiEn').classList.remove('dang-doc');
  }
  const boChu = s => s.split(' ').map(w => `<span class="w">${w.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span>`).join(' ');

  function phongKhung([x, y, w, h], chac) {
    let s = Math.min(1 / w, 1 / h) * 0.96;
    s = Math.min(s, chac ? 2.3 : 1.6);
    const cx = x + w / 2, cy = y + h / 2;
    const kep = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const tx = kep(0.5 - s * cx, 1 - s, 0), ty = kep(0.5 - s * cy, 1 - s, 0);
    return `translate(${(tx * 100).toFixed(2)}%, ${(ty * 100).toFixed(2)}%) scale(${s.toFixed(3)})`;
  }

  /* khung ảnh 3:4 vừa với vùng trống */
  function datCoKhung() {
    const san = $('san'), k = $('khungTrang');
    const W = san.clientWidth, H = san.clientHeight;
    let w = Math.min(W, H * 0.75), h = w / 0.75;
    k.style.width = Math.floor(w) + 'px'; k.style.height = Math.floor(h) + 'px';
  }
  addEventListener('resize', () => { if (tr && !$('doc').classList.contains('an')) datCoKhung(); });

  /* phát giọng */
  function phat() {
    dangDoc = true; $('nutPhat').classList.add('dang');
    batNhac(); giuMan(true);
    docLuot();
  }
  function dungDoc() {
    dangDoc = false; $('nutPhat').classList.remove('dang');
    clearTimeout(hen); am.pause(); dungChu();
    tatNhac(); giuMan(false);
  }
  function docLuot() {
    clearTimeout(hen);
    const d = tr.dong[buoc];
    const nn = danhSachNN()[luot];
    am.src = `am-thanh/${so2(tr.so)}/${d.id}-${nn}.mp3`;
    am.currentTime = 0;
    const p = am.play();
    if (p) p.catch(e => { if (e && e.name === 'NotAllowedError') dungDoc(); });
    chayChu(nn === 'vn' ? $('loiVn') : $('loiEn'), nn === 'vn' ? d.tVn : d.tEn);
    giamNhac(true);
  }
  // thiếu file giọng → bỏ qua, sang lượt kế sau 2 giây
  am.addEventListener('error', () => { if (dangDoc) { clearTimeout(hen); hen = setTimeout(() => am.dispatchEvent(new Event('ended')), 2000); } });
  am.addEventListener('ended', () => {
    dungChu(true); giamNhac(false);
    if (!dangDoc) return;
    const ds = danhSachNN();
    if (luot < ds.length - 1) { luot++; hen = setTimeout(docLuot, 650); return; }
    if (buoc < tr.dong.length - 1) {
      hen = setTimeout(() => { buoc++; luot = 0; hienBuoc(); hen = setTimeout(docLuot, 900); }, 900);
    } else {
      hen = setTimeout(ketTruyen, 1200);
    }
  });

  /* tô sáng từng chữ */
  let raf = 0, dongChu = null;
  function chayChu(el, moc) {
    dungChu(); dongChu = el;
    const ws = [...el.querySelectorAll('.w')];
    el.classList.add('dang-doc');
    if (!moc || !moc.length) { ws.forEach(w => w.classList.add('da')); return; }
    const vong = () => {
      const t = am.currentTime * 1000;
      ws.forEach((w, i) => {
        const m = moc[i]; if (!m) return;
        w.classList.toggle('nay', t >= m[0] - 40 && t < (moc[i + 1] ? moc[i + 1][0] - 40 : m[1] + 200));
        w.classList.toggle('da', t >= m[0] - 40);
      });
      raf = requestAnimationFrame(vong);
    };
    raf = requestAnimationFrame(vong);
  }
  function dungChu(xong) {
    cancelAnimationFrame(raf);
    if (dongChu) {
      dongChu.querySelectorAll('.w').forEach(w => { w.classList.remove('nay'); if (xong) w.classList.add('da'); });
      if (!xong) dongChu.classList.remove('dang-doc');
    }
  }

  function sangBuoc(n) {
    if (n < 0 || n >= tr.dong.length) return;
    clearTimeout(hen); am.pause(); dungChu();
    buoc = n; luot = 0; hienBuoc();
    if (dangDoc) hen = setTimeout(docLuot, 500);
  }
  function ketTruyen() {
    dungDoc();
    daNghe.add(tr.so); luu.ghi('da-nghe', [...daNghe]);
    const bh = tr.dong[tr.dong.length - 1];
    $('ketBaiHoc').textContent = bh.vn;
    $('ketTiep').classList.toggle('an', timSo(tr.so) === T.length - 1);
    $('ket').classList.remove('an');
  }
  function doiTruyen(d) {
    const i = timSo(tr.so) + d;
    if (i >= 0 && i < T.length) moTruyen(T[i].so, dangDoc);
  }

  $('nutPhat').addEventListener('click', () => dangDoc ? dungDoc() : phat());
  $('nutToi').addEventListener('click', () => sangBuoc(buoc + 1));
  $('nutLui').addEventListener('click', () => sangBuoc(buoc - 1));
  $('veTu').addEventListener('click', veTuTruyen);
  $('nutCaTrang').addEventListener('click', () => { caTrang = !caTrang; hienBuoc(); });
  $('khungTrang').addEventListener('click', () => { if (tr.dong[buoc].khung >= 0) { caTrang = !caTrang; hienBuoc(); } });
  $('truyenTruoc').addEventListener('click', () => doiTruyen(-1));
  $('truyenTiep').addEventListener('click', () => doiTruyen(1));
  $('nutThich').addEventListener('click', () => { doiThich(tr.so); $('nutThich').classList.toggle('co', thich.has(tr.so)); });
  $('ketTiep').addEventListener('click', () => { const i = timSo(tr.so) + 1; if (i < T.length) moTruyen(T[i].so, true); });
  $('ketLai').addEventListener('click', () => moTruyen(tr.so, true));
  $('ketVe').addEventListener('click', veTuTruyen);

  // vuốt trái/phải để sang khung
  let x0 = null;
  $('khungTrang').addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  $('khungTrang').addEventListener('touchend', e => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) { e.preventDefault(); sangBuoc(buoc + (dx < 0 ? 1 : -1)); }
  });
  addEventListener('keydown', e => {
    if ($('doc').classList.contains('an')) return;
    if (e.key === 'ArrowRight') sangBuoc(buoc + 1);
    else if (e.key === 'ArrowLeft') sangBuoc(buoc - 1);
    else if (e.key === ' ') { e.preventDefault(); dangDoc ? dungDoc() : phat(); }
    else if (e.key === 'Escape') veTuTruyen();
  });

  /* cài đặt */
  function veCaiDat() {
    [...$('chonGiong').children].forEach(b => b.setAttribute('aria-pressed', b.dataset.g === giong));
    [...$('chonNhac').children].forEach(b => b.setAttribute('aria-pressed', (b.dataset.n === '1') === nhacBat));
  }
  $('nutCaiDat').addEventListener('click', () => { veCaiDat(); $('caiDat').classList.remove('an'); });
  $('dongCaiDat').addEventListener('click', () => $('caiDat').classList.add('an'));
  $('caiDat').addEventListener('click', e => { if (e.target.id === 'caiDat') $('caiDat').classList.add('an'); });
  $('chonGiong').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    giong = b.dataset.g; luu.ghi('giong', giong); luot = 0; veCaiDat();
  });
  $('chonNhac').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    nhacBat = b.dataset.n === '1'; luu.ghi('nhac', nhacBat); veCaiDat();
    nhacBat && dangDoc ? batNhac() : tatNhac();
  });

  /* giữ màn hình sáng khi đang đọc */
  async function giuMan(bat) {
    try {
      if (bat && 'wakeLock' in navigator && !khoaMan) { khoaMan = await navigator.wakeLock.request('screen'); khoaMan.addEventListener('release', () => khoaMan = null); }
      if (!bat && khoaMan) { khoaMan.release(); khoaMan = null; }
    } catch (e) {}
  }

  /* ---------- NHẠC RU (tự tạo bằng code, kiểu hộp nhạc) ---------- */
  const N = { ctx: null, out: null, hen: null, chay: false };
  const NOT = [0, 2, 4, 7, 9, 12, 14, 16];       // ngũ cung
  const GAM = [[0, 4, 7, 12], [9, 12, 16, 21], [5, 9, 12, 17], [7, 11, 14, 19]];  // I vi IV V
  function batNhac() {
    if (!nhacBat || N.chay) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    if (!N.ctx) {
      N.ctx = new AC();
      N.out = N.ctx.createGain(); N.out.gain.value = 0;
      const loc = N.ctx.createBiquadFilter(); loc.type = 'lowpass'; loc.frequency.value = 2400;
      N.out.connect(loc); loc.connect(N.ctx.destination);
    }
    N.ctx.resume && N.ctx.resume();
    N.chay = true;
    const t = N.ctx.currentTime;
    N.out.gain.cancelScheduledValues(t); N.out.gain.setValueAtTime(N.out.gain.value, t);
    N.out.gain.linearRampToValueAtTime(0.05, t + 3);
    let nhip = 0, tiep = N.ctx.currentTime + 0.2;
    const goc = 261.63;   // C4
    const lich = () => {
      if (!N.chay) return;
      while (tiep < N.ctx.currentTime + 1.5) {
        const g = GAM[Math.floor(nhip / 8) % 4];
        const bac = nhip % 8;
        const hz = goc * Math.pow(2, (bac < 4 ? g[bac] : g[7 - bac] + (bac === 4 ? 12 : 0)) / 12);
        not(hz, tiep, 0.9 - (bac % 4) * 0.12);
        if (bac === 0) not(goc / 2 * Math.pow(2, g[0] / 12), tiep, 0.7, 3.5);
        if (nhip % 16 === 6) not(goc * 2 * Math.pow(2, NOT[Math.floor(Math.random() * NOT.length)] / 12), tiep + 0.35, 0.35);
        nhip++; tiep += 0.62;
      }
      N.hen = setTimeout(lich, 400);
    };
    lich();
  }
  function not(hz, t, vol, dai = 2.6) {
    const c = N.ctx, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = hz;
    o2.type = 'sine'; o2.frequency.value = hz * 2.01;
    const g2 = c.createGain(); g2.gain.value = 0.18;
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(N.out);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0006, t + dai);
    o.start(t); o2.start(t); o.stop(t + dai + 0.05); o2.stop(t + dai + 0.05);
  }
  function giamNhac(co) {
    if (!N.ctx || !N.chay) return;
    const t = N.ctx.currentTime;
    N.out.gain.cancelScheduledValues(t); N.out.gain.setValueAtTime(N.out.gain.value, t);
    N.out.gain.linearRampToValueAtTime(co ? 0.03 : 0.05, t + 0.6);
  }
  function tatNhac() {
    if (!N.ctx || !N.chay) return;
    N.chay = false; clearTimeout(N.hen);
    const t = N.ctx.currentTime;
    N.out.gain.cancelScheduledValues(t); N.out.gain.setValueAtTime(N.out.gain.value, t);
    N.out.gain.linearRampToValueAtTime(0, t + 1.2);
  }

  /* ---------- điều hướng bằng địa chỉ ---------- */
  function theoDiaChi() {
    const m = location.hash.match(/^#truyen-(\d+)/);
    if (m && timSo(+m[1]) >= 0) moTruyen(+m[1]);
    else if (!$('doc').classList.contains('an')) { dungDoc(); $('doc').classList.add('an'); $('tu').classList.remove('an'); veTu(); }
  }
  addEventListener('popstate', theoDiaChi);
  veTu();
  theoDiaChi();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
