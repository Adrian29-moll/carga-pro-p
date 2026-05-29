import { useState, useEffect, useRef, useMemo } from "react";

const STORAGE_KEY = "gym_tracker_v2";
const ROUTINE_KEY = "gym_routine_v1";
const OVERRIDES_KEY = "gym_week_overrides";
const TEMPLATES_KEY = "gym_templates_v1";

const DEFAULT_ROUTINE = [
  { day: "Lun", label: "Push A", sub: "Fuerza pectoral", duration: "~60 min", blocks: [
    { name: "Fuerza", exercises: [
      { name: "Press banca plano", sets: 5, reps: "3-5", rpe: "8-9", rest: "3-4 min", anchor: true, note: "Cuando completes 5x5 limpio, sube 2.5 kg" },
    ]},
    { name: "Hipertrofia pecho", exercises: [
      { name: "Press inclinado mancuernas", sets: 3, reps: "8-10", rpe: "7-8", rest: "2 min", note: "Rango completo, no bloquear codos" },
      { name: "Aperturas en polea baja", sets: 3, reps: "12-15", rpe: "7", rest: "90 s", note: "Cable cruzado, foco en aduccion final" },
    ]},
    { name: "Hombro y triceps", exercises: [
      { name: "Press militar barra", sets: 3, reps: "6-8", rpe: "7-8", rest: "2 min", note: "De pie o sentado, barra libre" },
      { name: "Elevaciones laterales cable", sets: 3, reps: "15-20", rpe: "7", rest: "60 s", note: "Unilateral, codo ligeramente flexionado" },
      { name: "Extension triceps polea alta", sets: 3, reps: "12-15", rpe: "7", rest: "60 s", note: "Cuerda o barra recta" },
    ]},
  ]},
  { day: "Mar", label: "Pull A", sub: "Espalda vertical", duration: "~55 min + Run Z2", blocks: [
    { name: "Fuerza traccion vertical", exercises: [
      { name: "Dominadas lastradas", sets: 4, reps: "4-6", rpe: "8", rest: "3 min", anchor: true, note: "Alt: jalon agarre prono con carga progresiva" },
    ]},
    { name: "Hipertrofia espalda", exercises: [
      { name: "Remo pecho apoyado maquina", sets: 3, reps: "8-10", rpe: "7-8", rest: "2 min" },
      { name: "Pullover en polea", sets: 3, reps: "12-15", rpe: "7", rest: "90 s" },
    ]},
    { name: "Biceps y rotadores", exercises: [
      { name: "Curl barra EZ", sets: 3, reps: "8-10", rpe: "7", rest: "90 s" },
      { name: "Face pull en polea", sets: 3, reps: "15-20", rpe: "6-7", rest: "60 s" },
    ]},
  ]},
  { day: "Mie", label: "Descanso", sub: "Recuperacion", duration: "Movilidad 10-15 min", rest: true, blocks: [] },
  { day: "Jue", label: "Push B", sub: "Volumen pectoral + hombro", duration: "~60 min", blocks: [
    { name: "Fuerza pecho variante", exercises: [
      { name: "Press banca inclinado barra", sets: 4, reps: "6-8", rpe: "7-8", rest: "2-3 min" },
    ]},
    { name: "Hipertrofia pecho bajo y medio", exercises: [
      { name: "Press en maquina pecho", sets: 3, reps: "10-12", rpe: "7", rest: "90 s" },
      { name: "Fondos lastrados paralelas", sets: 3, reps: "8-10", rpe: "7-8", rest: "2 min" },
    ]},
    { name: "Hombro lateral y triceps", exercises: [
      { name: "Press Arnold mancuernas", sets: 3, reps: "10-12", rpe: "7", rest: "90 s" },
      { name: "Elevaciones laterales mancuernas", sets: 3, reps: "15-20", rpe: "7", rest: "60 s" },
      { name: "Press frances mancuerna", sets: 3, reps: "10-12", rpe: "7", rest: "90 s" },
    ]},
  ]},
  { day: "Vie", label: "Pull B", sub: "Espalda horizontal + peso muerto", duration: "~60 min", blocks: [
    { name: "Fuerza traccion horizontal", exercises: [
      { name: "Peso muerto convencional", sets: 4, reps: "4-5", rpe: "8", rest: "3-4 min", anchor: true, note: "RPE max 8, el sabado toca sentadilla" },
    ]},
    { name: "Hipertrofia espalda horizontal", exercises: [
      { name: "Remo con barra Pendlay", sets: 3, reps: "6-8", rpe: "7-8", rest: "2 min" },
      { name: "Remo polea baja agarre neutro", sets: 3, reps: "10-12", rpe: "7", rest: "90 s" },
    ]},
    { name: "Biceps y posterior hombro", exercises: [
      { name: "Curl martillo mancuernas", sets: 3, reps: "10-12", rpe: "7", rest: "90 s" },
      { name: "Pajaro mancuernas o polea", sets: 3, reps: "15-20", rpe: "6-7", rest: "60 s" },
    ]},
  ]},
  { day: "Sab", label: "Legs A+B", sub: "Sesion fusionada", duration: "~75 min", blocks: [
    { name: "Dominante rodilla (Legs A)", exercises: [
      { name: "Sentadilla barra libre", sets: 4, reps: "5-6", rpe: "8", rest: "3 min", anchor: true, note: "Siempre primero" },
      { name: "Prensa inclinada pies altos", sets: 3, reps: "10-12", rpe: "7", rest: "2 min" },
      { name: "Curl femoral tumbado maquina", sets: 3, reps: "10-12", rpe: "7", rest: "90 s" },
    ]},
    { name: "Dominante cadera (Legs B)", exercises: [
      { name: "Hip thrust banco con barra", sets: 3, reps: "8-10", rpe: "7-8", rest: "2 min" },
      { name: "RDL mancuernas o barra", sets: 3, reps: "8-10", rpe: "7", rest: "2 min" },
    ]},
    { name: "Accesorio y gemelo", exercises: [
      { name: "Extension cuadriceps maquina", sets: 2, reps: "15-20", rpe: "6-7", rest: "60 s" },
      { name: "Elevacion de talones de pie", sets: 3, reps: "12-15", rpe: "7", rest: "60 s" },
    ]},
  ]},
  { day: "Dom", label: "Trail Z2", sub: "Recuperacion activa", duration: "45-60 min", rest: true, blocks: [] },
];

