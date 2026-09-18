#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 images/ 下的图片批量转成 WebP，并自动打开站点开关。

用法（任选其一，本机有 Pillow 或 cwebp 任一即可）：
    python tools/convert_webp.py            # 默认质量 82，保留原图
    python tools/convert_webp.py --q 75     # 指定质量
    python tools/convert_webp.py --replace  # 转换后删除原图（谨慎）

转换完成后脚本会把 assets/js/config.js 里的 webp 置为 true，
全站带 data-webp 的图片即自动切换；若某些图没有对应 WebP，则继续用原图，不会裂。
"""
import argparse
import os
import re
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(ROOT, "images")
CONFIG = os.path.join(ROOT, "assets", "js", "config.js")
EXTS = (".jpg", ".jpeg", ".png")
# 跳过规则：favicon 等站点图标（转 WebP 反而更大，且老浏览器需要 PNG 兜底），
# 以及体积过小的图标类图片（转完通常不划算）
SKIP_PREFIX = ("favicon", "apple-touch-icon")
MIN_SIZE = 12 * 1024  # 小于 12 KB 直接跳过


def has_cwebp() -> bool:
    return shutil.which("cwebp") is not None


def convert_with_pillow(src: str, dst: str, quality: int) -> bool:
    try:
        from PIL import Image  # noqa
    except ImportError:
        return False
    try:
        with Image.open(src) as im:
            im = im.convert("RGB") if im.mode not in ("RGB", "RGBA") else im
            im.save(dst, "WEBP", quality=quality, method=6)
        return True
    except Exception as exc:  # noqa
        print("   Pillow 失败：%s" % exc)
        return False


def convert_with_cwebp(src: str, dst: str, quality: int) -> bool:
    try:
        subprocess.run(
            ["cwebp", "-q", str(quality), "-mt", src, "-o", dst],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        return True
    except Exception:
        return False


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--q", type=int, default=82, help="WebP 质量 1-100，默认 82")
    ap.add_argument("--replace", action="store_true", help="转换后删除原图")
    args = ap.parse_args()

    if not os.path.isdir(IMG_DIR):
        print("找不到 images/ 目录：%s" % IMG_DIR)
        return 1

    engine = "cwebp" if has_cwebp() else "pillow"
    if engine == "pillow":
        try:
            import PIL  # noqa
        except ImportError:
            print("未检测到 Pillow 或 cwebp。请先安装其一：")
            print("  pip install Pillow")
            print("  或下载 cwebp：https://developers.google.com/speed/webp/download")
            return 1
    print("使用引擎：%s，质量：%d" % (engine, args.q))

    files = [f for f in sorted(os.listdir(IMG_DIR)) if f.lower().endswith(EXTS)]
    # 过滤：图标类 / 体积过小
    keep = []
    for name in files:
        if name.lower().startswith(SKIP_PREFIX):
            print("   跳过（站点图标）：%s" % name)
            continue
        if os.path.getsize(os.path.join(IMG_DIR, name)) < MIN_SIZE:
            print("   跳过（小于 12 KB）：%s" % name)
            continue
        keep.append(name)
    files = keep

    if not files:
        print("images/ 下没有需要转换的图片")
        return 0

    saved = 0
    done = 0
    for name in files:
        src = os.path.join(IMG_DIR, name)
        dst = os.path.join(IMG_DIR, os.path.splitext(name)[0] + ".webp")
        before = os.path.getsize(src)
        ok = convert_with_cwebp(src, dst, args.q) if engine == "cwebp" else convert_with_pillow(src, dst, args.q)
        if not ok or not os.path.exists(dst):
            print("   跳过（转换失败）：%s" % name)
            continue
        after = os.path.getsize(dst)
        saved += max(0, before - after)
        done += 1
        print("   %-46s %7.1f KB -> %7.1f KB" % (name, before / 1024, after / 1024))
        if args.replace:
            os.remove(src)

    # 打开站点开关
    if done and os.path.exists(CONFIG):
        with open(CONFIG, "r", encoding="utf-8") as f:
            text = f.read()
        text = re.sub(r"webp:\s*(true|false)", "webp: true", text, count=1)
        with open(CONFIG, "w", encoding="utf-8") as f:
            f.write(text)
        print("已开启 WebP：assets/js/config.js -> webp: true")

    print("\n完成 %d/%d 张，累计节省约 %.1f MB" % (done, len(files), saved / 1024 / 1024))
    return 0


if __name__ == "__main__":
    sys.exit(main())
