import { useState, useEffect, useRef, useMemo } from "react";
const STORAGE_KEY = "gym_tracker_v2";
const ROUTINE_KEY = "gym_routine_v1";
const OVERRIDES_KEY = "gym_week_overrides";
const ASSISTANT_MESSAGES_KEY = "gym_assistant_messages";
const TEMPLATES_KEY = "gym_templates_v1";

const DEFAULT_ROUTINE = [
  { day: "Lun", label: "Push A", sub: "Fuerza pectoral", duration: "~60 min", blocks: [
    { name: "Fuerza", exercises: [
      { name: "Press banca plano", sets: 5, reps: "3-5", rpe: "8-9", rest: "3-4 min", anchor: true, muscle: "Pecho", note: "Cuando completes 5x5 limpio, sube 2.5 kg" },
    ]},
    { name: "Hipertrofia pecho", exercises: [
      { name: "Press inclinado mancuernas", sets: 3, reps: "8-10", rpe: "7-8", rest: "2 min", muscle: "Pecho", note: "Rango completo, no bloquear codos" },
      { name: "Aperturas en polea baja", sets: 3, reps: "12-15", rpe: "7", rest: "90 s", muscle: "Pecho", note: "Cable cruzado, foco en aduccion final" },
    ]},
    { name: "Hombro y triceps", exercises: [
      { name: "Press militar barra", sets: 3, reps: "6-8", rpe: "7-8", rest: "2 min", muscle: "Hombro", note: "De pie o sentado, barra libre" },
      { name: "Elevaciones laterales cable", sets: 3, reps: "15-20", rpe: "7", rest: "60 s", muscle: "Hombro", note: "Unilateral, codo ligeramente flexionado" },
      { name: "Extension triceps polea alta", sets: 3, reps: "12-15", rpe: "7", rest: "60 s", muscle: "Tríceps", note: "Cuerda o barra recta" },
    ]},
  ]},
  { day: "Mar", label: "Pull A", sub: "Espalda vertical", duration: "~55 min + Run Z2", blocks: [
    { name: "Fuerza traccion vertical", exercises: [
      { name: "Dominadas lastradas", sets: 4, reps: "4-6", rpe: "8", rest: "3 min", anchor: true, muscle: "Espalda", note: "Alt: jalon agarre prono con carga progresiva" },
    ]},
    { name: "Hipertrofia espalda", exercises: [
      { name: "Remo pecho apoyado maquina", sets: 3, reps: "8-10", rpe: "7-8", rest: "2 min", muscle: "Espalda" },
      { name: "Pullover en polea", sets: 3, reps: "12-15", rpe: "7", rest: "90 s", muscle: "Espalda" },
    ]},
    { name: "Biceps y rotadores", exercises: [
      { name: "Curl barra EZ", sets: 3, reps: "8-10", rpe: "7", rest: "90 s", muscle: "Bíceps" },
      { name: "Face pull en polea", sets: 3, reps: "15-20", rpe: "6-7", rest: "60 s", muscle: "Hombro" },
    ]},
  ]},
  { day: "Mie", label: "Descanso", sub: "Recuperacion", duration: "Movilidad 10-15 min", rest: true, blocks: [] },
  { day: "Jue", label: "Push B", sub: "Volumen pectoral + hombro", duration: "~60 min", blocks: [
    { name: "Fuerza pecho variante", exercises: [
      { name: "Press banca inclinado barra", sets: 4, reps: "6-8", rpe: "7-8", rest: "2-3 min", muscle: "Pecho" },
    ]},
    { name: "Hipertrofia pecho bajo y medio", exercises: [
      { name: "Press en maquina pecho", sets: 3, reps: "10-12", rpe: "7", rest: "90 s", muscle: "Pecho" },
      { name: "Fondos lastrados paralelas", sets: 3, reps: "8-10", rpe: "7-8", rest: "2 min", muscle: "Pecho" },
    ]},
    { name: "Hombro lateral y triceps", exercises: [
      { name: "Press Arnold mancuernas", sets: 3, reps: "10-12", rpe: "7", rest: "90 s", muscle: "Hombro" },
      { name: "Elevaciones laterales mancuernas", sets: 3, reps: "15-20", rpe: "7", rest: "60 s", muscle: "Hombro" },
      { name: "Press frances mancuerna", sets: 3, reps: "10-12", rpe: "7", rest: "90 s", muscle: "Tríceps" },
    ]},
  ]},
  { day: "Vie", label: "Pull B", sub: "Espalda horizontal + peso muerto", duration: "~60 min", blocks: [
    { name: "Fuerza traccion horizontal", exercises: [
      { name: "Peso muerto convencional", sets: 4, reps: "4-5", rpe: "8", rest: "3-4 min", anchor: true, muscle: "Posterior", note: "RPE max 8, el sabado toca sentadilla" },
    ]},
    { name: "Hipertrofia espalda horizontal", exercises: [
      { name: "Remo con barra Pendlay", sets: 3, reps: "6-8", rpe: "7-8", rest: "2 min", muscle: "Espalda" },
      { name: "Remo polea baja agarre neutro", sets: 3, reps: "10-12", rpe: "7", rest: "90 s", muscle: "Espalda" },
    ]},
    { name: "Biceps y posterior hombro", exercises: [
      { name: "Curl martillo mancuernas", sets: 3, reps: "10-12", rpe: "7", rest: "90 s", muscle: "Bíceps" },
      { name: "Pajaro mancuernas o polea", sets: 3, reps: "15-20", rpe: "6-7", rest: "60 s", muscle: "Hombro" },
    ]},
  ]},
  { day: "Sab", label: "Legs A+B", sub: "Sesion fusionada", duration: "~75 min", blocks: [
    { name: "Dominante rodilla (Legs A)", exercises: [
      { name: "Sentadilla barra libre", sets: 4, reps: "5-6", rpe: "8", rest: "3 min", anchor: true, muscle: "Cuádriceps", note: "Siempre primero" },
      { name: "Prensa inclinada pies altos", sets: 3, reps: "10-12", rpe: "7", rest: "2 min", muscle: "Cuádriceps" },
      { name: "Curl femoral tumbado maquina", sets: 3, reps: "10-12", rpe: "7", rest: "90 s", muscle: "Posterior" },
    ]},
    { name: "Dominante cadera (Legs B)", exercises: [
      { name: "Hip thrust banco con barra", sets: 3, reps: "8-10", rpe: "7-8", rest: "2 min", muscle: "Posterior" },
      { name: "RDL mancuernas o barra", sets: 3, reps: "8-10", rpe: "7", rest: "2 min", muscle: "Posterior" },
    ]},
    { name: "Accesorio y gemelo", exercises: [
      { name: "Extension cuadriceps maquina", sets: 2, reps: "15-20", rpe: "6-7", rest: "60 s", muscle: "Cuádriceps" },
      { name: "Elevacion de talones de pie", sets: 3, reps: "12-15", rpe: "7", rest: "60 s", muscle: "Gemelo" },
    ]},
  ]},
  { day: "Dom", label: "Trail Z2", sub: "Recuperacion activa", duration: "45-60 min", rest: true, blocks: [] },
];

function loadData() {
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (current) {
      const migrated = {
        ...current,
        sessions: current.sessions.map(s => ({
          ...s,
          muscle: s.muscle || LEGACY_MUSCLE_MAP[s.exercise] || "Otro"
        }))
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
    const v1 = JSON.parse(localStorage.getItem("gym_tracker_v1"));
    if (v1) { localStorage.setItem(STORAGE_KEY, JSON.stringify(v1)); return v1; }
    return { sessions: [] };
  } catch { return { sessions: [] }; }
}
function saveData(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
function loadRoutine() {
  try { return JSON.parse(localStorage.getItem(ROUTINE_KEY)) || DEFAULT_ROUTINE; }
  catch { return DEFAULT_ROUTINE; }
}
function saveRoutine(r) { localStorage.setItem(ROUTINE_KEY, JSON.stringify(r)); }
function formatDate(iso) { return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }); }
function calcVolume(sets) { return sets.reduce((a, s) => a + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0); }
function getLastSession(sessions, exercise) {
  return [...sessions].filter(s => s.exercise === exercise).sort((a, b) => new Date(b.date) - new Date(a.date))[0];
}
function getWeekKey(dayIdx) {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${week}-${dayIdx}`;
}

async function fetchAI(history, exercise, prompt) {
  const lines = history.length
    ? history.slice(-6).map(s => formatDate(s.date) + ": " + s.sets.map(x => x.weight + "kg x" + x.reps).join(", ") + " Vol:" + calcVolume(s.sets).toFixed(0) + "kg").join("\n")
    : "Sin historial.";
  const msg = prompt
    ? "Ejercicio: " + exercise + "\nHistorial:\n" + lines + "\nPregunta: " + prompt
    : "Ejercicio: " + exercise + "\nHistorial:\n" + lines + "\nDame recomendaciones concretas para la proxima sesion.";
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: msg }),
  });
  const data = await res.json();
  return data.text || data.error || "Error al conectar.";
}

const Icon = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

function Sparkline({ values }) {
  if (values.length < 2) return null;
  const W = 56, H = 22;
  const max = Math.max(...values), min = Math.min(...values), range = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * W},${H - ((v - min) / range) * (H - 4) - 2}`).join(" ");
  const last = pts.split(" ").at(-1).split(",");
  return (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="3" fill="#f59e0b" />
    </svg>
  );
}

