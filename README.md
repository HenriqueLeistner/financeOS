# 💰 FinanceOS — PWA de Controle Financeiro

App PWA mobile-first para organização financeira pessoal com foco em atingir a meta de **R$10.000 até outubro**.

---

## 🚀 Como rodar

### Pré-requisitos
- Node.js 16+
- npm ou yarn

### Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Rodar em desenvolvimento
npm start

# 3. Build para produção
npm run build
```

---

## 📱 Funcionalidades

- **Dashboard** — Saldo, entradas/saídas, progresso da meta, gráfico mensal, insights automáticos
- **Entradas** — Salário, renda extra, freelance com recorrência mensal
- **Contas** — Cartão, boletos, parcelamentos com alertas de vencimento
- **Gastos** — Categorias: Essenciais, Investimentos, Lazer, Bobagens
- **Meta** — Progress ring, simulador de cenários, projeção até outubro, conquistas

### Extras
- 🔥 Sistema de streak (dias sem bobagem)
- 🌙 Modo escuro/claro persistente
- 💾 Funciona offline (localStorage)
- 📊 Gráficos de área e barras animados
- 🧠 Insights automáticos

---

## ☁️ Deploy na Vercel (gratuito)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Build e deploy
npm run build
vercel --prod
```

Ou acesse [vercel.com](https://vercel.com) e conecte seu repositório GitHub.

---

## 📦 Estrutura

```
finance-os/
├── public/
│   ├── index.html       # HTML principal
│   ├── manifest.json    # Config PWA
│   └── sw.js            # Service Worker (offline)
├── src/
│   ├── App.js           # App completo (todos os componentes)
│   ├── index.js         # Entry point + registro do SW
│   └── index.css        # Estilos globais
├── package.json
└── README.md
```

---

## 🎨 Stack

- **React 18** — UI
- **Recharts** — Gráficos
- **Lucide React** — Ícones
- **CSS Variables** — Tema dark/light
- **localStorage** — Persistência offline
- **Service Worker** — PWA instalável

---

## 📲 Instalar como PWA

1. Acesse o app pelo Chrome/Safari no celular
2. Toque no menu do navegador
3. Selecione **"Adicionar à tela inicial"**
4. Pronto! O app funciona como nativo 🎉
