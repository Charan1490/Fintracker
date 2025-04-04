/**
 * AI Utilities for Finance Tracker
 * 
 * This module contains functions for AI-powered features including:
 * - Expense categorization
 * - Spending insights generation
 * - Budget recommendations
 */

import GeminiService from './geminiService';

// Initialize with empty API key - will be set by user
let geminiService = null;

// Function to set the Gemini API key
export const setGeminiApiKey = (apiKey) => {
  if (apiKey && apiKey.trim() !== '') {
    geminiService = new GeminiService(apiKey);
    return true;
  }
  return false;
};

// Check if Gemini service is available
const isGeminiAvailable = () => {
  return geminiService !== null;
};

// Fallback function for category prediction
const fallbackPredictCategory = (description) => {
  const description_lower = description.toLowerCase();
  
  // Keywords for different categories with expanded sets
  const categories = {
    food: [
      'restaurant', 'cafe', 'burger', 'pizza', 'taco', 'sushi', 'dinner', 
      'lunch', 'breakfast', 'food', 'dining', 'takeout', 'delivery', 'mcdonalds', 
      'starbucks', 'doordash', 'grubhub', 'ubereats', 'chipotle', 'bakery'
    ],
    grocery: [
      'supermarket', 'grocery', 'market', 'food store', 'walmart', 'target', 
      'kroger', 'costco', 'safeway', 'whole foods', 'aldi', 'trader joes', 
      'publix', 'food shopping', 'groceries', 'organic'
    ],
    transport: [
      'gas', 'fuel', 'uber', 'lyft', 'taxi', 'bus', 'train', 'subway', 'metro',
      'transportation', 'commute', 'toll', 'parking', 'car service', 'shuttle', 
      'rideshare', 'transit', 'carpool', 'fare', 'gasoline', 'petrol'
    ],
    entertainment: [
      'movie', 'cinema', 'theater', 'concert', 'netflix', 'spotify', 'hulu', 
      'disney+', 'show', 'game', 'ticket', 'amusement', 'streaming', 'music', 
      'festival', 'performance', 'subscription', 'amazon prime', 'apple tv', 'hbo'
    ],
    shopping: [
      'amazon', 'mall', 'store', 'shop', 'ebay', 'etsy', 'clothing', 'shoes',
      'retail', 'purchase', 'buy', 'online shopping', 'department store', 'outlet',
      'boutique', 'apparel', 'fashion', 'electronics', 'gadget', 'accessory'
    ],
    housing: [
      'rent', 'mortgage', 'apartment', 'home', 'house', 'property', 'lease',
      'deposit', 'real estate', 'down payment', 'housing', 'landlord', 'tenant',
      'maintenance', 'repair', 'hoa', 'community', 'condo', 'townhouse'
    ],
    utilities: [
      'electric', 'water', 'gas', 'internet', 'wifi', 'phone', 'bill', 'utility',
      'cable', 'electricity', 'power', 'service', 'sewage', 'garbage', 'trash',
      'collection', 'broadband', 'landline', 'mobile', 'provider', 'connection'
    ],
    healthcare: [
      'doctor', 'hospital', 'clinic', 'pharmacy', 'prescription', 'medicine', 
      'dental', 'medical', 'health', 'checkup', 'appointment', 'insurance',
      'dentist', 'therapy', 'physician', 'specialist', 'copay', 'treatment',
      'emergency', 'urgent care', 'medication', 'drug', 'vitamin', 'supplement'
    ],
    education: [
      'tuition', 'school', 'college', 'university', 'course', 'book', 'class', 
      'student', 'loan', 'education', 'textbook', 'degree', 'program', 'study',
      'training', 'workshop', 'certification', 'seminar', 'campus', 'learning'
    ],
    personal: [
      'haircut', 'salon', 'spa', 'gym', 'fitness', 'wellness', 'beauty', 'cosmetics',
      'personal care', 'grooming', 'self-care', 'massage', 'barber', 'stylist',
      'skincare', 'makeup', 'manicure', 'pedicure', 'hygiene', 'product'
    ],
    travel: [
      'hotel', 'flight', 'airplane', 'booking', 'vacation', 'trip', 'airbnb', 
      'motel', 'travel', 'tourism', 'tour', 'cruise', 'resort', 'lodge', 'camping',
      'destination', 'accommodation', 'airline', 'rental', 'luggage', 'passport'
    ],
    subscription: [
      'subscription', 'membership', 'monthly', 'annual', 'renewal', 'recurring',
      'service', 'access', 'plan', 'premium', 'account', 'fee', 'bill', 'dues',
      'auto-pay', 'regular payment', 'auto-renewal', 'club'
    ],
    salary: [
      'salary', 'paycheck', 'direct deposit', 'wage', 'income', 'payment',
      'compensation', 'earnings', 'pay', 'net pay', 'gross pay', 'employer',
      'company', 'job', 'employment', 'payroll', 'deposit', 'hr', 'human resources'
    ],
    freelance: [
      'freelance', 'client', 'project', 'gig', 'contract', 'consulting', 'invoice',
      'self-employed', 'commission', 'job', 'side hustle', 'independent', 'contractor',
      'service', 'work', 'business', 'entrepreneur', 'billable', 'professional'
    ],
    gift: [
      'gift', 'present', 'donation', 'charity', 'contribute', 'contribution',
      'birthday', 'holiday', 'christmas', 'wedding', 'support', 'anniversary',
      'celebration', 'occasion', 'giving', 'generosity', 'fundraiser'
    ],
    investment: [
      'investment', 'stock', 'bond', 'dividend', 'interest', 'fund', 'portfolio',
      'retirement', 'ira', '401k', 'etf', 'mutual fund', 'share', 'security',
      'capital', 'broker', 'brokerage', 'asset', 'wealth', 'finance'
    ],
    refund: [
      'refund', 'return', 'cashback', 'reimbursement', 'credit', 'chargeback',
      'money back', 'exchange', 'compensation', 'rebate', 'adjustment', 'correction',
      'reversal', 'repayment', 'dispute'
    ]
  };
  
  // Check for category matches with confidence scoring
  let bestMatch = null;
  let highestScore = 0;
  
  for (const [category, keywords] of Object.entries(categories)) {
    let score = 0;
    
    for (const keyword of keywords) {
      if (description_lower.includes(keyword)) {
        // Calculate score based on keyword length and position
        const keywordScore = keyword.length * (description_lower.indexOf(keyword) === 0 ? 2 : 1);
        score += keywordScore;
      }
    }
    
    if (score > highestScore) {
      highestScore = score;
      bestMatch = category;
    }
  }
  
  // Return the best match if found and score is significant
  if (bestMatch && highestScore > 3) {
    return bestMatch;
  }
  
  // Default to other_expense for expenses and other_income for income
  if (description_lower.includes('income') || 
      description_lower.includes('deposit') || 
      description_lower.includes('salary') || 
      description_lower.includes('payment received')) {
    return 'other_income';
  }
  
  return 'other_expense';
};

