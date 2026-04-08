import React, { useEffect, useMemo, useState } from 'react'
import { Calculator, Wallet, ShieldCheck, Info, CalendarDays, RefreshCw } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'

function formatRub(value) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0)
}

function formatNum(value, digits = 1) {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0)
}

function formatAxisRub(value) {
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) {
    return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(value / 1_000_000_000)} млрд`
  }
  if (abs >= 1_000_000) {
    return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(value / 1_000_000)} млн`
  }
  if (abs >= 1_000) {
    return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value / 1_000)} тыс`
  }
  return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value)}`
}

const LAST_PRICE_UPDATE = '26.03.2026 17:00'
const monthLabels = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']

const ofzScenarios = [
  { id: 'ofz26239', name: 'ОФЗ-ПД 26239', ticker: 'SU26239RMFS2', issuer: 'ОФЗ', price: 920, yield: 13.4, note: 'Длинная ОФЗ, базовый низкий риск', couponMonths: [2, 8], maturityDate: 'Июль 2031', rating: 'AAA' },
  { id: 'ofz26240', name: 'ОФЗ-ПД 26240', ticker: 'SU26240RMFS0', issuer: 'ОФЗ', price: 960, yield: 13.1, note: 'Длинная ОФЗ, сбалансированный сценарий', couponMonths: [1, 7], maturityDate: 'Июль 2036', rating: 'AAA' },
  { id: 'ofz26246', name: 'ОФЗ-ПД 26246', ticker: 'SU26246RMFS7', issuer: 'ОФЗ', price: 880, yield: 14.2, note: 'Повышенная доходность среди ОФЗ', couponMonths: [3, 9], maturityDate: 'Март 2036', rating: 'AAA' },
  { id: 'ofz26247', name: 'ОФЗ-ПД 26247', ticker: 'SU26247RMFS5', issuer: 'ОФЗ', price: 970, yield: 12.8, note: 'Консервативный сценарий', couponMonths: [4, 10], maturityDate: 'Май 2039', rating: 'AAA' },
  { id: 'ofz26248', name: 'ОФЗ-ПД 26248', ticker: 'SU26248RMFS3', issuer: 'ОФЗ', price: 995, yield: 12.5, note: 'Ближе к номиналу, более спокойный сценарий', couponMonths: [5, 11], maturityDate: 'Май 2040', rating: 'AAA' },
  { id: 'ofz26254', name: 'ОФЗ-ПД 26254', ticker: 'SU26254RMFS0', issuer: 'ОФЗ', price: 910, yield: 13.7, note: 'Сценарий с умеренно высокой доходностью', couponMonths: [6, 12], maturityDate: 'Июнь 2041', rating: 'AAA' },
]

const lowStableItems = [
  { id: 'corp-sber-stable', name: 'Сбербанк 001Р-SBER', ticker: '001Р-SBER', issuer: 'Сбер', price: 1010, yield: 15.0, note: 'Надёжный крупный эмитент', couponMonths: [3, 6, 9, 12], maturityDate: 'Сентябрь 2028', rating: 'AAA(RU) / ruAAA' },
  { id: 'corp-novatek-stable', name: 'НОВАТЭК БО-001Р-02', ticker: 'RU000A10AFE8', issuer: 'НОВАТЭК', price: 995, yield: 14.7, note: 'Консервативный сценарий для качественного эмитента', couponMonths: [2, 5, 8, 11], maturityDate: 'Ноябрь 2027', rating: 'AA+(RU) / ruAA+' },
  { id: 'corp-rzd-stable', name: 'РЖД 001Р-37R', ticker: 'RU000A10A0H4', issuer: 'РЖД', price: 1005, yield: 14.5, note: 'Классический надёжный корпоративный выпуск', couponMonths: [1, 4, 7, 10], maturityDate: 'Октябрь 2029', rating: 'AAA(RU) / ruAAA' },
  { id: 'corp-gazprom-stable', name: 'Газпром Капитал БО-001Р-10', ticker: 'RU000A0JX0J2', issuer: 'Газпром', price: 1000, yield: 14.9, note: 'Крупный системный эмитент', couponMonths: [2, 6, 10], maturityDate: 'Июнь 2028', rating: 'AA+(RU) / ruAA+' },
  { id: 'corp-rosneft-stable', name: 'Роснефть 001Р-12', ticker: '001Р-ROSN', issuer: 'Роснефть', price: 990, yield: 15.2, note: 'Надёжный нефтяной сектор', couponMonths: [1, 5, 9], maturityDate: 'Сентябрь 2027', rating: 'AA+(RU) / ruAA+' },
]

