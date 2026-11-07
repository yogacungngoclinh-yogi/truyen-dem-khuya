"""Dò 4 khung truyện (lưới 2x2) trên mỗi trang ảnh. Khung = ảnh + 2 dòng chữ EN/VN bên dưới.

Cách dò:
  1. Ngang: tìm khe dọc giữa trang + mép trái/phải lưới (cột viền). Không được → 0.04 / 0.5 / 0.96.
  2. Dọc: tìm 2 huy hiệu "EN" (xanh dương) ở góc trái mỗi hàng → mép dưới = huy hiệu + 0.092.
     Mép trên = vòng số cam (1,2,3,4) khớp cả 2 cột; không thấy → huy hiệu - 0.25.
  3. Trang bố cục lạ → bảng GHI_DE bên dưới (đo tay), ưu tiên cao nhất.
Ra: khung(path) → ([[x, y, w, h] × 4] theo tỉ lệ 0..1 thứ tự 1-2-3-4, chắc_chắn).
Xem kết quả: python do-khung.py <thư mục ảnh> <thư mục ra>  (vẽ khung đỏ lên ảnh).
"""
import os
import numpy as np
from PIL import Image

# trang bố cục lạ: tên file → ([y_trên, y_dưới] hàng 1, [y_trên, y_dưới] hàng 2)
GHI_DE = {
    "02-thieu-phu-va-chiec-riu-vang-trang-02.jpg": ((0.055, 0.455), (0.46, 0.835)),
    "03-hat-giong-cua-nha-vua-trang-02.jpg": ((0.20, 0.59), (0.60, 0.94)),
    "04-co-be-ban-hoa-va-chiec-vi-danh-roi-trang-02.jpg": ((0.035, 0.595), (0.605, 0.98)),
    "05-cau-be-va-thu-thach-cua-nguoi-tho-gom-trang-02.jpg": ((0.035, 0.415), (0.435, 0.835)),
    "25-chu-chim-se-tap-bay.jpg": ((0.19, 0.525), (0.53, 0.865)),
    "27-ngon-nui-va-hat-cat.jpg": ((0.20, 0.525), (0.528, 0.825)),
    "41-su-tu-va-chu-chuot-nho-trang-02.jpg": ((0.032, 0.57), (0.595, 0.97)),
    "42-cau-be-va-chu-cho-bi-thuong-trang-02.jpg": ((0.032, 0.45), (0.452, 0.81)),
    "61-hat-gao-quy-gia-trang-02.jpg": ((0.032, 0.445), (0.455, 0.88)),
}


def _runs(mask, min_len):
    out, start = [], None
    for i, v in enumerate(list(mask) + [False]):
        if v and start is None:
            start = i
        elif not v and start is not None:
            if i - start >= min_len:
                out.append((start, i))
            start = None
    return out


def _gop(rs, gap):
    o = []
    for a, b in rs:
        if o and a - o[-1][1] <= gap:
            o[-1] = (o[-1][0], b)
        else:
            o.append((a, b))
    return o


def _hsv(a):
    x = a.astype(float) / 255
    r, g, b = x[..., 0], x[..., 1], x[..., 2]
    mx = x.max(axis=2); mn = x.min(axis=2); d = mx - mn + 1e-9
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    return h, d / (mx + 1e-9), mx


def _cot_ngang(khac, W, H):
    """(trai, xg, phai) theo tỉ lệ; mặc định nếu dò không được."""
    try:
        vung = khac[int(H * 0.3):int(H * 0.8), int(W * 0.4):int(W * 0.6)].mean(axis=0)
        khe = _runs(vung < 0.04, 4)
        k0, k1 = min(khe, key=lambda t: abs((t[0] + t[1]) / 2 - W * 0.1))
        xg = int(W * 0.4) + (k0 + k1) // 2
        cot = khac[int(H * 0.3):int(H * 0.8), :].mean(axis=0)
        trai = next(x for x in range(0, xg) if cot[x] > 0.6)
        phai = next(x for x in range(W - 1, xg, -1) if cot[x] > 0.6)
        if 0.02 < trai / W < 0.09 and 0.91 < phai / W < 0.98 and 0.46 < xg / W < 0.54:
            return trai / W, xg / W, phai / W
    except Exception:
        pass
    return 0.04, 0.5, 0.96