/**
 * Predicts a category for a transaction based on its description
 * @param {string} description - The transaction description
 * @returns {Promise<string>} - The predicted category
 */
export const predictCategory = async (description) => {
  try {
    if (isGeminiAvailable()) {
      return await geminiService.predictCategory(description);
    } else {
      return fallbackPredictCategory(description);
    }
  } catch (error) {
    console.error("Error predicting category:", error);
    return fallbackPredictCategory(description);
  }
};

// Fallback function for generating insights
const fallbackGenerateInsights = (transactions) => {
  if (!transactions || transactions.length === 0) {
    return [];
  }
  
  const insights = [];
  
  // Calculate total income and expenses
  const income = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  // Group expenses by category
  const expensesByCategory = {};
  transactions.filter(t => t.amount < 0).forEach(t => {
    const category = t.category || 'other';
    if (!expensesByCategory[category]) {
      expensesByCategory[category] = 0;
    }
    expensesByCategory[category] += Math.abs(t.amount);
  });
  
  // Find top spending category
  let topCategory = '';
  let topAmount = 0;
  Object.entries(expensesByCategory).forEach(([category, amount]) => {
    if (amount > topAmount) {
      topAmount = amount;
      topCategory = category;
    }
  });
  
  // Calculate savings rate
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
  
  // Add savings rate insight
  insights.push({
    title: "Monthly Savings Rate",
    description: `Your savings rate is ${savingsRate.toFixed(1)}% of your income.`,
    action: savingsRate < 20 ? "Try to increase your savings rate to at least 20% for financial security." : "Great job! Keep maintaining this savings rate.",
    amount: (income - expenses).toFixed(2)
  });
  
  // Add top spending category insight
  if (topCategory) {
    insights.push({
      title: "Top Spending Category",
      description: `Your highest spending is in ${topCategory} at ${((topAmount / expenses) * 100).toFixed(1)}% of total expenses.`,
      action: "Review if you can optimize spending in this category.",
      amount: topAmount.toFixed(2)
    });
  }
  
  // Add income trend insight if we have enough data
  if (transactions.length > 10) {
    const recentIncome = transactions.filter(t => t.amount > 0).slice(0, 5).reduce((sum, t) => sum + t.amount, 0);
    const olderIncome = transactions.filter(t => t.amount > 0).slice(5, 10).reduce((sum, t) => sum + t.amount, 0);
    
    if (recentIncome > 0 && olderIncome > 0) {
      const incomeChange = ((recentIncome - olderIncome) / olderIncome) * 100;
      
      insights.push({
        title: "Income Trend",
        description: `Your recent income has ${incomeChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(incomeChange).toFixed(1)}%.`,
        action: incomeChange < 0 ? "Look for additional income sources to stabilize your finances." : "Consider investing the extra income for future growth.",
        amount: Math.abs(recentIncome - olderIncome).toFixed(2)
      });
    }
  }
  
  return insights;
};