function AIPanel({ exercise, sessions, onClose }) {
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [customQ, setCustomQ] = useState("");
  const history = sessions.filter(s => s.exercise === exercise);
  async function ask(prompt) {
    setLoading(true); setResponse("");
    try { setResponse(await fetchAI(history, exercise, prompt || "")); }
    catch { setResponse("Error de conexion."); }
    setLoading(false);
  }
  useEffect(() => { ask(); }, []);
  const chips = ["Cuando subir peso?", "Riesgo de lesion?", "Que variante hacer?"];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)" }} />
      <div style={{ position: "relative", background: "#111827", borderRadius: "24px 24px 0 0", padding: "0 20px 36px", maxHeight: "80vh", overflowY: "auto", animation: "slideUp .28s cubic-bezier(.32,.72,0,1)" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 10px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.18)" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🤖</div>
          <div>
            <div style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>IA Entrenador</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "Syne, sans-serif" }}>{exercise}</div>
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px 16px", fontSize: 14, lineHeight: 1.8, color: "#e5e7eb", marginBottom: 16, minHeight: 80, border: "1px solid rgba(255,255,255,0.08)" }}>
          {loading ? <span style={{ color: "#6b7280" }}>Analizando...</span> : response}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {chips.map(q => (
            <button key={q} onClick={() => ask(q)} disabled={loading} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 99, padding: "6px 14px", fontSize: 12, color: "#d1d5db", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{q}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input placeholder="Pregunta lo que quieras..." value={customQ} onChange={e => setCustomQ(e.target.value)} onKeyDown={e => e.key === "Enter" && customQ && ask(customQ)}
            style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
          <button onClick={() => customQ ? ask(customQ) : ask()} disabled={loading}
            style={{ width: 50, height: 50, borderRadius: 12, border: "none", background: loading ? "rgba(255,255,255,0.1)" : "#f59e0b", color: "#111", fontSize: 18, cursor: "pointer" }}>→</button>
        </div>
      </div>
    </div>
  );
}

function ExerciseEditPanel({ exercise, onSave, onClose }) {
  const [form, setForm] = useState({ ...exercise });
  function update(field, val) { setForm(f => ({ ...f, [field]: val })); }
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }} />
      <div style={{ position: "relative", background: "#111827", borderRadius: "24px 24px 0 0", padding: "0 20px 36px", maxHeight: "85vh", overflowY: "auto", animation: "slideUp .25s cubic-bezier(.32,.72,0,1)" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 8px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.15)" }} />
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Editar ejercicio</div>
        <label style={lbl}>Nombre</label>
        <input value={form.name} onChange={e => update("name", e.target.value)} style={{ ...fld, marginBottom: 12 }} />
        <label style={lbl}>Grupo muscular</label>
        <select value={form.muscle || ""} onChange={e => update("muscle", e.target.value)} style={{ ...fld, marginBottom: 12 }}>
          <option value="">Seleccionar...</option>
          {MUSCLE_GROUPS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={lbl}>Series</label>
            <input type="number" value={form.sets} onChange={e => update("sets", e.target.value)} style={fld} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={lbl}>Reps</label>
            <input value={form.reps} onChange={e => update("reps", e.target.value)} style={fld} placeholder="ej. 6-8" />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={lbl}>RPE</label>
            <input value={form.rpe} onChange={e => update("rpe", e.target.value)} style={fld} placeholder="ej. 7-8" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={lbl}>Descanso</label>
            <input value={form.rest} onChange={e => update("rest", e.target.value)} style={fld} placeholder="ej. 2 min" />
          </div>
        </div>
        <label style={lbl}>Nota (opcional)</label>
        <input value={form.note || ""} onChange={e => update("note", e.target.value)} style={{ ...fld, marginBottom: 12 }} placeholder="Indicacion tecnica..." />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, padding: "12px 14px", background: "rgba(255,255,255,0.05)", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.1)" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f9fafb" }}>Ejercicio ancla</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Ejercicio principal de la sesion</div>
          </div>
          <button onClick={() => update("anchor", !form.anchor)} style={{ width: 44, height: 26, borderRadius: 99, border: "none", cursor: "pointer", background: form.anchor ? "#f59e0b" : "rgba(255,255,255,0.15)", position: "relative", transition: "background .2s" }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: form.anchor ? 21 : 3, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
          </button>
        </div>
        <button onClick={() => onSave(form)} style={{ width: "100%", padding: 15, borderRadius: 14, border: "none", background: "#f59e0b", color: "#111", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          Guardar cambios
        </button>
      </div>
    </div>
  );
}

function Stepper({ value, onChange, step, min, unit }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);
  const val = parseFloat(value) || 0;
  const s = step || 1;
  const m = min || 0;
  function startEdit() { setDraft(val === 0 ? "" : String(val)); setEditing(true); setTimeout(() => inputRef.current && inputRef.current.focus(), 0); }
  function commitEdit() { const p = parseFloat(draft); if (!isNaN(p) && p >= m) onChange(String(p)); setEditing(false); }
  return (
    <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.05)", borderRadius: 12, border: editing ? "1.5px solid #f59e0b" : "1.5px solid rgba(255,255,255,0.1)", overflow: "hidden", transition: "border-color .15s" }}>
      <button onClick={() => onChange(String(Math.max(m, parseFloat((val - s).toFixed(2)))))} style={{ width: 36, height: 46, border: "none", background: "none", fontSize: 18, color: "#64748b", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
      <div onClick={startEdit} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 0, cursor: "text" }}>
        {editing
          ? <input ref={inputRef} type="number" value={draft} onChange={e => setDraft(e.target.value)} onBlur={commitEdit} onKeyDown={e => e.key === "Enter" && commitEdit()} style={{ width: "100%", textAlign: "center", border: "none", background: "transparent", fontSize: 16, fontWeight: 700, color: "#f9fafb", outline: "none", padding: 0, fontFamily: "'DM Sans', sans-serif", WebkitAppearance: "none" }} />
          : <span style={{ fontSize: 16, fontWeight: 700, color: "#f9fafb", lineHeight: 1 }}>{val || "0"}</span>
        }
        <span style={{ fontSize: 9, color: editing ? "#f59e0b" : "#64748b", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>{editing ? "escribe" : unit}</span>
      </div>
      <button onClick={() => onChange(String(parseFloat((val + s).toFixed(2))))} style={{ width: 36, height: 46, border: "none", background: "none", fontSize: 18, color: "#f9fafb", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>+</button>
    </div>
  );
}

function SliderInput({ value, onChange, step, min, max, unit }) {
  const values = useMemo(() => {
    const arr = [];
    const n = Math.round((max - min) / step);
    for (let i = 0; i <= n; i++) arr.push(Math.round((min + i * step) * 10000) / 10000);
    return arr;
  }, [min, max, step]);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const startYRef = useRef(0);

  const ITEM_H = 36;
  const HALF = 2;

  const currentIdx = useMemo(() => {
    const v = parseFloat(value);
    if (isNaN(v)) return 0;
    return Math.max(0, Math.min(values.length - 1, Math.round((v - min) / step)));
  }, [value, values, min, step]);

  function goToIdx(raw) {
    const i = Math.max(0, Math.min(values.length - 1, Math.round(raw)));
    onChange(String(values[i]));
  }

  function onTouchStart(e) { startYRef.current = e.touches[0].clientY; setDragging(true); setDragOffset(0); }
  function onTouchMove(e) { e.preventDefault(); setDragOffset(e.touches[0].clientY - startYRef.current); }
  function onTouchEnd() { goToIdx(currentIdx - Math.round(dragOffset / ITEM_H)); setDragOffset(0); setDragging(false); }
  function onWheel(e) { e.preventDefault(); goToIdx(currentIdx + (e.deltaY > 0 ? 1 : -1)); }

  function startEdit() {
    const v = parseFloat(value);
    setDraft(isNaN(v) ? "" : String(v));
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function commitEdit() {
    const p = parseFloat(draft);
    if (!isNaN(p)) goToIdx(Math.round((p - min) / step));
    setEditing(false);
    setDraft("");
  }

  const topY = HALF * ITEM_H - currentIdx * ITEM_H + dragOffset;

  return (
    <div
      style={{ position: "relative", height: ITEM_H * (HALF * 2 + 1), overflow: "hidden", touchAction: "none", userSelect: "none", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)" }}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onWheel={onWheel}
    >
      <div style={{ position: "absolute", top: ITEM_H * HALF, left: 6, right: 6, height: ITEM_H, background: "rgba(245,158,11,0.12)", borderRadius: 8, border: "1px solid rgba(245,158,11,0.25)", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: ITEM_H * HALF, background: "linear-gradient(180deg, rgba(17,24,39,0.92), transparent)", pointerEvents: "none", zIndex: 2 }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: ITEM_H * HALF, background: "linear-gradient(0deg, rgba(17,24,39,0.92), transparent)", pointerEvents: "none", zIndex: 2 }} />
      <div style={{ position: "absolute", left: 0, right: 0, transform: `translateY(${topY}px)`, transition: dragging ? "none" : "transform .18s cubic-bezier(.32,.72,0,1)", willChange: "transform" }}>
        {values.map((v, i) => {
          const dist = Math.abs(i - currentIdx);
          return (
            <div key={i} onClick={() => i === currentIdx ? startEdit() : goToIdx(i)}
              style={{ height: ITEM_H, display: "flex", alignItems: "center", justifyContent: "center", fontSize: dist === 0 ? 19 : 13, fontWeight: dist === 0 ? 800 : 400, color: dist === 0 ? "#f9fafb" : dist === 1 ? "#64748b" : "#374151", opacity: dist > 2 ? 0 : 1 }}>
              {editing && i === currentIdx
                ? <input ref={inputRef} type="number" value={draft} onChange={e => setDraft(e.target.value)} onBlur={commitEdit} onKeyDown={e => e.key === "Enter" && commitEdit()}
                    style={{ width: 60, textAlign: "center", border: "none", background: "transparent", fontSize: 19, fontWeight: 800, color: "#f59e0b", outline: "none", fontFamily: "'DM Sans', sans-serif", WebkitAppearance: "none" }} />
                : v
              }
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", bottom: 3, width: "100%", textAlign: "center", fontSize: 8, color: "#f59e0b", textTransform: "uppercase", letterSpacing: 0.8, zIndex: 3, pointerEvents: "none" }}>{unit}</div>
    </div>
  );
}

const RIR_OPTIONS = ["0", "1", "2", "3", "4+"];
function SetRow({ set, idx, onChange, onRemove, isOnly }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 14, padding: "10px 12px", marginBottom: 8, border: "1.5px solid rgba(255,255,255,0.1)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ width: 24, height: 24, borderRadius: 7, background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#111", flexShrink: 0 }}>{idx + 1}</div>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", flex: 1 }}>Serie {idx + 1}</span>
        {!isOnly && <button onClick={() => onRemove(idx)} style={{ background: "none", border: "none", cursor: "pointer", color: "#d1d5db", fontSize: 15, padding: "0 2px" }}>✕</button>}
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Peso</div>
          <SliderInput value={set.weight} onChange={v => onChange(idx, "weight", v)} step={1.25} min={0} max={200} unit="kg" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Reps</div>
          <SliderInput value={set.reps} onChange={v => onChange(idx, "reps", v)} step={1} min={1} max={30} unit="reps" />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>RIR (reps en reserva)</div>
        <div style={{ display: "flex", gap: 6 }}>
          {RIR_OPTIONS.map(r => (
            <button key={r} onClick={() => onChange(idx, "rir", r)} style={{ flex: 1, padding: "7px 0", borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all .12s", background: set.rir === r ? "#f59e0b" : "rgba(255,255,255,0.06)", color: set.rir === r ? "#111" : "#64748b", border: set.rir === r ? "none" : "1.5px solid rgba(255,255,255,0.1)" }}>{r}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

const fld = { width: "100%", padding: "11px 12px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.1)", fontSize: 15, fontFamily: "'DM Sans', sans-serif", background: "rgba(255,255,255,0.06)", color: "#f9fafb", WebkitAppearance: "none" };
const lbl = { display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 };

const MUSCLE_GROUPS = ["Pecho", "Espalda", "Hombro", "Tríceps", "Bíceps", "Cuádriceps", "Posterior", "Gemelo", "Glúteo", "Aductores", "Abdomen", "Lumbar", "Antebrazo", "Trapecio", "Cardio", "Otro"];
const DASHBOARD_MUSCLES = ["Pecho", "Espalda", "Hombro", "Bíceps", "Tríceps", "Cuádriceps", "Posterior", "Gemelo"];

const LEGACY_MUSCLE_MAP = {
  "Press banca plano": "Pecho", "Press inclinado mancuernas": "Pecho", "Aperturas en polea baja": "Pecho", "Press banca inclinado barra": "Pecho", "Press en maquina pecho": "Pecho", "Fondos lastrados paralelas": "Pecho",
  "Dominadas lastradas": "Espalda", "Remo pecho apoyado maquina": "Espalda", "Pullover en polea": "Espalda", "Remo con barra Pendlay": "Espalda", "Remo polea baja agarre neutro": "Espalda",
  "Press militar barra": "Hombro", "Press Arnold mancuernas": "Hombro", "Elevaciones laterales cable": "Hombro", "Elevaciones laterales mancuernas": "Hombro", "Face pull en polea": "Hombro", "Pajaro mancuernas o polea": "Hombro",
  "Curl barra EZ": "Bíceps", "Curl martillo mancuernas": "Bíceps",
  "Extension triceps polea alta": "Tríceps", "Press frances mancuerna": "Tríceps",
  "Sentadilla barra libre": "Cuádriceps", "Prensa inclinada pies altos": "Cuádriceps", "Extension cuadriceps maquina": "Cuádriceps",
  "Peso muerto convencional": "Posterior", "RDL mancuernas o barra": "Posterior", "Curl femoral tumbado maquina": "Posterior", "Hip thrust banco con barra": "Posterior",
  "Elevacion de talones de pie": "Gemelo",
};

const RECOMMENDED_SETS = {
  "Pecho": { min: 10, max: 20 }, "Espalda": { min: 10, max: 20 },
  "Hombro": { min: 12, max: 20 }, "Bíceps": { min: 8, max: 14 },
  "Tríceps": { min: 8, max: 14 }, "Cuádriceps": { min: 10, max: 20 },
  "Posterior": { min: 10, max: 20 }, "Gemelo": { min: 8, max: 16 },
  "Glúteo": { min: 8, max: 16 }, "Aductores": { min: 6, max: 12 },
  "Abdomen": { min: 8, max: 16 }, "Lumbar": { min: 6, max: 12 },
  "Antebrazo": { min: 6, max: 12 }, "Trapecio": { min: 6, max: 12 },
};

function loadAssistantMessages() {
  try {
    const saved = JSON.parse(localStorage.getItem(ASSISTANT_MESSAGES_KEY) || "[]");
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);
    return saved.filter(m => m.date && new Date(m.date) >= cutoff);
  } catch { return []; }
}

function renderMarkdown(text) {
  const html = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
  return { __html: html };
}

function getDateLabel(isoDate) {
  const d = new Date(isoDate);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Hoy";
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

function SessionEditPanel({ sessionIdx, day, onSave, onDelete, onClose }) {
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(day)));
  const [expandedEx, setExpandedEx] = useState(null);
  const [dragEx, setDragEx] = useState(null);
  const [dragOverEx, setDragOverEx] = useState(null);
  const dragNode = useRef(null);

  function onTouchStartEx(e, bi, ei) {
    setDragEx({ bi, ei });
    dragNode.current = e.currentTarget;
    dragNode.current.style.opacity = "0.4";
  }

  function onTouchMoveEx(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const els = document.elementsFromPoint(touch.clientX, touch.clientY);
    const target = els.find(el => el.dataset.biex && el !== dragNode.current);
    if (target) {
      const [tbi, tei] = target.dataset.biex.split("-").map(Number);
      setDragOverEx({ bi: tbi, ei: tei });
    } else {
      setDragOverEx(null);
    }
  }

  function onTouchEndEx() {
    if (dragNode.current) dragNode.current.style.opacity = "1";
    if (dragEx && dragOverEx && !(dragEx.bi === dragOverEx.bi && dragEx.ei === dragOverEx.ei)) {
      setDraft(d => {
        const n = JSON.parse(JSON.stringify(d));
        const moved = n.blocks[dragEx.bi].exercises.splice(dragEx.ei, 1)[0];
        n.blocks[dragOverEx.bi].exercises.splice(dragOverEx.ei, 0, moved);
        return n;
      });
    }
    setDragEx(null);
    setDragOverEx(null);
    dragNode.current = null;
  }

  function updateEx(bi, ei, field, val) {
    setDraft(d => { const n = JSON.parse(JSON.stringify(d)); n.blocks[bi].exercises[ei][field] = val; return n; });
  }

  function addEx(bi) {
    const newEi = draft.blocks[bi].exercises.length;
    setDraft(d => { const n = JSON.parse(JSON.stringify(d)); n.blocks[bi].exercises.push({ name: "", sets: 3, reps: "8-10", rpe: "7", rest: "2 min" }); return n; });
    setExpandedEx({ bi, ei: newEi });
  }

  function removeEx(bi, ei) {
    setDraft(d => { const n = JSON.parse(JSON.stringify(d)); n.blocks[bi].exercises.splice(ei, 1); return n; });
    setExpandedEx(null);
  }

  function toggleAnchor(bi, ei) {
    setDraft(d => { const n = JSON.parse(JSON.stringify(d)); n.blocks[bi].exercises[ei].anchor = !n.blocks[bi].exercises[ei].anchor; return n; });
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 220, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(3px)" }} />
      <div style={{ position: "relative", background: "linear-gradient(160deg, #1c2840 0%, #111827 100%)", borderRadius: "24px 24px 0 0", padding: "0 20px 40px", maxHeight: "90vh", overflowY: "auto", animation: "slideUp .28s cubic-bezier(.32,.72,0,1)", userSelect: "none" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 8px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.18)" }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>Editar sesión</div>
          <label style={lbl}>Nombre</label>
          <input value={draft.label || ""} onChange={e => setDraft(d => ({ ...d, label: e.target.value }))} style={{ ...fld, marginBottom: 10 }} placeholder="ej. Push A" />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Descripción</label>
              <input value={draft.sub || ""} onChange={e => setDraft(d => ({ ...d, sub: e.target.value }))} style={fld} placeholder="ej. Fuerza pectoral" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Duración</label>
              <input value={draft.duration || ""} onChange={e => setDraft(d => ({ ...d, duration: e.target.value }))} style={fld} placeholder="ej. ~60 min" />
            </div>
          </div>
        </div>

        {draft.blocks.map((block, bi) => (
          <div key={bi} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10, paddingLeft: 2 }}>Bloque {bi + 1} — {block.name}</div>
            {block.exercises.map((ex, ei) => {
              const isExp = expandedEx?.bi === bi && expandedEx?.ei === ei;
              return (
                <div key={ei}
                  data-biex={`${bi}-${ei}`}
                  onTouchStart={e => onTouchStartEx(e, bi, ei)}
                  onTouchMove={onTouchMoveEx}
                  onTouchEnd={onTouchEndEx}
                  style={{ background: "rgba(255,255,255,0.05)", borderRadius: 14, marginBottom: 8, border: dragOverEx?.bi === bi && dragOverEx?.ei === ei ? "1.5px solid #f59e0b" : "1px solid rgba(255,255,255,0.08)", overflow: "hidden", opacity: dragEx?.bi === bi && dragEx?.ei === ei ? 0.4 : 1, transition: "opacity .15s, border .1s", touchAction: "none", userSelect: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", padding: "12px 14px", gap: 10, cursor: "pointer" }}
                    onClick={() => setExpandedEx(isExp ? null : { bi, ei })}>
                    <div style={{ color: "#475569", fontSize: 16, cursor: "grab", flexShrink: 0, marginRight: 4 }}>⠿</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#f9fafb" }}>{ex.name || "(sin nombre)"}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{ex.sets} × {ex.reps} · RIR {ex.rpe}</div>
                    </div>
                    {ex.anchor && <span style={{ background: "#f59e0b", color: "#111", fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 99, flexShrink: 0 }}>Ancla</span>}
                    <button onClick={e => { e.stopPropagation(); removeEx(bi, ei); }} style={{ background: "none", border: "none", color: "#64748b", fontSize: 15, cursor: "pointer", padding: "0 4px", flexShrink: 0 }}>✕</button>
                    <span style={{ fontSize: 11, color: "#64748b", flexShrink: 0 }}>{isExp ? "▲" : "▼"}</span>
                  </div>
                  {isExp && (
                    <div style={{ padding: "0 14px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ paddingTop: 12 }}>
                        <label style={lbl}>Nombre</label>
                        <input value={ex.name} onChange={e => updateEx(bi, ei, "name", e.target.value)} style={{ ...fld, marginBottom: 10 }} placeholder="Nombre del ejercicio" />
                        <label style={lbl}>Grupo muscular</label>
                        <select value={ex.muscle || ""} onChange={e => updateEx(bi, ei, "muscle", e.target.value)} style={{ ...fld, marginBottom: 10 }}>
                          <option value="">Seleccionar...</option>
                          {MUSCLE_GROUPS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                          <div style={{ flex: 1 }}><label style={lbl}>Series</label><input value={ex.sets} onChange={e => updateEx(bi, ei, "sets", e.target.value)} style={fld} /></div>
                          <div style={{ flex: 1 }}><label style={lbl}>Reps</label><input value={ex.reps} onChange={e => updateEx(bi, ei, "reps", e.target.value)} style={fld} placeholder="6-8" /></div>
                        </div>
                        <div style={{ marginBottom: 10 }}>
                          <label style={lbl}>RIR (reps en reserva)</label>
                          <div style={{ display: "flex", gap: 6 }}>
                            {["0", "1", "2", "3", "4+"].map(r => (
                              <button key={r} onClick={() => updateEx(bi, ei, "rpe", r)} style={{ flex: 1, padding: "7px 0", borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: 700, background: ex.rpe === r ? "#f59e0b" : "rgba(255,255,255,0.06)", color: ex.rpe === r ? "#111" : "#64748b", border: ex.rpe === r ? "none" : "1.5px solid rgba(255,255,255,0.1)" }}>{r}</button>
                            ))}
                          </div>
                        </div>
                        <label style={lbl}>Descanso</label>
                        <input value={ex.rest || ""} onChange={e => updateEx(bi, ei, "rest", e.target.value)} style={{ ...fld, marginBottom: 10 }} placeholder="2 min" />
                        <label style={lbl}>Nota</label>
                        <input value={ex.note || ""} onChange={e => updateEx(bi, ei, "note", e.target.value)} style={{ ...fld, marginBottom: 10 }} placeholder="Indicación técnica..." />
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#f9fafb" }}>Ejercicio ancla</div>
                            <div style={{ fontSize: 10, color: "#64748b" }}>Principal de la sesión</div>
                          </div>
                          <button onClick={() => toggleAnchor(bi, ei)} style={{ width: 42, height: 24, borderRadius: 99, border: "none", cursor: "pointer", background: ex.anchor ? "#f59e0b" : "rgba(255,255,255,0.15)", position: "relative", flexShrink: 0 }}>
                            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: ex.anchor ? 21 : 3, transition: "left .15s" }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <button onClick={() => addEx(bi)} style={{ width: "100%", padding: "9px", borderRadius: 12, border: "1.5px dashed rgba(255,255,255,0.12)", background: "none", color: "#64748b", fontSize: 12, cursor: "pointer" }}>+ Añadir ejercicio</button>
          </div>
        ))}

        <button onClick={() => onSave(draft)} style={{ width: "100%", padding: 15, borderRadius: 14, border: "none", background: "#f59e0b", color: "#111", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 8 }}>Guardar cambios</button>
        {onDelete && (
          <button onClick={onDelete} style={{ width: "100%", padding: 12, borderRadius: 14, border: "1.5px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#f87171", fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 8 }}>
            Eliminar sesión
          </button>
        )}
      </div>
    </div>
  );
}

function ExerciseDetailPanel({ exercise, sessions, onClose, onLog }) {
  const [tab, setTab] = useState("graficas");
  const hist = [...sessions.filter(s => s.exercise === exercise)].sort((a, b) => new Date(a.date) - new Date(b.date));
  const volData = hist.slice(-12).map(s => ({ date: s.date, vol: calcVolume(s.sets) }));
  const maxData = hist.slice(-12).map(s => ({ date: s.date, max: Math.max(...s.sets.map(x => parseFloat(x.weight) || 0)) }));
  const bestVol = hist.length ? Math.max(...hist.map(s => calcVolume(s.sets))) : 0;
  const bestMax = hist.length ? Math.max(...hist.flatMap(s => s.sets.map(x => parseFloat(x.weight) || 0))) : 0;
  const W = 280, H = 72;
  const maxVol = Math.max(...volData.map(d => d.vol), 1);
  const maxMaxW = Math.max(...maxData.map(d => d.max), 1);
  const minMaxW = Math.min(...maxData.map(d => d.max), maxMaxW - 1);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)" }} />
      <div style={{ position: "relative", background: "#111827", borderRadius: "24px 24px 0 0", padding: "0 20px 36px", maxHeight: "86vh", overflowY: "auto", animation: "slideUp .28s cubic-bezier(.32,.72,0,1)" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 10px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.18)" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "Syne, sans-serif" }}>{exercise}</div>
          <button onClick={() => onLog(exercise)} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: "#f59e0b", color: "#111", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Log</button>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[["Sesiones", hist.length], ["Mejor vol.", bestVol.toFixed(0) + " kg"], ["Máx. peso", bestMax + " kg"]].map(([l, v]) => (
            <div key={l} style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "10px 8px", textAlign: "center", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: 9, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{l}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#f9fafb" }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {["graficas", "historial"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "9px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, background: tab === t ? "#f59e0b" : "rgba(255,255,255,0.06)", color: tab === t ? "#111" : "#64748b" }}>
              {t === "graficas" ? "Gráficas" : "Historial"}
            </button>
          ))}
        </div>
        {tab === "graficas" && (
          volData.length >= 2 ? (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Volumen por sesión (kg)</div>
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px 12px 8px", marginBottom: 16, border: "1px solid rgba(255,255,255,0.07)" }}>
                <svg width="100%" viewBox={`0 0 ${W} ${H + 20}`} style={{ overflow: "visible" }}>
                  {volData.map((d, i) => {
                    const x = (i / Math.max(volData.length - 1, 1)) * (W - 20) + 10;
                    const barH = Math.max(4, (d.vol / maxVol) * H);
                    return (
                      <g key={i}>
                        <rect x={x - 7} y={H - barH} width={14} height={barH} rx={3} fill={i === volData.length - 1 ? "#f59e0b" : "rgba(255,255,255,0.18)"} />
                        <text x={x} y={H + 14} textAnchor="middle" fontSize={7} fill="#64748b">{formatDate(d.date).slice(0, 5)}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Peso máximo (kg)</div>
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px 12px 8px", marginBottom: 16, border: "1px solid rgba(255,255,255,0.07)" }}>
                <svg width="100%" viewBox={`0 0 ${W} ${H + 20}`} style={{ overflow: "visible" }}>
                  {(() => {
                    const range = maxMaxW - minMaxW || 1;
                    const pts = maxData.map((d, i) => ({ x: (i / Math.max(maxData.length - 1, 1)) * (W - 20) + 10, y: H - ((d.max - minMaxW) / range) * (H - 8) - 4, d }));
                    const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
                    return (
                      <>
                        <path d={pathD} fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        {pts.map((p, i) => (
                          <g key={i}>
                            <circle cx={p.x} cy={p.y} r={i === pts.length - 1 ? 4 : 2.5} fill={i === pts.length - 1 ? "#60a5fa" : "#1e40af"} stroke="#60a5fa" strokeWidth="1" />
                            <text x={p.x} y={H + 14} textAnchor="middle" fontSize={7} fill="#64748b">{formatDate(p.d.date).slice(0, 5)}</text>
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#9ca3af", fontSize: 13 }}>Necesitas al menos 2 sesiones para ver gráficas</div>
          )
        )}
        {tab === "historial" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {hist.length === 0
              ? <div style={{ textAlign: "center", padding: "30px 0", color: "#9ca3af", fontSize: 13 }}>Sin sesiones registradas</div>
              : [...hist].reverse().map(s => (
                <div key={s.id} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "10px 12px", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#f9fafb" }}>{formatDate(s.date)}</span>
                    <span style={{ fontSize: 11, color: "#64748b" }}>Vol: {calcVolume(s.sets).toFixed(0)} kg</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {s.sets.map((x, i) => <span key={i} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, color: "#e2e8f0" }}>{x.weight}×{x.reps}{x.rir !== undefined ? ` RIR${x.rir}` : ""}</span>)}
                  </div>
                  {s.notes && <div style={{ fontSize: 11, color: "#64748b", marginTop: 6, fontStyle: "italic" }}>{s.notes}</div>}
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateEditorPanel({ template, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(template.id ? { ...template } : {
    label: "", sub: "", duration: "",
    blocks: [{ name: "Bloque 1", exercises: [{ name: "", sets: 3, reps: "8-10", rpe: "7", rest: "2 min" }] }]
  });
  function updateField(f, v) { setForm(p => ({ ...p, [f]: v })); }
  function addBlock() { setForm(p => ({ ...p, blocks: [...p.blocks, { name: `Bloque ${p.blocks.length + 1}`, exercises: [{ name: "", sets: 3, reps: "8-10", rpe: "7", rest: "2 min" }] }] })); }
  function removeBlock(bi) { setForm(p => ({ ...p, blocks: p.blocks.filter((_, i) => i !== bi) })); }
  function updateBlock(bi, f, v) { setForm(p => ({ ...p, blocks: p.blocks.map((b, i) => i === bi ? { ...b, [f]: v } : b) })); }
  function addExercise(bi) { setForm(p => ({ ...p, blocks: p.blocks.map((b, i) => i === bi ? { ...b, exercises: [...b.exercises, { name: "", sets: 3, reps: "8-10", rpe: "7", rest: "2 min" }] } : b) })); }
  function removeExercise(bi, ei) { setForm(p => ({ ...p, blocks: p.blocks.map((b, i) => i === bi ? { ...b, exercises: b.exercises.filter((_, j) => j !== ei) } : b) })); }
  function updateExercise(bi, ei, f, v) { setForm(p => ({ ...p, blocks: p.blocks.map((b, i) => i === bi ? { ...b, exercises: b.exercises.map((e, j) => j === ei ? { ...e, [f]: v } : e) } : b) })); }
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 210, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(3px)" }} />
      <div style={{ position: "relative", background: "#111827", borderRadius: "24px 24px 0 0", padding: "0 20px 40px", maxHeight: "92vh", overflowY: "auto", animation: "slideUp .25s cubic-bezier(.32,.72,0,1)" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 8px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.15)" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "Syne, sans-serif" }}>{template.id ? "Editar plantilla" : "Nueva plantilla"}</div>
          {template.id && <button onClick={() => onDelete(template.id)} style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, color: "#f87171", cursor: "pointer" }}>Eliminar</button>}
        </div>
        <label style={lbl}>Nombre de la plantilla</label>
        <input value={form.label} onChange={e => updateField("label", e.target.value)} style={{ ...fld, marginBottom: 12 }} placeholder="ej. Push A alternativo" />
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={lbl}>Descripción</label>
            <input value={form.sub || ""} onChange={e => updateField("sub", e.target.value)} style={fld} placeholder="ej. Fuerza pectoral" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={lbl}>Duración</label>
            <input value={form.duration || ""} onChange={e => updateField("duration", e.target.value)} style={fld} placeholder="ej. ~60 min" />
          </div>
        </div>
        {form.blocks.map((block, bi) => (
          <div key={bi} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: "12px 14px", marginBottom: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <input value={block.name} onChange={e => updateBlock(bi, "name", e.target.value)} style={{ ...fld, flex: 1 }} placeholder={`Bloque ${bi + 1}`} />
              {form.blocks.length > 1 && <button onClick={() => removeBlock(bi)} style={{ background: "none", border: "none", color: "#64748b", fontSize: 18, cursor: "pointer", flexShrink: 0 }}>✕</button>}
            </div>
            {block.exercises.map((ex, ei) => (
              <div key={ei} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px", marginBottom: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <input value={ex.name} onChange={e => updateExercise(bi, ei, "name", e.target.value)} style={{ ...fld, flex: 1 }} placeholder="Nombre del ejercicio" />
                  {block.exercises.length > 1 && <button onClick={() => removeExercise(bi, ei)} style={{ background: "none", border: "none", color: "#64748b", fontSize: 15, cursor: "pointer", flexShrink: 0 }}>✕</button>}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[["Series", "sets", "3"], ["Reps", "reps", "8-10"], ["RPE", "rpe", "7"], ["Descanso", "rest", "2 min"]].map(([label, field, ph]) => (
                    <div key={field} style={{ flex: 1 }}>
                      <div style={{ fontSize: 8, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 }}>{label}</div>
                      <input value={ex[field] || ""} onChange={e => updateExercise(bi, ei, field, e.target.value)} style={{ ...fld, padding: "7px 8px", fontSize: 12 }} placeholder={ph} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={() => addExercise(bi)} style={{ width: "100%", padding: "8px", borderRadius: 10, border: "1.5px dashed rgba(255,255,255,0.12)", background: "none", color: "#64748b", fontSize: 12, cursor: "pointer", marginTop: 4 }}>+ Añadir ejercicio</button>
          </div>
        ))}
        <button onClick={addBlock} style={{ width: "100%", padding: "10px", borderRadius: 12, border: "1.5px dashed rgba(255,255,255,0.12)", background: "none", color: "#64748b", fontSize: 13, cursor: "pointer", marginBottom: 16 }}>+ Añadir bloque</button>
        <button onClick={() => onSave(form)} style={{ width: "100%", padding: 15, borderRadius: 14, border: "none", background: "#f59e0b", color: "#111", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          {template.id ? "Guardar cambios" : "Crear plantilla"}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(loadData);
  const [routine, setRoutine] = useState(loadRoutine);
  const [view, setView] = useState("dashboard");
  const [logExercise, setLogExercise] = useState(null);
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [sets, setSets] = useState([{ weight: "", reps: "", rir: undefined }]);
  const [notes, setNotes] = useState("");
  const [aiExercise, setAiExercise] = useState(null);
  const [toast, setToast] = useState("");
  const [histFilter, setHistFilter] = useState("");
  const [editingAnchors, setEditingAnchors] = useState(false);
  const [pinnedExercises, setPinnedExercises] = useState(() => {
    try { return JSON.parse(localStorage.getItem("gym_pinned_exercises") || "[]"); }
    catch { return []; }
  });
  const [assistantMessages, setAssistantMessages] = useState(loadAssistantMessages);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [showDataMenu, setShowDataMenu] = useState(false);
  const [dataMenuPos, setDataMenuPos] = useState({ top: 0, right: 0 });
  const dataMenuBtnRef = useRef(null);
  const importInputRef = useRef(null);
  const [weekSummary, setWeekSummary] = useState(null);
  const [weekSummaryLoading, setWeekSummaryLoading] = useState(false);
  const [routineDay, setRoutineDay] = useState(() => { const map = [6,0,1,2,3,4,5]; return map[new Date().getDay()]; });
  const [editingExercise, setEditingExercise] = useState(null);
  const [plannerMode, setPlannerMode] = useState(false);
  const [dragSrc, setDragSrc] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [editingDaySession, setEditingDaySession] = useState(null);
  const [weekOverrides, setWeekOverrides] = useState(() => { try { return JSON.parse(localStorage.getItem(OVERRIDES_KEY) || "{}"); } catch { return {}; } });
  const [detailExercise, setDetailExercise] = useState(null);
  const [templates, setTemplates] = useState(() => { try { return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "[]"); } catch { return []; } });
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const touchStartX = useRef(null);

  useEffect(() => { saveData(data); }, [data]);
  useEffect(() => { saveRoutine(routine); }, [routine]);
  useEffect(() => { localStorage.setItem(OVERRIDES_KEY, JSON.stringify(weekOverrides)); }, [weekOverrides]);
  useEffect(() => { localStorage.setItem("gym_pinned_exercises", JSON.stringify(pinnedExercises)); }, [pinnedExercises]);
  useEffect(() => {
    if (assistantMessages.length > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 14);
      const filtered = assistantMessages.filter(m => !m.date || new Date(m.date) >= cutoff);
      localStorage.setItem(ASSISTANT_MESSAGES_KEY, JSON.stringify(filtered));
    }
  }, [assistantMessages]);
  useEffect(() => { localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates)); }, [templates]);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 2200); }

  function getSessionForDay(dayIdx) { const k = getWeekKey(dayIdx); return weekOverrides[k] !== undefined ? weekOverrides[k] : dayIdx; }
  function setSessionForDay(dayIdx, sessionIdx) { setWeekOverrides(prev => ({ ...prev, [getWeekKey(dayIdx)]: sessionIdx })); }
  function resetSessionForDay(dayIdx) { setWeekOverrides(prev => { const n = {...prev}; delete n[getWeekKey(dayIdx)]; return n; }); }

  function handleSessionChange(dayIdx, sessionKey, mode = "temporal") {
    if (mode === "temporal") {
      if (sessionKey === "rest") {
        setSessionForDay(dayIdx, "rest");
      } else {
        setSessionForDay(dayIdx, sessionKey);
      }
    } else {
      const newRoutine = JSON.parse(JSON.stringify(routine));
      if (sessionKey === "rest") {
        newRoutine[dayIdx] = { ...newRoutine[dayIdx], rest: true, label: "Descanso", sub: "Sin entrenamiento", duration: "Recuperación", blocks: [] };
      } else {
        const targetSession = typeof sessionKey === "string" && sessionKey.startsWith("t-")
          ? templates.find(t => t.id === sessionKey)
          : routine[sessionKey];
        if (targetSession) {
          newRoutine[dayIdx] = { ...targetSession, day: routine[dayIdx].day };
        }
      }
      setRoutine(newRoutine);
      showToast("Sesión fijada permanentemente");
    }
    setEditingDaySession(null);
  }

  function buildContext() {
    const now = new Date();
    const sow = new Date(now); sow.setDate(now.getDate() - now.getDay());
    const weekSess = data.sessions.filter(s => new Date(s.date) >= sow);
    const recent = [...data.sessions].sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0,10);
    const todayRoutine = routine[getSessionForDay([6,0,1,2,3,4,5][now.getDay()])];
    const sessText = recent.map(s => formatDate(s.date) + " - " + s.exercise + ": " + s.sets.map(x => x.weight + "kg x" + x.reps + (x.rir !== undefined ? " RIR" + x.rir : "")).join(", ")).join("\n");
    const volMap = weekSess.reduce((acc, s) => { const m = s.muscle || "Otro"; acc[m] = (acc[m]||0) + s.sets.length; return acc; }, {});
    const volText = Object.entries(volMap).map(([m,n]) => m + ": " + n + " series").join(", ");
    return "CONTEXTO DEL ATLETA:\nRutina: PPL 5 dias\nHoy toca: " + todayRoutine.label + " - " + todayRoutine.sub + "\nSesiones esta semana: " + weekSess.length + "\nVolumen semanal: " + (volText || "Sin datos") + "\n\nULTIMAS 10 SESIONES:\n" + (sessText || "Sin sesiones registradas");
  }

  async function sendAssistantMessage(text) {
    if (!text.trim()) return;
    const now = new Date().toISOString();
    const userMsg = { role: "user", content: text, date: now };
    const newMessages = [...assistantMessages, userMsg];
    setAssistantMessages(newMessages);
    setAssistantInput("");
    setAssistantLoading(true);
    const context = buildContext();
    const systemPrompt = "Eres un entrenador personal experto en fuerza e hipertrofia. Tienes acceso completo al historial de entrenamiento del atleta. Respondes en espanol, de forma directa, practica y motivadora. Maximo 200 palabras por respuesta. Usa saltos de linea para separar secciones. Usa **negritas** con doble asterisco para destacar datos importantes: el sistema los convertira a negrita visible. Maximo 1-2 emojis por respuesta. Formato directo y escaneable, sin introduccion innecesaria.\n\n" + context;
    const msgText = newMessages.map(m => (m.role === "user" ? "Usuario" : "Asistente") + ": " + m.content).join("\n");
    try {
      const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msgText, system: systemPrompt }) });
      const d = await res.json();
      setAssistantMessages([...newMessages, { role: "assistant", content: d.text || "Error al conectar.", date: new Date().toISOString() }]);
    } catch { setAssistantMessages([...newMessages, { role: "assistant", content: "Error de conexion.", date: new Date().toISOString() }]); }
    setAssistantLoading(false);
  }

  async function generateWeekSummary() {
    setWeekSummaryLoading(true);
    const context = buildContext();
    try {
      const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: context + "\n\nAnaliza la semana actual del atleta. Responde con exactamente 3 secciones, cada una en una linea nueva, usando este formato con **negritas** (doble asterisco que el sistema convertira a negrita visible):\n\n**Volumen**\n[1-2 lineas: series por grupo muscular vs rango optimo]\n\n**Destacado**\n[1 linea: mejor rendimiento o progresion de la semana]\n\n**Alerta**\n[1 linea: lo que hay que mejorar o vigilar]\n\nSin emojis excesivos, sin introduccion, directo al punto." }) });
      const d = await res.json();
      setWeekSummary(d.text || null);
    } catch { setWeekSummary(null); }
    setWeekSummaryLoading(false);
  }

  function handleExport() {
    const payload = { sessions: data.sessions, routine, weekOverrides, pinnedExercises };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `carga-pro-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowDataMenu(false);
    showToast("Datos exportados");
  }

  function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (parsed.sessions) setData(d => ({ ...d, sessions: parsed.sessions }));
        if (parsed.routine) setRoutine(parsed.routine);
        if (parsed.weekOverrides) setWeekOverrides(parsed.weekOverrides);
        if (parsed.pinnedExercises) setPinnedExercises(parsed.pinnedExercises);
        showToast("Datos importados correctamente");
      } catch { showToast("Error al leer el archivo"); }
    };
    reader.readAsText(file);
    e.target.value = "";
    setShowDataMenu(false);
  }

  function saveTemplate(form) {
    if (form.id) {
      setTemplates(prev => prev.map(t => t.id === form.id ? form : t));
    } else {
      setTemplates(prev => [...prev, { ...form, id: "t-" + Date.now() }]);
    }
    setEditingTemplate(null);
    showToast("Plantilla guardada");
  }

  function deleteTemplate(id) {
    setTemplates(prev => prev.filter(t => t.id !== id));
    setEditingTemplate(null);
    showToast("Plantilla eliminada");
  }

  function handleSwipeTouchStart(e) { touchStartX.current = e.touches[0].clientX; }

  function handleSwipeTouchEnd(e) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 60) return;
    if (dx < 0) setRoutineDay(d => (d + 1) % routine.length);
    else setRoutineDay(d => (d - 1 + routine.length) % routine.length);
  }

  function resolveSession(key) {
    if (key === "rest") return { label: "Descanso", sub: "Sin entrenamiento", duration: "Recuperación", rest: true, blocks: [] };
    if (String(key).startsWith("t-")) return templates.find(t => t.id === key) || null;
    const idx = parseInt(key);
    return isNaN(idx) ? null : routine[idx] || null;
  }

  function openLog(exercise) {
    setLogExercise(exercise);
    setSets([{ weight: "", reps: "", rir: undefined }]);
    setNotes("");
    const last = getLastSession(data.sessions, exercise);
    if (last) setSets(last.sets.map(s => ({ weight: s.weight, reps: s.reps, rir: undefined })));
    setView("log");
  }

  function saveSession() {
    const valid = sets.filter(s => s.weight && s.reps);
    if (!valid.length) return;
    setData(d => ({ ...d, sessions: [...d.sessions, { id: Date.now(), exercise: logExercise, muscle: routine.flatMap(day => day.blocks || []).flatMap(b => b.exercises).find(e => e.name === logExercise)?.muscle || LEGACY_MUSCLE_MAP[logExercise] || "Otro", date: logDate, sets: valid, notes }] }));
    showToast("Sesion guardada");
    setView("routine");
  }

  function saveExerciseEdit(form) {
    if (!editingExercise) return;
    const { dayIdx, blockIdx, exIdx } = editingExercise;
    const newRoutine = JSON.parse(JSON.stringify(routine));
    newRoutine[dayIdx].blocks[blockIdx].exercises[exIdx] = form;
    setRoutine(newRoutine);
    setEditingExercise(null);
    showToast("Ejercicio actualizado");
  }

  const anchorExercises = [];
  routine.forEach(day => { if (day.rest) return; day.blocks.forEach(block => { block.exercises.forEach(ex => { if (ex.anchor) anchorExercises.push({ ...ex, dayLabel: day.label }); }); }); });
  templates.forEach(t => { (t.blocks || []).forEach(block => { (block.exercises || []).forEach(ex => { if (ex.anchor && ex.name && !anchorExercises.find(a => a.name === ex.name)) anchorExercises.push({ ...ex, dayLabel: t.label || "Plantilla" }); }); }); });

  const allRoutineExercises = [];
  routine.forEach(day => { if (day.rest) return; day.blocks.forEach(block => { block.exercises.forEach(ex => { if (!allRoutineExercises.includes(ex.name)) allRoutineExercises.push(ex.name); }); }); });
  templates.forEach(t => { (t.blocks || []).forEach(block => { (block.exercises || []).forEach(ex => { if (ex.name && !allRoutineExercises.includes(ex.name)) allRoutineExercises.push(ex.name); }); }); });

  const now2 = new Date();
  const sow2 = new Date(now2); sow2.setDate(now2.getDate() - now2.getDay());
  const weekSessions = data.sessions.filter(s => new Date(s.date) >= sow2);
  const weeklyVolume = {};
  weekSessions.forEach(s => { const muscle = s.muscle || LEGACY_MUSCLE_MAP[s.exercise] || "Otro"; weeklyVolume[muscle] = (weeklyVolume[muscle] || 0) + s.sets.length; });

  const filteredHistory = (histFilter ? data.sessions.filter(s => s.exercise === histFilter) : data.sessions).sort((a, b) => new Date(b.date) - new Date(a.date));

  const NAV = [
    { id: "dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", label: "Inicio" },
    { id: "routine", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", label: "Rutina" },
    { id: "log", icon: "M12 4v16m8-8H4", label: "Registrar", primary: true },
    { id: "history", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", label: "Historial" },
    { id: "assistant", label: "Asistente", sparkle: true },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "#0d1117", paddingBottom: 90 }}>
      <input ref={importInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;-webkit-user-select:none;user-select:none}
        input,textarea{-webkit-user-select:text;user-select:text}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
        input:focus,select:focus,textarea:focus{outline:2px solid rgba(245,158,11,0.5);border-color:#f59e0b!important}
        select option{background:#111827;color:#f9fafb}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes popIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes toastFade{0%,75%{opacity:1}100%{opacity:0}}
        .sec{animation:popIn .22s ease}
        ::-webkit-scrollbar{width:0}
      `}</style>

      <div style={{ background: "linear-gradient(135deg, #111827, #0f1729)", padding: "48px 20px 16px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -20, width: 110, height: 110, borderRadius: "50%", background: "rgba(245,158,11,0.1)" }} />
        <div style={{ fontSize: 9, color: "#f59e0b", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Tu tracker de fuerza</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: "#fff", fontFamily: "Syne, sans-serif" }}>CARGA</span>
            <span style={{ fontSize: 26, fontWeight: 800, color: "#f59e0b", fontFamily: "Syne, sans-serif" }}>PRO</span>
          </div>
          <div ref={dataMenuBtnRef}>
            <button onClick={() => { if (dataMenuBtnRef.current) { const rect = dataMenuBtnRef.current.getBoundingClientRect(); setDataMenuPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right }); } setShowDataMenu(v => !v); }} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "#94a3b8", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>⇅</button>
          </div>
        </div>
      </div>

      {showDataMenu && (
        <>
          <div onClick={() => setShowDataMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 998 }} />
          <div style={{ position: "fixed", top: dataMenuPos.top, right: dataMenuPos.right, background: "#1c2840", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, zIndex: 999, minWidth: 160, overflow: "hidden" }}>
            <button onClick={handleExport} style={{ width: "100%", padding: "12px 16px", background: "none", border: "none", color: "#e5e7eb", fontSize: 14, fontWeight: 600, cursor: "pointer", textAlign: "left", fontFamily: "'DM Sans', sans-serif" }}>📤 Exportar datos</button>
            <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />
            <button onClick={() => { importInputRef.current?.click(); setShowDataMenu(false); }} style={{ width: "100%", padding: "12px 16px", background: "none", border: "none", color: "#e5e7eb", fontSize: 14, fontWeight: 600, cursor: "pointer", textAlign: "left", fontFamily: "'DM Sans', sans-serif" }}>📥 Importar datos</button>
          </div>
        </>
      )}

      <div style={{ padding: 16 }}>

        {view === "dashboard" && (
          <div className="sec">
            {(() => {
              const map = [6,0,1,2,3,4,5];
              const todayIdx = map[new Date().getDay()];
              const todaySession = routine[getSessionForDay(todayIdx)];
              if (!todaySession.rest) return (
                <div style={{ background: "#111827", borderRadius: 18, padding: "14px 16px", marginBottom: 16 }}>
                  <div style={{ fontSize: 9, color: "#f59e0b", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>Hoy toca</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "Syne, sans-serif", marginBottom: 2 }}>{todaySession.label}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>{todaySession.sub} · {todaySession.duration}</div>
                  <button onClick={() => { setRoutineDay(todayIdx); setView("routine"); }} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: "#f59e0b", color: "#111", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Ver sesion de hoy →</button>
                </div>
              );
              return (
                <div style={{ background: "#111827", borderRadius: 18, padding: "14px 16px", marginBottom: 16, textAlign: "center" }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>🧘</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{todaySession.label}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{todaySession.duration}</div>
                </div>
              );
            })()}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: 1.5, textTransform: "uppercase" }}>Mis ejercicios</div>
              <button onClick={() => setEditingAnchors(e => !e)} style={{ fontSize: 12, fontWeight: 700, color: editingAnchors ? "#f59e0b" : "#6b7280", background: "none", border: "none", cursor: "pointer" }}>
                {editingAnchors ? "✓ Listo" : "Editar"}
              </button>
            </div>

            {editingAnchors && (
              <div style={{ background: "#1c2840", borderRadius: 14, padding: 14, marginBottom: 14, border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>Selecciona los ejercicios que quieres ver en el inicio</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {allRoutineExercises.map(exName => {
                    const isPinned = pinnedExercises.includes(exName);
                    return (
                      <button key={exName} onClick={() => setPinnedExercises(prev => isPinned ? prev.filter(e => e !== exName) : [...prev, exName])} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, border: isPinned ? "1.5px solid #f59e0b" : "1.5px solid rgba(255,255,255,0.08)", background: isPinned ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.04)", cursor: "pointer" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#f9fafb" }}>{exName}</span>
                        <span style={{ fontSize: 16, color: isPinned ? "#f59e0b" : "#475569" }}>{isPinned ? "★" : "☆"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {(pinnedExercises.length > 0 ? pinnedExercises : anchorExercises.map(e => e.name)).map(exName => {
                const hist = data.sessions.filter(s => s.exercise === exName).sort((a, b) => new Date(a.date) - new Date(b.date));
                const last = hist.at(-1);
                const volumes = hist.slice(-8).map(s => calcVolume(s.sets));
                const trend = volumes.length >= 2 ? (volumes.at(-1) > volumes.at(-2) ? "↑" : volumes.at(-1) < volumes.at(-2) ? "↓" : "→") : null;
                const dayLabel = (() => { for (const d of routine) { if (d.rest) continue; for (const b of d.blocks) { if (b.exercises.find(e => e.name === exName)) return d.label; } } return ""; })();
                return (
                  <div key={exName} style={{ background: "#1c2840", borderRadius: 18, padding: "14px 14px 12px", border: "1.5px solid rgba(245,158,11,0.12)", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div onClick={() => setDetailExercise(exName)} style={{ fontSize: 12, fontWeight: 700, color: "#f9fafb", lineHeight: 1.3, maxWidth: "70%", cursor: "pointer" }}>{exName}</div>
                      {trend && <span style={{ fontSize: 14, fontWeight: 900, color: trend === "↑" ? "#4ade80" : trend === "↓" ? "#f87171" : "#9ca3af" }}>{trend}</span>}
                    </div>
                    {dayLabel && <div style={{ fontSize: 9, color: "#f59e0b", fontWeight: 700, textTransform: "uppercase" }}>{dayLabel}</div>}
                    {last ? (
                      <>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {last.sets.slice(0, 3).map((s, i) => <span key={i} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "3px 8px", fontSize: 11, fontWeight: 600, color: "#e2e8f0" }}>{s.weight}x{s.reps}</span>)}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                          <div style={{ fontSize: 10, color: "#64748b" }}>{formatDate(last.date)}</div>
                          <Sparkline values={volumes} />
                        </div>
                      </>
                    ) : <div style={{ fontSize: 11, color: "#9ca3af" }}>Sin registros</div>}
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => openLog(exName)} style={{ flex: 1, padding: "7px 0", borderRadius: 10, border: "none", background: "#111827", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Log</button>
                      <button onClick={() => setAiExercise(exName)} style={{ flex: 1, padding: "7px 0", borderRadius: 10, border: "none", background: "rgba(245,158,11,0.15)", color: "#f59e0b", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>✦</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {data.sessions.length > 0 && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Ultimas sesiones</div>
                {[...data.sessions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3).map(s => (
                  <div key={s.id} style={{ background: "#1c2840", borderRadius: 14, padding: "12px 14px", marginBottom: 8, border: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#f9fafb" }}>{s.exercise}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{formatDate(s.date)} · {s.sets.length} series</div>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {s.sets.slice(0, 2).map((x, i) => <span key={i} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "3px 8px", fontSize: 11, fontWeight: 600, color: "#e2e8f0" }}>{x.weight}×{x.reps}</span>)}
                    </div>
                  </div>
                ))}
                <button onClick={() => setView("history")} style={{ width: "100%", padding: "10px", borderRadius: 12, border: "none", background: "none", color: "#9ca3af", fontSize: 13, cursor: "pointer", marginTop: 4 }}>Ver historial completo →</button>
              </>
            )}

            <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10, marginTop: 8 }}>Volumen semanal</div>
            <div style={{ background: "#1c2840", borderRadius: 18, padding: "14px 16px", marginBottom: 16, border: "1px solid rgba(255,255,255,0.07)" }}>
              {DASHBOARD_MUSCLES.map(muscle => {
                const done = weeklyVolume[muscle] || 0;
                const { min, max } = RECOMMENDED_SETS[muscle];
                const pct = Math.min(done / max, 1);
                const status = done === 0 ? "empty" : done < min ? "low" : done <= max ? "ok" : "high";
                const barColor = status === "ok" ? "#4ade80" : status === "high" ? "#f59e0b" : status === "low" ? "#60a5fa" : "rgba(255,255,255,0.1)";
                const textColor = status === "ok" ? "#4ade80" : status === "high" ? "#f59e0b" : status === "low" ? "#60a5fa" : "#64748b";
                return (
                  <div key={muscle} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{muscle}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: textColor }}>{done} <span style={{ color: "#64748b", fontWeight: 400 }}>/ {min}-{max} series</span>{status === "ok" ? " ✓" : status === "high" ? " ↑" : ""}</span>
                    </div>
                    <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct * 100}%`, background: barColor, borderRadius: 99, transition: "width .4s ease" }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ display: "flex", gap: 12, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                {[["#60a5fa", "Por debajo"], ["#4ade80", "En rango"], ["#f59e0b", "Por encima"]].map(([c, l]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
                    <span style={{ fontSize: 10, color: "#64748b" }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === "log" && (
          <div className="sec">
            <button onClick={() => setView("routine")} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 13, cursor: "pointer", marginBottom: 14, padding: 0 }}>← Volver</button>
            <div style={{ background: "#111827", borderRadius: 20, padding: 18, border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>Registrar serie</div>
              <label style={lbl}>Ejercicio</label>
              <select value={logExercise} onChange={e => setLogExercise(e.target.value)} style={{ ...fld, marginBottom: 14 }}>
                {allRoutineExercises.map(ex => <option key={ex}>{ex}</option>)}
              </select>
              <label style={lbl}>Fecha</label>
              <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} style={{ ...fld, marginBottom: 18 }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <label style={lbl}>Series</label>
                <button onClick={() => { const last = getLastSession(data.sessions, logExercise); if (last) setSets(last.sets.map(s => ({ weight: s.weight, reps: s.reps, rir: undefined }))); }} style={{ fontSize: 12, color: "#f59e0b", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>Copiar ultima</button>
              </div>
              {sets.map((s, i) => (
                <SetRow key={i} set={s} idx={i}
                  onChange={(i, f, v) => { const n = [...sets]; n[i] = { ...n[i], [f]: v }; setSets(n); }}
                  onRemove={i => setSets(sets.filter((_, j) => j !== i))}
                  isOnly={sets.length === 1} />
              ))}
              <button onClick={() => setSets([...sets, { weight: "", reps: "", rir: undefined }])} style={{ width: "100%", padding: 10, borderRadius: 12, border: "1.5px dashed rgba(255,255,255,0.15)", background: "none", color: "#64748b", fontSize: 13, cursor: "pointer", marginTop: 4, marginBottom: 16 }}>+ Anadir serie</button>
              <label style={lbl}>Notas</label>
              <textarea placeholder="Sensaciones, observaciones..." value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...fld, resize: "none", marginBottom: 16 }} />
              <button onClick={saveSession} style={{ width: "100%", padding: 15, borderRadius: 14, border: "none", background: "#111827", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>Guardar sesion</button>
              <button onClick={() => setAiExercise(logExercise)} style={{ width: "100%", padding: 12, borderRadius: 14, border: "1.5px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.08)", color: "#f59e0b", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>✦ Recomendacion</button>
            </div>
          </div>
        )}

        {view === "routine" && (
          <div className="sec">
            {editingDaySession !== null && (
              <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                <div onClick={() => setEditingDaySession(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }} />
                <div style={{ position: "relative", background: "#111827", borderRadius: "22px 22px 0 0", padding: "0 20px 36px", maxHeight: "75vh", overflowY: "auto", animation: "slideUp .25s cubic-bezier(.32,.72,0,1)" }}>
                  <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 8px" }}>
                    <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.15)" }} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Sesion para el {routine[editingDaySession].day}</div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(255,255,255,0.08)" }}>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#f9fafb" }}>Descanso</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>Sin entrenamiento · Recuperación</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                      <button onClick={() => { setSessionForDay(editingDaySession, "rest"); setEditingDaySession(null); }}
                        style={{ flex: 1, padding: "6px 0", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "none", color: "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                        Esta semana
                      </button>
                      <button onClick={() => { handleSessionChange(editingDaySession, "rest", "permanent"); }}
                        style={{ flex: 1, padding: "6px 0", borderRadius: 8, border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.06)", color: "#f59e0b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                        Fijar siempre
                      </button>
                    </div>
                  </div>
                  {routine.map((r, ri) => {
                    const isSelected = getSessionForDay(editingDaySession) === ri;
                    return (
                      <div key={ri} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", borderRadius: 14, background: isSelected ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.05)", border: isSelected ? "1.5px solid #f59e0b" : "1.5px solid rgba(255,255,255,0.08)" }}>
                            <div style={{ textAlign: "left" }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: "#f9fafb" }}>{r.label}</div>
                              <div style={{ fontSize: 11, color: "#64748b" }}>{r.sub} · {r.duration}</div>
                            </div>
                            {isSelected && <span style={{ fontSize: 16, color: "#f59e0b" }}>✓</span>}
                          </div>
                          {!r.rest && <button onClick={() => { setEditingDaySession(null); setEditingSession(ri); }} style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#94a3b8", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✎</button>}
                          <button onClick={() => { if (window.confirm("¿Eliminar " + r.label + "?")) { const newRoutine = JSON.parse(JSON.stringify(routine)); newRoutine[ri] = { day: r.day, label: "Descanso", sub: "Sin entrenamiento", duration: "Recuperación", rest: true, blocks: [] }; setRoutine(newRoutine); setEditingDaySession(null); showToast(r.label + " eliminada"); } }} style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.08)", color: "#f87171", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
                        </div>
                        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                          <button onClick={() => { setSessionForDay(editingDaySession, ri); setEditingDaySession(null); }}
                            style={{ flex: 1, padding: "6px 0", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "none", color: "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                            Esta semana
                          </button>
                          <button onClick={() => { handleSessionChange(editingDaySession, ri, "permanent"); }}
                            style={{ flex: 1, padding: "6px 0", borderRadius: 8, border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.06)", color: "#f59e0b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                            Fijar siempre
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {templates.length > 0 && (
                    <>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, margin: "14px 0 8px" }}>Mis plantillas</div>
                      {templates.map(t => {
                        const isSelected = getSessionForDay(editingDaySession) === t.id;
                        return (
                          <div key={t.id} style={{ marginBottom: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", borderRadius: 14, background: isSelected ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.05)", border: isSelected ? "1.5px solid #f59e0b" : "1.5px solid rgba(255,255,255,0.08)" }}>
                                <div style={{ textAlign: "left" }}>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f9fafb" }}>{t.label}</div>
                                  <div style={{ fontSize: 11, color: "#64748b" }}>{t.sub} · {t.duration}</div>
                                </div>
                                {isSelected && <span style={{ fontSize: 16, color: "#f59e0b" }}>✓</span>}
                              </div>
                              <button onClick={() => { setEditingDaySession(null); setEditingTemplate(t); }} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#94a3b8", cursor: "pointer", fontSize: 14, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>✎</button>
                              <button onClick={() => { if (window.confirm("¿Eliminar " + t.label + "?")) { deleteTemplate(t.id); setEditingDaySession(null); } }} style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.08)", color: "#f87171", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
                            </div>
                            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                              <button onClick={() => { setSessionForDay(editingDaySession, t.id); setEditingDaySession(null); }}
                                style={{ flex: 1, padding: "6px 0", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "none", color: "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                                Esta semana
                              </button>
                              <button onClick={() => { handleSessionChange(editingDaySession, t.id, "permanent"); }}
                                style={{ flex: 1, padding: "6px 0", borderRadius: 8, border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.06)", color: "#f59e0b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                                Fijar siempre
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                  <button onClick={() => { setEditingDaySession(null); setEditingTemplate({}); }} style={{ width: "100%", padding: "11px", borderRadius: 12, border: "1.5px dashed rgba(255,255,255,0.15)", background: "none", color: "#64748b", fontSize: 13, cursor: "pointer", marginTop: 4 }}>+ Nueva plantilla</button>
                  {getWeekKey(editingDaySession) in weekOverrides && (
                    <button onClick={() => { resetSessionForDay(editingDaySession); setEditingDaySession(null); }} style={{ width: "100%", padding: "11px", borderRadius: 12, border: "none", background: "none", color: "#64748b", fontSize: 13, cursor: "pointer", marginTop: 4 }}>Volver a la sesion por defecto</button>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, marginTop: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: 1.5, textTransform: "uppercase" }}>Esta semana</div>
              <button onClick={() => setPlannerMode(p => !p)} style={{ padding: "6px 14px", borderRadius: 99, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: plannerMode ? "#f59e0b" : "rgba(255,255,255,0.08)", color: plannerMode ? "#111" : "#94a3b8", transition: "all .15s" }}>
                {plannerMode ? "✓ Listo" : "Reorganizar semana"}
              </button>
            </div>

            {plannerMode && (
              <div style={{ background: "#1c2840", borderRadius: 18, padding: 16, marginBottom: 14, border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>Arrastra las sesiones entre dias para reorganizar tu semana</div>
                {routine.map((d, i) => {
                  const sessionIdx = getSessionForDay(i);
                  const session = resolveSession(sessionIdx) || routine[i];
                  const isOverridden = getWeekKey(i) in weekOverrides && weekOverrides[getWeekKey(i)] !== i;
                  const todayIdx = [6,0,1,2,3,4,5][new Date().getDay()];
                  const isToday = todayIdx === i;
                  return (
                    <div key={i} draggable
                      onDragStart={() => setDragSrc(i)}
                      onDragOver={e => { e.preventDefault(); setDragOver(i); }}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={() => { if (dragSrc === null || dragSrc === i) { setDragOver(null); return; } const srcS = getSessionForDay(dragSrc), dstS = getSessionForDay(i); setSessionForDay(dragSrc, dstS); setSessionForDay(i, srcS); setDragSrc(null); setDragOver(null); }}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, marginBottom: 6, background: dragOver === i ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.04)", border: dragOver === i ? "1.5px solid #f59e0b" : isToday ? "1.5px solid #f59e0b" : "1.5px solid transparent", cursor: "grab", userSelect: "none" }}>
                      <div style={{ color: "#475569", fontSize: 16, flexShrink: 0 }}>⠿</div>
                      <div style={{ width: 36, flexShrink: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: isToday ? "#f59e0b" : "#f9fafb" }}>{d.day}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#f9fafb", display: "flex", alignItems: "center", gap: 6 }}>
                          {session.label}
                          {isOverridden && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", display: "inline-block" }} />}
                        </div>
                        <div style={{ fontSize: 10, color: "#64748b" }}>{session.sub}</div>
                      </div>
                      <button onClick={() => setEditingDaySession(i)} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, color: "#94a3b8", cursor: "pointer", flexShrink: 0 }}>Cambiar</button>
                    </div>
                  );
                })}
                <button onClick={() => routine.forEach((_, i) => resetSessionForDay(i))} style={{ width: "100%", padding: "10px", borderRadius: 12, border: "none", background: "none", color: "#64748b", fontSize: 12, cursor: "pointer", marginTop: 4 }}>Resetear semana a rutina por defecto</button>
                <button onClick={() => {
                  const newRoutine = JSON.parse(JSON.stringify(routine));
                  routine.forEach((_, i) => {
                    const sessionKey = getSessionForDay(i);
                    const targetSession = typeof sessionKey === "string" && sessionKey.startsWith("t-")
                      ? templates.find(t => t.id === sessionKey)
                      : routine[sessionKey];
                    if (targetSession && sessionKey !== i) {
                      newRoutine[i] = { ...targetSession, day: routine[i].day };
                    }
                  });
                  setRoutine(newRoutine);
                  routine.forEach((_, i) => resetSessionForDay(i));
                  setPlannerMode(false);
                  showToast("Semana fijada como rutina permanente");
                }} style={{ width: "100%", padding: "11px", borderRadius: 12, border: "1.5px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.08)", color: "#f59e0b", fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 8 }}>
                  Fijar semana como rutina permanente
                </button>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
              <button onClick={() => setRoutineDay(d => (d - 1 + routine.length) % routine.length)} style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#64748b", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
              <div style={{ display: "flex", gap: 6, flex: 1, overflowX: "auto", paddingBottom: 4 }}>
                {routine.map((d, i) => {
                  const todayIdx = [6,0,1,2,3,4,5][new Date().getDay()];
                  const isToday = todayIdx === i;
                  const sessionKey = getSessionForDay(i);
                  const isOverridden = getWeekKey(i) in weekOverrides && weekOverrides[getWeekKey(i)] !== i;
                  const isPermanentlyFixed = routine[i].label !== DEFAULT_ROUTINE[i].label;
                  const sessionLabel = (resolveSession(sessionKey) || routine[i]).label.split(" ")[0];
                  return (
                    <button key={i} onClick={() => setRoutineDay(i)} style={{ flexShrink: 0, padding: "8px 12px", borderRadius: 12, cursor: "pointer", fontSize: 12, fontWeight: 700, background: routineDay === i ? "#1e3a5f" : isToday ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.05)", color: routineDay === i ? "#f59e0b" : isToday ? "#f59e0b" : "#64748b", border: routineDay === i ? "1.5px solid rgba(245,158,11,0.4)" : isToday && routineDay !== i ? "1.5px solid rgba(245,158,11,0.3)" : isOverridden ? "1.5px solid #a78bfa" : "1.5px solid transparent", position: "relative", transition: "all .15s" }}>
                      <div>{d.day}</div>
                      <div style={{ fontSize: 9, fontWeight: 600, marginTop: 2, opacity: .8 }}>{sessionLabel}</div>
                      {isOverridden && <div style={{ position: "absolute", top: 4, right: 4, width: 6, height: 6, borderRadius: "50%", background: "#a78bfa" }} />}
                      {isPermanentlyFixed && !isOverridden && <div style={{ position: "absolute", top: 4, right: 4, fontSize: 8, lineHeight: 1 }}>🔒</div>}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setRoutineDay(d => (d + 1) % routine.length)} style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#64748b", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>→</button>
            </div>

            {(() => {
              const sessionKey = getSessionForDay(routineDay);
              const isTemplateSession = String(sessionKey).startsWith("t-");
              const day = resolveSession(sessionKey) || routine[routineDay];
              const sessionIdx = isTemplateSession ? routineDay : parseInt(sessionKey);
              const isOverridden = getWeekKey(routineDay) in weekOverrides && weekOverrides[getWeekKey(routineDay)] !== routineDay;
              if (day.rest) return (
                <>
                  <div style={{ background: "#1c2840", borderRadius: 18, padding: 28, textAlign: "center", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 10 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>{day.label.includes("Trail") ? "🏃" : "🧘"}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#f9fafb", fontFamily: "Syne, sans-serif" }}>{day.label}</div>
                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>{day.duration}</div>
                  </div>
                  <button onClick={() => setEditingDaySession(routineDay)} style={{ width: "100%", padding: "11px", borderRadius: 14, border: "1.5px solid rgba(255,255,255,0.1)", background: "none", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cambiar sesion de este dia</button>
                </>
              );
              return (
                <>
                  <div style={{ background: "#111827", borderRadius: 16, padding: "14px 16px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 10, color: isOverridden ? "#a78bfa" : "#f59e0b", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{routine[routineDay].day} · {isOverridden ? "Sesion cambiada" : day.sub}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "Syne, sans-serif" }}>{day.label}</div>
                      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{day.duration}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {!isTemplateSession && <button onClick={() => setEditingSession(sessionIdx)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 10, padding: "8px 12px", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Modificar</button>}
                      <button onClick={() => setEditingDaySession(routineDay)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 10, padding: "8px 12px", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Cambiar</button>
                    </div>
                  </div>
                  {isOverridden && <div style={{ background: "rgba(124,58,237,0.2)", borderRadius: 10, padding: "8px 12px", marginBottom: 12, fontSize: 12, color: "#a78bfa", fontWeight: 600 }}>Sesion movida esta semana · vuelve a la normal la semana que viene</div>}
                  {day.blocks.map((block, bi) => (
                    <div key={bi} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, paddingLeft: 2 }}>Bloque {bi + 1} — {block.name}</div>
                      {block.exercises.map((ex, ei) => {
                        const lastLog = getLastSession(data.sessions, ex.name);
                        const doneToday = data.sessions.some(s => s.exercise === ex.name && s.date === new Date().toISOString().slice(0, 10));
                        return (
                          <div key={ei} style={{ background: "#1c2840", borderRadius: 14, padding: "12px 14px", marginBottom: 8, border: ex.anchor ? "1.5px solid #f59e0b" : doneToday ? "1px solid rgba(74,222,128,0.25)" : "1px solid rgba(255,255,255,0.07)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                  <span style={{ fontSize: 14, fontWeight: 700, color: "#f9fafb" }}>{ex.name}</span>
                                  {ex.anchor && <span style={{ background: "#f59e0b", color: "#111", fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 99, textTransform: "uppercase", letterSpacing: .5 }}>Ancla</span>}
                                </div>
                                {ex.note && <div style={{ fontSize: 11, color: "#64748b", marginTop: 3, fontStyle: "italic" }}>{ex.note}</div>}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, marginLeft: 8 }}>
                                {doneToday && <span style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80", fontSize: 11, fontWeight: 700, borderRadius: 99, padding: "3px 10px" }}>✓ Hecho</span>}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: lastLog ? 8 : 10 }}>
                              {[["Series", ex.sets], ["Reps", ex.reps], ["RIR", ex.rpe], ["Descanso", ex.rest]].map(([l, v]) => v && (
                                <div key={l} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "5px 10px", textAlign: "center" }}>
                                  <div style={{ fontSize: 9, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: .5 }}>{l}</div>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f9fafb" }}>{v}</div>
                                </div>
                              ))}
                            </div>
                            {lastLog && (
                              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "6px 10px", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>Ultima vez:</span>
                                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                  {lastLog.sets.slice(0, 3).map((s, si) => <span key={si} style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>{s.weight}×{s.reps}</span>)}
                                </div>
                                <span style={{ fontSize: 10, color: "#64748b", marginLeft: "auto" }}>{formatDate(lastLog.date)}</span>
                              </div>
                            )}
                            <button onClick={() => openLog(ex.name)} style={{ width: "100%", padding: "8px", borderRadius: 10, border: "none", background: doneToday ? "rgba(74,222,128,0.15)" : ex.anchor ? "#111827" : "rgba(255,255,255,0.08)", color: doneToday ? "#4ade80" : ex.anchor ? "#f59e0b" : "#e2e8f0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{doneToday ? "✓ Registrado" : "+ Registrar"}</button>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </>
              );
            })()}

          </div>
        )}

        {view === "history" && (
          <div className="sec">
            <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12, marginTop: 4 }}>Historial</div>
            <select value={histFilter} onChange={e => setHistFilter(e.target.value)} style={{ ...fld, marginBottom: 14 }}>
              <option value="">Todos los ejercicios</option>
              {allRoutineExercises.map(ex => <option key={ex}>{ex}</option>)}
            </select>
            {histFilter && (() => {
              const hist = data.sessions.filter(s => s.exercise === histFilter).sort((a, b) => new Date(a.date) - new Date(b.date));
              if (hist.length < 2) return null;
              const vols = hist.slice(-10).map(s => calcVolume(s.sets));
              const maxV = Math.max(...vols);
              return (
                <div style={{ background: "#1c2840", borderRadius: 16, padding: "14px 16px 12px", marginBottom: 12, border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Progresion de volumen</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 52 }}>
                    {vols.map((v, i) => <div key={i} style={{ flex: 1, borderRadius: "4px 4px 0 0", height: Math.max(4, (v / maxV) * 48), background: i === vols.length - 1 ? "#f59e0b" : "rgba(255,255,255,0.12)" }} />)}
                  </div>
                </div>
              );
            })()}
            {filteredHistory.length === 0
              ? <div style={{ textAlign: "center", padding: "50px 0", color: "#9ca3af" }}><div style={{ fontSize: 44, marginBottom: 12 }}>🏋</div><div style={{ fontSize: 14 }}>Sin sesiones registradas</div></div>
              : filteredHistory.map(s => (
                <div key={s.id} style={{ background: "#1c2840", borderRadius: 16, padding: 14, marginBottom: 8, border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#f9fafb" }}>{s.exercise}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{formatDate(s.date)} · {calcVolume(s.sets).toFixed(0)} kg</div>
                    </div>
                    <button onClick={() => setData(d => ({ ...d, sessions: d.sessions.filter(x => x.id !== s.id) }))} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 15 }}>✕</button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {s.sets.map((x, i) => (
                      <span key={i} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>
                        {x.weight} × {x.reps}{x.rir !== undefined ? <span style={{ color: "#64748b", fontWeight: 500 }}> RIR{x.rir}</span> : ""}
                      </span>
                    ))}
                  </div>
                  {s.notes && <div style={{ fontSize: 12, color: "#64748b", marginTop: 8, fontStyle: "italic" }}>{s.notes}</div>}
                </div>
              ))
            }
          </div>
        )}

        {view === "assistant" && (
          <div className="sec" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 180px)" }}>
            <div style={{ background: "#111827", borderRadius: 18, padding: "14px 16px", marginBottom: 14, flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 9, color: "#f59e0b", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>Resumen semanal</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", fontFamily: "Syne, sans-serif" }}>Analisis automatico</div>
                </div>
                <button onClick={generateWeekSummary} disabled={weekSummaryLoading} style={{ background: weekSummaryLoading ? "rgba(255,255,255,0.1)" : "#f59e0b", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, color: weekSummaryLoading ? "#6b7280" : "#111", cursor: "pointer" }}>
                  {weekSummaryLoading ? "..." : weekSummary ? "↻ Actualizar" : "Generar ✦"}
                </button>
              </div>
              {weekSummaryLoading && <div style={{ fontSize: 13, color: "#6b7280" }}>Analizando tu semana...</div>}
              {weekSummary && !weekSummaryLoading && <div style={{ fontSize: 13, color: "#d1d5db", lineHeight: 1.7 }} dangerouslySetInnerHTML={renderMarkdown(weekSummary)} />}
              {!weekSummary && !weekSummaryLoading && <div style={{ fontSize: 12, color: "#4b5563" }}>Pulsa "Generar" para analizar tu semana con IA</div>}
            </div>

            {assistantMessages.length === 0 && (
              <div style={{ marginBottom: 14, flexShrink: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Preguntas rapidas</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {["Como va mi progresion esta semana?", "En que ejercicio estoy mas estancado?", "Estoy haciendo suficiente volumen?", "Cuando deberia descargar?", "Analiza mi ultima sesion", "Planifícame la semana que viene"].map(q => (
                    <button key={q} onClick={() => sendAssistantMessage(q)} style={{ padding: "8px 14px", borderRadius: 99, border: "1.5px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", fontSize: 12, fontWeight: 600, color: "#cbd5e1", cursor: "pointer", textAlign: "left" }}>{q}</button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ flex: 1, overflowY: "auto", marginBottom: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              {(() => {
                const items = [];
                assistantMessages.forEach((msg, i) => {
                  const prevMsg = assistantMessages[i - 1];
                  const showSeparator = !prevMsg || !prevMsg.date || !msg.date ||
                    new Date(prevMsg.date).toDateString() !== new Date(msg.date).toDateString();
                  if (showSeparator && msg.date) {
                    items.push(
                      <div key={`sep-${i}`} style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0" }}>
                        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
                        <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>{getDateLabel(msg.date)}</span>
                        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
                      </div>
                    );
                  }
                  items.push(
                    <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                      {msg.role === "assistant" && <div style={{ width: 28, height: 28, borderRadius: 8, background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, marginRight: 8, flexShrink: 0, alignSelf: "flex-end" }}>✦</div>}
                      <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: msg.role === "user" ? "#1e3a5f" : "rgba(255,255,255,0.07)", color: "#f9fafb", fontSize: 13, lineHeight: 1.7, border: msg.role === "assistant" ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                        {msg.role === "assistant"
                          ? <span dangerouslySetInnerHTML={renderMarkdown(msg.content)} />
                          : msg.content}
                      </div>
                    </div>
                  );
                });
                return items;
              })()}
              {assistantLoading && (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>✦</div>
                  <div style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px 18px 18px 4px", padding: "10px 16px" }}>
                    <span style={{ display: "inline-block", animation: "spin 1s linear infinite", color: "#64748b" }}>◌</span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ flexShrink: 0, display: "flex", gap: 8, paddingBottom: 4 }}>
              {assistantMessages.length > 0 && <button onClick={() => setAssistantMessages([])} style={{ width: 46, height: 46, borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#64748b", fontSize: 16, cursor: "pointer", flexShrink: 0 }}>↺</button>}
              <input placeholder="Pregunta lo que quieras..." value={assistantInput} onChange={e => setAssistantInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !assistantLoading && sendAssistantMessage(assistantInput)} style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", color: "#f9fafb" }} />
              <button onClick={() => sendAssistantMessage(assistantInput)} disabled={assistantLoading || !assistantInput.trim()} style={{ width: 46, height: 46, borderRadius: 12, border: "none", background: assistantLoading || !assistantInput.trim() ? "rgba(255,255,255,0.06)" : "#f59e0b", color: assistantLoading || !assistantInput.trim() ? "#475569" : "#111", fontSize: 18, cursor: "pointer", flexShrink: 0 }}>→</button>
            </div>
          </div>
        )}

      </div>

      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "rgba(13,17,23,0.96)", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", padding: "8px 12px 22px", gap: 6, zIndex: 100, backdropFilter: "blur(12px)" }}>
        {NAV.map(nav => (
          <button key={nav.id} onClick={() => nav.id === "log" ? (setLogExercise(allRoutineExercises[0]), setView("log")) : setView(nav.id)} style={{ flex: nav.primary ? 1.4 : 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: "10px 6px", borderRadius: 14, border: "none", cursor: "pointer", background: nav.primary ? "#1e2d4a" : view === nav.id && nav.sparkle ? "#1e2d4a" : view === nav.id ? "rgba(255,255,255,0.08)" : "transparent", color: nav.primary ? "#f59e0b" : view === nav.id && nav.sparkle ? "#f59e0b" : view === nav.id ? "#f9fafb" : "#64748b", transition: "all .15s" }}>
            {nav.sparkle ? <span style={{ fontSize: 20, lineHeight: 1 }}>✦</span> : <Icon d={nav.icon} size={21} />}
            <span style={{ fontSize: 10, fontWeight: 700 }}>{nav.label}</span>
          </button>
        ))}
      </div>

      {editingExercise !== null && (() => {
        const { dayIdx, blockIdx, exIdx } = editingExercise;
        return <ExerciseEditPanel exercise={routine[dayIdx].blocks[blockIdx].exercises[exIdx]} onSave={saveExerciseEdit} onClose={() => setEditingExercise(null)} />;
      })()}

      {aiExercise && <AIPanel exercise={aiExercise} sessions={data.sessions} onClose={() => setAiExercise(null)} />}

      {detailExercise && <ExerciseDetailPanel exercise={detailExercise} sessions={data.sessions} onClose={() => setDetailExercise(null)} onLog={openLog} />}
      {editingTemplate !== null && <TemplateEditorPanel template={editingTemplate} onSave={saveTemplate} onDelete={deleteTemplate} onClose={() => setEditingTemplate(null)} />}
      {editingSession !== null && <SessionEditPanel sessionIdx={editingSession} day={routine[editingSession]} onSave={updatedDay => { const r = JSON.parse(JSON.stringify(routine)); r[editingSession] = updatedDay; setRoutine(r); setEditingSession(null); showToast("Sesión actualizada"); }} onDelete={() => { if (window.confirm("¿Eliminar esta sesión y convertir en descanso?")) { const r = JSON.parse(JSON.stringify(routine)); r[editingSession] = { day: routine[editingSession].day, label: "Descanso", sub: "Sin entrenamiento", duration: "Recuperación", rest: true, blocks: [] }; setRoutine(r); setEditingSession(null); showToast("Sesión eliminada"); } }} onClose={() => setEditingSession(null)} />}

      {toast && (
        <div style={{ position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", background: "#111827", color: "#fff", borderRadius: 12, padding: "12px 22px", fontSize: 14, fontWeight: 600, zIndex: 999, animation: "toastFade 2.2s ease forwards", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
