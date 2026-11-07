#!/bin/sh
# Thu giọng Việt từng lượt: mỗi câu thử 1 lần, nghỉ 3 phút, lặp tới khi đủ (tối đa 60 lượt ~ 4-5 giờ)
NGUON="J:/_Apps/ai-video-producer/du-an/2026-11-07-khac-truyen-tranh-dao-duc-80"
for i in $(seq 1 60); do
  python xay-app.py --nguon "$NGUON" --nn vn --song-song 1 --so-lan 1 2>&1 | grep -v "^  loi" | tail -2
  THIEU=$(python xay-app.py --nguon "$NGUON" --nn vn --song-song 1 --so-lan 0 2>/dev/null | grep -o "thieu giong: [0-9]*" | grep -o "[0-9]*")
  echo "luot $i: con thieu $THIEU cau"
  [ "$THIEU" = "0" ] && exit 0
  sleep 180
done
