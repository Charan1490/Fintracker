import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowUpIcon, ArrowDownIcon, ChartBarIcon, ChartPieIcon, CurrencyDollarIcon, 
  CalendarIcon, EyeIcon, LightBulbIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, 
  BanknotesIcon, ExclamationTriangleIcon, StarIcon
} from '@heroicons/react/24/outline';
import { getTotals, getCategoryData, getMonthlyTrendData } from '../utils/transactions';

// Lazy load chart components for better performance
const ChartComponents = lazy(() => import('../components/ChartComponents'));

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#F97316', '#6366F1'];

// Category map for display purposes
const categoryMap = {
  food: { name: 'Food & Dining', emoji: '🍔' },
  grocery: { name: 'Groceries', emoji: '🛒' },
  transport: { name: 'Transport', emoji: '🚗' },
  entertainment: { name: 'Entertainment', emoji: '🎬' },
  shopping: { name: 'Shopping', emoji: '🛍️' },
  housing: { name: 'Housing', emoji: '🏠' },
  utilities: { name: 'Utilities', emoji: '💡' },
  healthcare: { name: 'Healthcare', emoji: '🏥' },
  education: { name: 'Education', emoji: '📚' },
  personal: { name: 'Personal Care', emoji: '💇' },
  travel: { name: 'Travel', emoji: '✈️' },
  subscription: { name: 'Subscriptions', emoji: '📱' },
  other_expense: { name: 'Other Expenses', emoji: '📋' },
  salary: { name: 'Salary', emoji: '💰' },
  freelance: { name: 'Freelance', emoji: '💻' },
  gift: { name: 'Gifts', emoji: '🎁' },
  investment: { name: 'Investments', emoji: '📈' },
  refund: { name: 'Refunds', emoji: '↩️' },
  other_income: { name: 'Other Income', emoji: '💵' },
};

// Memoized Summary Card component for reduced re-renders
const SummaryCard = React.memo(({ icon, title, value, subtitle, color }) => (
  <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg animate-fadeIn">
    <div className="flex items-center space-x-4">
      <div className={`p-3 bg-${color}-100 rounded-full`}>
        {icon}
      </div>
      <div>
        <h3 className="text-gray-500 font-medium text-sm">{title}</h3>
        <p className={`text-2xl sm:text-3xl font-bold ${value.startsWith('-') ? 'text-red-600' : 'text-gray-900'}`}>
          {value}
        </p>
      </div>
    </div>
    <div className={`mt-4 flex items-center justify-start text-${color}-600`}>
      {subtitle}
    </div>
  </div>
));

