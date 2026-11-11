"""Dựng dữ liệu cho app Truyện Đêm Khuya từ dự án truyện tranh.

Đọc: <nguon>/2-kich-ban/du-lieu/*.json + <nguon>/3-tai-san/hinh/*.jpg
Ra (trong 4-dung/app/):
  anh/trang/<ten>.webp   trang truyện (896px)
  anh/bia/<so>.webp      ảnh bìa nhỏ (360px)
  am-thanh/<so>/<id>-vn.mp3, <id>-en.mp3   giọng đọc (edge-tts)
  du-lieu.js             window.TRUYEN = [...] (lời, khung, thời gian từng chữ)
Chạy lại: chỉ làm phần còn thiếu. --lai-giong: thu lại hết giọng.

python xay-app.py --nguon "J:/_Apps/ai-video-producer/du-an/2026-11-07-khac-truyen-tranh-dao-duc-80"
"""
import argparse, asyncio, glob, json, os, re, sys
from pathlib import Path
from PIL import Image
import edge_tts

sys.path.insert(0, str(Path(__file__).parent))
import importlib.util
_sp = importlib.util.spec_from_file_location("dk", Path(__file__).parent / "do-khung.py")
dk = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(dk)

APP = Path(__file__).resolve().parent.parent / "app"
GIONG = {"vn": ("vi-VN-HoaiMyNeural", "-12%"), "en": ("en-US-JennyNeural", "-15%")}
CHU_DE = {
    "trung-thuc": "Trung thực",
    "khiem-ton-no-luc": "Khiêm tốn & Nỗ lực",
    "long-tot": "Lòng tốt",
    "biet-on": "Biết ơn",
    "cam-xuc-tu-chu": "Cảm xúc & Tự chủ",
    "tu-tin-phat-trien": "Tự tin & Phát triển",
    "ban-be-hop-tac": "Bạn bè & Hợp tác",
    "trach-nhiem-thoi-quen": "Trách nhiệm & Thói quen",
    "dung-cam-ton-trong-an-toan": "Dũng cảm & An toàn",
    "tu-duy-tich-cuc": "Tư duy tích cực",
    "tu-duy-sang-tao-phan-bien": "Tư duy sáng tạo",
    "nhan-cach-dao-duc": "Nhân cách & Đạo đức",
    "ky-nang-song": "Kỹ năng sống",
    "gia-dinh-cong-dong": "Gia đình & Cộng đồng",
}


def lam_anh(f_jpg, so, la_bia):
    ten = Path(f_jpg).stem
    ra = APP / "anh" / "trang" / f"{ten}.webp"
    if not ra.exists():
        Image.open(f_jpg).convert("RGB").save(ra, "WEBP", quality=80, method=6)
    if la_bia:
        bia = APP / "anh" / "bia" / f"{so:02d}.webp"
        if not bia.exists():
            im = Image.open(f_jpg).convert("RGB")
            im.thumbnail((360, 480))
            im.save(bia, "WEBP", quality=78, method=6)
    return f"anh/trang/{ten}.webp"


def khop(chu, moc):
    """Gán thời gian cho từng từ (tách bằng dấu cách) theo mốc WordBoundary."""
    tu = chu.split(" ")
    co_chu = [bool(re.search(r"\w", t)) for t in tu]
    if moc and sum(co_chu) == len(moc):
        o, j = [], 0
        for c in co_chu:
            if c:
                o.append(moc[j]); j += 1
            else:
                o.append(o[-1] if o else moc[0])
        return o
    if not moc:
        return []
    dau, cuoi = moc[0][0], moc[-1][1]
    b = (cuoi - dau) / len(tu)
    return [[round(dau + i * b), round(dau + (i + 1) * b)] for i in range(len(tu))]


async def thu(chu, ngon_ngu, duong):
    ten, toc = GIONG[ngon_ngu]
    comm = edge_tts.Communicate(chu, ten, rate=toc, boundary="WordBoundary")
    am, moc = bytearray(), []
    async for c in comm.stream():
        if c["type"] == "audio":
            am += c["data"]
        elif c["type"] == "WordBoundary":
            bd = c["offset"] / 1e4
            moc.append([round(bd), round(bd + c["duration"] / 1e4)])
    duong.write_bytes(bytes(am))
    return moc