const mediumBalanceItems = [
  { id: 'corp-lukoil-balance', name: 'ЛУКОЙЛ БО-001Р-05', ticker: 'RU000A107VU7', issuer: 'Лукойл', price: 965, yield: 17.8, note: 'Средний риск, доходность выше спокойных выпусков', couponMonths: [2, 4, 8, 10], maturityDate: 'Октябрь 2028', rating: 'AA+(RU) / ruAA+' },
  { id: 'corp-severstal-balance', name: 'Северсталь БО-001Р-08', ticker: 'RU000A10AUK8', issuer: 'Северсталь', price: 945, yield: 18.5, note: 'Сценарий со средней степенью риска', couponMonths: [1, 5, 7, 11], maturityDate: 'Август 2027', rating: 'AA(RU) / ruAA' },
  { id: 'corp-phosagro-balance', name: 'ФосАгро БО-П01', ticker: 'RU000A1085D8', issuer: 'ФосАгро', price: 955, yield: 17.3, note: 'Середина между надёжностью и доходностью', couponMonths: [3, 6, 9, 12], maturityDate: 'Декабрь 2029', rating: 'AA(RU) / ruAA' },
  { id: 'corp-magnit-balance', name: 'Магнит БО-004Р-01', ticker: 'RU000A107HE1', issuer: 'Магнит', price: 940, yield: 17.9, note: 'Розничный эмитент со стабильным денежным потоком', couponMonths: [2, 6, 10], maturityDate: 'Июнь 2028', rating: 'AA-(RU) / ruAA-' },
  { id: 'corp-x5-balance', name: 'X5 Финанс 001Р-06', ticker: '001Р-X5', issuer: 'X5 Group', price: 950, yield: 18.1, note: 'Умеренный риск с понятным бизнесом', couponMonths: [1, 4, 7, 10], maturityDate: 'Октябрь 2028', rating: 'AA-(RU) / ruAA-' },
]

const highActiveItems = [
  { id: 'corp-a101-high', name: 'А101 БО-001Р-01', ticker: 'RU000A1091H4', issuer: 'A101', price: 890, yield: 21.8, note: 'Высокий риск, высокая доходность, нужен контроль эмитента', couponMonths: [1, 2, 4, 5, 7, 8, 10, 11], maturityDate: 'Ноябрь 2027', rating: 'BBB+(RU) / ruBBB+' },
  { id: 'corp-jetlend-high', name: 'ДжетЛенд БО-001Р-03', ticker: 'RU000A10AZ60', issuer: 'JetLend', price: 845, yield: 24.2, note: 'Агрессивный сценарий с повышенным риском дефолта', couponMonths: [1, 3, 5, 7, 9, 11], maturityDate: 'Декабрь 2028', rating: 'BBB(RU) / ruBBB' },
  { id: 'corp-highmix-active', name: 'Пионер-Лизинг БО-П05', ticker: 'RU000A10B2M4', issuer: 'Средний эмитент', price: 875, yield: 22.6, note: 'Высокая доходность, но нельзя брать без анализа', couponMonths: [2, 4, 6, 8, 10, 12], maturityDate: 'Октябрь 2027', rating: 'BBB(RU) / ruBBB' },
  { id: 'corp-softline-active', name: 'Софтлайн 001Р-05', ticker: 'RU000A1079T2', issuer: 'Softline', price: 860, yield: 22.9, note: 'Более агрессивный корпоративный выпуск', couponMonths: [1, 4, 7, 10], maturityDate: 'Октябрь 2028', rating: 'BBB-(RU) / ruBBB-' },
  { id: 'corp-samolet-active', name: 'Самолет БО-П14', ticker: 'RU000A1097X8', issuer: 'Самолет', price: 855, yield: 23.4, note: 'Девелоперский риск с повышенной доходностью', couponMonths: [2, 5, 8, 11], maturityDate: 'Ноябрь 2027', rating: 'BBB(RU) / ruBBB' },
]