/**
 * Generates insights based on transaction history
 * @param {Array} transactions - Array of transaction objects
 * @returns {Promise<Array>} - Array of insight objects
 */
export const generateInsights = async (transactions) => {
  try {
    if (isGeminiAvailable()) {
      return await geminiService.generateInsights(transactions);
    } else {
      return fallbackGenerateInsights(transactions);
    }
  } catch (error) {
    console.error("Error generating insights:", error);
    return fallbackGenerateInsights(transactions);
  }
};

// Fallback function for budget recommendations
const fallbackGenerateBudgetRecommendations = (transactions, existingBudgets = []) => {
  if (!transactions || transactions.length === 0) {
    return [];
  }
  
  const recommendations = [];
  const existingBudgetMap = {};
  
  // Map existing budgets by category
  existingBudgets.forEach(budget => {
    existingBudgetMap[budget.category] = budget.amount;
  });
  
  // Group expenses by category
  const expensesByCategory = {};
  transactions.filter(t => t.amount < 0).forEach(t => {
    const category = t.category || 'other_expense';
    if (!expensesByCategory[category]) {
      expensesByCategory[category] = 0;
    }
    expensesByCategory[category] += Math.abs(t.amount);
  });
  
  // Calculate total income and expenses
  const income = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  
  // Category icons for display
  const categoryIcons = {
    food: '🍔',
    grocery: '🛒',
    transport: '🚗',
    entertainment: '🎬',
    shopping: '🛍️',
    housing: '🏠',
    utilities: '💡',
    healthcare: '🏥',
    education: '📚',
    personal: '💇',
    travel: '✈️',
    subscription: '📱',
    other_expense: '📋'
  };
  
  // Generate recommendations for top categories
  Object.entries(expensesByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([category, amount]) => {
      const monthlyAverage = amount / 3; // Assuming 3 months of data
      const currentBudget = existingBudgetMap[category];
      let recommendedBudget;
      let reasoning;
      
      if (currentBudget) {
        // If budget exists but spending is higher
        if (monthlyAverage > currentBudget) {
          recommendedBudget = Math.ceil(monthlyAverage * 0.9); // Recommend 10% reduction
          reasoning = `Your average spending is higher than your current budget. Consider adjusting it to be more realistic while aiming for some reduction.`;
        } 
        // If budget exists but spending is much lower
        else if (monthlyAverage < currentBudget * 0.7) {
          recommendedBudget = Math.ceil(monthlyAverage * 1.1); // Recommend slightly above average
          reasoning = `Your spending is well below budget. You could reduce this budget and allocate funds elsewhere.`;
        }
        // If budget is about right
        else {
          recommendedBudget = currentBudget;
          reasoning = `Your current budget aligns well with your spending patterns.`;
        }
      } else {
        // No existing budget, recommend based on income and category
        const percentOfIncome = income > 0 ? (monthlyAverage / income) * 100 : 0;
        
        // Recommend budget based on typical percentages of income
        let recommendedPercent;
        if (category === 'housing') recommendedPercent = Math.min(percentOfIncome, 30);
        else if (category === 'food' || category === 'grocery') recommendedPercent = Math.min(percentOfIncome, 15);
        else if (category === 'transport') recommendedPercent = Math.min(percentOfIncome, 10);
        else recommendedPercent = Math.min(percentOfIncome, 5);
        
        recommendedBudget = Math.ceil((recommendedPercent / 100) * income);
        reasoning = `Based on your income and typical financial guidelines, consider allocating about ${recommendedPercent.toFixed(1)}% of your income to this category.`;
      }
      
      recommendations.push({
        category,
        currentBudget: currentBudget || null,
        recommendedBudget,
        reasoning,
        icon: categoryIcons[category] || '📋'
      });
    });
  
  return recommendations;
};