function loadData() {
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (current) return current;
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

function ExerciseDetailPanel({ exercise, sessions, onClose, onLog }) {
  const [tab, setTab] = useState("charts");
  const hist = [...sessions.filter(s => s.exercise === exercise)].sort((a, b) => new Date(a.date) - new Date(b.date));
  const recent = hist.slice(-10);
  const volumes = recent.map(s => calcVolume(s.sets));
  const maxWeights = recent.map(s => Math.max(0, ...s.sets.map(x => parseFloat(x.weight) || 0)));
  const dates = recent.map(s => formatDate(s.date));
  const pb = hist.length ? Math.max(0, ...hist.flatMap(s => s.sets.map(x => parseFloat(x.weight) || 0))) : 0;
  const totalSets = hist.reduce((a, s) => a + s.sets.length, 0);

  function BarChart() {
    if (!volumes.length) return null;
    const W = 300, H = 80;
    const maxV = Math.max(...volumes, 1);
    const barW = W / volumes.length;
    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H + 18}`} style={{ overflow: "visible" }}>
        {volumes.map((v, i) => {
          const bh = Math.max(4, (v / maxV) * H);
          const x = i * barW + 2;
          const w = barW - 4;
          const isLast = i === volumes.length - 1;
          return (
            <g key={i}>
              <rect x={x} y={H - bh} width={w} height={bh} rx={3} fill={isLast ? "#f59e0b" : "rgba(255,255,255,0.15)"} />
              {(i === 0 || isLast) && <text x={x + w / 2} y={H + 13} textAnchor="middle" fontSize={8} fill="#64748b">{dates[i]}</text>}
            </g>
          );
        })}
      </svg>
    );
  }

  function LineChart() {
    if (maxWeights.length < 2) return null;
    const W = 300, H = 70;
    const maxW = Math.max(...maxWeights, 1), minW = Math.min(...maxWeights);
    const range = maxW - minW || 1;
    const pts = maxWeights.map((v, i) => [
      (i / (maxWeights.length - 1)) * W,
      H - ((v - minW) / range) * (H - 12) - 6,
    ]);
    const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
    const area = `M${pts[0][0]},${H} ${pts.map(([x, y]) => `L${x},${y}`).join(" ")} L${pts.at(-1)[0]},${H} Z`;
    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H + 18}`} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#ag)" />
        <polyline points={line} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 4 : 2.5} fill={i === pts.length - 1 ? "#f59e0b" : "rgba(245,158,11,0.5)"} />)}
        {[0, maxWeights.length - 1].map(i => (
          <text key={i} x={pts[i][0]} y={H + 13} textAnchor={i === 0 ? "start" : "end"} fontSize={8} fill="#64748b">{dates[i]}</text>
        ))}
        <text x={pts.at(-1)[0]} y={pts.at(-1)[1] - 8} textAnchor="end" fontSize={9} fill="#f59e0b" fontWeight="700">{maxWeights.at(-1)} kg</text>
      </svg>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", background: "linear-gradient(160deg, #1c2840 0%, #111827 100%)", borderRadius: "24px 24px 0 0", maxHeight: "88vh", display: "flex", flexDirection: "column", animation: "slideUp .28s cubic-bezier(.32,.72,0,1)", border: "1px solid rgba(255,255,255,0.1)", borderBottom: "none" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 8px", flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.15)" }} />
        </div>
        <div style={{ padding: "0 20px 12px", flexShrink: 0 }}>
          <div style={{ fontSize: 9, color: "#f59e0b", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>Ejercicio</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "Syne, sans-serif", marginBottom: 14 }}>{exercise}</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {[["Sesiones", hist.length], ["PB", pb > 0 ? pb + " kg" : "—"], ["Series tot.", totalSets]].map(([label, value]) => (
              <div key={label} style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "10px 8px", border: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#f9fafb" }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 4, gap: 4 }}>
            {[["charts", "Gráficas"], ["history", "Historial"]].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: "8px", borderRadius: 9, border: "none", cursor: "pointer", background: tab === id ? "#f59e0b" : "transparent", color: tab === id ? "#111" : "#64748b", fontSize: 12, fontWeight: 700, transition: "all .15s" }}>{label}</button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px" }}>
          {tab === "charts" && (
            recent.length < 2
              ? <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}><div style={{ fontSize: 36, marginBottom: 10 }}>📊</div><div style={{ fontSize: 13 }}>Necesitas al menos 2 sesiones para ver gráficas</div></div>
              : <>
                  <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: "14px 16px", marginBottom: 12, border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Volumen por sesión</div>
                    <BarChart />
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                      <span style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700 }}>Última: {volumes.at(-1)?.toFixed(0)} kg·reps</span>
                    </div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: "14px 16px", marginBottom: 12, border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>Peso máximo</div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>Mín {Math.min(...maxWeights)} · Máx {Math.max(...maxWeights)} kg</div>
                    </div>
                    <LineChart />
                  </div>
                </>
          )}
          {tab === "history" && (
            hist.length === 0
              ? <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}><div style={{ fontSize: 36, marginBottom: 10 }}>🏋</div><div style={{ fontSize: 13 }}>Sin sesiones registradas</div></div>
              : [...hist].reverse().map(s => (
                  <div key={s.id} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px 14px", marginBottom: 8, border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#f9fafb" }}>{formatDate(s.date)}</span>
                      <span style={{ fontSize: 11, color: "#64748b" }}>{calcVolume(s.sets).toFixed(0)} kg vol.</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {s.sets.map((x, si) => (
                        <span key={si} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 600, color: "#e5e7eb" }}>
                          {x.weight} × {x.reps}{x.rir !== undefined ? <span style={{ color: "#64748b" }}> R{x.rir}</span> : ""}
                        </span>
                      ))}
                    </div>
                    {s.notes && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6, fontStyle: "italic" }}>{s.notes}</div>}
                  </div>
                ))
          )}
        </div>

        <div style={{ padding: "12px 20px 36px", flexShrink: 0 }}>
          <button onClick={() => { onLog(exercise); onClose(); }} style={{ width: "100%", padding: 15, borderRadius: 14, border: "none", background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "#111827", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
            + Registrar sesión
          </button>
        </div>
      </div>
    </div>
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
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", background: "linear-gradient(160deg, #1c2840 0%, #111827 100%)", borderRadius: "24px 24px 0 0", padding: "0 20px 36px", maxHeight: "80vh", overflowY: "auto", animation: "slideUp .28s cubic-bezier(.32,.72,0,1)", border: "1px solid rgba(255,255,255,0.1)", borderBottom: "none" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 10px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.15)" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #f59e0b, #f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🤖</div>
          <div>
            <div style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>IA Entrenador</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "Syne, sans-serif" }}>{exercise}</div>
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px 16px", fontSize: 14, lineHeight: 1.8, color: "#e5e7eb", marginBottom: 16, minHeight: 80, border: "1px solid rgba(255,255,255,0.08)" }}>
          {loading ? <span style={{ color: "#64748b" }}>Analizando...</span> : response}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {chips.map(q => (
            <button key={q} onClick={() => ask(q)} disabled={loading} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 99, padding: "6px 14px", fontSize: 12, color: "#cbd5e1", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{q}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input placeholder="Pregunta lo que quieras..." value={customQ} onChange={e => setCustomQ(e.target.value)} onKeyDown={e => e.key === "Enter" && customQ && ask(customQ)}
            style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
          <button onClick={() => customQ ? ask(customQ) : ask()} disabled={loading}
            style={{ width: 50, height: 50, borderRadius: 12, border: "none", background: loading ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #f59e0b, #f97316)", color: "#111", fontSize: 18, cursor: "pointer" }}>→</button>
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
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", background: "linear-gradient(160deg, #1c2840 0%, #111827 100%)", borderRadius: "24px 24px 0 0", padding: "0 20px 36px", maxHeight: "85vh", overflowY: "auto", animation: "slideUp .25s cubic-bezier(.32,.72,0,1)", border: "1px solid rgba(255,255,255,0.1)", borderBottom: "none" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 8px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.15)" }} />
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Editar ejercicio</div>
        <label style={lbl}>Nombre</label>
        <input value={form.name} onChange={e => update("name", e.target.value)} style={{ ...fld, marginBottom: 12 }} />
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
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, padding: "12px 14px", background: "rgba(255,255,255,0.06)", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.1)" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f9fafb" }}>Ejercicio ancla</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Ejercicio principal de la sesion</div>
          </div>
          <button onClick={() => update("anchor", !form.anchor)} style={{ width: 44, height: 26, borderRadius: 99, border: "none", cursor: "pointer", background: form.anchor ? "#f59e0b" : "#374151", position: "relative", transition: "background .2s" }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: form.anchor ? 21 : 3, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }} />
          </button>
        </div>
        <button onClick={() => onSave(form)} style={{ width: "100%", padding: 15, borderRadius: 14, border: "none", background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "#111827", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          Guardar cambios
        </button>
      </div>
    </div>
  );
}

function TemplateEditorPanel({ template, allExercises, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({ ...template, blocks: JSON.parse(JSON.stringify(template.blocks || [])) });
  const [newExInput, setNewExInput] = useState(() => (template.blocks || []).map(() => ""));
  const isNew = !template.name;

  function addBlock() {
    setForm(f => ({ ...f, blocks: [...f.blocks, { name: "Bloque " + (f.blocks.length + 1), exercises: [] }] }));
    setNewExInput(prev => [...prev, ""]);
  }
  function removeBlock(bi) {
    setForm(f => ({ ...f, blocks: f.blocks.filter((_, i) => i !== bi) }));
    setNewExInput(prev => prev.filter((_, i) => i !== bi));
  }
  function updateBlockName(bi, name) {
    setForm(f => { const blocks = JSON.parse(JSON.stringify(f.blocks)); blocks[bi].name = name; return { ...f, blocks }; });
  }
  function addExercise(bi) {
    const name = (newExInput[bi] || "").trim();
    if (!name) return;
    setForm(f => { const blocks = JSON.parse(JSON.stringify(f.blocks)); blocks[bi].exercises.push({ name, sets: 3, reps: "8-12", rpe: "7", rest: "90 s" }); return { ...f, blocks }; });
    setNewExInput(prev => { const n = [...prev]; n[bi] = ""; return n; });
  }
  function removeExercise(bi, ei) {
    setForm(f => { const blocks = JSON.parse(JSON.stringify(f.blocks)); blocks[bi].exercises.splice(ei, 1); return { ...f, blocks }; });
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 250, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", background: "linear-gradient(160deg, #1c2840 0%, #111827 100%)", borderRadius: "24px 24px 0 0", maxHeight: "92vh", display: "flex", flexDirection: "column", animation: "slideUp .28s cubic-bezier(.32,.72,0,1)", border: "1px solid rgba(255,255,255,0.1)", borderBottom: "none" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 8px", flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.15)" }} />
        </div>
        <div style={{ padding: "0 20px 12px", flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
            {isNew ? "Nueva plantilla" : "Editar plantilla"}
          </div>
          <input placeholder="Nombre (ej. Torso, Full Body...)" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ ...fld, marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="Subtítulo opcional" value={form.sub || ""} onChange={e => setForm(f => ({ ...f, sub: e.target.value }))} style={{ ...fld, flex: 1 }} />
            <input placeholder="Duración" value={form.duration || ""} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} style={{ ...fld, flex: 1 }} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 12px" }}>
          {form.blocks.map((block, bi) => (
            <div key={bi} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: "12px 14px", marginBottom: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <input value={block.name} onChange={e => updateBlockName(bi, e.target.value)} style={{ flex: 1, background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.15)", color: "#f9fafb", fontSize: 13, fontWeight: 700, outline: "none", paddingBottom: 3 }} />
                <button onClick={() => removeBlock(bi)} style={{ background: "none", border: "none", color: "#4b5563", fontSize: 18, cursor: "pointer" }}>✕</button>
              </div>
              {block.exercises.map((ex, ei) => (
                <div key={ei} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontSize: 13, color: "#e5e7eb" }}>{ex.name}</span>
                  <button onClick={() => removeExercise(bi, ei)} style={{ background: "none", border: "none", color: "#4b5563", fontSize: 14, cursor: "pointer" }}>✕</button>
                </div>
              ))}
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <input list={`exlist-${bi}`} placeholder="Añadir ejercicio..." value={newExInput[bi] || ""} onChange={e => setNewExInput(prev => { const n = [...prev]; n[bi] = e.target.value; return n; })} onKeyDown={e => e.key === "Enter" && addExercise(bi)} style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 13, outline: "none" }} />
                <datalist id={`exlist-${bi}`}>{allExercises.map(ex => <option key={ex} value={ex} />)}</datalist>
                <button onClick={() => addExercise(bi)} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "rgba(245,158,11,0.2)", color: "#f59e0b", fontSize: 18, fontWeight: 700, cursor: "pointer" }}>+</button>
              </div>
            </div>
          ))}
          <button onClick={addBlock} style={{ width: "100%", padding: 10, borderRadius: 12, border: "1.5px dashed rgba(255,255,255,0.15)", background: "none", color: "#64748b", fontSize: 13, cursor: "pointer", marginBottom: 10 }}>+ Añadir bloque</button>
        </div>
        <div style={{ padding: "8px 20px 36px", flexShrink: 0 }}>
          <button onClick={() => { if (!form.name.trim()) return; onSave(form); }} style={{ width: "100%", padding: 15, borderRadius: 14, border: "none", background: form.name.trim() ? "linear-gradient(135deg, #f59e0b, #f97316)" : "rgba(255,255,255,0.08)", color: form.name.trim() ? "#111827" : "#4b5563", fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>
            {isNew ? "Crear plantilla" : "Guardar cambios"}
          </button>
          {!isNew && (
            <button onClick={() => onDelete(form.id)} style={{ width: "100%", padding: 12, borderRadius: 14, border: "1.5px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#f87171", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Eliminar plantilla
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SliderInput({ label, value, onChange, min = 0, max = 100, step = 1, unit = "", sessions = [], exercise = "" }) {
  const itemH = 44;
  const padding = 2;
  const drumRef = useRef(null);
  const listRef = useRef(null);
  const startY = useRef(null);
  const startIdx = useRef(null);

  const values = useMemo(() => {
    const arr = [];
    if (unit === "kg") {
      for (let w = 0; w <= 200; w += 1.25) arr.push(Math.round(w * 100) / 100);
    } else {
      for (let r = min; r <= max; r += step) arr.push(r);
    }
    return arr;
  }, [unit, min, max, step]);

  const currentIdx = useMemo(() => {
    const v = parseFloat(value) || 0;
    let closest = 0;
    let minDiff = Infinity;
    values.forEach((val, i) => {
      const diff = Math.abs(val - v);
      if (diff < minDiff) { minDiff = diff; closest = i; }
    });
    return closest;
  }, [value, values]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.style.transition = "transform 0.15s ease";
    listRef.current.style.transform = `translateY(${-currentIdx * itemH}px)`;
    const items = listRef.current.querySelectorAll(".pick-item");
    items.forEach((el, i) => {
      el.style.opacity = i === currentIdx ? "1" : "0.3";
      el.style.fontSize = i === currentIdx ? "22px" : "16px";
      el.style.fontWeight = i === currentIdx ? "700" : "400";
    });
  }, [currentIdx]);

  function setIdx(idx) {
    const clamped = Math.max(0, Math.min(values.length - 1, idx));
    onChange(String(values[clamped]));
  }

  function onMouseDown(e) { startY.current = e.clientY; startIdx.current = currentIdx; e.preventDefault(); }
  function onMouseMove(e) {
    if (startY.current === null) return;
    const delta = Math.round((startY.current - e.clientY) / itemH);
    setIdx(startIdx.current + delta);
  }
  function onMouseUp() { startY.current = null; }

  function onTouchStart(e) { startY.current = e.touches[0].clientY; startIdx.current = currentIdx; }
  function onTouchMove(e) {
    if (startY.current === null) return;
    const delta = Math.round((startY.current - e.touches[0].clientY) / itemH);
    setIdx(startIdx.current + delta);
    e.preventDefault();
  }
  function onTouchEnd() { startY.current = null; }

  function onWheel(e) { e.preventDefault(); setIdx(currentIdx + (e.deltaY > 0 ? 1 : -1)); }

  useEffect(() => {
    const drum = drumRef.current;
    if (!drum) return;
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    drum.addEventListener("wheel", onWheel, { passive: false });
    drum.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      drum.removeEventListener("wheel", onWheel);
      drum.removeEventListener("touchmove", onTouchMove);
    };
  }, [currentIdx]);

  const displayVal = values[currentIdx] ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
      <div ref={drumRef} onMouseDown={onMouseDown} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
        style={{ width: "100%", height: itemH * 5, overflow: "hidden", position: "relative", background: "rgba(255,255,255,0.05)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.09)", cursor: "ns-resize", userSelect: "none" }}>
        <div style={{ position: "absolute", top: "50%", left: 8, right: 8, transform: "translateY(-50%)", height: itemH, borderTop: "1.5px solid rgba(245,158,11,0.6)", borderBottom: "1.5px solid rgba(245,158,11,0.6)", borderRadius: 4, zIndex: 1, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: itemH * 2, background: "linear-gradient(to bottom, rgba(13,17,23,0.9), transparent)", zIndex: 2, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: itemH * 2, background: "linear-gradient(to top, rgba(13,17,23,0.9), transparent)", zIndex: 2, pointerEvents: "none" }} />
        <div ref={listRef} style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: itemH * padding, paddingBottom: itemH * padding }}>
          {values.map((v, i) => (
            <div key={i} className="pick-item" style={{ height: itemH, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", color: "#f9fafb", transition: "all 0.1s", flexShrink: 0, fontFamily: "Syne, sans-serif" }}>
              {unit === "kg" ? (Number.isInteger(v) ? v : v.toFixed(2)) : v}
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{unit}</div>
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

const RIR_OPTIONS = ["0", "1", "2", "3", "4+"];
function SetRow({ set, idx, onChange, onRemove, isOnly, sessions = [], exercise = "" }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: "10px 14px 12px", marginBottom: 8, border: "1.5px solid rgba(255,255,255,0.09)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div style={{ width: 24, height: 24, borderRadius: 7, background: "rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#f59e0b", flexShrink: 0, border: "1px solid rgba(245,158,11,0.3)" }}>{idx + 1}</div>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", flex: 1 }}>Serie {idx + 1}</span>
        {!isOnly && <button onClick={() => onRemove(idx)} style={{ background: "none", border: "none", cursor: "pointer", color: "#4b5563", fontSize: 15, padding: "0 2px" }}>✕</button>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        <SliderInput label="Peso" value={set.weight} onChange={v => onChange(idx, "weight", v)}
          min={0} max={100} step={2.5} unit="kg" sessions={sessions} exercise={exercise} />
        <SliderInput label="Reps" value={set.reps} onChange={v => onChange(idx, "reps", v)}
          min={1} max={30} step={1} unit="reps" />
      </div>

      <div>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>RIR (reps en reserva)</div>
        <div style={{ display: "flex", gap: 6 }}>
          {RIR_OPTIONS.map(r => (
            <button key={r} onClick={() => onChange(idx, "rir", r)} style={{ flex: 1, padding: "7px 0", borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all .12s", background: set.rir === r ? "#f59e0b" : "rgba(255,255,255,0.05)", color: set.rir === r ? "#111827" : "#64748b", border: set.rir === r ? "none" : "1.5px solid rgba(255,255,255,0.1)" }}>{r}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

const fld = { width: "100%", padding: "11px 12px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.12)", fontSize: 15, fontFamily: "'DM Sans', sans-serif", background: "rgba(255,255,255,0.06)", color: "#f9fafb", WebkitAppearance: "none" };
const lbl = { display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 };

const MUSCLE_MAP = {
  "Press banca plano": "Pecho", "Press banca inclinado barra": "Pecho", "Press inclinado mancuernas": "Pecho", "Press en maquina pecho": "Pecho", "Aperturas en polea baja": "Pecho", "Fondos lastrados paralelas": "Pecho",
  "Dominadas lastradas": "Espalda", "Remo pecho apoyado maquina": "Espalda", "Pullover en polea": "Espalda", "Remo con barra Pendlay": "Espalda", "Remo polea baja agarre neutro": "Espalda",
  "Press militar barra": "Hombro", "Press Arnold mancuernas": "Hombro", "Elevaciones laterales cable": "Hombro", "Elevaciones laterales mancuernas": "Hombro", "Face pull en polea": "Hombro", "Pajaro mancuernas o polea": "Hombro",
  "Curl barra EZ": "Biceps", "Curl martillo mancuernas": "Biceps",
  "Extension triceps polea alta": "Triceps", "Press frances mancuerna": "Triceps",
  "Sentadilla barra libre": "Cuadriceps", "Prensa inclinada pies altos": "Cuadriceps", "Extension cuadriceps maquina": "Cuadriceps",
  "Peso muerto convencional": "Posterior", "RDL mancuernas o barra": "Posterior", "Curl femoral tumbado maquina": "Posterior", "Hip thrust banco con barra": "Posterior",
  "Elevacion de talones de pie": "Gemelo",
};

const RECOMMENDED_SETS = {
  "Pecho": { min: 10, max: 20 }, "Espalda": { min: 10, max: 20 }, "Hombro": { min: 12, max: 20 },
  "Biceps": { min: 8, max: 14 }, "Triceps": { min: 8, max: 14 }, "Cuadriceps": { min: 10, max: 20 },
  "Posterior": { min: 10, max: 20 }, "Gemelo": { min: 8, max: 16 },
};

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
  const [assistantMessages, setAssistantMessages] = useState([]);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);
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
  const touchStartX = useRef(null);

  useEffect(() => { saveData(data); }, [data]);
  useEffect(() => { saveRoutine(routine); }, [routine]);
  useEffect(() => { localStorage.setItem(OVERRIDES_KEY, JSON.stringify(weekOverrides)); }, [weekOverrides]);
  useEffect(() => { localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates)); }, [templates]);
  useEffect(() => { localStorage.setItem("gym_pinned_exercises", JSON.stringify(pinnedExercises)); }, [pinnedExercises]);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 2200); }

  function getSessionForDay(dayIdx) { const k = getWeekKey(dayIdx); return weekOverrides[k] !== undefined ? weekOverrides[k] : dayIdx; }
  function setSessionForDay(dayIdx, sessionIdx) { setWeekOverrides(prev => ({ ...prev, [getWeekKey(dayIdx)]: sessionIdx })); }
  function resetSessionForDay(dayIdx) { setWeekOverrides(prev => { const n = {...prev}; delete n[getWeekKey(dayIdx)]; return n; }); }

  function resolveSession(key) {
    if (typeof key === "string" && key.startsWith("t-")) {
      return templates.find(t => t.id === key) || routine[0];
    }
    return routine[typeof key === "number" ? key : parseInt(key)] || routine[0];
  }

  function handleSwipeTouchStart(e) { touchStartX.current = e.touches[0].clientX; }
  function handleSwipeTouchEnd(e) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 60) setRoutineDay(d => dx < 0 ? (d + 1) % 7 : (d + 6) % 7);
    touchStartX.current = null;
  }

  function saveTemplate(form) {
    setTemplates(prev => prev.find(t => t.id === form.id) ? prev.map(t => t.id === form.id ? form : t) : [...prev, form]);
    setEditingTemplate(null);
    showToast(form.name + " guardada");
  }
  function deleteTemplate(id) {
    setTemplates(prev => prev.filter(t => t.id !== id));
    setWeekOverrides(prev => { const n = { ...prev }; Object.keys(n).forEach(k => { if (n[k] === id) delete n[k]; }); return n; });
    setEditingTemplate(null);
    showToast("Plantilla eliminada");
  }

  function buildContext() {
    const now = new Date();
    const sow = new Date(now); sow.setDate(now.getDate() - now.getDay());
    const weekSess = data.sessions.filter(s => new Date(s.date) >= sow);
    const recent = [...data.sessions].sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0,10);
    const todayRoutine = resolveSession(getSessionForDay([6,0,1,2,3,4,5][now.getDay()]));
    const sessText = recent.map(s => formatDate(s.date) + " - " + s.exercise + ": " + s.sets.map(x => x.weight + "kg x" + x.reps + (x.rir !== undefined ? " RIR" + x.rir : "")).join(", ")).join("\n");
    const volMap = weekSess.reduce((acc, s) => { const m = MUSCLE_MAP[s.exercise] || "Otro"; acc[m] = (acc[m]||0) + s.sets.length; return acc; }, {});
    const volText = Object.entries(volMap).map(([m,n]) => m + ": " + n + " series").join(", ");
    return "CONTEXTO DEL ATLETA:\nRutina: PPL 5 dias\nHoy toca: " + todayRoutine.label + " - " + todayRoutine.sub + "\nSesiones esta semana: " + weekSess.length + "\nVolumen semanal: " + (volText || "Sin datos") + "\n\nULTIMAS 10 SESIONES:\n" + (sessText || "Sin sesiones registradas");
  }

  async function sendAssistantMessage(text) {
    if (!text.trim()) return;
    const userMsg = { role: "user", content: text };
    const newMessages = [...assistantMessages, userMsg];
    setAssistantMessages(newMessages);
    setAssistantInput("");
    setAssistantLoading(true);
    const context = buildContext();
    const systemPrompt = "Eres un entrenador personal experto en fuerza e hipertrofia. Tienes acceso completo al historial de entrenamiento del atleta. Respondes en espanol, de forma directa, practica y motivadora. Maximo 200 palabras por respuesta.\n\n" + context;
    const msgText = newMessages.map(m => (m.role === "user" ? "Usuario" : "Asistente") + ": " + m.content).join("\n");
    try {
      const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msgText, system: systemPrompt }) });
      const d = await res.json();
      setAssistantMessages([...newMessages, { role: "assistant", content: d.text || "Error al conectar." }]);
    } catch { setAssistantMessages([...newMessages, { role: "assistant", content: "Error de conexion." }]); }
    setAssistantLoading(false);
  }

  async function generateWeekSummary() {
    setWeekSummaryLoading(true);
    const context = buildContext();
    try {
      const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: context + "\n\nGenera un resumen breve de la semana actual del atleta. Incluye: sesiones completadas, volumen por grupo muscular vs recomendado, ejercicio que mejor va y uno a vigilar. Maximo 120 palabras. Formato directo, sin introduccion." }) });
      const d = await res.json();
      setWeekSummary(d.text || null);
    } catch { setWeekSummary(null); }
    setWeekSummaryLoading(false);
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
    setData(d => ({ ...d, sessions: [...d.sessions, { id: Date.now(), exercise: logExercise, date: logDate, sets: valid, notes }] }));
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

  const allRoutineExercises = [];
  routine.forEach(day => { if (day.rest) return; day.blocks.forEach(block => { block.exercises.forEach(ex => { if (!allRoutineExercises.includes(ex.name)) allRoutineExercises.push(ex.name); }); }); });

  const now2 = new Date();
  const sow2 = new Date(now2); sow2.setDate(now2.getDate() - now2.getDay());
  const weekSessions = data.sessions.filter(s => new Date(s.date) >= sow2);
  const weeklyVolume = {};
  weekSessions.forEach(s => { const muscle = MUSCLE_MAP[s.exercise] || "Otro"; weeklyVolume[muscle] = (weeklyVolume[muscle] || 0) + s.sets.length; });

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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
        input:focus,select:focus,textarea:focus{outline:2px solid #f59e0b;border-color:#f59e0b!important}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes popIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes toastFade{0%,75%{opacity:1}100%{opacity:0}}
        .sec{animation:popIn .22s ease}
        ::-webkit-scrollbar{width:0}
        ::placeholder{color:rgba(255,255,255,0.25)}
        select option{background:#161d2e;color:#f9fafb}
        .weight-slider{-webkit-appearance:none;appearance:none}
        .weight-slider::-webkit-slider-runnable-track{-webkit-appearance:none;height:6px;border-radius:99px;background:transparent}
        .weight-slider::-webkit-slider-thumb{-webkit-appearance:none;width:28px;height:28px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fbbf24,#f97316);margin-top:-11px;cursor:pointer;box-shadow:0 0 12px rgba(245,158,11,0.65),0 2px 5px rgba(0,0,0,0.4);border:2px solid rgba(255,255,255,0.25)}
        .weight-slider::-moz-range-track{height:6px;border-radius:99px;background:rgba(255,255,255,0.15)}
        .weight-slider::-moz-range-progress{height:6px;border-radius:99px;background:#f59e0b}
        .weight-slider::-moz-range-thumb{width:28px;height:28px;border-radius:50%;background:#f59e0b;cursor:pointer;border:none;box-shadow:0 0 10px rgba(245,158,11,0.6)}
      `}</style>

      <div style={{ background: "linear-gradient(135deg, #111827 0%, #0f1729 100%)", padding: "48px 20px 16px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -20, width: 110, height: 110, borderRadius: "50%", background: "rgba(245,158,11,0.15)" }} />
        <div style={{ position: "absolute", bottom: -20, left: 10, width: 70, height: 70, borderRadius: "50%", background: "rgba(245,158,11,0.07)" }} />
        <div style={{ fontSize: 9, color: "#f59e0b", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Tu tracker de fuerza</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: 26, fontWeight: 800, color: "#fff", fontFamily: "Syne, sans-serif" }}>CARGA</span>
          <span style={{ fontSize: 26, fontWeight: 800, color: "#f59e0b", fontFamily: "Syne, sans-serif" }}>PRO</span>
        </div>
      </div>

      <div style={{ padding: 16 }}>

        {view === "dashboard" && (
          <div className="sec">
            {(() => {
              const map = [6,0,1,2,3,4,5];
              const todayIdx = map[new Date().getDay()];
              const todaySession = resolveSession(getSessionForDay(todayIdx));
              if (!todaySession.rest) return (
                <div style={{ background: "linear-gradient(135deg, #1e2d47 0%, #111827 100%)", borderRadius: 18, padding: "14px 16px", marginBottom: 16, border: "1px solid rgba(245,158,11,0.2)" }}>
                  <div style={{ fontSize: 9, color: "#f59e0b", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>Hoy toca</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "Syne, sans-serif", marginBottom: 2 }}>{todaySession.label}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>{todaySession.sub} · {todaySession.duration}</div>
                  <button onClick={() => { setRoutineDay(todayIdx); setView("routine"); }} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "#111", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Ver sesion de hoy →</button>
                </div>
              );
              return (
                <div style={{ background: "linear-gradient(135deg, #1e2d47 0%, #111827 100%)", borderRadius: 18, padding: "14px 16px", marginBottom: 16, textAlign: "center", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>🧘</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{todaySession.label}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{todaySession.duration}</div>
                </div>
              );
            })()}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: 1.5, textTransform: "uppercase" }}>Mis ejercicios</div>
              <button onClick={() => setEditingAnchors(e => !e)} style={{ fontSize: 12, fontWeight: 700, color: editingAnchors ? "#f59e0b" : "#64748b", background: "none", border: "none", cursor: "pointer" }}>
                {editingAnchors ? "✓ Listo" : "Editar"}
              </button>
            </div>

            {editingAnchors && (
              <div style={{ background: "linear-gradient(145deg, #1c2840 0%, #111827 100%)", borderRadius: 14, padding: 14, marginBottom: 14, border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>Selecciona los ejercicios que quieres ver en el inicio</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {allRoutineExercises.map(exName => {
                    const isPinned = pinnedExercises.includes(exName);
                    return (
                      <button key={exName} onClick={() => setPinnedExercises(prev => isPinned ? prev.filter(e => e !== exName) : [...prev, exName])} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, border: isPinned ? "1.5px solid #f59e0b" : "1.5px solid rgba(255,255,255,0.08)", background: isPinned ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.04)", cursor: "pointer" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#e5e7eb" }}>{exName}</span>
                        <span style={{ fontSize: 16, color: isPinned ? "#f59e0b" : "#374151" }}>{isPinned ? "★" : "☆"}</span>
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
                  <div key={exName} style={{ background: "linear-gradient(145deg, #1c2840 0%, #111827 100%)", borderRadius: 18, padding: "14px 14px 12px", border: "1px solid rgba(245,158,11,0.12)", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div onClick={() => setDetailExercise(exName)} style={{ fontSize: 12, fontWeight: 700, color: "#f9fafb", lineHeight: 1.3, maxWidth: "70%", cursor: "pointer" }}>{exName}</div>
                      {trend && <span style={{ fontSize: 14, fontWeight: 900, color: trend === "↑" ? "#4ade80" : trend === "↓" ? "#f87171" : "#64748b" }}>{trend}</span>}
                    </div>
                    {dayLabel && <div style={{ fontSize: 9, color: "#f59e0b", fontWeight: 700, textTransform: "uppercase" }}>{dayLabel}</div>}
                    {last ? (
                      <>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {last.sets.slice(0, 3).map((s, i) => <span key={i} style={{ background: "rgba(255,255,255,0.1)", borderRadius: 8, padding: "3px 8px", fontSize: 11, fontWeight: 600, color: "#e5e7eb" }}>{s.weight}x{s.reps}</span>)}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                          <div style={{ fontSize: 10, color: "#64748b" }}>{formatDate(last.date)}</div>
                          <Sparkline values={volumes} />
                        </div>
                      </>
                    ) : <div style={{ fontSize: 11, color: "#64748b" }}>Sin registros</div>}
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => openLog(exName)} style={{ flex: 1, padding: "7px 0", borderRadius: 10, border: "none", background: "rgba(255,255,255,0.1)", color: "#f9fafb", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Log</button>
                      <button onClick={() => setAiExercise(exName)} style={{ flex: 1, padding: "7px 0", borderRadius: 10, border: "none", background: "rgba(245,158,11,0.15)", color: "#f59e0b", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>✦</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {data.sessions.length > 0 && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Ultimas sesiones</div>
                {[...data.sessions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3).map(s => (
                  <div key={s.id} style={{ background: "linear-gradient(145deg, #1c2840 0%, #111827 100%)", borderRadius: 14, padding: "12px 14px", marginBottom: 8, border: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#f9fafb" }}>{s.exercise}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{formatDate(s.date)} · {s.sets.length} series</div>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {s.sets.slice(0, 2).map((x, i) => <span key={i} style={{ background: "rgba(255,255,255,0.1)", borderRadius: 8, padding: "3px 8px", fontSize: 11, fontWeight: 600, color: "#e5e7eb" }}>{x.weight}×{x.reps}</span>)}
                    </div>
                  </div>
                ))}
                <button onClick={() => setView("history")} style={{ width: "100%", padding: "10px", borderRadius: 12, border: "none", background: "none", color: "#64748b", fontSize: 13, cursor: "pointer", marginTop: 4 }}>Ver historial completo →</button>
              </>
            )}

            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10, marginTop: 8 }}>Volumen semanal</div>
            <div style={{ background: "linear-gradient(145deg, #1c2840 0%, #111827 100%)", borderRadius: 18, padding: "14px 16px", marginBottom: 16, border: "1px solid rgba(255,255,255,0.07)" }}>
              {Object.keys(RECOMMENDED_SETS).map(muscle => {
                const done = weeklyVolume[muscle] || 0;
                const { min, max } = RECOMMENDED_SETS[muscle];
                const pct = Math.min(done / max, 1);
                const status = done === 0 ? "empty" : done < min ? "low" : done <= max ? "ok" : "high";
                const barColor = status === "ok" ? "#4ade80" : status === "high" ? "#f59e0b" : status === "low" ? "#60a5fa" : "rgba(255,255,255,0.1)";
                const textColor = status === "ok" ? "#4ade80" : status === "high" ? "#f59e0b" : status === "low" ? "#60a5fa" : "#64748b";
                return (
                  <div key={muscle} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#e5e7eb" }}>{muscle}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: textColor }}>{done} <span style={{ color: "#64748b", fontWeight: 400 }}>/ {min}-{max} series</span>{status === "ok" ? " ✓" : status === "high" ? " ↑" : ""}</span>
                    </div>
                    <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct * 100}%`, background: barColor, borderRadius: 99, transition: "width .4s ease" }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ display: "flex", gap: 12, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
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
            <button onClick={() => setView("routine")} style={{ background: "none", border: "none", color: "#64748b", fontSize: 13, cursor: "pointer", marginBottom: 14, padding: 0 }}>← Volver</button>
            <div style={{ background: "linear-gradient(145deg, #1c2840 0%, #111827 100%)", borderRadius: 20, padding: 18, border: "1px solid rgba(255,255,255,0.07)" }}>
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
                  isOnly={sets.length === 1}
                  sessions={data.sessions}
                  exercise={logExercise} />
              ))}
              <button onClick={() => setSets([...sets, { weight: "", reps: "", rir: undefined }])} style={{ width: "100%", padding: 10, borderRadius: 12, border: "1.5px dashed rgba(255,255,255,0.15)", background: "none", color: "#64748b", fontSize: 13, cursor: "pointer", marginTop: 4, marginBottom: 16 }}>+ Anadir serie</button>
              <label style={lbl}>Notas</label>
              <textarea placeholder="Sensaciones, observaciones..." value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...fld, resize: "none", marginBottom: 16 }} />
              <button onClick={saveSession} style={{ width: "100%", padding: 15, borderRadius: 14, border: "none", background: "linear-gradient(135deg, #f59e0b, #f97316)", color: "#111827", fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>Guardar sesion</button>
              <button onClick={() => setAiExercise(logExercise)} style={{ width: "100%", padding: 12, borderRadius: 14, border: "1.5px solid rgba(245,158,11,0.25)", background: "rgba(245,158,11,0.08)", color: "#f59e0b", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>✦ Recomendacion</button>
            </div>
          </div>
        )}

        {view === "routine" && (
          <div className="sec" onTouchStart={handleSwipeTouchStart} onTouchEnd={handleSwipeTouchEnd}>
            {editingDaySession !== null && (
              <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                <div onClick={() => setEditingDaySession(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
                <div style={{ position: "relative", background: "linear-gradient(160deg, #1c2840 0%, #111827 100%)", borderRadius: "22px 22px 0 0", padding: "0 20px 36px", animation: "slideUp .25s cubic-bezier(.32,.72,0,1)", border: "1px solid rgba(255,255,255,0.1)", borderBottom: "none" }}>
                  <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 8px" }}>
                    <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.15)" }} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>
                      Sesion para el <span style={{ color: "#f59e0b" }}>{routine[editingDaySession].day}</span>
                  </div>
                  {routine.map((r, ri) => {
                    const isSelected = getSessionForDay(editingDaySession) === ri;
                    return (
                      <button key={ri} onClick={() => { setSessionForDay(editingDaySession, ri); setEditingDaySession(null); }} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", borderRadius: 14, marginBottom: 8, cursor: "pointer", background: isSelected ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.04)", border: isSelected ? "1.5px solid #f59e0b" : "1.5px solid rgba(255,255,255,0.08)" }}>
                        <div style={{ textAlign: "left" }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#f9fafb" }}>{r.label}</div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>{r.sub} · {r.duration}</div>
                        </div>
                        {isSelected && <span style={{ fontSize: 16, color: "#f59e0b" }}>✓</span>}
                      </button>
                    );
                  })}
                  {templates.length > 0 && (
                    <>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, margin: "12px 0 8px" }}>Plantillas</div>
                      {templates.map(t => {
                        const isSelected = getSessionForDay(editingDaySession) === t.id;
                        return (
                          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                            <button onClick={() => { setSessionForDay(editingDaySession, t.id); setEditingDaySession(null); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", borderRadius: 14, cursor: "pointer", background: isSelected ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.04)", border: isSelected ? "1.5px solid #f59e0b" : "1.5px solid rgba(124,58,237,0.3)" }}>
                              <div style={{ textAlign: "left" }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "#f9fafb" }}>{t.name}</div>
                                <div style={{ fontSize: 11, color: "#64748b" }}>{t.sub || "Plantilla"}{t.duration ? " · " + t.duration : ""}</div>
                              </div>
                              {isSelected && <span style={{ fontSize: 16, color: "#f59e0b" }}>✓</span>}
                            </button>
                            <button onClick={() => { setEditingTemplate(t); setEditingDaySession(null); }} style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#94a3b8", fontSize: 14, cursor: "pointer" }}>✎</button>
                          </div>
                        );
                      })}
                    </>
                  )}
                  <button onClick={() => { setEditingDaySession(null); setEditingTemplate({ id: "t-" + Date.now(), name: "", sub: "", duration: "", blocks: [], custom: true }); }} style={{ width: "100%", padding: "11px", borderRadius: 12, border: "1.5px dashed rgba(255,255,255,0.15)", background: "none", color: "#64748b", fontSize: 13, cursor: "pointer", marginTop: 4, marginBottom: 4 }}>+ Nueva plantilla</button>
                  {getWeekKey(editingDaySession) in weekOverrides && (
                    <button onClick={() => { resetSessionForDay(editingDaySession); setEditingDaySession(null); }} style={{ width: "100%", padding: "11px", borderRadius: 12, border: "none", background: "none", color: "#64748b", fontSize: 13, cursor: "pointer", marginTop: 4 }}>Volver a la sesion por defecto</button>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, marginTop: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: 1.5, textTransform: "uppercase" }}>Esta semana</div>
              <button onClick={() => setPlannerMode(p => !p)} style={{ padding: "6px 14px", borderRadius: 99, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: plannerMode ? "#f59e0b" : "rgba(255,255,255,0.08)", color: plannerMode ? "#111827" : "#94a3b8", transition: "all .15s" }}>
                {plannerMode ? "✓ Listo" : "Reorganizar semana"}
              </button>
            </div>

            {plannerMode && (
              <div style={{ background: "linear-gradient(145deg, #1c2840 0%, #111827 100%)", borderRadius: 18, padding: 16, marginBottom: 14, border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>Arrastra las sesiones entre dias para reorganizar tu semana</div>
                {routine.map((d, i) => {
                  const sessionKey = getSessionForDay(i);
                  const session = resolveSession(sessionKey);
                  const isOverridden = getWeekKey(i) in weekOverrides && weekOverrides[getWeekKey(i)] !== i;
                  const todayIdx = [6,0,1,2,3,4,5][new Date().getDay()];
                  const isToday = todayIdx === i;
                  return (
                    <div key={i} draggable
                      onDragStart={() => setDragSrc(i)}
                      onDragOver={e => { e.preventDefault(); setDragOver(i); }}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={() => { if (dragSrc === null || dragSrc === i) { setDragOver(null); return; } const srcS = getSessionForDay(dragSrc), dstS = getSessionForDay(i); setSessionForDay(dragSrc, dstS); setSessionForDay(i, srcS); setDragSrc(null); setDragOver(null); }}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, marginBottom: 6, background: dragOver === i ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.04)", border: dragOver === i ? "1.5px solid #f59e0b" : isToday ? "1.5px solid rgba(245,158,11,0.4)" : "1.5px solid transparent", cursor: "grab", userSelect: "none" }}>
                      <div style={{ color: "#374151", fontSize: 16, flexShrink: 0 }}>⠿</div>
                      <div style={{ width: 36, flexShrink: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: isToday ? "#f59e0b" : "#f9fafb" }}>{d.day}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#f9fafb", display: "flex", alignItems: "center", gap: 6 }}>
                          {session.label || session.name}
                          {isOverridden && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", display: "inline-block" }} />}
                        </div>
                        <div style={{ fontSize: 10, color: "#64748b" }}>{session.sub}</div>
                      </div>
                      <button onClick={() => setEditingDaySession(i)} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, color: "#94a3b8", cursor: "pointer", flexShrink: 0 }}>Cambiar</button>
                    </div>
                  );
                })}
                <button onClick={() => routine.forEach((_, i) => resetSessionForDay(i))} style={{ width: "100%", padding: "10px", borderRadius: 12, border: "none", background: "none", color: "#64748b", fontSize: 12, cursor: "pointer", marginTop: 4 }}>Resetear semana a rutina por defecto</button>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 16 }}>
              <button onClick={() => setRoutineDay(d => (d + 6) % 7)} style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#94a3b8", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
              <div style={{ flex: 1, display: "flex", gap: 6, overflowX: "auto", paddingBottom: 0 }}>
                {routine.map((d, i) => {
                  const todayIdx = [6,0,1,2,3,4,5][new Date().getDay()];
                  const isToday = todayIdx === i;
                  const sessionKey = getSessionForDay(i);
                  const resolvedSession = resolveSession(sessionKey);
                  const isOverridden = getWeekKey(i) in weekOverrides && weekOverrides[getWeekKey(i)] !== i;
                  return (
                    <button key={i} onClick={() => setRoutineDay(i)} style={{ flexShrink: 0, padding: "8px 12px", borderRadius: 12, cursor: "pointer", fontSize: 12, fontWeight: 700, background: routineDay === i ? "rgba(245,158,11,0.2)" : isToday ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.06)", color: routineDay === i ? "#f59e0b" : isToday ? "#f59e0b" : "#64748b", border: routineDay === i ? "1.5px solid rgba(245,158,11,0.5)" : isToday && routineDay !== i ? "1.5px solid rgba(245,158,11,0.3)" : isOverridden ? "1.5px solid #a78bfa" : "1.5px solid transparent", position: "relative", transition: "all .15s" }}>
                      <div>{d.day}</div>
                      <div style={{ fontSize: 9, fontWeight: 600, marginTop: 2, opacity: .8 }}>{(resolvedSession.label || resolvedSession.name || "").split(" ")[0]}</div>
                      {isOverridden && <div style={{ position: "absolute", top: 4, right: 4, width: 6, height: 6, borderRadius: "50%", background: "#a78bfa" }} />}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setRoutineDay(d => (d + 1) % 7)} style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#94a3b8", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
            </div>

            {(() => {
              const sessionKey = getSessionForDay(routineDay);
              const day = resolveSession(sessionKey);
              const isOverridden = getWeekKey(routineDay) in weekOverrides && weekOverrides[getWeekKey(routineDay)] !== routineDay;
              if (day.rest) return (
                <>
                  <div style={{ background: "linear-gradient(145deg, #1c2840 0%, #111827 100%)", borderRadius: 18, padding: 28, textAlign: "center", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 10 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>{(day.label || day.name || "").includes("Trail") ? "🏃" : "🧘"}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#f9fafb", fontFamily: "Syne, sans-serif" }}>{day.label || day.name}</div>
                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>{day.duration}</div>
                  </div>
                  <button onClick={() => setEditingDaySession(routineDay)} style={{ width: "100%", padding: "11px", borderRadius: 14, border: "1.5px solid rgba(255,255,255,0.1)", background: "none", color: "#94a3b8", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cambiar sesion de este dia</button>
                </>
              );
              return (
                <>
                  <div style={{ background: "linear-gradient(135deg, #1e2d47 0%, #111827 100%)", borderRadius: 16, padding: "14px 16px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(245,158,11,0.15)" }}>
                    <div>
                      <div style={{ fontSize: 10, color: isOverridden ? "#a78bfa" : "#f59e0b", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{routine[routineDay].day} · {isOverridden ? "Sesion cambiada" : day.sub}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "Syne, sans-serif" }}>{day.label || day.name}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{day.duration}</div>
                    </div>
                    <button onClick={() => setEditingDaySession(routineDay)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 10, padding: "8px 12px", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Cambiar</button>
                  </div>
                  {isOverridden && <div style={{ background: "rgba(124,58,237,0.15)", borderRadius: 10, padding: "8px 12px", marginBottom: 12, fontSize: 12, color: "#a78bfa", fontWeight: 600 }}>Sesion movida esta semana · vuelve a la normal la semana que viene</div>}
                  {day.blocks.map((block, bi) => (
                    <div key={bi} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, paddingLeft: 2 }}>Bloque {bi + 1} — {block.name}</div>
                      {block.exercises.map((ex, ei) => {
                        const lastLog = getLastSession(data.sessions, ex.name);
                        return (
                          <div key={ei} style={{ background: "linear-gradient(145deg, #1c2840 0%, #111827 100%)", borderRadius: 14, padding: "12px 14px", marginBottom: 8, border: ex.anchor ? "1.5px solid #f59e0b" : "1px solid rgba(255,255,255,0.07)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                  <span onClick={() => setDetailExercise(ex.name)} style={{ fontSize: 14, fontWeight: 700, color: "#f9fafb", cursor: "pointer", textDecoration: "underline", textDecorationColor: "rgba(255,255,255,0.15)", textUnderlineOffset: 3 }}>{ex.name}</span>
                                  {ex.anchor && <span style={{ background: "#f59e0b", color: "#111", fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 99, textTransform: "uppercase", letterSpacing: .5 }}>Ancla</span>}
                                </div>
                                {ex.note && <div style={{ fontSize: 11, color: "#64748b", marginTop: 3, fontStyle: "italic" }}>{ex.note}</div>}
                              </div>
                              <button onClick={() => setEditingExercise({ dayIdx: sessionIdx, blockIdx: bi, exIdx: ei })} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, color: "#94a3b8", cursor: "pointer", flexShrink: 0, marginLeft: 8 }}>Editar</button>
                            </div>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: lastLog ? 8 : 10 }}>
                              {[["Series", ex.sets], ["Reps", ex.reps], ["RPE", ex.rpe], ["Descanso", ex.rest]].map(([l, v]) => v && (
                                <div key={l} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "5px 10px", textAlign: "center" }}>
                                  <div style={{ fontSize: 9, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: .5 }}>{l}</div>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f9fafb" }}>{v}</div>
                                </div>
                              ))}
                            </div>
                            {lastLog && (
                              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "6px 10px", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>Ultima vez:</span>
                                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                  {lastLog.sets.slice(0, 3).map((s, si) => <span key={si} style={{ fontSize: 11, fontWeight: 700, color: "#e5e7eb" }}>{s.weight}×{s.reps}</span>)}
                                </div>
                                <span style={{ fontSize: 10, color: "#64748b", marginLeft: "auto" }}>{formatDate(lastLog.date)}</span>
                              </div>
                            )}
                            <button onClick={() => openLog(ex.name)} style={{ width: "100%", padding: "8px", borderRadius: 10, border: "none", background: ex.anchor ? "linear-gradient(135deg, #f59e0b, #f97316)" : "rgba(255,255,255,0.08)", color: ex.anchor ? "#111827" : "#e5e7eb", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Registrar</button>
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
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12, marginTop: 4 }}>Historial</div>
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
                <div style={{ background: "linear-gradient(145deg, #1c2840 0%, #111827 100%)", borderRadius: 16, padding: "14px 16px 12px", marginBottom: 12, border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Progresion de volumen</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 52 }}>
                    {vols.map((v, i) => <div key={i} style={{ flex: 1, borderRadius: "4px 4px 0 0", height: Math.max(4, (v / maxV) * 48), background: i === vols.length - 1 ? "#f59e0b" : "rgba(255,255,255,0.12)" }} />)}
                  </div>
                </div>
              );
            })()}
            {filteredHistory.length === 0
              ? <div style={{ textAlign: "center", padding: "50px 0", color: "#64748b" }}><div style={{ fontSize: 44, marginBottom: 12 }}>🏋</div><div style={{ fontSize: 14 }}>Sin sesiones registradas</div></div>
              : filteredHistory.map(s => (
                <div key={s.id} style={{ background: "linear-gradient(145deg, #1c2840 0%, #111827 100%)", borderRadius: 16, padding: 14, marginBottom: 8, border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#f9fafb" }}>{s.exercise}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{formatDate(s.date)} · {calcVolume(s.sets).toFixed(0)} kg</div>
                    </div>
                    <button onClick={() => setData(d => ({ ...d, sessions: d.sessions.filter(x => x.id !== s.id) }))} style={{ background: "none", border: "none", color: "#374151", cursor: "pointer", fontSize: 15 }}>✕</button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {s.sets.map((x, i) => (
                      <span key={i} style={{ background: "rgba(255,255,255,0.1)", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 600, color: "#e5e7eb" }}>
                        {x.weight} × {x.reps}{x.rir !== undefined ? <span style={{ color: "#64748b", fontWeight: 500 }}> RIR{x.rir}</span> : ""}
                      </span>
                    ))}
                  </div>
                  {s.notes && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8, fontStyle: "italic" }}>{s.notes}</div>}
                </div>
              ))
            }
          </div>
        )}

        {view === "assistant" && (
          <div className="sec" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 180px)" }}>
            <div style={{ background: "linear-gradient(135deg, #1e2d47 0%, #111827 100%)", borderRadius: 18, padding: "14px 16px", marginBottom: 14, flexShrink: 0, border: "1px solid rgba(245,158,11,0.15)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 9, color: "#f59e0b", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>Resumen semanal</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", fontFamily: "Syne, sans-serif" }}>Analisis automatico</div>
                </div>
                <button onClick={generateWeekSummary} disabled={weekSummaryLoading} style={{ background: weekSummaryLoading ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #f59e0b, #f97316)", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, color: weekSummaryLoading ? "#64748b" : "#111", cursor: "pointer" }}>
                  {weekSummaryLoading ? "..." : weekSummary ? "↻ Actualizar" : "Generar ✦"}
                </button>
              </div>
              {weekSummaryLoading && <div style={{ fontSize: 13, color: "#64748b" }}>Analizando tu semana...</div>}
              {weekSummary && !weekSummaryLoading && <div style={{ fontSize: 13, color: "#d1d5db", lineHeight: 1.7 }}>{weekSummary}</div>}
              {!weekSummary && !weekSummaryLoading && <div style={{ fontSize: 12, color: "#4b5563" }}>Pulsa "Generar" para analizar tu semana con IA</div>}
            </div>

            {assistantMessages.length === 0 && (
              <div style={{ marginBottom: 14, flexShrink: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Preguntas rapidas</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {["Como va mi progresion esta semana?", "En que ejercicio estoy mas estancado?", "Estoy haciendo suficiente volumen?", "Cuando deberia descargar?", "Analiza mi ultima sesion", "Planifícame la semana que viene"].map(q => (
                    <button key={q} onClick={() => sendAssistantMessage(q)} style={{ padding: "8px 14px", borderRadius: 99, border: "1.5px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", fontSize: 12, fontWeight: 600, color: "#cbd5e1", cursor: "pointer", textAlign: "left" }}>{q}</button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ flex: 1, overflowY: "auto", marginBottom: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              {assistantMessages.map((msg, i) => (
                <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  {msg.role === "assistant" && <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #f59e0b, #f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, marginRight: 8, flexShrink: 0, alignSelf: "flex-end" }}>✦</div>}
                  <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: msg.role === "user" ? "linear-gradient(135deg, #1e2d47, #111827)" : "rgba(255,255,255,0.06)", color: "#f9fafb", fontSize: 13, lineHeight: 1.7, border: msg.role === "assistant" ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {assistantLoading && (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #f59e0b, #f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>✦</div>
                  <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px 18px 18px 4px", padding: "10px 16px" }}>
                    <span style={{ display: "inline-block", animation: "spin 1s linear infinite", color: "#f59e0b" }}>◌</span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ flexShrink: 0, display: "flex", gap: 8, paddingBottom: 4 }}>
              {assistantMessages.length > 0 && <button onClick={() => setAssistantMessages([])} style={{ width: 46, height: 46, borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#94a3b8", fontSize: 16, cursor: "pointer", flexShrink: 0 }}>↺</button>}
              <input placeholder="Pregunta lo que quieras..." value={assistantInput} onChange={e => setAssistantInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !assistantLoading && sendAssistantMessage(assistantInput)} style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", color: "#f9fafb" }} />
              <button onClick={() => sendAssistantMessage(assistantInput)} disabled={assistantLoading || !assistantInput.trim()} style={{ width: 46, height: 46, borderRadius: 12, border: "none", background: assistantLoading || !assistantInput.trim() ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, #f59e0b, #f97316)", color: assistantLoading || !assistantInput.trim() ? "#4b5563" : "#111827", fontSize: 18, cursor: "pointer", flexShrink: 0 }}>→</button>
            </div>
          </div>
        )}

      </div>

      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "rgba(13,17,23,0.96)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", padding: "8px 12px 22px", gap: 6, zIndex: 100 }}>
        {NAV.map(nav => (
          <button key={nav.id} onClick={() => nav.id === "log" ? (setLogExercise(allRoutineExercises[0]), setView("log")) : setView(nav.id)} style={{ flex: nav.primary ? 1.4 : 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: "10px 6px", borderRadius: 14, border: "none", cursor: "pointer", background: nav.primary ? "linear-gradient(135deg, #f59e0b, #f97316)" : view === nav.id ? "rgba(245,158,11,0.15)" : "transparent", color: nav.primary ? "#111827" : view === nav.id ? "#f59e0b" : "#4b5563", transition: "all .15s" }}>
            {nav.sparkle ? <span style={{ fontSize: 20, lineHeight: 1 }}>✦</span> : <Icon d={nav.icon} size={21} />}
            <span style={{ fontSize: 10, fontWeight: 700 }}>{nav.label}</span>
          </button>
        ))}
      </div>

      {editingExercise !== null && (() => {
        const { dayIdx, blockIdx, exIdx } = editingExercise;
        return <ExerciseEditPanel exercise={routine[dayIdx].blocks[blockIdx].exercises[exIdx]} onSave={saveExerciseEdit} onClose={() => setEditingExercise(null)} />;
      })()}

      {detailExercise && <ExerciseDetailPanel exercise={detailExercise} sessions={data.sessions} onClose={() => setDetailExercise(null)} onLog={(ex) => { openLog(ex); }} />}
      {aiExercise && <AIPanel exercise={aiExercise} sessions={data.sessions} onClose={() => setAiExercise(null)} />}
      {editingTemplate && <TemplateEditorPanel template={editingTemplate} allExercises={allRoutineExercises} onSave={saveTemplate} onDelete={deleteTemplate} onClose={() => setEditingTemplate(null)} />}

      {toast && (
        <div style={{ position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, #1e2d47, #111827)", color: "#fff", borderRadius: 12, padding: "12px 22px", fontSize: 14, fontWeight: 600, zIndex: 999, animation: "toastFade 2.2s ease forwards", whiteSpace: "nowrap", border: "1px solid rgba(245,158,11,0.3)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
