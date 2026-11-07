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
  /* ---------- BẬC NGHE + TRUYỆN CỦA TUẦN ---------- */
  // Nghe lại cùng 1 truyện giúp bé nhớ từ: bậc 1 tiếng Việt → bậc 2 Anh rồi Việt → bậc 3 tiếng Anh
  const BAC = [['vn', 'Tiếng Việt'], ['en-vn', 'Anh → Việt'], ['en', 'Tiếng Anh']];
  let bac = luu.doc('bac', {});                    // { so: [true, false, false] }
  const bacCua = so => bac[so] || [false, false, false];
  const xongBac = so => bacCua(so).every(Boolean);
  function ghiBac(so, g) {
    const i = BAC.findIndex(b => b[0] === g); if (i < 0) return;
    const a = bacCua(so).slice(); a[i] = true; bac[so] = a; luu.ghi('bac', bac);
  }
  function dauTuan() {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (d.getDay() + 6) % 7);
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  let tuan = luu.doc('tuan', null);                // { so, tuan }
  function chonTuan(doi) {
    const k = dauTuan();
    if (!doi && tuan && tuan.tuan === k && timSo(tuan.so) >= 0) return tuan;
    const bd = tuan ? timSo(tuan.so) : -1;
    let m = null;
    for (let j = 1; j <= T.length; j++) {
      const t = T[(bd + j) % T.length];
      if (!xongBac(t.so)) { m = t; break; }
    }
    if (!m) m = T[(bd + 1) % T.length];
    tuan = { so: m.so, tuan: k }; luu.ghi('tuan', tuan); return tuan;
  }
  function veTuan(doi) {
    const t = T[timSo(chonTuan(doi).so)], b = bacCua(t.so);
    const tiep = b.findIndex(x => !x);
    $('toiNay').innerHTML = `
      <img src="${t.bia}" alt="">
      <div>
        <div class="nhan">Truyện của tuần</div>
        <h2>${t.tenVn}</h2>
        <p class="en-nho">${t.tenEn}</p>
        <div class="bac">${BAC.map(([g, ten], i) => `<span class="${b[i] ? 'xong' : i === tiep ? 'tiep' : ''}">${b[i] ? '✓' : i + 1} ${ten}</span>`).join('')}</div>
        <div class="hang-nut">
          <button class="nut-vang" data-bac="${tiep < 0 ? 0 : tiep}"><svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:currentColor;stroke:none"><path d="M8 5v14l11-7z"/></svg>${tiep < 0 ? 'Nghe lại' : 'Nghe bậc ' + (tiep + 1)}</button>
          <button class="nut-vien" id="doiTruyen">${tiep < 0 ? 'Truyện mới' : 'Đổi truyện'}</button>
        </div>
        <p class="goi-y">${tiep < 0 ? 'Bé đã nghe đủ 3 bậc. Hỏi bé kể lại truyện nhé!' : 'Nghe lại 3 lần trong tuần để bé nhớ từ tốt hơn.'}</p>
      </div>`;
  }
  function veTu() { veLoc(); veLuoi(); veTuan(); }

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
    if (e.target.closest('#doiTruyen')) { veTuan(true); return; }
    const b = e.target.closest('[data-bac]');
    if (b) { giong = BAC[+b.dataset.bac][0]; luu.ghi('giong', giong); veCaiDat(); moTruyen(chonTuan().so, true); }
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
    const el = $('trang');
    if (ngay) { el.style.transition = 'none'; requestAnimationFrame(() => el.style.transition = ''); }
    datKhung(el, caTrang || d.khung < 0 ? null : p.khung[d.khung], p.chac);
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

  /* Phóng khung: cửa sổ rộng hết màn hình, cao vừa đúng 1 khung, khung lấp đầy chiều ngang.
     Trang gốc 896×1200 (tỉ lệ 3:4). box = [x, y, w, h] theo tỉ lệ trang; null = xem cả trang. */
  const ASP = 1200 / 896;
  function datKhung(el, box, chac) {
    const san = $('san'), k = $('khungTrang');
    const Ww = san.clientWidth, Hmax = san.clientHeight;
    const Pw = Ww, Ph = Ww * ASP;                       // trang ở độ phóng 1
    let s, Hk, tx, ty;
    if (!box) {                                          // cả trang, vừa khít chiều cao
      Hk = Math.min(Hmax, Ph); s = Hk / Ph;
      tx = (Ww - s * Pw) / 2; ty = 0;
    } else {
      const [x, y, w, h] = box;
      const le = chac ? 0.975 : 0.93;                    // chừa lề nhỏ quanh khung (khung dò chưa chắc → chừa rộng hơn)
      s = Math.min(le / w, 3.6);
      Hk = Math.min(Hmax, s * h * Ph / le);
      s = Math.min(s, le * Hk / (h * Ph));               // màn thấp quá thì vừa chiều cao
      const kep = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
      tx = kep(Ww / 2 - s * (x + w / 2) * Pw, Ww - s * Pw, 0);
      ty = kep(Hk / 2 - s * (y + h / 2) * Ph, Hk - s * Ph, 0);
    }
    k.style.width = Ww + 'px'; k.style.height = Math.round(Hk) + 'px';
    el.style.width = Pw + 'px'; el.style.height = Ph + 'px';
    el.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${s.toFixed(4)})`;
  }
  addEventListener('resize', () => { if (tr && !$('doc').classList.contains('an')) hienBuoc(true); });

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
  const esc = x => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function ketTruyen() {
    dungDoc();
    daNghe.add(tr.so); luu.ghi('da-nghe', [...daNghe]);
    ghiBac(tr.so, giong);
    moKet(true);
  }
  /* màn "Cùng nói chuyện": câu hỏi song ngữ + 5 từ mới. xong = vừa đọc hết truyện */
  function moKet(xong) {
    $('ketTieuDe').textContent = xong ? 'Chúc bé ngủ ngon' : 'Hỏi cùng bé';
    const q = [{ vn: 'Bài học của câu chuyện này là gì?', en: 'What is the lesson of this story?', dVn: tr.baiHocVn, dEn: tr.baiHocEn, nut: 'Xem bài học · Show the lesson' },
      ...(tr.hoi || []).map(c => ({ ...c, nut: 'Xem gợi ý trả lời · Show the answer' }))];
    $('ketHoi').innerHTML = q.map((c, i) => `<li>
      <div class="hoi-vn">${esc(c.vn)}</div><div class="hoi-en">${esc(c.en)}</div>
      ${c.dVn ? `<button class="xem-dap" data-dap="${i}" data-nut="${esc(c.nut)}">${esc(c.nut)}</button>
      <div class="dap-an an"><div>${esc(c.dVn)}</div><div class="hoi-en">${esc(c.dEn)}</div></div>` : ''}</li>`).join('');
    $('ketTu').innerHTML = (tr.tu || []).map((w, i) => `<button class="tu" data-tu="${i}"><span class="tu-en">${esc(w.en)}</span><span class="tu-vn">${esc(w.vn)}</span></button>`).join('');
    $('ketTiep').classList.toggle('an', timSo(tr.so) === T.length - 1);
    $('ketDong').classList.toggle('an', xong);
    $('ket').classList.remove('an'); $('ketHop').scrollTop = 0;
  }
  const amTu = new Audio();
  $('ketHop').addEventListener('click', e => {
    const d = e.target.closest('[data-dap]');
    if (d) {
      const da = d.nextElementSibling; da.classList.toggle('an');
      d.textContent = da.classList.contains('an') ? d.dataset.nut : 'Ẩn đáp án · Hide';
      return;
    }
    const w = e.target.closest('[data-tu]');
    if (w) {
      amTu.src = tr.tu[+w.dataset.tu].am; amTu.currentTime = 0; amTu.play().catch(() => {});
      w.classList.add('nghe'); setTimeout(() => w.classList.remove('nghe'), 900);
    }
  });
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
  $('ketDong').addEventListener('click', () => $('ket').classList.add('an'));
  $('nutHoi').addEventListener('click', () => { dungDoc(); moKet(false); });

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

  /* cài đặt: giọng + nhạc (hàng nút nhanh dưới lời đọc và bảng ⚙ dùng chung) */
  function veCaiDat() {
    [...$('chonGiong').children, ...$('giongNhanh').children].forEach(b => b.setAttribute('aria-pressed', b.dataset.g === giong));
    [...$('chonNhac').children].forEach(b => b.setAttribute('aria-pressed', (b.dataset.n === '1') === nhacBat));
    $('nutNhac').setAttribute('aria-pressed', nhacBat);
    $('chuNhac').textContent = nhacBat ? 'Nhạc: bật' : 'Nhạc: tắt';
  }
  function doiGiong(g) {
    if (g === giong) return;
    giong = g; luu.ghi('giong', giong); luot = 0; veCaiDat();
    if (dangDoc) { clearTimeout(hen); am.pause(); dungChu(); docLuot(); }   // đọc lại câu này bằng giọng mới
  }
  function doiNhac(bat) {
    nhacBat = bat; luu.ghi('nhac', nhacBat); veCaiDat();
    nhacBat && dangDoc ? batNhac() : tatNhac();
  }
  $('nutCaiDat').addEventListener('click', () => { veCaiDat(); $('caiDat').classList.remove('an'); });
  $('dongCaiDat').addEventListener('click', () => $('caiDat').classList.add('an'));
  $('caiDat').addEventListener('click', e => { if (e.target.id === 'caiDat') $('caiDat').classList.add('an'); });
  const chonG = e => { const b = e.target.closest('button'); if (b) doiGiong(b.dataset.g); };
  $('chonGiong').addEventListener('click', chonG);
  $('giongNhanh').addEventListener('click', chonG);
  $('chonNhac').addEventListener('click', e => { const b = e.target.closest('button'); if (b) doiNhac(b.dataset.n === '1'); });
  $('nutNhac').addEventListener('click', () => doiNhac(!nhacBat));
  veCaiDat();

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