/**
 * Generates budget recommendations based on spending patterns
 * @param {Array} transactions - Array of transaction objects
 * @param {Array} existingBudgets - Array of existing budget objects
 * @returns {Promise<Array>} - Array of budget recommendation objects
 */
export const generateBudgetRecommendations = async (transactions, existingBudgets = []) => {
  try {
    if (isGeminiAvailable()) {
      return await geminiService.generateBudgetRecommendations(transactions, existingBudgets);
    } else {
      return fallbackGenerateBudgetRecommendations(transactions, existingBudgets);
    }
  } catch (error) {
    console.error("Error generating budget recommendations:", error);
    return fallbackGenerateBudgetRecommendations(transactions, existingBudgets);
  }
};

// Fallback function for predicting future expenses
const fallbackPredictFutureExpenses = (transactions) => {
  if (!transactions || transactions.length === 0) {
    return { totalPredicted: 0, categories: [] };
  }
  
  // Group expenses by category
  const expensesByCategory = {};
  const categoryCounts = {};
  
  transactions.filter(t => t.amount < 0).forEach(t => {
    const category = t.category || 'other_expense';
    if (!expensesByCategory[category]) {
      expensesByCategory[category] = 0;
      categoryCounts[category] = 0;
    }
    expensesByCategory[category] += Math.abs(t.amount);
    categoryCounts[category]++;
  });
  
  // Calculate average monthly expense for each category
  const monthlyPredictions = [];
  let totalPredicted = 0;
  
  const categoryIcons = {
    food: '🍔',
    grocery: '🛒',
    transport: '🚗',
    entertainment: '🎬',
    shopping: '🛍️',
    housing: '🏠',
    utilities: '💡',
    healthcare: '🏥',
    education: '📚',
    personal: '💇',
    travel: '✈️',
    subscription: '📱',
    other_expense: '📋'
  };
  
  Object.entries(expensesByCategory).forEach(([category, total]) => {
    // Simple prediction: average amount * slight growth factor
    const count = categoryCounts[category];
    const avgAmount = count > 0 ? total / count : 0;
    const predictedAmount = avgAmount * 1.05; // 5% growth prediction
    
    if (predictedAmount > 0) {
      monthlyPredictions.push({
        name: category,
        amount: predictedAmount,
        icon: categoryIcons[category] || '📋'
      });
      totalPredicted += predictedAmount;
    }
  });
  
  // Sort by amount, highest first
  monthlyPredictions.sort((a, b) => b.amount - a.amount);
  
  return {
    totalPredicted,
    categories: monthlyPredictions
  };
};

/**
 * Predicts future expenses based on spending patterns
 * @param {Array} transactions - Array of transaction objects
 * @returns {Promise<Object>} - Prediction object with total and categories
 */
export const predictFutureExpenses = async (transactions) => {
  try {
    if (isGeminiAvailable()) {
      return await geminiService.predictFutureExpenses(transactions);
    } else {
      return fallbackPredictFutureExpenses(transactions);
    }
  } catch (error) {
    console.error("Error predicting future expenses:", error);
    return fallbackPredictFutureExpenses(transactions);
  }
};