async def thu_het(viec, cu, lai, song_song, tg_file, so_lan=4):
    sem = asyncio.Semaphore(song_song)
    xong = [0]

    async def mot(key, chu, nn, duong):
        if not lai and key in cu and duong.exists():
            return
        async with sem:
            for lan in range(so_lan):
                try:
                    cu[key] = khop(chu, await asyncio.wait_for(thu(chu, nn, duong), 60))  # 60s: tránh treo khi máy chủ im
                    xong[0] += 1
                    if xong[0] % 25 == 0:
                        print("  da thu", xong[0], flush=True)
                        tg_file.write_text(json.dumps(cu), encoding="utf-8")
                    return
                except Exception as e:
                    print("  loi", key, repr(e)[:120], flush=True)
                    await asyncio.sleep(2 + lan * 3)

    await asyncio.gather(*(mot(*v) for v in viec))
    return xong[0]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--nguon", required=True, nargs="+", help="1 hay nhiều folder dự án truyện tranh")
    ap.add_argument("--lai-giong", action="store_true")
    ap.add_argument("--nn", choices=["vn", "en"], help="chỉ thu 1 ngôn ngữ")
    ap.add_argument("--song-song", type=int, default=4)
    ap.add_argument("--so-lan", type=int, default=4, help="số lần thử mỗi câu")
    a = ap.parse_args()
    nguons = [Path(x) for x in a.nguon]
    for d in ("anh/trang", "anh/bia", "am-thanh"):
        (APP / d).mkdir(parents=True, exist_ok=True)

    tg_file = Path(__file__).parent / "thoi-gian.json"
    tg = json.loads(tg_file.read_text(encoding="utf-8")) if tg_file.exists() else {}

    hinh = sorted(f for n in nguons for e in ("jpg", "png", "jpeg", "webp") for f in glob.glob(str(n / "3-tai-san" / "hinh" / f"*.{e}")))
    # câu hỏi + từ vựng viết tay: noi-dung/hoi-tu.json {so: {h: [[vn,en]..], t: [[en,vn]..]}}
    ht_file = Path(__file__).parent / "noi-dung" / "hoi-tu.json"
    ht = json.loads(ht_file.read_text(encoding="utf-8")) if ht_file.exists() else {}
    (APP / "am-thanh" / "tu").mkdir(parents=True, exist_ok=True)
    tu_thu = {}
    ds, viec, mau = [], [], 0
    for fj in sorted(f for n in nguons for f in glob.glob(str(n / "2-kich-ban" / "du-lieu" / "*.json"))):
        cd_key = re.sub(r"^phan-\d+-", "", Path(fj).stem)
        for s in json.load(open(fj, encoding="utf-8")):
            so = s["so"]
            anh = [f for f in hinh if Path(f).name.startswith(f"{so:02d}-")]
            if not anh:
                print("thieu anh truyen", so); continue
            trang = []
            for i, f in enumerate(anh):
                khung, chac = dk.khung(f)
                mau += (not chac)
                trang.append({"anh": lam_anh(f, so, i == 0), "khung": khung, "chac": chac})
            dong = [{"id": "ten", "vn": f"{s['ten_vn']}. {s['phu_de_vn']}.", "en": f"{s['ten_en']}. {s['phu_de_en']}.", "trang": 0, "khung": -1}]
            for k, p in enumerate(s["panels"]):
                dong.append({"id": f"k{k + 1}", "vn": p["vn"], "en": p["en"], "trang": k // 4, "khung": k % 4})
            dong.append({"id": "bh", "vn": "Bài học: " + s["bai_hoc_vn"], "en": "Moral: " + s["bai_hoc_en"], "trang": len(anh) - 1, "khung": -2})
            (APP / "am-thanh" / f"{so:02d}").mkdir(exist_ok=True)
            for d in dong:
                for nn in ("vn", "en"):
                    key = f"{so:02d}/{d['id']}-{nn}"
                    viec.append((key, d[nn], nn, APP / "am-thanh" / f"{key}.mp3"))
            h = ht.get(str(so), {})
            tu = []
            for en, vn in h.get("t", []):
                slug = re.sub(r"[^a-z0-9]+", "-", en.lower()).strip("-")
                tu.append({"en": en, "vn": vn, "am": f"am-thanh/tu/{slug}.mp3"})
                tu_thu[f"tu/{slug}"] = (f"tu/{slug}", en, "en", APP / "am-thanh" / "tu" / f"{slug}.mp3")
            ds.append({"so": so, "chuDe": cd_key,
                       "baiHocVn": s["bai_hoc_vn"], "baiHocEn": s["bai_hoc_en"],
                       "hoi": [{"vn": q[0], "en": q[1], "dVn": d[0], "dEn": d[1]} for q, d in zip(h.get("h", []), h.get("d", [["", ""]] * 2))], "tu": tu, "tenVn": s["ten_vn"], "tenEn": s["ten_en"],
                       "phuDeVn": s["phu_de_vn"], "phuDeEn": s["phu_de_en"],
                       "bia": f"anh/bia/{so:02d}.webp", "trang": trang, "dong": dong})
    print("truyen:", len(ds), "| trang:", sum(len(t["trang"]) for t in ds), "| trang dung khung mau:", mau)
    print("cau can doc:", len(viec))

    viec += list(tu_thu.values())
    if a.nn:
        viec = [v for v in viec if v[2] == a.nn]
    n = asyncio.run(thu_het(viec, tg, a.lai_giong, a.song_song, tg_file, a.so_lan))
    tg_file.write_text(json.dumps(tg), encoding="utf-8")
    print("thu moi:", n)

    thieu = 0
    for t in ds:
        for d in t["dong"]:
            for nn in ("vn", "en"):
                key = f"{t['so']:02d}/{d['id']}-{nn}"
                d["t" + nn.capitalize()] = tg.get(key, [])
                thieu += key not in tg
    js = ("// Tự sinh bởi 4-dung/cong-cu/xay-app.py — không sửa tay\n"
          "window.CHU_DE = " + json.dumps(CHU_DE, ensure_ascii=False) + ";\n"
          "window.TRUYEN = " + json.dumps(ds, ensure_ascii=False, separators=(",", ":")) + ";\n")
    (APP / "du-lieu.js").write_text(js, encoding="utf-8")
    print("du-lieu.js xong | cau thieu giong:", thieu)


if __name__ == "__main__":
    main()
