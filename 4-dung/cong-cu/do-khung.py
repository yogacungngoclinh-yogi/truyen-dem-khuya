"""Dò 4 khung truyện (lưới 2x2) trên mỗi trang ảnh.

Cách dò: tìm khe nền dọc giữa trang (chia 2 cột) và khe nền ngang giữa 2 hàng,
rồi tìm mép trên hàng 1 / mép dưới hàng 2 bằng cột viền khung.
Không dò được → dùng khung mẫu theo loại trang (có tiêu đề / trang 2).
Ra: [[x, y, w, h] * 4] theo tỉ lệ 0..1, thứ tự 1-2-3-4.
"""
import numpy as np
from PIL import Image

MAU = {
    "tieu-de": [[0.04, 0.215, 0.46, 0.33], [0.5, 0.215, 0.46, 0.33], [0.04, 0.55, 0.46, 0.33], [0.5, 0.55, 0.46, 0.33]],
    "trang-2": [[0.04, 0.05, 0.46, 0.37], [0.5, 0.05, 0.46, 0.37], [0.04, 0.44, 0.46, 0.37], [0.5, 0.44, 0.46, 0.37]],
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


def do_khung(duong_dan):
    im = Image.open(duong_dan).convert("RGB")
    W, H = im.size
    a = np.asarray(im).astype(np.int16)
    mep = np.concatenate([a[:, :10].reshape(-1, 3), a[:, -10:].reshape(-1, 3)])
    nen = np.median(mep, axis=0)
    khac = (np.abs(a - nen).sum(axis=2) > 60)  # điểm không phải nền

    # cột giữa: khe dọc trong dải x 40–60%, dò trên vùng y 30–80%
    vung = khac[int(H * 0.3):int(H * 0.8), int(W * 0.4):int(W * 0.6)].mean(axis=0)
    khe_doc = _runs(vung < 0.04, 4)
    if not khe_doc:
        return None
    k0, k1 = min(khe_doc, key=lambda t: abs((t[0] + t[1]) / 2 - W * 0.1))
    xg = int(W * 0.4) + (k0 + k1) // 2

    # mép trái/phải của lưới: cột ngoài cùng có nhiều điểm khác nền
    ys = slice(int(H * 0.3), int(H * 0.8))
    cot = khac[ys, :].mean(axis=0)
    trai = next((x for x in range(0, xg) if cot[x] > 0.6), int(W * 0.04))
    phai = next((x for x in range(W - 1, xg, -1) if cot[x] > 0.6), int(W * 0.96))

    # hàng: chỉ xét dải ngay cạnh mép (viền khung chạy dọc suốt khung)
    def dai_vien(x):
        return khac[:, max(0, x - 3):x + 4].mean(axis=1) > 0.5
    vien = dai_vien(trai + 4) | dai_vien(phai - 4)
    hang = _runs(vien, int(H * 0.2))
    hang = sorted(sorted(hang, key=lambda t: t[1] - t[0], reverse=True)[:2])
    if len(hang) != 2:
        return None
    (a0, a1), (b0, b1) = hang
    o = []
    for y0, y1 in ((a0, a1), (b0, b1)):
        o.append([trai, y0, xg - trai, y1 - y0])
        o.append([xg, y0, phai - xg, y1 - y0])
    o = [[round(x / W, 4), round(y / H, 4), round(w / W, 4), round(h / H, 4)] for x, y, w, h in o]
    for x, y, w, h in o:
        if not (0.38 < w < 0.52 and 0.24 < h < 0.45):
            return None
    return o


def khung(duong_dan):
    k = do_khung(duong_dan)
    if k:
        return k, True
    return MAU["trang-2" if "trang-02" in duong_dan else "tieu-de"], False


if __name__ == "__main__":
    import sys, glob, os
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
    print("dung mau:", len(loi), loi)
