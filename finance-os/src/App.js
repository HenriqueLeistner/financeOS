import { useState, useEffect, useRef, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, Cell } from "recharts";
import { 
  TrendingUp, TrendingDown, Target, Zap, Plus, X, Check, ChevronRight, 
  Home, CreditCard, PieChart, Flag, Wallet, Bell, Moon, Sun, Flame,
  AlertTriangle, ArrowUpCircle, ArrowDownCircle, Calendar, BarChart2,
  Lightbulb, Award, Settings, ChevronDown, Trash2, Edit3, RefreshCw,
  DollarSign, Coffee, ShoppingBag, Tv, Shield, Briefcase, FileText
} from "lucide-react";

// ─── UTILITY ────────────────────────────────────────────────────────────────
const fmt = (v) => `R$\u00a0${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => { const date = new Date(d); return date.toLocaleDateString("pt-BR"); };
const fmtShort = (v) => {
  if (Math.abs(v) >= 1000) return `R$\u00a0${(v/1000).toFixed(1)}k`;
  return `R$\u00a0${Number(v).toFixed(0)}`;
};
const today = new Date();
const META_VALUE = 10000;

// ─── SEED DATA (vazio) ──────────────────────────────────────────────────────
const getDefaultMetaDate = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1); // 1 ano a partir de hoje
  return d.toISOString().split('T')[0];
};

const SEED = {
  entradas: [],
  gastos: [],
  contas: [],
  rendaMensal: 0,
  metaAtual: 0,
  streak: 0,
  metaDate: getDefaultMetaDate(),
};

const calcDateMetrics = (dateStr) => {
  if (!dateStr) return { daysLeft: 0, monthsLeft: 1 };
  const metaDate = new Date(dateStr + 'T23:59:59');
  const todayMidnight = new Date(today);
  todayMidnight.setHours(0, 0, 0, 0);
  const daysLeft = Math.max(0, Math.ceil((metaDate - todayMidnight) / (1000 * 60 * 60 * 24)));
  const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
  return { daysLeft, monthsLeft };
};

// ─── HOOKS ───────────────────────────────────────────────────────────────────
function useStorage(key, def) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : def; } 
    catch { return def; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }, [key, val]);
  return [val, setVal];
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function ProgressRing({ pct, size = 120, stroke = 10, color = "#10b981" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#ffffff10" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)" }} />
    </svg>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, display:"flex", alignItems:"flex-end" }}>
      <div onClick={onClose} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(4px)" }} />
      <div style={{
        position:"relative", width:"100%", background:"var(--card)", borderRadius:"24px 24px 0 0",
        padding:"0 0 32px", maxHeight:"90vh", overflowY:"auto",
        animation: "slideUp 0.35s cubic-bezier(0.32,0.72,0,1)"
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 24px 16px" }}>
          <span style={{ fontSize:18, fontWeight:700, color:"var(--text)", fontFamily:"'DM Serif Display',serif" }}>{title}</span>
          <button onClick={onClose} style={{ background:"var(--bg)", border:"none", borderRadius:12, padding:8, cursor:"pointer", color:"var(--text2)" }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding:"0 24px" }}>{children}</div>
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom:16 }}>
      {label && <label style={{ display:"block", fontSize:12, color:"var(--text2)", marginBottom:6, fontWeight:600, letterSpacing:"0.05em", textTransform:"uppercase" }}>{label}</label>}
      <input {...props} style={{
        width:"100%", background:"var(--bg)", border:"1.5px solid var(--border)", borderRadius:14,
        padding:"14px 16px", color:"var(--text)", fontSize:15, outline:"none", boxSizing:"border-box",
        transition:"border-color 0.2s", fontFamily:"inherit", ...props.style
      }} onFocus={e => e.target.style.borderColor="#10b981"} onBlur={e => e.target.style.borderColor="var(--border)"} />
    </div>
  );
}

function Select({ label, children, ...props }) {
  return (
    <div style={{ marginBottom:16 }}>
      {label && <label style={{ display:"block", fontSize:12, color:"var(--text2)", marginBottom:6, fontWeight:600, letterSpacing:"0.05em", textTransform:"uppercase" }}>{label}</label>}
      <select {...props} style={{
        width:"100%", background:"var(--bg)", border:"1.5px solid var(--border)", borderRadius:14,
        padding:"14px 16px", color:"var(--text)", fontSize:15, outline:"none", boxSizing:"border-box",
        appearance:"none", fontFamily:"inherit"
      }}>{children}</select>
    </div>
  );
}

function Btn({ children, variant="primary", onClick, style={}, disabled }) {
  const base = {
    width:"100%", border:"none", borderRadius:16, padding:"16px", fontSize:16, fontWeight:700,
    cursor: disabled ? "not-allowed" : "pointer", transition:"all 0.2s", fontFamily:"inherit",
    opacity: disabled ? 0.5 : 1, ...style
  };
  const vars = variant === "primary"
    ? { background:"linear-gradient(135deg,#10b981,#059669)", color:"#fff", boxShadow:"0 8px 24px rgba(16,185,129,0.35)" }
    : { background:"var(--bg)", color:"var(--text2)", border:"1.5px solid var(--border)" };
  return <button style={{...base,...vars}} onClick={disabled ? undefined : onClick}>{children}</button>;
}

function Card({ children, style={}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background:"var(--card)", borderRadius:20, padding:20,
      border:"1px solid var(--border)", ...style,
      cursor: onClick ? "pointer" : "default",
      transition:"transform 0.15s, box-shadow 0.15s",
    }}
    onMouseEnter={e => { if(onClick){ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.2)"; }}}
    onMouseLeave={e => { if(onClick){ e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}}
    >{children}</div>
  );
}

// ─── TELAS ───────────────────────────────────────────────────────────────────

function Dashboard({ data, dark, onSetRenda, isSmall }) {
  const { entradas, gastos, contas, metaAtual, streak } = data;
  
  const mesAtual = today.getMonth();
  const anoAtual = today.getFullYear();
  
  const entradasMesEntries = entradas.filter(e => {
    const d = new Date(e.data);
    return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  }).reduce((s,e) => s + e.valor, 0);
  
  const gastosMes = gastos.filter(g => {
    const d = new Date(g.data);
    return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  }).reduce((s,g) => s + g.valor, 0);
  
  // renda mensal preferencial: se o usuário definiu `rendaMensal` usa ela, senão usa entradas do mês
  const rendaMensal = (data.rendaMensal && Number(data.rendaMensal) > 0) ? Number(data.rendaMensal) : entradasMesEntries;

  const [editRendaOpen, setEditRendaOpen] = useState(false);
  const [rendaInput, setRendaInput] = useState(String(rendaMensal || 0));
  useEffect(() => { setRendaInput(String(rendaMensal || 0)); }, [rendaMensal]);

  const saldo = rendaMensal - gastosMes;
  const metaGoal = (data.metaGoal && Number(data.metaGoal) > 0) ? Number(data.metaGoal) : META_VALUE;
  const metaDate = data.metaDate || SEED.metaDate;
  const { daysLeft: daysLeftMeta, monthsLeft: monthsLeftMeta } = calcDateMetrics(metaDate);
  const pctMeta = Math.min((metaAtual / metaGoal) * 100, 100);
  const faltaMeta = Math.max(metaGoal - metaAtual, 0);
  const guardPorMes = monthsLeftMeta > 0 ? faltaMeta / monthsLeftMeta : faltaMeta;
  
  const bobagens = gastos.filter(g => {
    const d = new Date(g.data);
    return g.categoria === "Bobagens" && d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  }).reduce((s,g) => s + g.valor, 0);

  const contasVencer = contas.filter(c => !c.pago).sort((a,b) => new Date(a.vencimento) - new Date(b.vencimento));
  
  // Chart data — últimos 6 meses
  const chartData = [
    { mes: "Set", entrada: 4200, saida: 3100, meta: 800 },
    { mes: "Out", entrada: 5000, saida: 3400, meta: 1600 },
    { mes: "Nov", entrada: 4800, saida: 2900, meta: 1900 },
    { mes: "Dez", entrada: 6200, saida: 4100, meta: 2600 },
    { mes: "Jan", entrada: 5300, saida: 3650, meta: 3250 },
    { mes: "Fev", entrada: rendaMensal || 4500, saida: gastosMes || 2370, meta: metaGoal },
  ];

  const insights = [];
  if (bobagens > 100) insights.push({ icon: "⚠️", text: `Você gastou ${fmt(bobagens)} em bobagens esse mês`, color: "#f59e0b" });
  if (saldo > guardPorMes) insights.push({ icon: "🎉", text: `Você está R$${(saldo - guardPorMes).toFixed(0)} acima do planejado!`, color: "#10b981" });
  if (contasVencer.length > 0) {
    const proxima = contasVencer[0];
    insights.push({ icon: "📅", text: `${proxima.descricao} vence em ${new Date(proxima.vencimento).toLocaleDateString("pt-BR")}`, color: "#ef4444" });
  }
  if (streak >= 3) insights.push({ icon: "🔥", text: `${streak} dias sem bobagem! Continue assim!`, color: "#f97316" });

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(160deg, #065f46 0%, #064e3b 60%, #022c22 100%)",
        padding: "60px 24px 48px",
        marginBottom: -24,
        borderRadius: "0 0 32px 32px",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:"50%", background:"rgba(16,185,129,0.08)" }} />
        <div style={{ position:"absolute", bottom:-20, left:-20, width:120, height:120, borderRadius:"50%", background:"rgba(16,185,129,0.05)" }} />
        
        <div style={{ position:"relative" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
            <div>
              <p style={{ color:"#6ee7b7", fontSize:13, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", margin:0 }}>Saldo Disponível</p>
              <h1 style={{ color:"#fff", fontSize:36, fontWeight:800, margin:"4px 0 0", fontFamily:"'DM Serif Display',serif", letterSpacing:"-0.02em" }}>
                {fmt(saldo)}
              </h1>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ background:"rgba(255,255,255,0.1)", borderRadius:16, padding:"8px 14px", backdropFilter:"blur(8px)" }}>
                <Flame size={16} color="#f97316" style={{ display:"block", margin:"0 auto 2px" }} />
                <span style={{ color:"#fff", fontWeight:800, fontSize:18, display:"block" }}>{streak}</span>
                <span style={{ color:"#86efac", fontSize:10, fontWeight:600 }}>STREAK</span>
              </div>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns: isSmall ? "1fr" : "1fr 1fr", gap:12, marginBottom:20 }}>
            <div style={{ background:"rgba(255,255,255,0.07)", borderRadius:16, padding:14, backdropFilter:"blur(8px)", position:"relative" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                <ArrowUpCircle size={14} color="#10b981" />
                <span style={{ color:"#a7f3d0", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>Entradas</span>
              </div>
              <span style={{ color:"#fff", fontWeight:700, fontSize:18 }}>{fmtShort(rendaMensal)}</span>
              <button onClick={() => setEditRendaOpen(true)} style={{ position:"absolute", right:10, top:10, background:"transparent", border:"none", color:"var(--text2)", cursor:"pointer" }}>Editar</button>
            </div>

            <Modal open={editRendaOpen} onClose={() => setEditRendaOpen(false)} title="Editar Renda Mensal">
              <Input label="Renda mensal (R$)" value={rendaInput} onChange={e => setRendaInput(e.target.value)} />
              <div style={{ display:"flex", gap:10, marginTop:8 }}>
                <Btn onClick={() => { const v = Number(rendaInput) || 0; onSetRenda && onSetRenda(v); setEditRendaOpen(false); }}>Salvar</Btn>
                <Btn variant="secondary" onClick={() => setEditRendaOpen(false)}>Cancelar</Btn>
              </div>
            </Modal>
            <div style={{ background:"rgba(255,255,255,0.07)", borderRadius:16, padding:14, backdropFilter:"blur(8px)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                <ArrowDownCircle size={14} color="#ef4444" />
                <span style={{ color:"#fca5a5", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>Saídas</span>
              </div>
              <span style={{ color:"#fff", fontWeight:700, fontSize:18 }}>{fmtShort(gastosMes)}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding:"0 16px", paddingTop:40 }}>
        
        {/* Meta Card */}
        <Card style={{ marginBottom:16, background:"linear-gradient(135deg, var(--card) 0%, var(--card) 100%)", border:"1px solid rgba(16,185,129,0.2)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <div>
              <p style={{ color:"var(--text2)", fontSize:12, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 4px" }}>Meta: R$ 10.000</p>
              <p style={{ color:"var(--text)", fontSize:22, fontWeight:800, margin:0, fontFamily:"'DM Serif Display',serif" }}>{fmt(metaAtual)}</p>
              <p style={{ color:"#10b981", fontSize:13, margin:"2px 0 0" }}>Faltam {fmt(faltaMeta)} • {daysLeftMeta} dias</p>
            </div>
            <div style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <ProgressRing pct={pctMeta} size={90} stroke={8} />
              <div style={{ position:"absolute", textAlign:"center" }}>
                <span style={{ color:"var(--text)", fontWeight:800, fontSize:16 }}>{pctMeta.toFixed(0)}%</span>
              </div>
            </div>
          </div>
          
          <div style={{ background:"var(--bg)", borderRadius:12, height:8, overflow:"hidden", marginBottom:12 }}>
            <div style={{
              height:"100%", borderRadius:12,
              background:"linear-gradient(90deg, #10b981, #34d399)",
              width:`${pctMeta}%`,
              transition:"width 1s cubic-bezier(0.4,0,0.2,1)",
              boxShadow:"0 0 12px rgba(16,185,129,0.5)"
            }} />
          </div>

          <div style={{ display:"grid", gridTemplateColumns: isSmall ? "1fr" : "1fr 1fr", gap:10 }}>
            <div style={{ background:"var(--bg)", borderRadius:12, padding:"10px 14px" }}>
              <p style={{ color:"var(--text2)", fontSize:11, fontWeight:600, textTransform:"uppercase", margin:"0 0 2px" }}>Guardar/mês</p>
              <p style={{ color:"#10b981", fontWeight:800, fontSize:16, margin:0 }}>{fmtShort(guardPorMes)}</p>
            </div>
            <div style={{ background:"var(--bg)", borderRadius:12, padding:"10px 14px" }}>
              <p style={{ color:"var(--text2)", fontSize:11, fontWeight:600, textTransform:"uppercase", margin:"0 0 2px" }}>Meses restantes</p>
              <p style={{ color:"var(--text)", fontWeight:800, fontSize:16, margin:0 }}>{monthsLeftMeta} meses</p>
            </div>
          </div>
        </Card>

        {/* Gráfico */}
        <Card style={{ marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <span style={{ color:"var(--text)", fontWeight:700, fontSize:16 }}>Evolução Financeira</span>
            <span style={{ color:"var(--text2)", fontSize:12 }}>6 meses</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top:0, right:0, left:-20, bottom:0 }}>
              <defs>
                <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="mes" tick={{ fill:"var(--text2)", fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"var(--text2)", fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} />
              <Tooltip formatter={(v,n) => [fmt(v), n === "entrada" ? "Entradas" : "Saídas"]} contentStyle={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:12, color:"var(--text)" }} />
              <Area type="monotone" dataKey="entrada" stroke="#10b981" fill="url(#gIn)" strokeWidth={2.5} dot={false} />
              <Area type="monotone" dataKey="saida" stroke="#ef4444" fill="url(#gOut)" strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Insights */}
        {insights.length > 0 && (
          <Card style={{ marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
              <Lightbulb size={16} color="#f59e0b" />
              <span style={{ color:"var(--text)", fontWeight:700, fontSize:15 }}>Insights</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {insights.map((ins, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10, background:"var(--bg)", borderRadius:12, padding:"10px 14px" }}>
                  <span style={{ fontSize:18 }}>{ins.icon}</span>
                  <span style={{ color:"var(--text)", fontSize:13, lineHeight:1.4 }}>{ins.text}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Próximas Contas */}
        {contasVencer.length > 0 && (
          <Card style={{ marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <span style={{ color:"var(--text)", fontWeight:700, fontSize:15 }}>Próximas Contas</span>
              <span style={{ color:"#ef4444", fontSize:12, fontWeight:600 }}>{contasVencer.length} pendente{contasVencer.length > 1 ? "s":""}</span>
            </div>
            {contasVencer.slice(0,3).map(c => {
              const dias = Math.ceil((new Date(c.vencimento) - today) / (1000*60*60*24));
              const urgente = dias <= 3;
              return (
                <div key={c.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
                  <div>
                    <p style={{ color:"var(--text)", fontWeight:600, fontSize:14, margin:0 }}>{c.descricao}</p>
                    <p style={{ color: urgente ? "#ef4444" : "var(--text2)", fontSize:12, margin:"2px 0 0" }}>
                      {urgente ? `⚠️ Vence em ${dias}d` : `Vence em ${dias}d`}
                    </p>
                  </div>
                  <span style={{ color: urgente ? "#ef4444" : "var(--text)", fontWeight:700, fontSize:15 }}>{fmt(c.valor / c.parcelas)}</span>
                </div>
              );
            })}
          </Card>
        )}

        {/* Gastos por categoria mini */}
        <Card>
          <span style={{ color:"var(--text)", fontWeight:700, fontSize:15, display:"block", marginBottom:12 }}>Gastos do Mês</span>
          {["Essenciais","Investimentos","Lazer","Bobagens"].map(cat => {
            const total = gastos.filter(g => g.categoria === cat && new Date(g.data).getMonth() === mesAtual).reduce((s,g) => s+g.valor, 0);
            const cores = { Essenciais:"#3b82f6", Investimentos:"#10b981", Lazer:"#8b5cf6", Bobagens:"#ef4444" };
            const icons = { Essenciais: Shield, Investimentos: TrendingUp, Lazer: Tv, Bobagens: ShoppingBag };
            const Icon = icons[cat];
            const pct = gastosMes > 0 ? (total / gastosMes) * 100 : 0;
            return (
              <div key={cat} style={{ marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ background:`${cores[cat]}20`, borderRadius:8, padding:6 }}>
                      <Icon size={14} color={cores[cat]} />
                    </div>
                    <span style={{ color:"var(--text)", fontSize:13, fontWeight:600 }}>{cat}</span>
                  </div>
                  <span style={{ color:"var(--text2)", fontSize:13 }}>{fmt(total)}</span>
                </div>
                <div style={{ background:"var(--bg)", borderRadius:6, height:5, overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:6, background:cores[cat], width:`${pct}%`, transition:"width 0.8s ease" }} />
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}

function Entradas({ data, setData }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ tipo:"Salário", valor:"", descricao:"", data: today.toISOString().split("T")[0], recorrente:false });

  const handleAdd = () => {
    if (!form.valor || !form.descricao) return;
    const nova = { ...form, id: Date.now(), valor: parseFloat(form.valor) };
    setData(d => ({ ...d, entradas: [...d.entradas, nova] }));
    setModal(false);
    setForm({ tipo:"Salário", valor:"", descricao:"", data: today.toISOString().split("T")[0], recorrente:false });
  };

  const handleDel = (id) => setData(d => ({ ...d, entradas: d.entradas.filter(e => e.id !== id) }));

  const total = data.entradas.reduce((s,e) => s + e.valor, 0);

  return (
    <div style={{ padding:"80px 16px 100px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h2 style={{ color:"var(--text)", fontSize:24, fontWeight:800, margin:0, fontFamily:"'DM Serif Display',serif" }}>Entradas</h2>
          <p style={{ color:"#10b981", fontSize:14, margin:"2px 0 0", fontWeight:600 }}>{fmt(total)} total</p>
        </div>
        <button onClick={() => setModal(true)} style={{
          background:"linear-gradient(135deg,#10b981,#059669)", border:"none", borderRadius:16,
          padding:"10px 18px", color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:6
        }}>
          <Plus size={16} /> Nova
        </button>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {data.entradas.length === 0 && (
          <div style={{ textAlign:"center", padding:"60px 0", color:"var(--text2)" }}>
            <ArrowUpCircle size={48} color="#10b981" style={{ marginBottom:12, opacity:0.3 }} />
            <p>Nenhuma entrada registrada</p>
          </div>
        )}
        {data.entradas.map(e => (
          <Card key={e.id}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                <div style={{ background:"rgba(16,185,129,0.12)", borderRadius:14, padding:12 }}>
                  <Wallet size={20} color="#10b981" />
                </div>
                <div>
                  <p style={{ color:"var(--text)", fontWeight:700, fontSize:15, margin:0 }}>{e.descricao}</p>
                  <div style={{ display:"flex", gap:8, marginTop:4 }}>
                    <span style={{ background:"rgba(16,185,129,0.1)", color:"#10b981", borderRadius:8, padding:"2px 8px", fontSize:11, fontWeight:600 }}>{e.tipo}</span>
                    {e.recorrente && <span style={{ background:"rgba(99,102,241,0.1)", color:"#818cf8", borderRadius:8, padding:"2px 8px", fontSize:11, fontWeight:600 }}>Recorrente</span>}
                  </div>
                  <p style={{ color:"var(--text2)", fontSize:12, margin:"4px 0 0" }}>{new Date(e.data).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <p style={{ color:"#10b981", fontWeight:800, fontSize:18, margin:"0 0 8px" }}>+{fmt(e.valor)}</p>
                <button onClick={() => handleDel(e.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text2)" }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Nova Entrada">
        <Select label="Tipo" value={form.tipo} onChange={e => setForm(f => ({...f, tipo:e.target.value}))}>
          <option>Salário</option>
          <option>Renda extra</option>
          <option>Freelance</option>
          <option>Investimento</option>
          <option>Outro</option>
        </Select>
        <Input label="Descrição" placeholder="Ex: Salário principal" value={form.descricao} onChange={e => setForm(f => ({...f, descricao:e.target.value}))} />
        <Input label="Valor (R$)" type="number" placeholder="0,00" value={form.valor} onChange={e => setForm(f => ({...f, valor:e.target.value}))} />
        <Input label="Data" type="date" value={form.data} onChange={e => setForm(f => ({...f, data:e.target.value}))} />
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20, padding:"12px 16px", background:"var(--bg)", borderRadius:14 }}>
          <button onClick={() => setForm(f => ({...f, recorrente:!f.recorrente}))} style={{
            width:44, height:24, borderRadius:12, border:"none", cursor:"pointer", position:"relative", transition:"background 0.2s",
            background: form.recorrente ? "#10b981" : "var(--border)"
          }}>
            <span style={{ position:"absolute", top:2, left: form.recorrente ? 22 : 2, width:20, height:20, borderRadius:10, background:"#fff", transition:"left 0.2s" }} />
          </button>
          <span style={{ color:"var(--text)", fontSize:14 }}>Recorrência mensal</span>
        </div>
        <Btn onClick={handleAdd} disabled={!form.valor || !form.descricao}>Adicionar Entrada</Btn>
      </Modal>
    </div>
  );
}

function Contas({ data, setData }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ tipo:"Cartão", descricao:"", valor:"", parcelas:"1", vencimento: today.toISOString().split("T")[0] });

  const handleAdd = () => {
    if (!form.valor || !form.descricao) return;
    const nova = { ...form, id: Date.now(), valor: parseFloat(form.valor), parcelas: parseInt(form.parcelas), parcelaAtual:1, pago:false };
    setData(d => ({ ...d, contas: [...d.contas, nova] }));
    setModal(false);
    setForm({ tipo:"Cartão", descricao:"", valor:"", parcelas:"1", vencimento: today.toISOString().split("T")[0] });
  };

  const togglePago = (id) => setData(d => ({ ...d, contas: d.contas.map(c => c.id === id ? {...c, pago:!c.pago} : c) }));
  const handleDel = (id) => setData(d => ({ ...d, contas: d.contas.filter(c => c.id !== id) }));

  const pendentes = data.contas.filter(c => !c.pago);
  const pagas = data.contas.filter(c => c.pago);
  const totalPendente = pendentes.reduce((s,c) => s + (c.valor / c.parcelas), 0);

  const tipoIcons = { "Cartão": CreditCard, "Boleto": FileText, "Parcelamento": RefreshCw };
  const tipoCores = { "Cartão": "#8b5cf6", "Boleto": "#f59e0b", "Parcelamento": "#3b82f6" };

  function ContaCard({ c }) {
    const Icon = CreditCard;
    const dias = Math.ceil((new Date(c.vencimento) - today) / (1000*60*60*24));
    const urgente = !c.pago && dias <= 3;
    const cor = tipoCores[c.tipo] || "#6b7280";
    const parcela = c.valor / c.parcelas;
    return (
      <Card style={{ opacity: c.pago ? 0.6 : 1, border: urgente ? "1.5px solid #ef444440" : "1px solid var(--border)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div style={{ display:"flex", gap:12, alignItems:"center", flex:1 }}>
            <div style={{ background:`${cor}18`, borderRadius:14, padding:12 }}>
              <CreditCard size={20} color={cor} />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <p style={{ color:"var(--text)", fontWeight:700, fontSize:15, margin:0 }}>{c.descricao}</p>
                {urgente && <AlertTriangle size={14} color="#ef4444" />}
              </div>
              <div style={{ display:"flex", gap:6, marginTop:4 }}>
                <span style={{ background:`${cor}18`, color:cor, borderRadius:8, padding:"2px 8px", fontSize:11, fontWeight:600 }}>{c.tipo}</span>
                {c.parcelas > 1 && <span style={{ color:"var(--text2)", fontSize:11 }}>{c.parcelaAtual}/{c.parcelas}x</span>}
              </div>
              <p style={{ color: urgente ? "#ef4444" : "var(--text2)", fontSize:12, margin:"4px 0 0", fontWeight: urgente ? 600 : 400 }}>
                {c.pago ? "✓ Pago" : `Vence: ${new Date(c.vencimento).toLocaleDateString("pt-BR")} ${dias > 0 ? `(em ${dias}d)` : "(hoje!)"}`}
              </p>
            </div>
          </div>
          <div style={{ textAlign:"right", marginLeft:12 }}>
            <p style={{ color:"var(--text)", fontWeight:800, fontSize:17, margin:0 }}>{fmt(parcela)}</p>
            {c.parcelas > 1 && <p style={{ color:"var(--text2)", fontSize:11, margin:"2px 0 0" }}>de {fmt(c.valor)}</p>}
            <div style={{ display:"flex", gap:8, marginTop:8, justifyContent:"flex-end" }}>
              <button onClick={() => togglePago(c.id)} style={{
                background: c.pago ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.8)",
                border:"none", borderRadius:8, padding:"6px 10px", cursor:"pointer", color: c.pago ? "#10b981" : "#fff",
                fontWeight:600, fontSize:12
              }}>
                {c.pago ? "✓" : "Pagar"}
              </button>
              <button onClick={() => handleDel(c.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text2)", padding:"6px" }}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ padding:"80px 16px 100px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h2 style={{ color:"var(--text)", fontSize:24, fontWeight:800, margin:0, fontFamily:"'DM Serif Display',serif" }}>Contas</h2>
          <p style={{ color:"#ef4444", fontSize:14, margin:"2px 0 0", fontWeight:600 }}>{fmt(totalPendente)} pendente</p>
        </div>
        <button onClick={() => setModal(true)} style={{
          background:"linear-gradient(135deg,#8b5cf6,#7c3aed)", border:"none", borderRadius:16,
          padding:"10px 18px", color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:6
        }}>
          <Plus size={16} /> Nova
        </button>
      </div>

      {pendentes.length > 0 && (
        <>
          <p style={{ color:"var(--text2)", fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Pendentes</p>
          <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
            {pendentes.map(c => <ContaCard key={c.id} c={c} />)}
          </div>
        </>
      )}

      {pagas.length > 0 && (
        <>
          <p style={{ color:"var(--text2)", fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Pagas</p>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {pagas.map(c => <ContaCard key={c.id} c={c} />)}
          </div>
        </>
      )}

      {data.contas.length === 0 && (
        <div style={{ textAlign:"center", padding:"60px 0", color:"var(--text2)" }}>
          <CreditCard size={48} color="#8b5cf6" style={{ marginBottom:12, opacity:0.3 }} />
          <p>Nenhuma conta registrada</p>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Nova Conta / Fatura">
        <Select label="Tipo" value={form.tipo} onChange={e => setForm(f => ({...f, tipo:e.target.value}))}>
          <option>Cartão</option>
          <option>Boleto</option>
          <option>Parcelamento</option>
        </Select>
        <Input label="Descrição" placeholder="Ex: Nubank Fevereiro" value={form.descricao} onChange={e => setForm(f => ({...f, descricao:e.target.value}))} />
        <Input label="Valor Total (R$)" type="number" placeholder="0,00" value={form.valor} onChange={e => setForm(f => ({...f, valor:e.target.value}))} />
        <Input label="Número de Parcelas" type="number" min="1" value={form.parcelas} onChange={e => setForm(f => ({...f, parcelas:e.target.value}))} />
        <Input label="Vencimento" type="date" value={form.vencimento} onChange={e => setForm(f => ({...f, vencimento:e.target.value}))} />
        {form.valor && form.parcelas && (
          <div style={{ background:"rgba(139,92,246,0.1)", borderRadius:14, padding:14, marginBottom:16 }}>
            <p style={{ color:"#a78bfa", fontSize:13, margin:0 }}>
              💡 Cada parcela: <strong>{fmt(parseFloat(form.valor || 0) / parseInt(form.parcelas || 1))}</strong>
            </p>
          </div>
        )}
        <Btn onClick={handleAdd} disabled={!form.valor || !form.descricao} style={{ background:"linear-gradient(135deg,#8b5cf6,#7c3aed)", boxShadow:"0 8px 24px rgba(139,92,246,0.35)" }}>
          Adicionar Conta
        </Btn>
      </Modal>
    </div>
  );
}

function Gastos({ data, setData }) {
  const [modal, setModal] = useState(false);
  const [catFiltro, setCatFiltro] = useState("Todos");
  const [form, setForm] = useState({ categoria:"Essenciais", descricao:"", valor:"", data: today.toISOString().split("T")[0] });

  const handleAdd = () => {
    if (!form.valor || !form.descricao) return;
    const novo = { ...form, id: Date.now(), valor: parseFloat(form.valor) };
    setData(d => ({ ...d, gastos: [...d.gastos, novo] }));
    // streak reset if bobagem
    if (form.categoria === "Bobagens") {
      setData(d => ({ ...d, streak: 0 }));
    }
    setModal(false);
    setForm({ categoria:"Essenciais", descricao:"", valor:"", data: today.toISOString().split("T")[0] });
  };

  const handleDel = (id) => setData(d => ({ ...d, gastos: d.gastos.filter(g => g.id !== id) }));

  const cats = ["Todos","Essenciais","Investimentos","Lazer","Bobagens"];
  const filtrados = catFiltro === "Todos" ? data.gastos : data.gastos.filter(g => g.categoria === catFiltro);
  const sorted = [...filtrados].sort((a,b) => new Date(b.data) - new Date(a.data));

  const totalMes = data.gastos.filter(g => new Date(g.data).getMonth() === today.getMonth()).reduce((s,g) => s+g.valor, 0);
  const bobMes = data.gastos.filter(g => g.categoria === "Bobagens" && new Date(g.data).getMonth() === today.getMonth()).reduce((s,g) => s+g.valor, 0);

  const catData = ["Essenciais","Investimentos","Lazer","Bobagens"].map(cat => ({
    name: cat,
    value: data.gastos.filter(g => g.categoria === cat && new Date(g.data).getMonth() === today.getMonth()).reduce((s,g) => s+g.valor, 0)
  })).filter(c => c.value > 0);

  const cores = { Essenciais:"#3b82f6", Investimentos:"#10b981", Lazer:"#8b5cf6", Bobagens:"#ef4444" };
  const icons = { Essenciais: Shield, Investimentos: TrendingUp, Lazer: Tv, Bobagens: ShoppingBag };

  return (
    <div style={{ padding:"80px 16px 100px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h2 style={{ color:"var(--text)", fontSize:24, fontWeight:800, margin:0, fontFamily:"'DM Serif Display',serif" }}>Gastos</h2>
          <p style={{ color:"var(--text2)", fontSize:14, margin:"2px 0 0" }}>{fmt(totalMes)} este mês</p>
        </div>
        <button onClick={() => setModal(true)} style={{
          background:"linear-gradient(135deg,#ef4444,#dc2626)", border:"none", borderRadius:16,
          padding:"10px 18px", color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:6
        }}>
          <Plus size={16} /> Novo
        </button>
      </div>

      {/* Bobagens alert */}
      {bobMes > 150 && (
        <div style={{ background:"rgba(239,68,68,0.08)", border:"1.5px solid rgba(239,68,68,0.25)", borderRadius:16, padding:"14px 16px", marginBottom:16, display:"flex", gap:10, alignItems:"center" }}>
          <span style={{ fontSize:20 }}>🛑</span>
          <div>
            <p style={{ color:"#ef4444", fontWeight:700, fontSize:14, margin:0 }}>Alerta de Bobagens!</p>
            <p style={{ color:"var(--text2)", fontSize:13, margin:"2px 0 0" }}>Você gastou {fmt(bobMes)} em bobagens. Isso compromete sua meta!</p>
          </div>
        </div>
      )}

      {/* Mini bar chart */}
      <Card style={{ marginBottom:16 }}>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={catData} margin={{ top:0, right:0, left:-20, bottom:0 }}>
            <XAxis dataKey="name" tick={{ fill:"var(--text2)", fontSize:10 }} axisLine={false} tickLine={false}
              tickFormatter={n => n.substring(0,3)} />
            <YAxis tick={{ fill:"var(--text2)", fontSize:9 }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} />
            <Tooltip formatter={(v,n) => [fmt(v), n]} contentStyle={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:12, color:"var(--text)" }} />
            <Bar dataKey="value" radius={[6,6,0,0]}>
              {catData.map((entry) => (
                <Cell key={entry.name} fill={cores[entry.name] || "#6b7280"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Filtros */}
      <div style={{ display:"flex", gap:8, marginBottom:16, overflowX:"auto", paddingBottom:4 }}>
        {cats.map(cat => (
          <button key={cat} onClick={() => setCatFiltro(cat)} style={{
            background: catFiltro === cat ? "#10b981" : "var(--card)",
            border: catFiltro === cat ? "none" : "1px solid var(--border)",
            borderRadius:12, padding:"8px 16px", color: catFiltro === cat ? "#fff" : "var(--text2)",
            fontWeight:600, fontSize:13, cursor:"pointer", whiteSpace:"nowrap", transition:"all 0.2s", fontFamily:"inherit"
          }}>{cat}</button>
        ))}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {sorted.length === 0 && (
          <div style={{ textAlign:"center", padding:"60px 0", color:"var(--text2)" }}>
            <ShoppingBag size={48} style={{ marginBottom:12, opacity:0.3 }} />
            <p>Nenhum gasto registrado</p>
          </div>
        )}
        {sorted.map(g => {
          const Icon = icons[g.categoria] || ShoppingBag;
          const cor = cores[g.categoria] || "#6b7280";
          return (
            <Card key={g.id} style={{ padding:"14px 16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  <div style={{ background:`${cor}18`, borderRadius:12, padding:10 }}>
                    <Icon size={18} color={cor} />
                  </div>
                  <div>
                    <p style={{ color:"var(--text)", fontWeight:600, fontSize:14, margin:0 }}>{g.descricao}</p>
                    <div style={{ display:"flex", gap:6, alignItems:"center", marginTop:3 }}>
                      <span style={{ background:`${cor}18`, color:cor, borderRadius:6, padding:"1px 7px", fontSize:11, fontWeight:600 }}>{g.categoria}</span>
                      <span style={{ color:"var(--text2)", fontSize:11 }}>{new Date(g.data).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ color:"#ef4444", fontWeight:800, fontSize:16 }}>-{fmt(g.valor)}</span>
                  <button onClick={() => handleDel(g.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text2)" }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Novo Gasto">
        <Select label="Categoria" value={form.categoria} onChange={e => setForm(f => ({...f, categoria:e.target.value}))}>
          <option>Essenciais</option>
          <option>Investimentos</option>
          <option>Lazer</option>
          <option>Bobagens</option>
        </Select>
        <Input label="Descrição" placeholder="Ex: Aluguel, Netflix, Uber Eats..." value={form.descricao} onChange={e => setForm(f => ({...f, descricao:e.target.value}))} />
        <Input label="Valor (R$)" type="number" placeholder="0,00" value={form.valor} onChange={e => setForm(f => ({...f, valor:e.target.value}))} />
        <Input label="Data" type="date" value={form.data} onChange={e => setForm(f => ({...f, data:e.target.value}))} />
        {form.categoria === "Bobagens" && (
          <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:14, padding:14, marginBottom:16 }}>
            <p style={{ color:"#ef4444", fontSize:13, margin:0 }}>⚠️ Registrar como bobagem vai resetar seu streak!</p>
          </div>
        )}
        <Btn onClick={handleAdd} disabled={!form.valor || !form.descricao} style={{ background:"linear-gradient(135deg,#ef4444,#dc2626)", boxShadow:"0 8px 24px rgba(239,68,68,0.35)" }}>
          Registrar Gasto
        </Btn>
      </Modal>
    </div>
  );
}

function Meta({ data, setData, small }) {
  const [addVal, setAddVal] = useState("");
  const [scenario, setScenario] = useState({ corte:300, renda:500 });
  const [resetOpen, setResetOpen] = useState(false);
  const [editGoalOpen, setEditGoalOpen] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [dateInput, setDateInput] = useState("");

  const metaGoal = (data.metaGoal && Number(data.metaGoal) > 0) ? Number(data.metaGoal) : META_VALUE;
  const metaDate = data.metaDate || SEED.metaDate;
  const { daysLeft, monthsLeft } = calcDateMetrics(metaDate);
  
  useEffect(() => { setGoalInput(String(metaGoal)); }, [metaGoal]);
  useEffect(() => { setDateInput(metaDate); }, [metaDate]);

  const pct = Math.min((data.metaAtual / metaGoal) * 100, 100);
  const falta = Math.max(metaGoal - data.metaAtual, 0);
  const guardPorMes = monthsLeft > 0 ? falta / monthsLeft : falta;

  const simCorte = Math.min(data.metaAtual + scenario.corte * monthsLeft, metaGoal * 1.5);
  const simRenda = Math.min(data.metaAtual + scenario.renda * monthsLeft, metaGoal * 1.5);
  const pctCorte = Math.min((simCorte / metaGoal) * 100, 100);
  const pctRenda = Math.min((simRenda / metaGoal) * 100, 100);

  const handleAdd = () => {
    const v = parseFloat(addVal);
    if (!v || v <= 0) return;
    setData(d => ({ ...d, metaAtual: Math.min(d.metaAtual + v, (d.metaGoal && Number(d.metaGoal) > 0) ? Number(d.metaGoal) : META_VALUE), streak: d.streak + 1 }));
    setAddVal("");
  };

  // Projection data
  const proj = Array.from({ length: monthsLeft + 1 }, (_, i) => ({
    mes: `M${i}`,
    projetado: Math.min(data.metaAtual + guardPorMes * i, metaGoal),
    meta: metaGoal,
  }));

  const milestones = [
    { label: "🌱 Início", val: 0, done: true },
    { label: "☕ 1k guardado", val: 1000, done: data.metaAtual >= 1000 },
    { label: "🎯 25% da meta", val: 2500, done: data.metaAtual >= 2500 },
    { label: "⚡ Metade lá!", val: 5000, done: data.metaAtual >= 5000 },
    { label: "🔥 75% concluído", val: 7500, done: data.metaAtual >= 7500 },
    { label: "🏆 META BATIDA!", val: metaGoal, done: data.metaAtual >= metaGoal },
  ];

  const msgs = [
    "Você está indo muito bem! Continue focado! 💪",
    `Só faltam ${fmt(falta)} para realizar seu sonho!`,
    `Em ${monthsLeft} meses, com disciplina, você chega lá!`,
    `Cada real conta. Guarde ${fmt(guardPorMes)}/mês e vence!`,
  ];
  const msg = msgs[Math.floor((data.metaAtual / metaGoal) * (msgs.length - 1))];

  return (
    <div style={{ padding:"80px 16px 100px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, marginBottom:6 }}>
        <h2 style={{ color:"var(--text)", fontSize:24, fontWeight:800, margin:0, fontFamily:"'DM Serif Display',serif" }}>Meta: {fmt(metaGoal)}</h2>
        <button onClick={() => setEditGoalOpen(true)} style={{ background:"transparent", border:"1px solid var(--border)", padding:"8px 10px", borderRadius:12, color:"var(--text2)", cursor:"pointer" }}>Editar Meta</button>
      </div>
      <p style={{ color:"var(--text2)", fontSize:14, margin:"0 0 20px" }}>Até {fmtDate(metaDate)} • {daysLeft} dias restantes</p>

      {/* Progress hero */}
      <Card style={{ marginBottom:16, textAlign:"center", padding:28, background:"linear-gradient(135deg, rgba(16,185,129,0.05), rgba(16,185,129,0.02))", border:"1px solid rgba(16,185,129,0.2)" }}>
        <div style={{ position:"relative", display:"inline-flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
          <ProgressRing pct={pct} size={160} stroke={14} />
          <div style={{ position:"absolute", textAlign:"center" }}>
            <span style={{ color:"var(--text)", fontWeight:900, fontSize:28, display:"block", fontFamily:"'DM Serif Display',serif" }}>{pct.toFixed(1)}%</span>
            <span style={{ color:"#10b981", fontSize:12, fontWeight:600 }}>{fmt(data.metaAtual)}</span>
          </div>
        </div>
        <p style={{ color:"var(--text2)", fontSize:14, margin:"0 0 16px", fontStyle:"italic" }}>"{msg}"</p>
        
        <div style={{ display:"flex", gap:8, alignItems:"center", flexDirection: small ? "column" : "row", alignContent: small ? "stretch" : "flex-start" }}>
          <input value={addVal} onChange={e => setAddVal(e.target.value)} type="number" placeholder="Adicionar à meta (R$)"
            style={{ flex:1, width: small ? "100%" : undefined, background:"var(--bg)", border:"1.5px solid var(--border)", borderRadius:14, padding:"12px 16px", color:"var(--text)", fontSize:15, outline:"none", fontFamily:"inherit" }}
          />
          <button onClick={handleAdd} style={{ background:"linear-gradient(135deg,#10b981,#059669)", border:"none", borderRadius:14, padding:"12px 20px", color:"#fff", fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", width: small ? "100%" : undefined }}>
            Guardar
          </button>
          <button onClick={() => setResetOpen(true)} style={{ background:"transparent", border:"1px solid rgba(239,68,68,0.18)", borderRadius:14, padding:"12px 16px", color:"#ef4444", fontWeight:700, cursor:"pointer", width: small ? "100%" : undefined }}>
            Reiniciar Meta
          </button>
        </div>
      
      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reiniciar Meta">
        <p style={{ color:"var(--text)", marginBottom:12 }}>Tem certeza que deseja reiniciar sua meta? Isso irá zerar o progresso atual e o streak.</p>
        <div style={{ display:"flex", gap:10 }}>
          <Btn onClick={() => { setData(d => ({ ...d, metaAtual: 0, streak: 0 })); setResetOpen(false); }}>Confirmar Reinício</Btn>
          <Btn variant="secondary" onClick={() => setResetOpen(false)}>Cancelar</Btn>
        </div>
      </Modal>
      
      <Modal open={editGoalOpen} onClose={() => setEditGoalOpen(false)} title="Editar Meta">
        <Input label="Meta alvo (R$)" value={goalInput} onChange={e => setGoalInput(e.target.value)} />
        <Input label="Data para completar" type="date" value={dateInput} onChange={e => setDateInput(e.target.value)} />
        <div style={{ display:"flex", gap:10 }}>
          <Btn onClick={() => { const v = Number(goalInput) || META_VALUE; setData(d => ({ ...d, metaGoal: v, metaDate: dateInput || SEED.metaDate })); setEditGoalOpen(false); }}>Salvar</Btn>
          <Btn variant="secondary" onClick={() => setEditGoalOpen(false)}>Cancelar</Btn>
        </div>
      </Modal>
      </Card>

      {/* Milestones */}
      <Card style={{ marginBottom:16 }}>
        <p style={{ color:"var(--text)", fontWeight:700, fontSize:15, margin:"0 0 14px" }}>Conquistas</p>
        {milestones.map((m, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:12, marginBottom: i < milestones.length-1 ? 12 : 0 }}>
            <div style={{ width:32, height:32, borderRadius:16, background: m.done ? "#10b981" : "var(--bg)", border: m.done ? "none" : "2px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"background 0.3s" }}>
              {m.done ? <Check size={16} color="#fff" /> : <span style={{ color:"var(--text2)", fontSize:11, fontWeight:700 }}>{i+1}</span>}
            </div>
            <div style={{ flex:1 }}>
              <span style={{ color: m.done ? "var(--text)" : "var(--text2)", fontWeight: m.done ? 600 : 400, fontSize:14 }}>{m.label}</span>
            </div>
            <span style={{ color:"var(--text2)", fontSize:12 }}>{fmt(m.val)}</span>
          </div>
        ))}
      </Card>

      {/* Simulador */}
      <Card style={{ marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
          <Zap size={16} color="#f59e0b" />
          <p style={{ color:"var(--text)", fontWeight:700, fontSize:15, margin:0 }}>Simulador de Cenários</p>
        </div>

        <div style={{ background:"var(--bg)", borderRadius:14, padding:14, marginBottom:12 }}>
          <p style={{ color:"var(--text2)", fontSize:12, margin:"0 0 8px", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>Se cortar R$ em bobagens/mês</p>
          <input type="range" min={0} max={1000} step={50} value={scenario.corte}
            onChange={e => setScenario(s => ({...s, corte: parseInt(e.target.value)}))}
            style={{ width:"100%", accentColor:"#f59e0b", marginBottom:8 }} />
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <span style={{ color:"#f59e0b", fontWeight:700 }}>R$ {scenario.corte}/mês</span>
            <span style={{ color:"var(--text)", fontSize:13 }}>Acumularia {fmt(simCorte)} ({pctCorte.toFixed(0)}%)</span>
          </div>
          {simCorte >= metaGoal && <div style={{ color:"#10b981", fontWeight:700, fontSize:13, marginTop:4 }}>✅ Meta batida nesse cenário!</div>}
        </div>

        <div style={{ background:"var(--bg)", borderRadius:14, padding:14 }}>
          <p style={{ color:"var(--text2)", fontSize:12, margin:"0 0 8px", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>Se aumentar renda em R$/mês</p>
          <input type="range" min={0} max={2000} step={100} value={scenario.renda}
            onChange={e => setScenario(s => ({...s, renda: parseInt(e.target.value)}))}
            style={{ width:"100%", accentColor:"#10b981", marginBottom:8 }} />
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <span style={{ color:"#10b981", fontWeight:700 }}>+R$ {scenario.renda}/mês</span>
            <span style={{ color:"var(--text)", fontSize:13 }}>Acumularia {fmt(simRenda)} ({pctRenda.toFixed(0)}%)</span>
          </div>
          {simRenda >= metaGoal && <div style={{ color:"#10b981", fontWeight:700, fontSize:13, marginTop:4 }}>✅ Meta batida nesse cenário!</div>}
        </div>
      </Card>

      {/* Projeção */}
      <Card>
        <p style={{ color:"var(--text)", fontWeight:700, fontSize:15, margin:"0 0 12px" }}>Projeção até {fmtDate(metaDate)}</p>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={proj} margin={{ top:0, right:0, left:-20, bottom:0 }}>
            <defs>
              <linearGradient id="gProj" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="mes" tick={{ fill:"var(--text2)", fontSize:10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:"var(--text2)", fontSize:9 }} axisLine={false} tickLine={false} tickFormatter={v => fmtShort(v)} />
            <Tooltip formatter={(v) => [fmt(v)]} contentStyle={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:12, color:"var(--text)" }} />
            <Area type="monotone" dataKey="projetado" stroke="#10b981" fill="url(#gProj)" strokeWidth={2.5} dot={false} name="Projetado" />
            <Area type="monotone" dataKey="meta" stroke="#ffffff20" fill="none" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Meta" />
          </AreaChart>
        </ResponsiveContainer>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
          <span style={{ fontSize:12, color:"var(--text2)" }}>Precisar guardar: <strong style={{ color:"var(--text)" }}>{fmt(guardPorMes)}/mês</strong></span>
          <span style={{ fontSize:12, color: data.metaAtual >= metaGoal ? "#10b981" : "var(--text2)" }}>
            {data.metaAtual >= metaGoal ? "🎉 Meta atingida!" : `${fmt(falta)} faltando`}
          </span>
        </div>
      </Card>
    </div>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App() {
  const [data, setData] = useStorage("financeApp_data", SEED);
  const [tab, setTab] = useState("dashboard");
  const [dark, setDark] = useStorage("financeApp_dark", true);
  const [isSmall, setIsSmall] = useState(typeof window !== "undefined" ? window.innerWidth <= 420 : false);

  useEffect(() => {
    function onResize() { setIsSmall(window.innerWidth <= 420); }
    try {
      window.addEventListener('resize', onResize);
    } catch (e) {}
    return () => { try { window.removeEventListener('resize', onResize); } catch (e) {} };
  }, []);

  const setRendaMensal = (v) => setData(d => ({ ...d, rendaMensal: Number(v) }));

  const tabs = [
    { id:"dashboard", icon:Home, label:"Início" },
    { id:"entradas", icon:TrendingUp, label:"Entradas" },
    { id:"contas", icon:CreditCard, label:"Contas" },
    { id:"gastos", icon:PieChart, label:"Gastos" },
    { id:"meta", icon:Target, label:"Meta" },
  ];

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700;800&display=swap');
    
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    
    :root {
      --bg: ${dark ? "#0a0f0d" : "#f0f7f4"};
      --card: ${dark ? "#111816" : "#ffffff"};
      --border: ${dark ? "#1f2e28" : "#d1fae5"};
      --text: ${dark ? "#f0fdf4" : "#064e3b"};
      --text2: ${dark ? "#4b7460" : "#6b9e8a"};
    }

    body { 
      background: var(--bg); 
      color: var(--text); 
      font-family: 'DM Sans', sans-serif; 
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }

    input[type="range"] { height: 4px; cursor: pointer; }
    input[type="range"]::-webkit-slider-thumb { width: 20px; height: 20px; }
    
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    select option { background: var(--card); color: var(--text); }
  `;

  return (
    <>
      <style>{styles}</style>
      <div style={{ maxWidth:480, margin:"0 auto", minHeight:"100vh", background:"var(--bg)", position:"relative" }}>
        
        {/* Top bar */}
        <div style={{
          position:"fixed", top:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480,
          zIndex:100, background:"var(--bg)", borderBottom:"1px solid var(--border)",
          display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"12px 20px 10px", backdropFilter:"blur(12px)"
        }}>
          <div>
            <p style={{ color:"var(--text2)", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.1em", margin:0 }}>FinanceOS</p>
            <p style={{ color:"var(--text)", fontSize:13, fontWeight:600, margin:"1px 0 0" }}>
              {new Date().toLocaleDateString("pt-BR", { weekday:"short", day:"numeric", month:"short" })}
            </p>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <div style={{ background:"rgba(249,115,22,0.1)", borderRadius:12, padding:"6px 12px", display:"flex", alignItems:"center", gap:5 }}>
              <Flame size={13} color="#f97316" />
              <span style={{ color:"#f97316", fontWeight:700, fontSize:13 }}>{data.streak}</span>
            </div>
            <button onClick={() => setDark(d => !d)} style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:12, padding:8, cursor:"pointer", color:"var(--text2)", display:"flex", alignItems:"center" }}>
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ animation:"fadeIn 0.3s ease" }}>
          {tab === "dashboard" && <Dashboard data={data} dark={dark} onSetRenda={setRendaMensal} isSmall={isSmall} />}
          {tab === "entradas" && <Entradas data={data} setData={setData} isSmall={isSmall} />}
          {tab === "contas" && <Contas data={data} setData={setData} isSmall={isSmall} />}
          {tab === "gastos" && <Gastos data={data} setData={setData} isSmall={isSmall} />}
          {tab === "meta" && <Meta data={data} setData={setData} small={isSmall} />}
        </div>

        {/* Bottom nav */}
        <div style={{
          position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480,
          background:"var(--card)", borderTop:"1px solid var(--border)", display:"flex",
          padding:"8px 8px 20px", backdropFilter:"blur(16px)", zIndex:100
        }}>
          {tabs.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4,
                background:"none", border:"none", cursor:"pointer", padding:"8px 4px",
                transition:"all 0.2s", borderRadius:12
              }}>
                <div style={{
                  padding:"6px 14px", borderRadius:12, transition:"all 0.2s",
                  background: active ? "rgba(16,185,129,0.12)" : "transparent"
                }}>
                  <Icon size={20} color={active ? "#10b981" : "var(--text2)"} strokeWidth={active ? 2.5 : 1.8} />
                </div>
                <span style={{ color: active ? "#10b981" : "var(--text2)", fontSize:10, fontWeight: active ? 700 : 500, letterSpacing:"0.02em" }}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