def do_khung(duong_dan):
    ten = os.path.basename(duong_dan)
    im = Image.open(duong_dan).convert("RGB")
    W, H = im.size
    a = np.asarray(im)
    mep = np.concatenate([a[:, :10].reshape(-1, 3), a[:, -10:].reshape(-1, 3)])
    nen = np.median(mep, axis=0)
    khac = (np.abs(a.astype(np.int16) - nen).sum(axis=2) > 60)
    trai, xg, phai = _cot_ngang(khac, W, H)

    if ten in GHI_DE:
        rows = GHI_DE[ten]
    else:
        h, s, v = _hsv(a)
        xanh = (h > 190) & (h < 215) & (s > 0.45) & (v > 0.6)
        cam = (h > 14) & (h < 40) & (s > 0.6) & (v > 0.75)
        xl0, xl1 = int((trai - 0.01) * W), int((trai + 0.10) * W)
        xr0, xr1 = int(xg * W), int((xg + 0.12) * W)
        # huy hiệu EN: dải xanh khớp ở cả 2 cột
        cols = []
        for x0, x1 in ((xl0, xl1), (xr0, xr1)):
            m = xanh[:, x0:x1].sum(axis=1) > 8
            cols.append([(p / H, q / H) for p, q in _gop(_runs(m, 6), 12) if 0.008 <= (q - p) / H <= 0.045])
        e = [p for p, q in cols[0] if any(abs(p - c) < 0.012 for c, d in cols[1])]
        en = []
        for v_ in e:
            if not en or v_ - en[-1] >= 0.25:
                en.append(v_)
        if len(en) == 1:                      # chỉ thấy 1 hàng → suy ra hàng kia
            en = [en[0], en[0] + 0.316] if en[0] < 0.6 else [en[0] - 0.316, en[0]]
        if len(en) < 2:
            return None
        en = en[:2]
        tops = []
        for k in (0, 1):
            w0, w1 = max(0.0, en[k] - 0.50), en[k] - 0.16
            if k == 1:
                w0 = max(w0, en[0] + 0.09)
            cc = []
            for x0, x1 in ((int(max(0, trai - 0.01) * W), int((trai + 0.09) * W)), (int(xg * W), int((xg + 0.10) * W))):
                m = cam[int(w0 * H):int(w1 * H), x0:x1].sum(axis=1) > 7
                cc.append([w0 + p / H for p, q in _gop(_runs(m, 5), 4) if 0.018 <= (q - p) / H <= 0.05])
            both = [c for c in cc[0] if any(abs(c - d) < 0.01 for d in cc[1])]
            tops.append(min(both, key=lambda c: abs(c - (en[k] - 0.25))) - 0.004 if both else en[k] - 0.25)
        b1 = min(en[0] + 0.092, tops[1] - 0.006)
        b2 = min(en[1] + 0.092, 0.995)
        rows = ((tops[0], b1), (tops[1], b2))

    g = 0.004
    o = []
    for y0, y1 in rows:
        o.append([trai, y0, xg - g - trai, y1 - y0])
        o.append([xg + g, y0, phai - xg - g, y1 - y0])
    o = [[round(x, 4), round(y, 4), round(w, 4), round(h, 4)] for x, y, w, h in o]
    if ten not in GHI_DE:
        for x, y, w, h in o:
            if not (0.38 < w < 0.52 and 0.22 < h < 0.47 and y >= 0 and y + h <= 1.0):
                return None
    return o


# khung mẫu khi mọi cách dò đều hỏng (không nên xảy ra; kiểm tra bằng lệnh vẽ khung)
MAU = {
    "tieu-de": [[0.04, 0.23, 0.46, 0.36], [0.5, 0.23, 0.46, 0.36], [0.04, 0.62, 0.46, 0.34], [0.5, 0.62, 0.46, 0.34]],
    "trang-2": [[0.04, 0.05, 0.46, 0.37], [0.5, 0.05, 0.46, 0.37], [0.04, 0.44, 0.46, 0.37], [0.5, 0.44, 0.46, 0.37]],
}


def khung(duong_dan):
    k = do_khung(duong_dan)
    if k:
        return k, True
    return MAU["trang-2" if "trang-02" in duong_dan else "tieu-de"], False


if __name__ == "__main__":
    import sys, glob
    from PIL import ImageDraw
    thu_muc, ra = sys.argv[1], sys.argv[2]
    os.makedirs(ra, exist_ok=True)
    loi = []
    for f in sorted(glob.glob(os.path.join(thu_muc, "*.jpg"))):
        k, ok = khung(f)
        if not ok:
            loi.append(os.path.basename(f))
        im = Image.open(f).convert("RGB")
        d = ImageDraw.Draw(im)
        W, H = im.size
        for x, y, w, h in k:
            d.rectangle([x * W, y * H, (x + w) * W, (y + h) * H], outline=(255, 0, 0) if ok else (0, 0, 255), width=6)
        im.thumbnail((300, 400))
        im.save(os.path.join(ra, os.path.basename(f)))
    print("dùng mẫu:", len(loi), loi)
