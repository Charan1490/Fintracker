import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { collection, onSnapshot, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowUpIcon, ArrowDownIcon, ChartBarIcon, ChartPieIcon, CurrencyDollarIcon, 
  CalendarIcon, EyeIcon, LightBulbIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, 
  BanknotesIcon, ExclamationTriangleIcon, StarIcon, CreditCardIcon, SparklesIcon
} from '@heroicons/react/24/outline';
import { getTotals, getCategoryData, getMonthlyTrendData } from '../utils/transactions';
import BudgetProgress from '../components/BudgetProgress';
import RecentTransactions from '../components/RecentTransactions';
import { BarChart, PieChart, LineChart, ResponsiveContainer, XAxis, YAxis, Bar, Pie, Line, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import Spinner from '../components/Spinner';
import { generateInsights, generateBudgetRecommendations, predictFutureExpenses, setGeminiApiKey } from '../utils/ai';
import FinancialHealthAnalyzer from '../components/FinancialHealthAnalyzer';
import GeminiApiExplainer from '../components/GeminiApiExplainer';

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
const TransactionItem = React.memo(({ transaction, index = 0 }) => {
  const { id, title, amount, category, date } = transaction;
  const formatCategoryDisplay = (categoryId) => {
    const cat = categoryMap[categoryId];
    return cat ? `${cat.emoji} ${cat.name}` : categoryId;
  };

  return (
    <div 
      className="flex items-center p-3 rounded-xl hover:bg-blue-50/30 hover:backdrop-blur-sm transition-all duration-300 animate-slideIn border border-transparent hover:border-blue-100/50"
      style={{ animationDelay: `${index * 75}ms` }}
    >
      <div className={`p-2 rounded-full mr-3 ${
        amount > 0 
          ? 'bg-gradient-to-br from-green-100 to-green-50 animate-float' 
          : 'bg-gradient-to-br from-red-100 to-red-50 animate-float'
      }`}>
        {amount > 0 ? 
          <ArrowUpIcon className="h-5 w-5 text-green-600" /> : 
          <ArrowDownIcon className="h-5 w-5 text-red-600" />
        }
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium text-gray-900">{title}</h4>
          <span className={`text-sm font-medium ${amount > 0 ? 'text-green-600' : 'text-red-600'} animate-blur-in`} style={{ animationDelay: `${(index * 75) + 100}ms` }}>
            {amount > 0 ? '+' : ''}${Math.abs(amount).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between mt-1 items-center">
          <span className="text-xs text-gray-500 flex items-center">
            <span className="transform transition-all duration-300 inline-block hover:scale-110 mr-1">
              {formatCategoryDisplay(category).split(' ')[0]}
            </span>
            <span className="opacity-80">
              {formatCategoryDisplay(category).split(' ').slice(1).join(' ')}
            </span>
          </span>
          <span className="text-xs text-gray-500 bg-gray-50/50 px-2 py-0.5 rounded-full">{date}</span>
        </div>
      </div>
    </div>
  );
});

// Memoized Insight Item component
const InsightItem = React.memo(({ insight, index }) => (
  <div 
    className="flex items-start border-b border-gray-100 pb-4 last:border-0 animate-slideIn backdrop-blur-sm hover:bg-blue-50/20 p-3 rounded-xl transition-all duration-300 group" 
    style={{ animationDelay: `${index * 100}ms` }}
  >
    <div className="bg-gradient-to-br from-indigo-100 to-blue-50 p-2 rounded-full mr-3 animate-float shadow-sm group-hover:animate-glow">
      {insight.icon}
    </div>
    <div className="flex-1">
      <h4 className="text-sm font-medium text-gray-700 group-hover:text-indigo-700 transition-colors duration-300">{insight.title}</h4>
      <p className="text-xs text-gray-500 mt-1 group-hover:text-gray-600 transition-colors duration-300">{insight.description}</p>
      <p className="text-base font-semibold text-gray-900 mt-1 group-hover:text-blue-700 transition-colors duration-300 animate-blur-in" style={{ animationDelay: `${(index * 100) + 200}ms` }}>${insight.amount}</p>
    </div>
  </div>
));

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('month'); // 'week', 'month', 'year'
  const [insights, setInsights] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [hasGeminiApiKey, setHasGeminiApiKey] = useState(false);
  const navigate = useNavigate();
  
  // Track first load for animations
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Check for Gemini API key on component mount
  useEffect(() => {
    // Initialize Gemini API key if available in localStorage
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
      setGeminiApiKey(savedApiKey);
      setHasGeminiApiKey(true);
    } else {
      setHasGeminiApiKey(false);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (!auth.currentUser) return;
        
        // Fetch transactions
        const transactionsRef = collection(db, 'transactions', auth.currentUser.uid, 'userTransactions');
        const transactionsSnap = await getDocs(query(transactionsRef, orderBy('date', 'desc')));
        const transactionsData = transactionsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTransactions(transactionsData);
        
        // Fetch budgets
        const budgetsRef = collection(db, 'budgets', auth.currentUser.uid, 'userBudgets');
        const budgetsSnap = await getDocs(budgetsRef);
        const budgetsData = budgetsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBudgets(budgetsData);
        
        // Generate AI insights after data is loaded
        if (transactionsData.length > 0) {
          const generatedInsights = await generateInsights(transactionsData);
          setInsights(generatedInsights);
          
          const budgetRecs = await generateBudgetRecommendations(transactionsData, budgetsData);
          setRecommendations(budgetRecs);
          
          const expensePredictions = await predictFutureExpenses(transactionsData);
          setPredictions(expensePredictions);
        }
        
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filtered transactions based on timeframe
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let compareDate = new Date();
    
    if (timeframe === 'week') {
      compareDate.setDate(now.getDate() - 7);
    } else if (timeframe === 'month') {
      compareDate.setMonth(now.getMonth() - 1);
    } else if (timeframe === 'year') {
      compareDate.setFullYear(now.getFullYear() - 1);
    }
    
    return transactions.filter(t => new Date(t.date) >= compareDate);
  }, [transactions, timeframe]);
  
  // Calculate summary data
  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expenses = filteredTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
    const balance = income - expenses;
    
    return { income, expenses, balance };
  }, [filteredTransactions]);
  
  // Group transactions by category for the pie chart
  const expensesByCategory = useMemo(() => {
    const categories = {};
    
    filteredTransactions
      .filter(t => t.amount < 0)
      .forEach(t => {
        const category = t.category || 'other';
        if (!categories[category]) {
          categories[category] = 0;
        }
        categories[category] += Math.abs(t.amount);
      });
      
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);
  
  // Group transactions by month for the bar chart
  const monthlyData = useMemo(() => {
    const months = {};
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Initialize all months
    for (let i = 0; i < 6; i++) {
      const monthDate = new Date(currentYear, now.getMonth() - i, 1);
      const monthKey = monthDate.toLocaleString('default', { month: 'short' });
      months[monthKey] = { name: monthKey, income: 0, expenses: 0 };
    }
    
    // Fill with data
    transactions.forEach(t => {
      const date = new Date(t.date);
      // Only consider transactions from the last 6 months
      if (date.getFullYear() === currentYear && date.getMonth() >= now.getMonth() - 5) {
        const monthKey = date.toLocaleString('default', { month: 'short' });
        if (months[monthKey]) {
          if (t.amount > 0) {
            months[monthKey].income += t.amount;
          } else {
            months[monthKey].expenses += Math.abs(t.amount);
          }
        }
      }
    });
    
    // Convert to array and reverse to have chronological order
    return Object.values(months).reverse();
  }, [transactions]);
  
  // Weekly spending trend for line chart
  const weeklySpending = useMemo(() => {
    const days = {};
    const now = new Date();
    
    // Initialize all days of the week
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      const dayKey = day.toLocaleString('default', { weekday: 'short' });
      const dateStr = day.toISOString().split('T')[0];
      days[dateStr] = { name: dayKey, amount: 0, date: dateStr };
    }
    
    // Fill with expense data
    transactions
      .filter(t => t.amount < 0)
      .forEach(t => {
        const date = new Date(t.date);
        const dateStr = date.toISOString().split('T')[0];
        if (days[dateStr]) {
          days[dateStr].amount += Math.abs(t.amount);
        }
      });
    
    return Object.values(days);
  }, [transactions]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /></div>;
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">
          Financial Dashboard
        </h1>
        
        <div className="inline-flex shadow-sm rounded-md">
          <button
            type="button"
            onClick={() => setTimeframe('week')}
            className={`px-4 py-2 text-sm font-medium rounded-l-md ${
              timeframe === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('month')}
            className={`px-4 py-2 text-sm font-medium ${
              timeframe === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            This Month
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('year')}
            className={`px-4 py-2 text-sm font-medium rounded-r-md ${
              timeframe === 'year'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            This Year
          </button>
        </div>
      </div>

      {!hasGeminiApiKey && <GeminiApiExplainer />}
      
      <div className="animate-fadeIn">
        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-6 border border-gray-100/50 transition-all duration-300 hover:shadow-lg group animate-blur-in">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-gradient-to-br from-green-100 to-green-50 mr-4 shadow-sm animate-float group-hover:animate-glow">
                <ArrowUpIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Income</p>
                <p className="text-2xl font-bold text-gray-900 group-hover:text-green-700 transition-colors duration-300">${summary.income.toFixed(2)}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 w-full bg-gray-200/50 rounded-full">
                <div className="h-2 bg-gradient-to-r from-green-400 to-green-500 rounded-full animate-gradient-shift" style={{ width: `100%` }} />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-6 border border-gray-100/50 transition-all duration-300 hover:shadow-lg group animate-blur-in" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-gradient-to-br from-red-100 to-red-50 mr-4 shadow-sm animate-float group-hover:animate-glow">
                <ArrowDownIcon className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Expenses</p>
                <p className="text-2xl font-bold text-gray-900 group-hover:text-red-700 transition-colors duration-300">${summary.expenses.toFixed(2)}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 w-full bg-gray-200/50 rounded-full">
                <div 
                  className="h-2 bg-gradient-to-r from-red-400 to-red-500 rounded-full animate-gradient-shift" 
                  style={{ width: `${Math.min(100, (summary.expenses / summary.income) * 100)}%` }} 
                />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-6 border border-gray-100/50 transition-all duration-300 hover:shadow-lg group animate-blur-in" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 mr-4 shadow-sm animate-float group-hover:animate-glow">
                <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Balance</p>
                <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-300">${summary.balance.toFixed(2)}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 w-full bg-gray-200/50 rounded-full">
                <div 
                  className="h-2 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full animate-gradient-shift" 
                  style={{ width: `${Math.min(100, Math.max(0, (summary.balance / summary.income) * 100))}%` }} 
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* AI Insights Section */}
        {insights && insights.length > 0 && (
          <div className="mb-8 bg-gradient-to-br from-indigo-50 to-purple-50/80 backdrop-blur-sm border border-indigo-100/50 rounded-xl p-6 animate-blur-in shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-indigo-100 p-2 rounded-full mr-2 animate-float">
                  <SparklesIcon className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">AI-Powered Insights</h2>
              </div>
              {hasGeminiApiKey && (
                <div className="flex items-center bg-gradient-to-r from-indigo-100 to-purple-100 px-3 py-1.5 rounded-full text-xs font-medium text-indigo-800 shadow-sm animate-glow">
                  <SparklesIcon className="h-3 w-3 mr-1.5 animate-pulse" />
                  Powered by Gemini AI
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {insights.map((insight, index) => (
                <div key={index} className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-indigo-100/30 transition-all duration-300 hover:shadow-md group animate-slideIn" style={{ animationDelay: `${index * 100}ms` }}>
                  <h3 className="font-medium text-indigo-900 mb-1 group-hover:text-indigo-700 transition-colors duration-300">{insight.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                  {insight.action && (
                    <p className="text-xs bg-indigo-50/80 backdrop-blur-sm p-2 rounded-lg text-indigo-700 animate-blur-in" style={{ animationDelay: `${(index * 100) + 200}ms` }}>
                      <span className="font-medium">Suggestion: </span>{insight.action}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Future Expenses Prediction */}
        {predictions && predictions.categories && predictions.categories.length > 0 && (
          <div className="bg-gradient-to-br from-white to-purple-50/30 backdrop-blur-sm rounded-xl shadow-md p-6 border border-purple-100/50 animate-blur-in" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-purple-100 p-2 rounded-full mr-2 animate-float">
                  <SparklesIcon className="h-5 w-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Expense Predictions</h2>
              </div>
              {hasGeminiApiKey && (
                <div className="flex items-center bg-gradient-to-r from-indigo-100 to-purple-100 px-3 py-1.5 rounded-full text-xs font-medium text-indigo-800 shadow-sm animate-glow">
                  <SparklesIcon className="h-3 w-3 mr-1.5 animate-pulse" />
                  Powered by Gemini AI
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {predictions.categories.map((category, index) => (
                <div key={index} className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-purple-100/30 transition-all duration-300 hover:shadow-md group animate-slideIn" style={{ animationDelay: `${index * 100}ms` }}>
                  <h3 className="font-medium text-purple-900 mb-1 group-hover:text-purple-700 transition-colors duration-300">{category.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                  <p className="text-base font-semibold text-gray-900 mt-1 group-hover:text-purple-700 transition-colors duration-300 animate-blur-in" style={{ animationDelay: `${(index * 100) + 200}ms` }}>${category.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* The rest of your dashboard components */}
      </div>
    </div>
  );
}