// Fallback function for recommending actions
const fallbackRecommendActions = (transactions) => {
  if (!transactions || transactions.length === 0) {
    return [
      {
        title: "Start Tracking Your Expenses",
        description: "Begin by recording all your expenses to get a clear picture of your spending habits.",
        impact: "High",
        timeframe: "Short-term"
      },
      {
        title: "Create a Basic Budget",
        description: "Set up a simple budget for essential categories like housing, food, and transportation.",
        impact: "High",
        timeframe: "Short-term"
      },
      {
        title: "Build an Emergency Fund",
        description: "Start saving for an emergency fund to cover 3-6 months of expenses.",
        impact: "High",
        timeframe: "Medium-term"
      }
    ];
  }
  
  const actions = [];
  
  // Calculate key metrics
  const income = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
  
  // Group expenses by category
  const expensesByCategory = {};
  transactions.filter(t => t.amount < 0).forEach(t => {
    const category = t.category || 'other';
    if (!expensesByCategory[category]) {
      expensesByCategory[category] = 0;
    }
    expensesByCategory[category] += Math.abs(t.amount);
  });
  
  // Find top spending categories
  const topCategories = Object.entries(expensesByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category, amount]) => ({ category, amount, percentage: (amount / expenses) * 100 }));
  
  // Add savings rate recommendation
  if (savingsRate < 20) {
    actions.push({
      title: "Increase Your Savings Rate",
      description: `Your current savings rate is ${savingsRate.toFixed(1)}%. Aim to save at least 20% of your income.`,
      impact: "High",
      timeframe: "Medium-term"
    });
  } else {
    actions.push({
      title: "Maintain Your Savings Rate",
      description: `Great job! Your savings rate is ${savingsRate.toFixed(1)}%. Consider investing your savings for long-term growth.`,
      impact: "Medium",
      timeframe: "Long-term"
    });
  }
  
  // Add top category optimization recommendation
  if (topCategories.length > 0) {
    const topCategory = topCategories[0];
    if (topCategory.percentage > 30) {
      actions.push({
        title: `Optimize ${topCategory.category} Spending`,
        description: `This category accounts for ${topCategory.percentage.toFixed(1)}% of your expenses. Look for ways to reduce costs here.`,
        impact: "High",
        timeframe: "Short-term"
      });
    }
  }
  
  // Add emergency fund recommendation
  actions.push({
    title: "Build or Strengthen Emergency Fund",
    description: "Ensure you have 3-6 months of essential expenses saved in an easily accessible account.",
    impact: "High",
    timeframe: "Medium-term"
  });
  
  // Add debt recommendation if we can detect it
  const possibleDebtCategories = ['loan', 'debt', 'mortgage', 'credit'];
  const hasDebt = transactions.some(t => 
    t.amount < 0 && possibleDebtCategories.some(dc => 
      t.category?.includes(dc) || t.title?.toLowerCase().includes(dc)
    )
  );
  
  if (hasDebt) {
    actions.push({
      title: "Create a Debt Repayment Plan",
      description: "Focus on paying off high-interest debt first, then work on other debts.",
      impact: "High",
      timeframe: "Medium-term"
    });
  }
  
  return actions;
};

/**
 * Generates personalized financial action recommendations
 * @param {Array} transactions - Array of transaction objects
 * @returns {Promise<Array>} - Array of recommendation objects
 */
export const recommendActions = async (transactions) => {
  try {
    if (isGeminiAvailable()) {
      return await geminiService.recommendActions(transactions);
    } else {
      return fallbackRecommendActions(transactions);
    }
  } catch (error) {
    console.error("Error generating action recommendations:", error);
    return fallbackRecommendActions(transactions);
  }
};

// Fallback function for enriching transaction data
const fallbackEnrichTransactionData = (description) => {
  const descriptionLower = description.toLowerCase();
  
  // Common merchants and their categories
  const merchantMappings = [
    { keywords: ['amazon', 'amzn'], name: 'Amazon', category: 'shopping', icon: '🛍️' },
    { keywords: ['walmart', 'target', 'costco', 'sams club'], name: 'Retail Store', category: 'shopping', icon: '🛍️' },
    { keywords: ['uber', 'lyft', 'taxi', 'cab'], name: 'Ride Share', category: 'transport', icon: '🚗' },
    { keywords: ['netflix', 'hulu', 'disney+', 'hbo'], name: 'Streaming Service', category: 'subscription', icon: '📱' },
    { keywords: ['restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonald', 'burger', 'pizza'], name: 'Restaurant', category: 'food', icon: '🍔' },
    { keywords: ['grocery', 'supermarket', 'food store', 'trader joe', 'whole foods'], name: 'Grocery Store', category: 'grocery', icon: '🛒' },
    { keywords: ['gas', 'shell', 'exxon', 'chevron', 'bp'], name: 'Gas Station', category: 'transport', icon: '⛽' },
    { keywords: ['doctor', 'medical', 'hospital', 'clinic', 'pharmacy', 'dental'], name: 'Healthcare Provider', category: 'healthcare', icon: '🏥' },
    { keywords: ['spotify', 'apple music', 'pandora'], name: 'Music Service', category: 'subscription', icon: '🎵' },
    { keywords: ['rent', 'mortgage', 'apartment', 'house payment'], name: 'Housing', category: 'housing', icon: '🏠' },
    { keywords: ['electric', 'water', 'gas', 'utility', 'internet', 'phone bill'], name: 'Utility Company', category: 'utilities', icon: '💡' },
    { keywords: ['gym', 'fitness', 'workout'], name: 'Fitness', category: 'personal', icon: '💪' },
    { keywords: ['school', 'tuition', 'college', 'university', 'course'], name: 'Education', category: 'education', icon: '📚' },
    { keywords: ['hotel', 'airbnb', 'booking', 'flight', 'airline', 'travel'], name: 'Travel', category: 'travel', icon: '✈️' },
    { keywords: ['salary', 'payroll', 'direct deposit', 'income'], name: 'Income', category: 'salary', icon: '💰' }
  ];
  
  // Find matching merchant
  for (const mapping of merchantMappings) {
    if (mapping.keywords.some(keyword => descriptionLower.includes(keyword))) {
      return {
        merchantName: mapping.name,
        category: mapping.category,
        icon: mapping.icon
      };
    }
  }
  
  // Default values if no match found
  return {
    merchantName: '',
    category: descriptionLower.includes('income') || descriptionLower.includes('deposit') ? 'other_income' : 'other_expense',
    icon: descriptionLower.includes('income') || descriptionLower.includes('deposit') ? '💵' : '📋'
  };
};