const basketScenarios = {
  low: [
    { id: 'corp-low-basket-stable', name: 'Надёжная подборка корпоративных облигаций', note: 'Низкий риск: крупные компании с высоким рейтингом и более предсказуемыми выплатами.', items: lowStableItems },
  ],
  medium: [
    { id: 'corp-medium-basket-balance', name: 'Подборка среднего риска', note: 'Баланс между надёжностью и доходностью. Возможны колебания цен сильнее, чем у самых консервативных выпусков.', items: mediumBalanceItems },
  ],
  high: [
    { id: 'corp-high-basket-active', name: 'Подборка высокого риска', note: 'Более высокая доходность, но и заметно выше риск проблем с выплатами и цены бумаг.', items: highActiveItems },
  ],
}

const monthlyOfzScenario = {
  id: 'ofz-monthly-basket',
  name: 'Пассивный доход каждый месяц из ОФЗ',
  note: 'Комбинация всех ОФЗ из списка, чтобы купоны приходили каждый месяц.',
  items: ofzScenarios,
}

const scenarioGroups = {
  ofzMonthly: [monthlyOfzScenario],
  low: basketScenarios.low,
  medium: basketScenarios.medium,
  high: basketScenarios.high,
}

function averageYieldOfItems(items) {
  if (items.length === 0) return 0
  return items.reduce((sum, item) => sum + item.yield, 0) / items.length
}

function averagePriceOfItems(items) {
  if (items.length === 0) return 0
  return items.reduce((sum, item) => sum + item.price, 0) / items.length
}

function getCoveredMonths(items) {
  return new Set(items.flatMap((item) => item.couponMonths)).size
}

function buildReinvestmentProjection(startCapital, annualNetIncome, years, monthlyContribution) {
  const monthlyRate = annualNetIncome > 0 && startCapital > 0 ? annualNetIncome / startCapital / 12 : 0
  let capital = startCapital
  const safeMonthlyContribution = Math.max(0, monthlyContribution)
  const rows = []

  for (let month = 1; month <= years * 12; month += 1) {
    const coupon = capital * monthlyRate
    capital += coupon + safeMonthlyContribution
    rows.push({
      month,
      capital,
      monthlyIncome: capital * monthlyRate,
    })
  }

  return rows
}

function runSanityChecks() {
  const averageYield = averageYieldOfItems([
    { id: '1', name: 'A', ticker: 'A', issuer: 'A', price: 100, yield: 10, note: '', couponMonths: [1, 7] },
    { id: '2', name: 'B', ticker: 'B', issuer: 'B', price: 100, yield: 20, note: '', couponMonths: [2, 8] },
  ])
  const averagePrice = averagePriceOfItems([
    { id: '1', name: 'A', ticker: 'A', issuer: 'A', price: 90, yield: 10, note: '', couponMonths: [1, 7] },
    { id: '2', name: 'B', ticker: 'B', issuer: 'B', price: 110, yield: 20, note: '', couponMonths: [2, 8] },
  ])
  const coveredMonths = getCoveredMonths(ofzScenarios)
  const projection = buildReinvestmentProjection(120000, 14400, 2, 5000)

  console.assert(averageYield === 15, 'Average yield should be arithmetic mean')
  console.assert(averagePrice === 100, 'Average price should be arithmetic mean')
  console.assert(coveredMonths === 12, 'OFZ basket should cover all months')
  console.assert(projection.length === 24, 'Projection should have 24 months for 2 years')
  console.assert(projection[23].capital > projection[0].capital, 'Capital should grow')
  console.assert(formatAxisRub(2_500_000) === '2,5 млн', 'Axis formatter should shorten millions')
  console.assert(formatAxisRub(850_000) === '850 тыс', 'Axis formatter should shorten thousands')
}

runSanityChecks()

function Button({ children, className = '', ...props }) {
  return <button className={`btn ${className}`.trim()} {...props}>{children}</button>
}

function Badge({ children, className = '' }) {
  return <span className={`badge ${className}`.trim()}>{children}</span>
}

function Input({ className = '', ...props }) {
  return <input {...props} className={`input ${className}`.trim()} />
}

function Label({ className = '', children }) {
  return <div className={`label ${className}`.trim()}>{children}</div>
}

function Separator({ className = '' }) {
  return <div className={`separator ${className}`.trim()} />
}

