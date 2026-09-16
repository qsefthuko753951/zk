#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 PDF 逐页渲染成 WebP 图片，用于作品集的轮播 / 无限画布展示。

用法：
    python tools/pdf_to_webp.py 文档.pdf                 # 默认宽度 1600px、质量 82
    python tools/pdf_to_webp.py 文档.pdf --name robocon  # 指定输出前缀
    python tools/pdf_to_webp.py 文档.pdf --w 1280 --q 75

输出：images/<前缀>-01.webp / -02.webp ...
依赖：pip install pymupdf（或本机有 cwebp 也可，脚本会自动选引擎）
"""
import argparse
import os
import re
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(ROOT, "images")


def slugify(text: str) -> str:
    text = re.sub(r"[\\/:*?\"<>|\s]+", "-", text).strip("-")
    return text or "doc"


def render_with_pymupdf(pdf_path: str, prefix: str, width: int, quality: int):
    try:
        import pymupdf
    except ImportError:
        try:
            import fitz as pymupdf  # 旧版兼容
        except ImportError:
            return None, "未安装 pymupdf（pip install pymupdf）"

    from PIL import Image
    import io

    doc = pymupdf.open(pdf_path)
    outs = []
    for i, page in enumerate(doc, start=1):
        zoom = width / page.rect.width
        pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), alpha=False)
        img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
        dst = os.path.join(IMG_DIR, "%s-%02d.webp" % (prefix, i))
        img.save(dst, "WEBP", quality=quality, method=6)
        outs.append((dst, os.path.getsize(dst)))
    doc.close()
    return outs, None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf", help="PDF 文件路径")
    ap.add_argument("--name", default="", help="输出文件名前缀，默认取 PDF 文件名")
    ap.add_argument("--w", type=int, default=1600, help="输出宽度像素，默认 1600")
    ap.add_argument("--q", type=int, default=82, help="WebP 质量 1-100，默认 82")
    args = ap.parse_args()

    pdf_path = args.pdf if os.path.isabs(args.pdf) else os.path.join(ROOT, args.pdf)
    if not os.path.exists(pdf_path):
        print("找不到 PDF：%s" % pdf_path)
        return 1

    prefix = args.name or slugify(os.path.splitext(os.path.basename(pdf_path))[0])
    outs, err = render_with_pymupdf(pdf_path, prefix, args.w, args.q)
    if err:
        print(err)
        return 1

    total = sum(s for _, s in outs)
    for dst, size in outs:
        print("   %-34s %7.1f KB" % (os.path.basename(dst), size / 1024))
    print("\n完成 %d 页，合计 %.2f MB" % (len(outs), total / 1024 / 1024))
    print("页面前缀：%s（HTML 里用 images/%s-01.webp 起引用）" % (prefix, prefix))
    return 0


if __name__ == "__main__":
    sys.exit(main())
