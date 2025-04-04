import React from 'react';
import { Link } from 'react-router-dom';
import { SparklesIcon, LightBulbIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const GeminiApiExplainer = () => {
  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 mb-8 border border-indigo-100 animate-fadeIn">
      <div className="flex items-center mb-4">
        <SparklesIcon className="h-6 w-6 text-indigo-600 mr-2" />
        <h2 className="text-xl font-bold text-gray-900">Enhance Your Finance Tracker with Gemini AI</h2>
      </div>
      
      <p className="text-gray-700 mb-4">
        Unlock powerful AI features in your Finance Tracker by adding a Google Gemini API key. Get personalized 
        financial insights, smart categorization, and budget recommendations powered by advanced AI.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-md shadow-sm hover:shadow-md transition-all duration-200">
          <div className="font-medium text-indigo-900 mb-1 flex items-center">
            <span className="text-lg mr-2">🏷️</span>
            Smart Categorization
          </div>
          <p className="text-sm text-gray-600">Automatically categorize your transactions based on description.</p>
        </div>
        
        <div className="bg-white p-4 rounded-md shadow-sm hover:shadow-md transition-all duration-200">
          <div className="font-medium text-indigo-900 mb-1 flex items-center">
            <span className="text-lg mr-2">💡</span>
            Financial Insights
          </div>
          <p className="text-sm text-gray-600">Get personalized insights about your spending patterns.</p>
        </div>
        
        <div className="bg-white p-4 rounded-md shadow-sm hover:shadow-md transition-all duration-200">
          <div className="font-medium text-indigo-900 mb-1 flex items-center">
            <span className="text-lg mr-2">📊</span>
            Budget Recommendations
          </div>
          <p className="text-sm text-gray-600">Receive tailored budget suggestions based on your habits.</p>
        </div>
      </div>
      
      {/* Demo view of AI-powered insights */}
      <div className="mb-6 bg-white rounded-lg p-4 border border-indigo-100 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
          <LightBulbIcon className="h-5 w-5 text-yellow-500 mr-2" />
          Example AI Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-indigo-50 p-3 rounded-md">
            <h4 className="font-medium text-indigo-900 mb-1">High Food & Dining Spending</h4>
            <p className="text-sm text-gray-700">Your spending on restaurants is 35% higher than last month.</p>
            <p className="text-xs mt-2 text-indigo-700 font-medium">Try meal prepping at home to reduce costs.</p>
          </div>
          <div className="bg-indigo-50 p-3 rounded-md">
            <h4 className="font-medium text-indigo-900 mb-1">Savings Opportunity</h4>
            <p className="text-sm text-gray-700">You could save $120/month by reducing subscription services.</p>
            <p className="text-xs mt-2 text-indigo-700 font-medium">Review your recurring payments and cancel unused services.</p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center">
        <Link 
          to="/settings" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Set Up Gemini API Key
          <ArrowRightIcon className="ml-2 h-4 w-4" />
        </Link>
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>Your API key is stored locally on your device and never shared with our servers.</p>
        <p className="mt-1">The app functions normally without AI features, but Gemini integration enhances your experience.</p>
      </div>
    </div>
  );
};

export default GeminiApiExplainer; 