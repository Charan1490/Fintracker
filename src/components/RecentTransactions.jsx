import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpIcon, ArrowDownIcon, SparklesIcon, StarIcon } from '@heroicons/react/24/outline';
import { enrichTransactionData } from '../utils/ai';

export default function RecentTransactions({ transactions = [] }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 backdrop-blur-sm bg-white/30 rounded-xl p-6 border border-gray-100/50 animate-blur-in">
        <p>No transactions to display.</p>
        <Link 
          to="/transactions" 
          className="mt-4 inline-block text-blue-600 hover:text-blue-800 transition-colors duration-200 font-medium"
        >
          Add your first transaction
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-blur-in">
      {transactions.map((transaction, index) => {
        // Enrich transaction with AI data if not already available
        const enriched = transaction.merchant 
          ? transaction 
          : enrichTransactionData(transaction.title);
        
        const isExpense = transaction.amount < 0;
        const amount = Math.abs(transaction.amount).toFixed(2);
        const date = new Date(transaction.date).toLocaleDateString();
        
        // Find an appropriate emoji icon for the category
        const getCategoryEmoji = (category) => {
          const categoryIcons = {
            food: '🍔', grocery: '🛒', transport: '🚗', entertainment: '🎬',
            shopping: '🛍️', housing: '🏠', utilities: '💡', healthcare: '🏥',
            education: '📚', personal: '💇', travel: '✈️', subscription: '📱',
            other_expense: '📋', salary: '💰', freelance: '💻', gift: '🎁',
            investment: '📈', refund: '↩️', other_income: '💵'
          };
          return categoryIcons[category] || '📊';
        };
        
        const categoryEmoji = getCategoryEmoji(transaction.category);
        
        return (
          <div 
            key={transaction.id} 
            className="p-4 border border-gray-100/70 rounded-xl hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm flex items-center justify-between group animate-slideIn"
            style={{ animationDelay: `${index * 75}ms` }}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-full ${isExpense ? 'bg-gradient-to-br from-red-100 to-red-50' : 'bg-gradient-to-br from-green-100 to-green-50'} animate-float`}>
                {isExpense 
                  ? <ArrowDownIcon className="h-5 w-5 text-red-600" /> 
                  : <ArrowUpIcon className="h-5 w-5 text-green-600" />}
              </div>
              <div>
                <div className="flex items-center">
                  <span className="text-lg mr-2 transform transition-transform duration-300 group-hover:scale-110">{categoryEmoji}</span>
                  <h3 className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors duration-200">
                    {transaction.title}
                  </h3>
                  
                  {enriched.merchant && transaction.title !== enriched.merchant && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100/80 text-indigo-800 backdrop-blur-sm animate-glow">
                      <SparklesIcon className="h-3 w-3 mr-1 animate-pulse" />
                      {enriched.merchant}
                    </span>
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <span>{date}</span>
                  <span className="mx-2">•</span>
                  <span className="capitalize">{transaction.category}</span>
                  
                  {transaction.notes && (
                    <>
                      <span className="mx-2">•</span>
                      <span className="truncate max-w-[150px]">{transaction.notes}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <span className={`font-medium ${isExpense ? 'text-red-600' : 'text-green-600'} text-lg`}>
                {isExpense ? '-' : '+'} ${amount}
              </span>
              
              {/* Special indicator for important transactions */}
              {(transaction.amount > 100 || transaction.amount < -100) && (
                <div className="ml-2 animate-float">
                  <StarIcon className="h-5 w-5 text-yellow-500 animate-pulse-shadow" />
                </div>
              )}
            </div>
          </div>
        );
      })}
      
      <div className="text-center pt-4">
        <Link 
          to="/transactions" 
          className="text-blue-600 hover:text-blue-800 font-medium transition-all duration-300 inline-flex items-center py-2 px-4 rounded-full hover:bg-blue-50/80 backdrop-blur-sm animate-gradient-shift bg-gradient-to-r from-blue-50/30 to-indigo-50/30"
        >
          View all transactions
          <svg className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
} 