// Memoized Recent Transaction Item component
const TransactionItem = React.memo(({ transaction }) => {
  const { id, title, amount, category, date } = transaction;
  const formatCategoryDisplay = (categoryId) => {
    const cat = categoryMap[categoryId];
    return cat ? `${cat.emoji} ${cat.name}` : categoryId;
  };

  return (
    <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
      <div className={`p-2 rounded-full mr-3 ${amount > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
        {amount > 0 ? 
          <ArrowUpIcon className="h-5 w-5 text-green-600" /> : 
          <ArrowDownIcon className="h-5 w-5 text-red-600" />
        }
      </div>
      <div className="flex-1">
        <div className="flex justify-between">
          <h4 className="text-sm font-medium text-gray-900">{title}</h4>
          <span className={`text-sm font-medium ${amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {amount > 0 ? '+' : ''}${Math.abs(amount).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">
            {formatCategoryDisplay(category)}
          </span>
          <span className="text-xs text-gray-500">{date}</span>
        </div>
      </div>
    </div>
  );
});

// Memoized Insight Item component
const InsightItem = React.memo(({ insight, index }) => (
  <div 
    className="flex items-start border-b border-gray-100 pb-4 last:border-0 animate-slideIn" 
    style={{ animationDelay: `${index * 100}ms` }}
  >
    <div className="bg-gray-50 p-2 rounded-full mr-3">
      {insight.icon}
    </div>
    <div className="flex-1">
      <h4 className="text-sm font-medium text-gray-700">{insight.title}</h4>
      <p className="text-xs text-gray-500 mt-1">{insight.description}</p>
      <p className="text-base font-semibold text-gray-900 mt-1">${insight.amount}</p>
    </div>
  </div>
));

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState('all'); // 'all', 'month', 'week'
  const navigate = useNavigate();
  
  // Track first load for animations
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const transactionsRef = collection(db, 'transactions', auth.currentUser.uid, 'userTransactions');
    
    // Get all transactions for charts and calculations
    const unsubscribe = onSnapshot(
      transactionsRef,
      (snapshot) => {
        setTransactions(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
        setLoading(false);
        
        // Set first load to false after data is loaded
        if (isFirstLoad) {
          setTimeout(() => setIsFirstLoad(false), 500);
        }
      },
      (err) => {
        console.error('Dashboard data error:', err);
        setLoading(false);
      }
    );
    
    // Get recent transactions for the dashboard
    const recentQuery = query(transactionsRef, orderBy('date', 'desc'), limit(5));
    const recentUnsubscribe = onSnapshot(
      recentQuery,
      (snapshot) => {
        setRecentTransactions(snapshot.docs.map(d => ({ 
          ...d.data(), 
          id: d.id,
          date: new Date(d.data().date).toLocaleDateString() 
        })));
      }
    );

    return () => {
      unsubscribe();
      recentUnsubscribe();
    };
  }, [isFirstLoad]);

  // Filter transactions based on selected time frame
  const filteredTransactions = useMemo(() => {
    if (timeFrame === 'all') return transactions;
    
    const now = new Date();
    const msPerDay = 86400000; // 24h * 60m * 60s * 1000ms
    
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const daysDiff = (now - transactionDate) / msPerDay;
      
      if (timeFrame === 'month' && daysDiff <= 30) return true;
      if (timeFrame === 'week' && daysDiff <= 7) return true;
      return false;
    });
  }, [transactions, timeFrame]);

  const { income, expenses } = useMemo(() => getTotals(filteredTransactions), [filteredTransactions]);
  const categoryData = useMemo(() => getCategoryData(filteredTransactions), [filteredTransactions]);
  const trendData = useMemo(() => getMonthlyTrendData(filteredTransactions), [filteredTransactions]);
  const balance = income - expenses;

  // Calculate financial insights
  const insights = useMemo(() => {
    if (!filteredTransactions.length) return [];
    
    const insights = [];
    
    // Top spending category
    if (categoryData.length > 0) {
      const topCategory = [...categoryData].sort((a, b) => b.value - a.value)[0];
      const catInfo = categoryMap[topCategory.name] || { name: topCategory.name, emoji: '📊' };
      insights.push({
        title: 'Top Spending Category',
        description: `Your highest spending is on ${catInfo.emoji} ${catInfo.name}`,
        icon: <ArrowTrendingUpIcon className="h-5 w-5 text-blue-500" />,
        amount: topCategory.value.toFixed(2)
      });
    }
    
    // Savings rate
    if (income > 0) {
      const savingsRate = ((income - expenses) / income) * 100;
      let savingsIcon = <StarIcon className="h-5 w-5 text-yellow-500" />;
      let savingsDescription = 'Great job saving money!';
      
      if (savingsRate < 0) {
        savingsIcon = <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
        savingsDescription = 'You\'re spending more than you earn';
      } else if (savingsRate < 10) {
        savingsIcon = <ArrowTrendingDownIcon className="h-5 w-5 text-orange-500" />;
        savingsDescription = 'Try to increase your savings rate';
      }
      
      insights.push({
        title: 'Savings Rate',
        description: savingsDescription,
        icon: savingsIcon,
        amount: `${savingsRate.toFixed(1)}%`
      });
    }
    
    // Recent expense pattern
    if (trendData.length >= 2) {
      const lastTwo = trendData.slice(-2);
      const expenseDiff = lastTwo[1].expenses - lastTwo[0].expenses;
      const percentChange = lastTwo[0].expenses ? (expenseDiff / lastTwo[0].expenses) * 100 : 0;
      
      if (Math.abs(percentChange) > 10) {
        insights.push({
          title: 'Expense Trend',
          description: percentChange > 0 
            ? `Your expenses increased by ${percentChange.toFixed(1)}% compared to previous month` 
            : `Your expenses decreased by ${Math.abs(percentChange).toFixed(1)}% compared to previous month`,
          icon: percentChange > 0 
            ? <ArrowTrendingUpIcon className="h-5 w-5 text-red-500" />
            : <ArrowTrendingDownIcon className="h-5 w-5 text-green-500" />,
          amount: `${Math.abs(expenseDiff).toFixed(2)}`
        });
      }
    }
    
    return insights;
  }, [filteredTransactions, categoryData, trendData, income, expenses]);

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-12">
        <div className="animate-pulse">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-center mt-4 text-gray-600">Loading your financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-12 animate-fadeIn">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 animate-slideInRight">
          Financial Dashboard
        </h1>
        <p className="mt-2 text-gray-600 animate-slideInRight" style={{ animationDelay: '100ms' }}>
          Your financial overview and insights at a glance
        </p>
      </header>
      
      {/* Time Frame Filter */}
      <div className="mb-6 animate-slideInRight" style={{ animationDelay: '200ms' }}>
        <div className="flex space-x-2 bg-white inline-block p-1 rounded-lg shadow-sm border border-gray-200">
          <button 
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
              timeFrame === 'all' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setTimeFrame('all')}
          >
            All Time
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
              timeFrame === 'month' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setTimeFrame('month')}
          >
            Last 30 Days
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
              timeFrame === 'week' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setTimeFrame('week')}
          >
            Last 7 Days
          </button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="animate-slideInUp" style={{ animationDelay: '100ms' }}>
          <SummaryCard
            icon={<CurrencyDollarIcon className="h-6 w-6 text-blue-600" />}
            title="Total Income"
            value={`$${income.toFixed(2)}`}
            subtitle={<><ArrowUpIcon className="h-4 w-4 mr-1" /><span className="text-sm font-medium">Money In</span></>}
            color="blue"
          />
        </div>

        <div className="animate-slideInUp" style={{ animationDelay: '200ms' }}>
          <SummaryCard
            icon={<ArrowDownIcon className="h-6 w-6 text-red-600" />}
            title="Total Expenses"
            value={`$${expenses.toFixed(2)}`}
            subtitle={<><ArrowDownIcon className="h-4 w-4 mr-1" /><span className="text-sm font-medium">Money Out</span></>}
            color="red"
          />
        </div>

        <div className="animate-slideInUp" style={{ animationDelay: '300ms' }}>
          <SummaryCard
            icon={<BanknotesIcon className="h-6 w-6 text-green-600" />}
            title="Net Balance"
            value={`$${balance.toFixed(2)}`}
            subtitle={
              <span className="text-sm font-medium">
                {balance >= 0 ? 'You\'re in the green!' : 'Spending exceeds income'}
              </span>
            }
            color="green"
          />
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Charts Section */}
          <div className="grid grid-cols-1 gap-8 mb-8">
            {/* Monthly Trend Line Chart */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 transition-all duration-300 hover:shadow-lg animate-fadeIn">
              <div className="flex items-center mb-6">
                <ChartBarIcon className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-xl font-bold text-gray-900">Monthly Trends</h3>
              </div>
              <div className="h-80">
                <Suspense fallback={
                  <div className="h-full flex items-center justify-center">
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
                      <p className="mt-4 text-gray-500">Loading chart...</p>
                    </div>
                  </div>
                }>
                  {trendData.length > 0 ? (
                    <ChartComponents 
                      type="line" 
                      data={trendData} 
                      categoryData={categoryData} 
                      categoryMap={categoryMap}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center flex-col text-gray-500">
                      <CalendarIcon className="h-12 w-12 mb-2" />
                      <p>No trend data available for the selected timeframe</p>
                    </div>
                  )}
                </Suspense>
              </div>
            </div>

            {/* Category Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Category Pie Chart */}
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 transition-all duration-300 hover:shadow-lg animate-fadeIn" style={{ animationDelay: '100ms' }}>
                <div className="flex items-center mb-6">
                  <ChartPieIcon className="h-6 w-6 text-blue-600 mr-2" />
                  <h3 className="text-xl font-bold text-gray-900">Spending by Category</h3>
                </div>
                <div className="h-80">
                  <Suspense fallback={
                    <div className="h-full flex items-center justify-center">
                      <div className="animate-pulse flex flex-col items-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-gray-500">Loading chart...</p>
                      </div>
                    </div>
                  }>
                    {categoryData.length > 0 ? (
                      <ChartComponents 
                        type="pie" 
                        data={categoryData} 
                        categoryMap={categoryMap}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center flex-col text-gray-500">
                        <ChartPieIcon className="h-12 w-12 mb-2" />
                        <p>No category data available for the selected timeframe</p>
                      </div>
                    )}
                  </Suspense>
                </div>
              </div>

              {/* Category Bar Chart */}
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 transition-all duration-300 hover:shadow-lg animate-fadeIn" style={{ animationDelay: '200ms' }}>
                <div className="flex items-center mb-6">
                  <ChartBarIcon className="h-6 w-6 text-blue-600 mr-2" />
                  <h3 className="text-xl font-bold text-gray-900">Top Expense Categories</h3>
                </div>
                <div className="h-80">
                  <Suspense fallback={
                    <div className="h-full flex items-center justify-center">
                      <div className="animate-pulse flex flex-col items-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-gray-500">Loading chart...</p>
                      </div>
                    </div>
                  }>
                    {categoryData.length > 0 ? (
                      <ChartComponents 
                        type="bar" 
                        data={categoryData.sort((a, b) => b.value - a.value).slice(0, 5)} 
                        categoryMap={categoryMap}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center flex-col text-gray-500">
                        <ChartBarIcon className="h-12 w-12 mb-2" />
                        <p>No category data available for the selected timeframe</p>
                      </div>
                    )}
                  </Suspense>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          {/* Insights Panel */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 mb-8 transition-all duration-300 hover:shadow-lg animate-fadeIn" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center mb-6">
              <LightBulbIcon className="h-6 w-6 text-yellow-500 mr-2" />
              <h3 className="text-xl font-bold text-gray-900">Financial Insights</h3>
            </div>
            
            {insights.length > 0 ? (
              <div className="space-y-6">
                {insights.map((insight, index) => (
                  <InsightItem key={index} insight={insight} index={index} />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center flex-col text-gray-500 py-8">
                <LightBulbIcon className="h-12 w-12 mb-2" />
                <p>Add more transactions to see insights</p>
              </div>
            )}
          </div>
          
          {/* Recent Transactions */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 transition-all duration-300 hover:shadow-lg animate-fadeIn" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <EyeIcon className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-xl font-bold text-gray-900">Recent Transactions</h3>
              </div>
              <button 
                onClick={() => navigate('/transactions')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
              >
                View All
              </button>
            </div>
            
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((t, index) => (
                  <div key={t.id} className="animate-slideIn" style={{ animationDelay: `${index * 100}ms` }}>
                    <TransactionItem transaction={t} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center flex-col text-gray-500 py-8">
                <CalendarIcon className="h-12 w-12 mb-2" />
                <p>No recent transactions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}