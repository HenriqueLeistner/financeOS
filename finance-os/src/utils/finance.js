// ─── FINANCE ENGINE ───────────────────────────────────────────────────────────
// Toda lógica de cálculo financeiro isolada aqui

export const META_VALUE = 10000;
export const META_DATE = new Date(2025, 9, 31); // 31 de Outubro 2025
export const today = new Date();

// Formatadores
export const fmt = (v) =>
  `R$\u00a0${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtShort = (v) => {
  if (Math.abs(v) >= 1000) return `R$\u00a0${(v / 1000).toFixed(1)}k`;
  return `R$\u00a0${Number(v).toFixed(0)}`;
};

// Tempo
export const getDaysLeft = () =>
  Math.max(0, Math.ceil((META_DATE - today) / (1000 * 60 * 60 * 24)));

export const getMonthsLeft = () => Math.max(1, Math.ceil(getDaysLeft() / 30));

// Filtros por mês/ano
export const filterByMonth = (arr, month = today.getMonth(), year = today.getFullYear()) =>
  arr.filter((item) => {
    const d = new Date(item.data);
    return d.getMonth() === month && d.getFullYear() === year;
  });

// Totais
export const sumValores = (arr) => arr.reduce((s, item) => s + (item.valor || 0), 0);

export const getTotalEntradasMes = (entradas) =>
  sumValores(filterByMonth(entradas));

export const getTotalGastosMes = (gastos) =>
  sumValores(filterByMonth(gastos));

export const getSaldoMes = (entradas, gastos) =>
  getTotalEntradasMes(entradas) - getTotalGastosMes(gastos);

export const getGastosPorCategoria = (gastos, mes = today.getMonth(), ano = today.getFullYear()) => {
  const cats = ["Essenciais", "Investimentos", "Lazer", "Bobagens"];
  return cats.map((cat) => ({
    categoria: cat,
    total: sumValores(filterByMonth(gastos, mes, ano).filter((g) => g.categoria === cat)),
  }));
};

// Meta
export const getPctMeta = (metaAtual) =>
  Math.min((metaAtual / META_VALUE) * 100, 100);

export const getFaltaMeta = (metaAtual) => Math.max(META_VALUE - metaAtual, 0);

export const getGuardarPorMes = (metaAtual) => {
  const falta = getFaltaMeta(metaAtual);
  const meses = getMonthsLeft();
  return meses > 0 ? falta / meses : falta;
};

// Simulações
export const simularCorte = (metaAtual, corteMensal) => {
  const meses = getMonthsLeft();
  return Math.min(metaAtual + corteMensal * meses, META_VALUE * 1.5);
};

export const simularRenda = (metaAtual, rendaExtra) => {
  const meses = getMonthsLeft();
  return Math.min(metaAtual + rendaExtra * meses, META_VALUE * 1.5);
};

// Projeção mensal
export const gerarProjecao = (metaAtual) => {
  const meses = getMonthsLeft();
  const porMes = getGuardarPorMes(metaAtual);
  return Array.from({ length: meses + 1 }, (_, i) => ({
    mes: `M${i}`,
    projetado: Math.min(metaAtual + porMes * i, META_VALUE),
    meta: META_VALUE,
  }));
};

// Insights automáticos
export const gerarInsights = ({ gastos, entradas, metaAtual, streak, contas }) => {
  const insights = [];
  const mes = today.getMonth();
  const ano = today.getFullYear();

  const bobagens = sumValores(filterByMonth(gastos, mes, ano).filter((g) => g.categoria === "Bobagens"));
  const totalGastos = getTotalGastosMes(gastos);
  const totalEntradas = getTotalEntradasMes(entradas);
  const saldo = totalEntradas - totalGastos;
  const guardar = getGuardarPorMes(metaAtual);

  if (bobagens > 150)
    insights.push({ icon: "⚠️", text: `Você gastou ${fmt(bobagens)} em bobagens este mês`, color: "#ef4444" });

  if (saldo > guardar)
    insights.push({ icon: "🎉", text: `Você está ${fmt(saldo - guardar)} acima do planejado este mês!`, color: "#10b981" });
  else if (totalEntradas > 0 && saldo < guardar)
    insights.push({ icon: "📉", text: `Você está ${fmt(guardar - saldo)} abaixo do necessário este mês`, color: "#f59e0b" });

  const contasUrgentes = contas.filter((c) => {
    if (c.pago) return false;
    const dias = Math.ceil((new Date(c.vencimento) - today) / (1000 * 60 * 60 * 24));
    return dias <= 3;
  });
  if (contasUrgentes.length > 0)
    insights.push({ icon: "🔔", text: `${contasUrgentes.length} conta(s) vencem em até 3 dias!`, color: "#ef4444" });

  if (streak >= 7)
    insights.push({ icon: "🔥", text: `${streak} dias sem bobagem! Você é incrível!`, color: "#f97316" });
  else if (streak >= 3)
    insights.push({ icon: "⚡", text: `${streak} dias seguidos sem bobagem. Continue!`, color: "#f97316" });

  if (metaAtual >= META_VALUE)
    insights.push({ icon: "🏆", text: "PARABÉNS! Você bateu a meta de R$10.000!", color: "#10b981" });

  return insights;
};

// Mensagem motivacional baseada no progresso
export const getMensagemMotivacional = (metaAtual) => {
  const pct = getPctMeta(metaAtual);
  const falta = getFaltaMeta(metaAtual);
  const guardar = getGuardarPorMes(metaAtual);
  const meses = getMonthsLeft();

  if (pct >= 100) return "🏆 META CONQUISTADA! Você é incrível!";
  if (pct >= 75) return `Quase lá! Só ${fmt(falta)} para o sonho! 🔥`;
  if (pct >= 50) return `Metade do caminho feita! ${fmt(guardar)}/mês e você chega! 💪`;
  if (pct >= 25) return `Ótimo início! Guarde ${fmt(guardar)}/mês e vence em ${meses} meses!`;
  return `Cada real conta. Comece hoje, guarde ${fmt(guardar)}/mês! 🌱`;
};

// Seed data inicial
export const SEED_DATA = {
  entradas: [
    { id: 1, tipo: "Salário", valor: 4500, data: "2025-01-05", recorrente: true, descricao: "Salário principal" },
    { id: 2, tipo: "Renda extra", valor: 800, data: "2025-01-12", recorrente: false, descricao: "Freelance design" },
    { id: 3, tipo: "Salário", valor: 4500, data: "2025-02-05", recorrente: true, descricao: "Salário principal" },
  ],
  gastos: [
    { id: 1, categoria: "Essenciais", valor: 1200, data: "2025-02-03", descricao: "Aluguel" },
    { id: 2, categoria: "Essenciais", valor: 350, data: "2025-02-08", descricao: "Mercado" },
    { id: 3, categoria: "Lazer", valor: 180, data: "2025-02-10", descricao: "Cinema + jantar" },
    { id: 4, categoria: "Bobagens", valor: 95, data: "2025-02-11", descricao: "Compra impulsiva" },
    { id: 5, categoria: "Investimentos", valor: 500, data: "2025-02-01", descricao: "Tesouro Direto" },
    { id: 6, categoria: "Bobagens", valor: 45, data: "2025-02-14", descricao: "Delivery tarde da noite" },
  ],
  contas: [
    { id: 1, tipo: "Cartão", descricao: "Nubank Fevereiro", valor: 1450, parcelas: 1, parcelaAtual: 1, vencimento: "2025-02-20", pago: false },
    { id: 2, tipo: "Boleto", descricao: "Internet Fibra", valor: 99.9, parcelas: 1, parcelaAtual: 1, vencimento: "2025-02-25", pago: false },
    { id: 3, tipo: "Parcelamento", descricao: "Notebook 10x", valor: 2400, parcelas: 10, parcelaAtual: 3, vencimento: "2025-02-28", pago: false },
  ],
  metaAtual: 1850,
  streak: 3,
};
