import React from 'react';
import { 
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, BarChart, Bar 
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#F97316', '#6366F1'];

// Custom tooltip component for better visualization
const CustomTooltip = ({ active, payload, label, categoryMap }) => {
  if (!active || !payload || !payload.length) return null;
  
  return (
    <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
      {payload.map((entry, index) => {
        const isCategory = entry.name === "value" && entry.payload.name;
        const categoryName = isCategory && categoryMap[entry.payload.name]?.name;
        
        return (
          <div key={index} className="flex items-center py-1">
            <div 
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-700">
              {isCategory ? categoryName || entry.payload.name : entry.name}:
            </span>
            <span className="ml-2 text-sm font-medium">
              ${typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            </span>
          </div>
        );
      })}
      {label && <div className="text-xs text-gray-500 mt-1 pt-1 border-t">{label}</div>}
    </div>
  );
};

// The main chart component that handles different chart types
const ChartComponents = ({ type, data, categoryMap }) => {
  // Animation configuration
  const animationProps = {
    animationEasing: "ease-in-out",
    animationDuration: 1000
  };

  switch (type) {
    case 'pie':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={50}
              fill="#8884d8"
              dataKey="value"
              paddingAngle={2}
              label={({ name, percent }) => {
                const categoryName = categoryMap[name]?.name || name;
                return `${(percent * 100).toFixed(0)}%`;
              }}
              isAnimationActive={true}
              {...animationProps}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  className="hover:opacity-80 transition-opacity duration-200"
                />
              ))}
            </Pie>
            <Tooltip 
              content={<CustomTooltip categoryMap={categoryMap} />}
              animationDuration={200}
              cursor={{ fill: 'transparent' }}
            />
            <Legend 
              layout="vertical" 
              verticalAlign="middle" 
              align="right"
              formatter={(value) => {
                return categoryMap[value]?.name || value;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      );

    case 'bar':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            {...animationProps}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              tickFormatter={(value) => `$${value}`}
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              tick={(props) => {
                const { x, y, payload } = props;
                const categoryId = payload.value;
                const category = categoryMap[categoryId];
                return (
                  <text x={x} y={y} dy={4} textAnchor="end" fill="#666" fontSize={12}>
                    {category ? `${category.emoji} ${category.name}` : categoryId}
                  </text>
                );
              }}
              width={150}
            />
            <Tooltip 
              content={<CustomTooltip categoryMap={categoryMap} />}
              cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
            />
            <Bar 
              dataKey="value" 
              fill="#3B82F6" 
              radius={[0, 4, 4, 0]}
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-out"
              className="cursor-pointer"
            />
          </BarChart>
        </ResponsiveContainer>
      );

    case 'line':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={data} 
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            {...animationProps}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date"
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={(value) => `$${value}`}
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />
            <Tooltip 
              content={<CustomTooltip />}
              animationDuration={200}
              cursor={{ stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '3 3' }}
            />
            <Legend 
              verticalAlign="top" 
              height={36}
              iconType="circle"
              iconSize={10}
              wrapperStyle={{ paddingBottom: 10 }}
            />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#10B981"
              strokeWidth={3}
              activeDot={{ r: 8, fill: '#10B981', stroke: 'white', strokeWidth: 2 }}
              name="Income"
              dot={{ r: 3, fill: '#10B981', stroke: 'white', strokeWidth: 1 }}
              isAnimationActive={true}
              animationEasing="ease-in-out"
              animationDuration={1500}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#EF4444"
              strokeWidth={3}
              activeDot={{ r: 8, fill: '#EF4444', stroke: 'white', strokeWidth: 2 }}
              name="Expenses"
              dot={{ r: 3, fill: '#EF4444', stroke: 'white', strokeWidth: 1 }}
              isAnimationActive={true}
              animationEasing="ease-in-out"
              animationDuration={1500}
              animationBegin={300}
            />
          </LineChart>
        </ResponsiveContainer>
      );

    default:
      return <div>Chart type not supported</div>;
  }
};

export default React.memo(ChartComponents); 