/**
 * Enriches transaction data with merchant and category information
 * @param {string} description - The transaction description
 * @returns {Promise<Object>} - Object with merchant name, category, and icon
 */
export const enrichTransactionData = async (description) => {
  try {
    if (isGeminiAvailable()) {
      return await geminiService.enrichTransactionData(description);
    } else {
      return fallbackEnrichTransactionData(description);
    }
  } catch (error) {
    console.error("Error enriching transaction data:", error);
    return fallbackEnrichTransactionData(description);
  }
};

// Financial health analyzer class - will use Gemini if available
export class FinancialHealthAnalyzer {
  constructor(transactions, budgets) {
    this.transactions = transactions || [];
    this.budgets = budgets || [];
    this.healthScore = 0;
    this.insights = [];
  }
  
  async analyze() {
    // Calculate basic metrics regardless of API availability
    const income = this.transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const expenses = this.transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    
    // Check budget adherence
    let budgetAdherence = 0;
    if (this.budgets.length > 0) {
      const categoriesWithBudget = {};
      this.budgets.forEach(budget => {
        categoriesWithBudget[budget.category] = budget.amount;
      });
      
      // Calculate spending by category
      const spendingByCategory = {};
      this.transactions.filter(t => t.amount < 0).forEach(t => {
        const category = t.category || 'other';
        if (!spendingByCategory[category]) {
          spendingByCategory[category] = 0;
        }
        spendingByCategory[category] += Math.abs(t.amount);
      });
      
      // Calculate adherence score
      let adherenceSum = 0;
      let categoryCount = 0;
      
      Object.entries(categoriesWithBudget).forEach(([category, budgetAmount]) => {
        const spent = spendingByCategory[category] || 0;
        if (budgetAmount > 0) {
          // Score 100 if under budget, less if over
          const categoryScore = Math.min(100, (budgetAmount / spent) * 100);
          adherenceSum += categoryScore;
          categoryCount++;
        }
      });
      
      budgetAdherence = categoryCount > 0 ? adherenceSum / categoryCount : 0;
    }
    
    // Calculate health score
    const savingsScore = Math.min(100, savingsRate * 5); // 20% savings = 100 points
    const budgetScore = Math.min(100, budgetAdherence);
    
    // Overall financial health score is average of individual scores
    this.healthScore = Math.round((savingsScore + budgetScore) / 2);
    
    // Generate insights using Gemini if available
    if (isGeminiAvailable()) {
      try {
        this.insights = await geminiService.recommendActions(this.transactions);
      } catch (error) {
        console.error("Error getting AI financial health insights:", error);
        this.insights = fallbackRecommendActions(this.transactions);
      }
    } else {
      this.insights = fallbackRecommendActions(this.transactions);
    }
    
    return {
      score: this.healthScore,
      savingsRate,
      budgetAdherence,
      insights: this.insights
    };
  }
}

export default {
  predictCategory,
  generateInsights,
  generateBudgetRecommendations,
  predictFutureExpenses,
  recommendActions,
  enrichTransactionData
}; 