function Slider({ value, min, max, step = 1, onValueChange, className = '' }) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value[0]}
      onChange={(e) => onValueChange([Number(e.target.value)])}
      className={`range ${className}`.trim()}
    />
  )
}

function Tabs({ children }) {
  return <div>{children}</div>
}

function TabsList({ children, className = '' }) {
  return <div className={`tabs-list ${className}`.trim()}>{children}</div>
}

function TabsTrigger({ children, value, activeValue, onClick }) {
  const active = value === activeValue
  return (
    <button type="button" className={`tab-trigger ${active ? 'tab-active' : ''}`} onClick={onClick}>
      {children}
    </button>
  )
}

function Card({ children, className = '' }) {
  return <div className={`panel ${className}`.trim()}>{children}</div>
}
function CardHeader({ children, className = '' }) {
  return <div className={`panel-header ${className}`.trim()}>{children}</div>
}
function CardTitle({ children, className = '' }) {
  return <div className={`panel-title ${className}`.trim()}>{children}</div>
}
function CardDescription({ children, className = '' }) {
  return <div className={`panel-desc ${className}`.trim()}>{children}</div>
}
function CardContent({ children, className = '' }) {
  return <div className={`panel-content ${className}`.trim()}>{children}</div>
}

export default function App() {
  const [targetMonthlyIncome, setTargetMonthlyIncome] = useState(50000)
  const [taxRate, setTaxRate] = useState(13)
  const includeTax = true
  const [selectedGroup, setSelectedGroup] = useState('ofzMonthly')
  const [selectedScenarioId, setSelectedScenarioId] = useState(monthlyOfzScenario.id)
  const [reinvestmentYearsInput, setReinvestmentYearsInput] = useState('5')
  const [reinvestmentYears, setReinvestmentYears] = useState(5)
  const [monthlyContributionInput, setMonthlyContributionInput] = useState('0')
  const [monthlyContribution, setMonthlyContribution] = useState(0)
  const [accumulationYears, setAccumulationYears] = useState(5)
  const [priceRefreshCounter, setPriceRefreshCounter] = useState(0)
  const [lastPriceUpdate, setLastPriceUpdate] = useState(LAST_PRICE_UPDATE)

  useEffect(() => {
    const currentScenarios = scenarioGroups[selectedGroup]
    const firstScenario = currentScenarios[0]
    if (!currentScenarios.some((item) => item.id === selectedScenarioId) && firstScenario) {
      setSelectedScenarioId(firstScenario.id)
    }
  }, [selectedGroup, selectedScenarioId])

  const allScenarios = useMemo(() => Object.values(scenarioGroups).flat(), [])
  const selectedScenario = allScenarios.find((item) => item.id === selectedScenarioId) ?? monthlyOfzScenario
  const visibleScenarios = scenarioGroups[selectedGroup]

  const basketItems = selectedScenario.items.map((item, index) => ({
    ...item,
    price: Math.max(1, item.price + ((priceRefreshCounter % 5) - 2) * ((index % 3) + 1)),
  }))

  const averageYield = averageYieldOfItems(basketItems)
  const averagePrice = averagePriceOfItems(basketItems)
  const coveredMonthsCount = getCoveredMonths(basketItems)

  const calc = useMemo(() => {
    const monthlyNetTarget = Math.max(0, targetMonthlyIncome)
    const netFactor = includeTax ? 1 - taxRate / 100 : 1
    const effectiveAnnualNetYield = (averageYield / 100) * netFactor
    const requiredCapital = effectiveAnnualNetYield > 0 ? (monthlyNetTarget * 12) / effectiveAnnualNetYield : 0
    const itemCount = basketItems.length || 1
    const capitalPerItem = requiredCapital / itemCount

    const allocation = basketItems.map((item) => {
      const count = item.price > 0 ? Math.ceil(capitalPerItem / item.price) : 0
      const invested = count * item.price
      const annualGross = invested * (item.yield / 100)
      const annualNet = annualGross * netFactor
      const perPaymentNet = item.couponMonths.length > 0 ? annualNet / item.couponMonths.length : 0
      return {
        ...item,
        count,
        invested,
        annualNet,
        annualGross,
        perPaymentNet,
        weightPercent: requiredCapital > 0 ? (invested / requiredCapital) * 100 : 0,
      }
    })

    const actualCapital = allocation.reduce((sum, item) => sum + item.invested, 0)
    const totalBondCount = allocation.reduce((sum, item) => sum + item.count, 0)
    const annualNetIncome = allocation.reduce((sum, item) => sum + item.annualNet, 0)
    const monthlyNetIncome = annualNetIncome / 12

    const monthlyCalendarIncome = monthLabels.map((_, index) => {
      const monthNumber = index + 1
      return allocation.reduce((sum, item) => sum + (item.couponMonths.includes(monthNumber) ? item.perPaymentNet : 0), 0)
    })

    const monthsWithPayments = monthlyCalendarIncome.filter((value) => value > 0).length
    const averagePortfolioPayment = monthsWithPayments > 0
      ? monthlyCalendarIncome.reduce((sum, value) => sum + value, 0) / monthsWithPayments
      : 0

    return {
      actualCapital,
      annualNetIncome,
      monthlyNetIncome,
      bondCount: totalBondCount,
      netCouponPerPortfolio: averagePortfolioPayment,
      monthlyCalendarIncome,
      allocation,
      effectiveAnnualNetYield,
    }
  }, [targetMonthlyIncome, taxRate, includeTax, averageYield, basketItems])

  const reinvestmentProjection = useMemo(
    () => buildReinvestmentProjection(calc.actualCapital, calc.annualNetIncome, reinvestmentYears, monthlyContribution),
    [calc.actualCapital, calc.annualNetIncome, reinvestmentYears, monthlyContribution],
  )

  const reinvestmentSummary = useMemo(() => {
    const lastPoint = reinvestmentProjection[reinvestmentProjection.length - 1]
    return {
      finalCapital: lastPoint?.capital ?? calc.actualCapital,
      finalMonthlyIncome: lastPoint?.monthlyIncome ?? calc.monthlyNetIncome,
      totalGrowth: (lastPoint?.capital ?? calc.actualCapital) - calc.actualCapital,
      totalContributions: monthlyContribution * reinvestmentYears * 12,
    }
  }, [reinvestmentProjection, calc.actualCapital, calc.monthlyNetIncome, monthlyContribution, reinvestmentYears])

  const monthlySavingsNeeded = useMemo(() => {
    const months = Math.max(1, accumulationYears * 12)
    return calc.actualCapital / months
  }, [calc.actualCapital, accumulationYears])

  const monthlyChartData = useMemo(
    () => monthLabels.map((label, index) => ({ month: label, income: calc.monthlyCalendarIncome[index] || 0 })),
    [calc.monthlyCalendarIncome],
  )

  const goalPresets = [
    { label: 'Связь', value: 1000 },
    { label: 'Еда', value: 30000 },
    { label: 'Аренда', value: 50000 },
    { label: 'Жизнь', value: 150000 },
  ]

  return (
    <div className="page">
      <div className="container">
        <div className="hero">
          <div className="hero-top">
            <Badge>Конструктор пассивного дохода на облигациях</Badge>
            <Badge className="badge-accent">Последнее обновление цен: {lastPriceUpdate}</Badge>
          </div>
          <div className="hero-grid">
            <div className="hero-copy">
              <h1>Собери свой пассивный доход</h1>
              <p>Показывает, сколько нужно вложить в облигации, какой будет доход и как растёт капитал со временем.</p>
            </div>
            <div className="hero-mini-grid">
              <div className="mini-card">
                <div className="mini-label">Текущая цель</div>
                <div className="mini-value">{formatRub(targetMonthlyIncome)}</div>
                <div className="mini-note">Пассивный доход в месяц</div>
              </div>
              <div className="mini-card">
                <div className="mini-label">Нужный капитал</div>
                <div className="mini-value accent">{formatRub(calc.actualCapital)}</div>
                <div className="mini-note">По текущему сценарию</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid-two">
          <Card>
            <CardHeader className="compact">
              <div className="head-row">
                <div>
                  <CardTitle><Calculator size={18} /> Параметры расчёта</CardTitle>
                  <CardDescription>Выбери цель и сценарий облигаций, чтобы быстро рассчитать нужный капитал и пассивный доход.</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setPriceRefreshCounter((v) => v + 1)
                    setLastPriceUpdate('Обновлено вручную только что')
                  }}
                >
                  <RefreshCw size={16} /> Обновить цены
                </Button>
              </div>
            </CardHeader>
            <CardContent className="content-tight">
              <div className="field-group">
                <Label>Цель по пассивному доходу в месяц</Label>
                <div className="hint">Можно выбрать готовую сумму или ввести свою.</div>
                <div className="pill-row">
                  {goalPresets.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => setTargetMonthlyIncome(preset.value)}
                      className="pill"
                    >
                      {preset.label} — {formatRub(preset.value)}
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  value={targetMonthlyIncome}
                  onChange={(e) => setTargetMonthlyIncome(Number(e.target.value) || 0)}
                  placeholder="Например, 75000"
                />
              </div>

              <div className="scenario-wrap">
                <div className="scenario-head">
                  <ShieldCheck size={18} />
                  <span>Сценарии облигаций</span>
                </div>
                <Tabs>
                  <TabsList>
                    <TabsTrigger value="ofzMonthly" activeValue={selectedGroup} onClick={() => setSelectedGroup('ofzMonthly')}>ОФЗ</TabsTrigger>
                    <TabsTrigger value="low" activeValue={selectedGroup} onClick={() => setSelectedGroup('low')}>Низкий риск</TabsTrigger>
                    <TabsTrigger value="medium" activeValue={selectedGroup} onClick={() => setSelectedGroup('medium')}>Средний риск</TabsTrigger>
                    <TabsTrigger value="high" activeValue={selectedGroup} onClick={() => setSelectedGroup('high')}>Высокий риск</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="info-box">
                  <Info size={16} />
                  <div><strong>Средняя доходность:</strong> около {formatNum(averageYield, 1)}% годовых до налога. Капитал внутри подборки распределяется равными долями.</div>
                </div>

                <div className="scenario-list">
                  {visibleScenarios.map((scenario) => {
                    const isActive = scenario.id === selectedScenarioId
                    const scenarioAverageYield = averageYieldOfItems(scenario.items)
                    return (
                      <button
                        key={scenario.id}
                        onClick={() => setSelectedScenarioId(scenario.id)}
                        className={`scenario-card ${isActive ? 'active' : ''}`}
                      >
                        <div className="scenario-name">{scenario.name}</div>
                        <div className="scenario-note">{scenario.note}</div>
                        <div className="scenario-tags">
                          <span>Средняя доходность: {formatNum(scenarioAverageYield, 1)}%</span>
                          <span>Бумаг в подборке: {scenario.items.length}</span>
                        </div>
                        <div className="scenario-items">
                          {scenario.items.map((item) => (
                            <div key={item.id} className="scenario-item">
                              <div className="item-name">{item.name}</div>
                              <div className="item-ticker">{item.ticker}</div>
                              <div className="item-meta">Цена: {formatRub(item.price)}</div>
                              {item.rating && <div className="item-rating">Рейтинг: {item.rating}</div>}
                              {item.maturityDate && <div className="item-meta">Погашение: {item.maturityDate}</div>}
                            </div>
                          ))}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="field-grid">
                <div className="field-group">
                  <Label>Налог, %</Label>
                  <div className="hint">Нужен, чтобы посчитать чистые деньги, которые реально придут на счёт.</div>
                  <Input type="number" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value) || 0)} />
                </div>
                <div className="field-group">
                  <Label>Средняя цена 1 облигации, ₽</Label>
                  <div className="hint">Показывает среднюю цену одной облигации внутри выбранной подборки.</div>
                  <Input type="number" value={Math.round(averagePrice)} readOnly />
                </div>
              </div>

              <div className="field-group">
                <Label>Горизонт реинвестирования, лет</Label>
                <div className="hint">Укажи срок ниже и нажми кнопку в блоке реинвестирования.</div>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={reinvestmentYearsInput}
                  onChange={(e) => setReinvestmentYearsInput(e.target.value)}
                />
              </div>

              <div className="box">
                <div className="box-title">Дополнительные пополнения в месяц</div>
                <div className="hint">Сумма, которую хочешь ежемесячно добавлять в портфель сверх реинвестированных купонов.</div>
                <div className="row-gap">
                  <Input
                    type="number"
                    min={0}
                    value={monthlyContributionInput}
                    onChange={(e) => setMonthlyContributionInput(e.target.value)}
                    placeholder="Например, 10000"
                  />
                  <Button
                    onClick={() => {
                      const parsed = Number(monthlyContributionInput)
                      const safeValue = Math.max(0, Number.isFinite(parsed) ? parsed : 0)
                      setMonthlyContribution(safeValue)
                      setMonthlyContributionInput(String(safeValue))
                    }}
                  >
                    Применить пополнения
                  </Button>
                </div>
                <div className="accent-text">Сейчас учтено: {formatRub(monthlyContribution)} / месяц</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle><Wallet size={18} /> Результат</CardTitle>
              <CardDescription>Готовая картина по капиталу, количеству облигаций и выплатам.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="result-hero">
                <div className="mini-label">Нужно вложить</div>
                <div className="result-value">{formatRub(calc.actualCapital)}</div>
                <div className="mini-note">Чтобы получать около <strong>{formatRub(calc.monthlyNetIncome)}</strong> в месяц</div>
              </div>

              <div className="highlight">
                Выбрана подборка: <strong>{selectedScenario.name}</strong> — {selectedScenario.note}
              </div>

              <div className="field-grid">
                <div className="mini-card">
                  <div className="mini-label">Всего облигаций в портфеле</div>
                  <div className="mini-value">{formatNum(calc.bondCount, 0)} шт.</div>
                </div>
                <div className="mini-card">
                  <div className="mini-label">Средняя выплата по подборке</div>
                  <div className="mini-value">{formatRub(calc.netCouponPerPortfolio)}</div>
                </div>
              </div>

              <div className="box">
                <div className="mini-label">Чистая доходность портфеля</div>
                <div className="mini-value accent">{formatNum(calc.effectiveAnnualNetYield * 100, 1)}%</div>
              </div>

              <div className="box">
                <div className="box-title">Сколько нужно откладывать в месяц, чтобы собрать этот капитал</div>
                <div className="hint">Модель без доходности на этапе накопления: просто нужная сумма, разделённая на выбранный срок.</div>
                <div className="saving-box">
                  <div>
                    <div className="mini-label">Срок накопления</div>
                    <div className="saving-value">{accumulationYears} {accumulationYears === 1 ? 'год' : accumulationYears < 5 ? 'года' : 'лет'}</div>
                  </div>
                  <div className="align-right">
                    <div className="mini-label">Нужно откладывать</div>
                    <div className="saving-value accent">{formatRub(monthlySavingsNeeded)} / мес.</div>
                  </div>
                </div>
                <Slider value={[accumulationYears]} min={1} max={30} step={1} onValueChange={(value) => setAccumulationYears(value[0])} />
              </div>

              <div className="box">
                <div className="box-title">Состав подборки и распределение капитала</div>
                <div className="allocation-list">
                  {calc.allocation.map((item) => (
                    <div key={item.id} className="allocation-item">
                      <div>
                        <div className="item-name">{item.name}</div>
                        <div className="item-ticker">{item.ticker}</div>
                        <div className="item-meta">Цена: {formatRub(item.price)}</div>
                        <div className="item-meta">Доля: {formatNum(item.weightPercent, 1)}%</div>
                        {item.rating && <div className="item-rating">Рейтинг: {item.rating}</div>}
                        {item.maturityDate && <div className="item-meta">Погашение: {item.maturityDate}</div>}
                      </div>
                      <div className="align-right">
                        <div className="allocation-value">{formatRub(item.invested)}</div>
                        <div className="item-meta">{item.count} шт.</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="stats-list">
                <div className="stats-row"><span>Доход в месяц</span><strong>{formatRub(calc.monthlyNetIncome)}</strong></div>
                <div className="stats-row"><span>Доход в год</span><strong>{formatRub(calc.annualNetIncome)}</strong></div>
                <div className="stats-row"><span>Средняя выплата по подборке</span><strong>{formatRub(calc.netCouponPerPortfolio)}</strong></div>
                <div className="stats-row"><span>Месяцев с выплатами</span><strong>{coveredMonthsCount}</strong></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid-two">
          <Card>
            <CardHeader>
              <CardTitle><CalendarDays size={18} /> Календарь пассивного дохода</CardTitle>
              <CardDescription>Здесь видно, сколько денег приходит по выбранному сценарию в каждый месяц года.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="months-grid">
                {monthLabels.map((month, index) => {
                  const value = calc.monthlyCalendarIncome[index] || 0
                  const hasIncome = value > 0
                  return (
                    <div key={month} className={`month-box ${hasIncome ? 'month-active' : ''}`}>
                      <div className="mini-label">{month}</div>
                      <div className="month-value">{formatRub(value)}</div>
                      <div className="mini-note">{hasIncome ? 'Есть выплата' : 'Без выплаты'}</div>
                    </div>
                  )
                })}
              </div>

              <div className="chart-box">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 10 }} tickMargin={8} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} width={64} tickFormatter={(value) => formatAxisRub(Number(value))} />
                    <Tooltip
                      formatter={(value) => [formatRub(value), 'Доход за месяц']}
                      contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '16px', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="income" stroke="#22d3ee" fill="#22d3ee33" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle><RefreshCw size={18} /> Реинвестирование купонов каждый месяц</CardTitle>
              <CardDescription>Модель показывает, как может расти капитал и будущий пассивный доход, если купоны ежемесячно докупают облигации.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="reinvest-head">
                <div>
                  <div className="box-title">Срок для реинвестирования</div>
                  <div className="hint">График пересчитывается после нажатия на кнопку.</div>
                  <div className="saving-value accent">{reinvestmentYears} {reinvestmentYears === 1 ? 'год' : reinvestmentYears < 5 ? 'года' : 'лет'}</div>
                </div>
                <Button
                  onClick={() => {
                    const parsed = Number(reinvestmentYearsInput)
                    const safeValue = Math.max(1, Math.min(30, Number.isFinite(parsed) ? parsed : 1))
                    setReinvestmentYears(safeValue)
                    setReinvestmentYearsInput(String(safeValue))
                  }}
                >
                  Построить график
                </Button>
              </div>

              <div className="reinvest-stats">
                <div className="mini-card"><div className="mini-label">Стартовый капитал</div><div className="mini-value">{formatRub(calc.actualCapital)}</div></div>
                <div className="mini-card"><div className="mini-label">Капитал через {reinvestmentYears} лет</div><div className="mini-value">{formatRub(reinvestmentSummary.finalCapital)}</div></div>
                <div className="mini-card"><div className="mini-label">Пассивный доход в месяц через {reinvestmentYears} лет</div><div className="mini-value">{formatRub(reinvestmentSummary.finalMonthlyIncome)}</div></div>
                <div className="mini-card"><div className="mini-label">Доп. пополнения за весь срок</div><div className="mini-value">{formatRub(reinvestmentSummary.totalContributions)}</div></div>
              </div>

              <div className="box">
                <div className="chart-top">
                  <div>
                    <div className="box-title">График роста капитала при реинвестировании</div>
                    <div className="hint">Все купоны каждый месяц направляются обратно в портфель, а дополнительные пополнения учитываются отдельно.</div>
                  </div>
                  <div className="align-right">
                    <div className="mini-label">Прирост капитала</div>
                    <div className="saving-value">{formatRub(reinvestmentSummary.totalGrowth)}</div>
                  </div>
                </div>

                <div className="chart-box tall">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reinvestmentProjection}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis
                        dataKey="month"
                        stroke="#94a3b8"
                        tick={{ fontSize: 10 }}
                        tickMargin={8}
                        tickFormatter={(value) => `${Math.ceil(Number(value) / 12)} г.`}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        tick={{ fontSize: 10 }}
                        width={72}
                        tickFormatter={(value) => formatAxisRub(Number(value))}
                      />
                      <Tooltip
                        formatter={(value, name) => [formatRub(value), name === 'capital' ? 'Капитал' : 'Доход в месяц']}
                        labelFormatter={(label) => `Месяц ${label}`}
                        contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '16px', fontSize: '12px' }}
                      />
                      <Line type="monotone" dataKey="capital" stroke="#22d3ee" strokeWidth={3} dot={false} name="capital" />
                      <Line type="monotone" dataKey="monthlyIncome" stroke="#34d399" strokeWidth={2} dot={false} name="monthlyIncome" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="warning">
          Важно: вся информация в калькуляторе носит ознакомительный характер и не является индивидуальной инвестиционной рекомендацией. Цены в этой демо-версии ориентировочные.
        </div>
      </div>
    </div>
  )
}
