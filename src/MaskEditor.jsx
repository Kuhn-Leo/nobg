import { useCallback, useEffect, useRef, useState } from "react";

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/* Magic Brush 蒙版编辑器
   原理：三层像素模型 ——
   - orig：原图 RGB（恢复模式直接取原图像素）
   - base：模型输出的 alpha（自动区域的透明度）
   - edit：用户笔刷三态（0=自动 / -1=擦除 / +1=恢复）
   最终 alpha = edit==-1 ? 0 : edit==1 ? 255 : base */
export default function MaskEditor({ originalUrl, cutoutUrl, onApply, onCancel, t }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const S = useRef(null); // { w, h, ctx, orig, base, edit, strokes }
  const painting = useRef(false);
  const lastPt = useRef(null);
  const [mode, setMode] = useState(-1); // -1 擦除 | 1 恢复
  const [size, setSize] = useState(40);
  const [canUndo, setCanUndo] = useState(false);
  const [ready, setReady] = useState(false);
  const [cursor, setCursor] = useState(null);
  const sizeRef = useRef(size);
  const modeRef = useRef(mode);
  sizeRef.current = size;
  modeRef.current = mode;

  /* ---------- 渲染 ---------- */
  const renderRegion = useCallback((x0, y0, x1, y1) => {
    const s = S.current;
    if (!s) return;
    x0 = Math.max(0, Math.floor(x0));
    y0 = Math.max(0, Math.floor(y0));
    x1 = Math.min(s.w, Math.ceil(x1));
    y1 = Math.min(s.h, Math.ceil(y1));
    if (x1 <= x0 || y1 <= y0) return;
    const patch = new ImageData(x1 - x0, y1 - y0);
    const d = patch.data;
    const o = s.orig;
    const a = s.base;
    const e = s.edit;
    for (let y = y0; y < y1; y++) {
      let pi = (y - y0) * (x1 - x0) * 4;
      let si = (y * s.w + x0) * 4;
      let mi = y * s.w + x0;
      for (let x = x0; x < x1; x++, pi += 4, si += 4, mi++) {
        const st = e[mi];
        d[pi] = o[si];
        d[pi + 1] = o[si + 1];
        d[pi + 2] = o[si + 2];
        d[pi + 3] = st === -1 ? 0 : st === 1 ? 255 : a[mi];
      }
    }
    s.ctx.putImageData(patch, x0, y0);
  }, []);

  const stampEdit = (cx, cy, r, m) => {
    const s = S.current;
    const x0 = Math.max(0, Math.floor(cx - r));
    const y0 = Math.max(0, Math.floor(cy - r));
    const x1 = Math.min(s.w, Math.ceil(cx + r));
    const y1 = Math.min(s.h, Math.ceil(cy + r));
    const r2 = r * r;
    for (let y = y0; y < y1; y++) {
      const dy = y - cy;
      for (let x = x0; x < x1; x++) {
        const dx = x - cx;
        if (dx * dx + dy * dy <= r2) s.edit[y * s.w + x] = m;
      }
    }
    return [x0, y0, x1, y1];
  };

  const stampStrokePoint = (px, py) => {
    const s = S.current;
    const last = s.strokes[s.strokes.length - 1];
    const [bx0, by0, bx1, by1] = stampEdit(px, py, last.r, last.mode);
    s.dirty = s.dirty
      ? [Math.min(s.dirty[0], bx0), Math.min(s.dirty[1], by0), Math.max(s.dirty[2], bx1), Math.max(s.dirty[3], by1)]
      : [bx0, by0, bx1, by1];
  };

  /* ---------- 笔刷 ---------- */
  const toCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return [
      (e.clientX - rect.left) * (canvas.width / rect.width),
      (e.clientY - rect.top) * (canvas.height / rect.height),
    ];
  };

  const onPointerDown = (e) => {
    if (!S.current) return;
    e.preventDefault();
    canvasRef.current.setPointerCapture(e.pointerId);
    const [x, y] = toCanvasCoords(e);
    const s = S.current;
    s.strokes.push({ r: sizeRef.current / 2, mode: modeRef.current, pts: [] });
    painting.current = true;
    lastPt.current = [x, y];
    stampStrokePoint(x, y);
    renderRegion(...s.dirty);
    s.dirty = null;
    setCanUndo(true);
  };

  const onPointerMove = (e) => {
    if (!S.current) return;
    // 笔刷光标跟随（显示坐标）
    const wrapRect = wrapRef.current.getBoundingClientRect();
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const dispR = (sizeRef.current / 2) * (rect.width / canvas.width);
    setCursor({ x: e.clientX - wrapRect.left, y: e.clientY - wrapRect.top, r: dispR });

    if (!painting.current) return;
    e.preventDefault();
    const [x, y] = toCanvasCoords(e);
    const s = S.current;
    const last = s.strokes[s.strokes.length - 1];
    const [lx, ly] = lastPt.current;
    const dist = Math.hypot(x - lx, y - ly);
    const step = Math.max(last.r * 0.35, 2);
    const steps = Math.max(1, Math.ceil(dist / step));
    for (let i = 1; i <= steps; i++) {
      stampStrokePoint(lx + ((x - lx) * i) / steps, ly + ((y - ly) * i) / steps);
    }
    renderRegion(...s.dirty);
    s.dirty = null;
    lastPt.current = [x, y];
  };

  const onPointerUp = () => {
    painting.current = false;
    lastPt.current = null;
  };

  const undo = () => {
    const s = S.current;
    if (!s || !s.strokes.length) return;
    s.strokes.pop();
    s.edit.fill(0);
    for (const st of s.strokes) {
      for (const [px, py] of st.pts) stampEdit(px, py, st.r, st.mode);
    }
    renderRegion(0, 0, s.w, s.h);
    setCanUndo(s.strokes.length > 0);
  };

  const apply = () => {
    const s = S.current;
    if (!s) return;
    renderRegion(0, 0, s.w, s.h);
    canvasRef.current.toBlob((blob) => {
      if (blob) onApply(URL.createObjectURL(blob));
    }, "image/png");
  };

  /* ---------- 初始化 ---------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      const [orig, cut] = await Promise.all([loadImage(originalUrl), loadImage(cutoutUrl)]);
      if (!alive) return;
      const w = orig.naturalWidth;
      const h = orig.naturalHeight;
      const oc = document.createElement("canvas");
      oc.width = w;
      oc.height = h;
      const octx = oc.getContext("2d", { willReadFrequently: true });
      octx.drawImage(orig, 0, 0);
      const cc = document.createElement("canvas");
      cc.width = w;
      cc.height = h;
      const cctx = cc.getContext("2d", { willReadFrequently: true });
      cctx.drawImage(cut, 0, 0);
      const origData = octx.getImageData(0, 0, w, h).data;
      const cutData = cctx.getImageData(0, 0, w, h).data;
      const base = new Uint8ClampedArray(w * h);
      for (let i = 0; i < w * h; i++) base[i] = cutData[i * 4 + 3];
      const canvas = canvasRef.current;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      S.current = { w, h, ctx, orig: origData, base, edit: new Int8Array(w * h), strokes: [], dirty: null };
      renderRegion(0, 0, w, h);
      setReady(true);
    })();
    return () => {
      alive = false;
      S.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalUrl, cutoutUrl]);

  return (
    <div className="mask-editor">
      <div className="me-toolbar">
        <button
          className={`me-mode me-erase ${mode === -1 ? "me-mode-active" : ""}`}
          onClick={() => setMode(-1)}
        >
          ◌ {t.brushErase}
        </button>
        <button
          className={`me-mode me-restore ${mode === 1 ? "me-mode-active" : ""}`}
          onClick={() => setMode(1)}
        >
          ● {t.brushRestore}
        </button>
        <label className="me-size">
          <span>{t.brushSize}</span>
          <input
            type="range"
            min="10"
            max="160"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          />
        </label>
        <button className="me-btn" onClick={undo} disabled={!canUndo}>
          ↩ {t.undoEdit}
        </button>
        <span className="me-spacer" />
        <button className="me-btn" onClick={onCancel}>
          {t.cancelEdit}
        </button>
        <button className="me-btn me-apply" onClick={apply} disabled={!ready}>
          ✓ {t.applyEdit}
        </button>
      </div>
      <div className="me-canvas-wrap" ref={wrapRef}>
        <canvas
          ref={canvasRef}
          className="me-canvas"
          style={{ touchAction: "none", cursor: "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        />
        {cursor && (
          <div
            className="me-cursor"
            style={{
              left: cursor.x - cursor.r,
              top: cursor.y - cursor.r,
              width: cursor.r * 2,
              height: cursor.r * 2,
              borderColor: mode === -1 ? "#ef4444" : "#22c55e",
            }}
          />
        )}
      </div>
    </div>
  );
}
