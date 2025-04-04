import { useState, useEffect } from 'react';
import { 
  SparklesIcon, ChartBarIcon, ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, CheckCircleIcon, ExclamationTriangleIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import { recommendActions } from '../utils/ai';

const healthScoreColors = {
  excellent: { color: 'text-green-600', bg: 'bg-green-100', icon: <CheckCircleIcon className="h-5 w-5" /> },
  good: { color: 'text-blue-600', bg: 'bg-blue-100', icon: <CheckCircleIcon className="h-5 w-5" /> },
  fair: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: <LightBulbIcon className="h-5 w-5" /> },
  poor: { color: 'text-red-600', bg: 'bg-red-100', icon: <ExclamationTriangleIcon className="h-5 w-5" /> }
};

export default function FinancialHealthAnalyzer({ transactions, budgets }) {
  const [healthScore, setHealthScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [hasGeminiApiKey, setHasGeminiApiKey] = useState(false);

  useEffect(() => {
    // Check for Gemini API key
    const savedApiKey = localStorage.getItem('gemini_api_key');
    setHasGeminiApiKey(!!savedApiKey);

    if (!transactions || !transactions.length) {
      setLoading(false);
      return;
    }

    // Calculate financial health
    calculateFinancialHealth(transactions, budgets);
  }, [transactions, budgets]);

  const calculateFinancialHealth = (transactions, budgets) => {
    setLoading(true);
    
    // Calculate metrics
    const income = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expenses = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    // Get last 3 months of transactions
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const recentTransactions = transactions.filter(
      t => new Date(t.date) >= threeMonthsAgo
    );
    
    // Calculate metrics
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    
    // Check budget adherence
    let budgetAdherence = 0;
    if (budgets && budgets.length > 0) {
      const budgetCounts = { met: 0, exceeded: 0, total: budgets.length };
      
      budgets.forEach(budget => {
        const category = budget.category;
        const limit = budget.amount;
        
        const spent = transactions
          .filter(t => t.category === category && t.amount < 0)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);
          
        if (spent <= limit) {
          budgetCounts.met++;
        } else {
          budgetCounts.exceeded++;
        }
      });
      
      budgetAdherence = (budgetCounts.met / budgetCounts.total) * 100;
    }
    
    // Get AI recommendations
    const aiRecommendations = recommendActions(transactions, budgets);
    setRecommendations(aiRecommendations);
    
    // Calculate overall health score (0-100)
    let score = 0;
    
    // Savings rate contributes up to 40 points
    if (savingsRate >= 20) score += 40;
    else if (savingsRate >= 10) score += 30;
    else if (savingsRate >= 5) score += 20;
    else if (savingsRate > 0) score += 10;
    
    // Budget adherence contributes up to 30 points
    if (budgetAdherence >= 80) score += 30;
    else if (budgetAdherence >= 60) score += 20;
    else if (budgetAdherence >= 40) score += 10;
    
    // Income stability (additional 20 points)
    // Check last 3 months for consistent income
    const hasConsistentIncome = true; // Simplified for this example
    if (hasConsistentIncome) score += 20;
    
    // Check expense patterns (additional 10 points)
    // Positive if expenses aren't increasing month over month
    const hasStableExpenses = true; // Simplified for this example
    if (hasStableExpenses) score += 10;
    
    // Determine health category
    let healthCategory = 'poor';
    if (score >= 80) healthCategory = 'excellent';
    else if (score >= 60) healthCategory = 'good';
    else if (score >= 40) healthCategory = 'fair';
    
    setHealthScore({
      score,
      category: healthCategory,
      metrics: {
        savingsRate: savingsRate.toFixed(1),
        budgetAdherence: budgetAdherence.toFixed(1),
        expenseToIncomeRatio: income > 0 ? ((expenses / income) * 100).toFixed(1) : 'N/A',
      }
    });
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-6"></div>
        <div className="h-32 bg-gray-200 rounded w-full mb-4"></div>
      </div>
    );
  }

  if (!healthScore) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center mb-4">
          <SparklesIcon className="h-6 w-6 text-purple-600 mr-2" />
          <h2 className="text-xl font-bold text-gray-900">Financial Health</h2>
        </div>
        <p className="text-gray-600">Add more transactions to see your financial health analysis.</p>
      </div>
    );
  }

  const { color, bg, icon } = healthScoreColors[healthScore.category];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <SparklesIcon className="h-6 w-6 text-purple-600 mr-2" />
          <h2 className="text-xl font-bold text-gray-900">Financial Health</h2>
        </div>
        {hasGeminiApiKey && (
          <div className="flex items-center bg-gradient-to-r from-indigo-100 to-purple-100 px-2 py-1 rounded-full text-xs font-medium text-indigo-800">
            <SparklesIcon className="h-3 w-3 mr-1" />
            Powered by Gemini AI
          </div>
        )}
      </div>
      
      {/* Health Score */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between">
        <div className="flex items-center mb-4 sm:mb-0">
          <div className={`p-4 rounded-full ${bg} ${color} mr-4`}>
            {icon}
          </div>
          <div>
            <div className="flex items-center">
              <h3 className="text-lg font-bold text-gray-900 mr-2">
                {healthScore.category.charAt(0).toUpperCase() + healthScore.category.slice(1)}
              </h3>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${bg} ${color}`}>
                {healthScore.score}/100
              </span>
            </div>
            <p className="text-sm text-gray-600">Overall Financial Health Score</p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
        >
          {expanded ? 'Show less' : 'Show more'}
          <svg
            className={`ml-1 h-4 w-4 transform transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center mb-1">
            <ArrowTrendingUpIcon className="h-4 w-4 text-blue-600 mr-1" />
            <h4 className="text-sm font-medium text-gray-900">Savings Rate</h4>
          </div>
          <p className="text-xl font-bold">{healthScore.metrics.savingsRate}%</p>
          <p className="text-xs text-gray-500">of income saved</p>
        </div>
        
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center mb-1">
            <ChartBarIcon className="h-4 w-4 text-blue-600 mr-1" />
            <h4 className="text-sm font-medium text-gray-900">Budget Adherence</h4>
          </div>
          <p className="text-xl font-bold">{healthScore.metrics.budgetAdherence}%</p>
          <p className="text-xs text-gray-500">budgets on target</p>
        </div>
        
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center mb-1">
            <ArrowTrendingDownIcon className="h-4 w-4 text-blue-600 mr-1" />
            <h4 className="text-sm font-medium text-gray-900">Expense Ratio</h4>
          </div>
          <p className="text-xl font-bold">{healthScore.metrics.expenseToIncomeRatio}%</p>
          <p className="text-xs text-gray-500">of income spent</p>
        </div>
      </div>
      
      {/* Expanded Recommendations Section */}
      {expanded && (
        <div className="space-y-4 mt-6 animate-fadeIn">
          <h3 className="font-medium text-gray-900 flex items-center">
            <LightBulbIcon className="h-5 w-5 text-yellow-500 mr-2" />
            AI-Powered Recommendations
          </h3>
          
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex">
                  <div className="flex-shrink-0 pt-1">
                    <span className="text-lg mr-2">{rec.emoji}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{rec.title}</h4>
                    <p className="text-sm text-gray-600">{rec.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 