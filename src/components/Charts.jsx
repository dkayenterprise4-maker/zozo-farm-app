import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, ReferenceLine } from 'recharts'
import { money, moneyShort } from '../lib/utils'

const tip = { formatter: (v) => money(v), contentStyle: { borderRadius: 12, border: '1px solid #ddd' } }

export function IncomeExpenseChart({ data, height = 240 }) {
  if (!data?.length) return <p className="text-gray-500 text-center py-10">No data yet</p>
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={moneyShort} tick={{ fontSize: 11 }} width={52} />
        <Tooltip {...tip} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="income" name="Income" fill="#4CAF50" radius={[6, 6, 0, 0]} />
        <Bar dataKey="expenses" name="Expenses" fill="#795548" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function ProfitTrendChart({ data, height = 220 }) {
  if (!data?.length) return <p className="text-gray-500 text-center py-10">No data yet</p>
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={moneyShort} tick={{ fontSize: 11 }} width={52} />
        <Tooltip {...tip} />
        <ReferenceLine y={0} stroke="#999" />
        <Line type="monotone" dataKey="profit" name="Profit" stroke="#1B5E20" strokeWidth={3} dot={{ r: 4 }} />
        <Line type="monotone" dataKey="projected" name="Projected" stroke="#4CAF50" strokeDasharray="6 4" strokeWidth={2} dot={false} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function ExpensePie({ data, height = 220 }) {
  if (!data?.length) return <p className="text-gray-500 text-center py-10">No expenses yet</p>
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="amount" nameKey="category" innerRadius="50%" outerRadius="85%" paddingAngle={2}>
          {data.map((d) => <Cell key={d.category} fill={d.color} />)}
        </Pie>
        <Tooltip {...tip} />
      </PieChart>
    </ResponsiveContainer>
  )
}
