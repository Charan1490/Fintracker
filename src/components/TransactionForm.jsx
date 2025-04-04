import { useState, useEffect, useRef, useCallback } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { 
  ExclamationTriangleIcon, XMarkIcon, PlusIcon, 
  CheckCircleIcon, ArrowPathIcon, CurrencyDollarIcon,
  DocumentTextIcon, CalendarIcon, TagIcon,
  SparklesIcon, BeakerIcon, ArrowDownIcon, ArrowUpIcon
} from '@heroicons/react/24/outline';
import { predictCategory, enrichTransactionData, setGeminiApiKey } from '../utils/ai';
import { useDebouncedCallback } from 'use-debounce';

// Expanded categories with emoji icons
const categoryOptions = [
  { id: 'food', name: 'Food & Dining', emoji: '🍔', type: 'expense' },
  { id: 'grocery', name: 'Groceries', emoji: '🛒', type: 'expense' },
  { id: 'transport', name: 'Transport', emoji: '🚗', type: 'expense' },
  { id: 'entertainment', name: 'Entertainment', emoji: '🎬', type: 'expense' },
  { id: 'shopping', name: 'Shopping', emoji: '🛍️', type: 'expense' },
  { id: 'housing', name: 'Housing', emoji: '🏠', type: 'expense' },
  { id: 'utilities', name: 'Utilities', emoji: '💡', type: 'expense' },
  { id: 'healthcare', name: 'Healthcare', emoji: '🏥', type: 'expense' },
  { id: 'education', name: 'Education', emoji: '📚', type: 'expense' },
  { id: 'personal', name: 'Personal Care', emoji: '💇', type: 'expense' },
  { id: 'travel', name: 'Travel', emoji: '✈️', type: 'expense' },
  { id: 'subscription', name: 'Subscriptions', emoji: '📱', type: 'expense' },
  { id: 'other_expense', name: 'Other Expenses', emoji: '📋', type: 'expense' },
  { id: 'salary', name: 'Salary', emoji: '💰', type: 'income' },
  { id: 'freelance', name: 'Freelance', emoji: '💻', type: 'income' },
  { id: 'gift', name: 'Gifts', emoji: '🎁', type: 'income' },
  { id: 'investment', name: 'Investments', emoji: '📈', type: 'income' },
  { id: 'refund', name: 'Refunds', emoji: '↩️', type: 'income' },
  { id: 'other_income', name: 'Other Income', emoji: '💵', type: 'income' },
];

export default function TransactionForm({ transactionToEdit, onComplete }) {
  // Form fields
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState(categoryOptions[0].id);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  
  // UI states
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState({});
  const [aiProcessing, setAiProcessing] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [hasGeminiApiKey, setHasGeminiApiKey] = useState(false);
  
  // Refs
  const formRef = useRef(null);
  const amountRef = useRef(null);
  const titleRef = useRef(null);

  // Filter categories based on transaction type
  const filteredCategories = categoryOptions.filter(
    cat => cat.type === type || cat.type === 'both'
  );

  useEffect(() => {
    if (transactionToEdit) {
      setTitle(transactionToEdit.title);
      setAmount(Math.abs(transactionToEdit.amount));
      setType(transactionToEdit.amount > 0 ? 'income' : 'expense');
      setCategory(transactionToEdit.category);
      setDate(transactionToEdit.date.split('T')[0]);
      setNotes(transactionToEdit.notes || '');
    } else {
      // Reset form when not editing
      resetForm();
    }
  }, [transactionToEdit]);

  // Format currency as user types
  useEffect(() => {
    if (amount && !isNaN(amount) && document.activeElement !== amountRef.current) {
      const formatted = parseFloat(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      setAmount(formatted);
    }
  }, [amount]);

  // Check for Gemini API key
  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
      setGeminiApiKey(savedApiKey);
      setHasGeminiApiKey(true);
    }
  }, []);

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setType('expense');
    setCategory(categoryOptions[0].id);
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setTouched({});
    formRef.current?.reset();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuccess(false);

    // Validate all fields
    const touchedAll = {
      title: true,
      amount: true,
      date: true,
      category: true
    };
    setTouched(touchedAll);

    if (!title.trim() || !amount || !date) {
      setError('Please fill all required fields');
      setLoading(false);
      // Animate the form to indicate error
      formRef.current.classList.add('animate-shake');
      setTimeout(() => {
        formRef.current.classList.remove('animate-shake');
      }, 500);
      return;
    }

    try {
      // Clean amount value from formatting
      const cleanAmount = parseFloat(amount.toString().replace(/,/g, ''));
      
      const transactionData = {
        title: title.trim(),
        amount: type === 'income' ? +cleanAmount : -cleanAmount,
        category,
        date: new Date(date).toISOString(),
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
        // Add merchant data if available from AI detection
        ...(aiSuggestion && aiSuggestion.merchantName ? { merchant: aiSuggestion.merchantName } : {})
      };

      if (transactionToEdit) {
        await updateDoc(doc(db, 'transactions', auth.currentUser.uid, 'userTransactions', transactionToEdit.id), transactionData);
      } else {
        await addDoc(collection(db, 'transactions', auth.currentUser.uid, 'userTransactions'), transactionData);
      }

      // Show success message
      setSuccess(true);
      
      // Reset form after success (if not editing)
      if (!transactionToEdit) {
        resetForm();
      } else {
        onComplete?.();
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError('Failed to save transaction');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim().length < 3) {
      setError('Category name must be at least 3 characters');
      return;
    }
    
    // In a real app, you would save this to Firebase
    // For now, we'll just close the form
    setShowNewCategory(false);
    setNewCategory('');
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const getFieldError = (field, value) => {
    if (!touched[field]) return null;
    
    switch(field) {
      case 'title':
        return !value?.trim() ? 'Title is required' : null;
      case 'amount':
        return !value ? 'Amount is required' : null;
      case 'date':
        return !value ? 'Date is required' : null;
      case 'category':
        return !value ? 'Category is required' : null;
      default:
        return null;
    }
  };

  // AI-powered features
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    // Only trigger AI categorization if we have Gemini API key
    if (newTitle.length > 5 && hasGeminiApiKey) {
      debouncedDescriptionChange(newTitle);
    }
  };

  const handleAIDetect = async () => {
    if (!title.trim()) {
      setError('Please enter a transaction title first');
      return;
    }
    
    setAiProcessing(true);
    
    try {
      // Use Gemini AI service to analyze transaction title
      const enrichedData = await enrichTransactionData(title);
      setAiSuggestion(enrichedData);
      
      // Auto-fill category if we have a suggestion
      if (enrichedData.category) {
        // Find the closest matching category from our available options
        let matchingCategory = categoryOptions.find(cat => 
          cat.id === enrichedData.category.toLowerCase()
        );
        
        // If no exact match, try to find a partial match
        if (!matchingCategory) {
          matchingCategory = categoryOptions.find(cat => 
            cat.id.includes(enrichedData.category.toLowerCase()) || 
            enrichedData.category.toLowerCase().includes(cat.id) ||
            cat.name.toLowerCase().includes(enrichedData.category.toLowerCase()) ||
            enrichedData.category.toLowerCase().includes(cat.name.toLowerCase())
          );
        }
        
        // For healthcare-related terms
        if (!matchingCategory && 
            (enrichedData.category.toLowerCase().includes('health') || 
             enrichedData.category.toLowerCase().includes('medic') || 
             enrichedData.category.toLowerCase().includes('doctor') ||
             enrichedData.category.toLowerCase().includes('hospital') ||
             enrichedData.category.toLowerCase().includes('pharmacy') ||
             enrichedData.category.toLowerCase().includes('dental'))) {
          matchingCategory = categoryOptions.find(cat => cat.id === 'healthcare');
        }
        
        // For food/restaurant-related terms
        if (!matchingCategory && 
            (enrichedData.category.toLowerCase().includes('restaurant') || 
             enrichedData.category.toLowerCase().includes('cafe') || 
             enrichedData.category.toLowerCase().includes('dining'))) {
          matchingCategory = categoryOptions.find(cat => cat.id === 'food');
        }
        
        // Default fallback
        if (!matchingCategory) {
          if (enrichedData.category.toLowerCase().includes('income') || 
              enrichedData.category.toLowerCase().includes('salary') ||
              enrichedData.category.toLowerCase().includes('deposit')) {
            matchingCategory = categoryOptions.find(cat => cat.id === 'other_income');
          } else {
            matchingCategory = categoryOptions.find(cat => cat.id === 'other_expense');
          }
        }
        
        if (matchingCategory) {
          setCategory(matchingCategory.id);
          // Also set the correct transaction type based on the category
          setType(matchingCategory.type || 'expense');
        }
      }
    } catch (err) {
      console.error('Gemini AI detection error:', err);
    } finally {
      setAiProcessing(false);
    }
  };

  const titleError = getFieldError('title', title);
  const amountError = getFieldError('amount', amount);
  const dateError = getFieldError('date', date);
  const categoryError = getFieldError('category', category);

  // Debounced handler for AI-based suggestions using Gemini
  const debouncedDescriptionChange = useDebouncedCallback(
    async (description) => {
      if (description.length > 5) {
        setIsAiProcessing(true);
        try {
          // Use Gemini AI service for enriching transaction data
          const enrichedData = await enrichTransactionData(description);
          setAiSuggestion(enrichedData);
          
          // Auto-fill category if we have a suggestion
          if (enrichedData.category) {
            // Find the closest matching category from our available options
            let matchingCategory = categoryOptions.find(cat => 
              cat.id === enrichedData.category.toLowerCase()
            );
            
            // If no exact match, try to find a partial match
            if (!matchingCategory) {
              matchingCategory = categoryOptions.find(cat => 
                cat.id.includes(enrichedData.category.toLowerCase()) || 
                enrichedData.category.toLowerCase().includes(cat.id) ||
                cat.name.toLowerCase().includes(enrichedData.category.toLowerCase()) ||
                enrichedData.category.toLowerCase().includes(cat.name.toLowerCase())
              );
            }
            
            // For healthcare-related terms
            if (!matchingCategory && 
                (enrichedData.category.toLowerCase().includes('health') || 
                 enrichedData.category.toLowerCase().includes('medic') || 
                 enrichedData.category.toLowerCase().includes('doctor') ||
                 enrichedData.category.toLowerCase().includes('hospital') ||
                 enrichedData.category.toLowerCase().includes('pharmacy') ||
                 enrichedData.category.toLowerCase().includes('dental'))) {
              matchingCategory = categoryOptions.find(cat => cat.id === 'healthcare');
            }
            
            // For food/restaurant-related terms
            if (!matchingCategory && 
                (enrichedData.category.toLowerCase().includes('restaurant') || 
                 enrichedData.category.toLowerCase().includes('cafe') || 
                 enrichedData.category.toLowerCase().includes('dining'))) {
              matchingCategory = categoryOptions.find(cat => cat.id === 'food');
            }
            
            // Default fallback
            if (!matchingCategory) {
              if (enrichedData.category.toLowerCase().includes('income') || 
                  enrichedData.category.toLowerCase().includes('salary') ||
                  enrichedData.category.toLowerCase().includes('deposit')) {
                matchingCategory = categoryOptions.find(cat => cat.id === 'other_income');
              } else {
                matchingCategory = categoryOptions.find(cat => cat.id === 'other_expense');
              }
            }
            
            if (matchingCategory) {
              setCategory(matchingCategory.id);
              // Also set the correct transaction type based on the category
              setType(matchingCategory.type || 'expense');
            }
          }
        } catch (error) {
          console.error("Error using Gemini AI service:", error);
        } finally {
          setIsAiProcessing(false);
        }
      }
    },
    500 // 500ms delay
  );

  return (
    <div className="bg-gradient-to-br from-white to-blue-50 backdrop-blur-lg p-6 rounded-xl shadow-lg border border-blue-100/40 transition-all duration-300 hover:shadow-blue-200/50 animate-fadeIn">
      {transactionToEdit ? (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <CurrencyDollarIcon className="h-6 w-6 text-blue-600 mr-2" />
            Edit Transaction
          </h3>
          <button 
            onClick={() => onComplete?.()} 
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100/70 transition-colors duration-200"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center">
          <CurrencyDollarIcon className="h-6 w-6 text-blue-600 mr-2" />
          Add Transaction
        </h3>
      )}

      {error && (
        <div className="flex items-center gap-3 mb-4 p-4 bg-gradient-to-r from-red-50 to-red-100/70 backdrop-blur-sm border-l-4 border-red-500 text-red-700 rounded-lg animate-fadeIn shadow-sm">
          <div className="bg-red-100 p-2 rounded-full">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
          </div>
          <span className="font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 mb-4 p-4 bg-gradient-to-r from-green-50 to-green-100/70 backdrop-blur-sm border-l-4 border-green-500 text-green-700 rounded-lg animate-fadeIn shadow-sm">
          <div className="bg-green-100 p-2 rounded-full">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
          </div>
          <span className="font-medium">{transactionToEdit ? 'Transaction updated successfully!' : 'Transaction added successfully!'}</span>
        </div>
      )}
      
      {!hasGeminiApiKey && (
        <div className="flex items-center gap-3 mb-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50/70 backdrop-blur-sm border-l-4 border-indigo-500 text-indigo-700 rounded-lg animate-fadeIn shadow-sm">
          <div className="bg-indigo-100 p-2 rounded-full">
            <SparklesIcon className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-medium">Enhanced AI features available</p>
            <p className="text-sm">Set up your <a href="/settings" className="underline hover:text-indigo-800">Gemini API key</a> for improved category detection and AI suggestions.</p>
          </div>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="p-6 rounded-xl border border-blue-200/30 bg-white/80 backdrop-filter backdrop-blur-sm shadow-lg transition-all duration-300">
        <div className="space-y-5">
          {/* Toggle Buttons */}
          <div className="flex mb-4 p-1 bg-gray-100/70 backdrop-blur-sm rounded-lg">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-2.5 flex justify-center items-center rounded-lg transition-all duration-300 ${
                type === 'expense' 
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md' 
                  : 'bg-transparent text-gray-700 hover:bg-gray-200/50'
              }`}
            >
              <ArrowDownIcon className="h-4 w-4 mr-2" />
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-2.5 flex justify-center items-center rounded-lg transition-all duration-300 ${
                type === 'income' 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md' 
                  : 'bg-transparent text-gray-700 hover:bg-gray-200/50'
              }`}
            >
              <ArrowUpIcon className="h-4 w-4 mr-2" />
              Income
            </button>
          </div>

          {/* Description / Title Field */}
          <div className="relative w-full mb-4 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DocumentTextIcon className="h-5 w-5 text-blue-500" />
            </div>
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              onBlur={() => handleBlur('title')}
              ref={titleRef}
              className={`block w-full pl-10 pr-16 py-3 border ${
                getFieldError('title', title) ? 'border-red-300 bg-red-50/50' : 'border-gray-300'
              } bg-white/70 backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 group-hover:shadow-md`}
              placeholder="Transaction title or description"
            />
            <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
              {aiProcessing ? (
                <div className="rounded-md px-3 py-1.5 text-sm bg-indigo-100/70 text-indigo-600">
                  <div className="flex items-center">
                    <ArrowPathIcon className="h-4 w-4 animate-spin mr-1" />
                    <span className="text-xs">Processing</span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAIDetect}
                  className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-xs font-medium rounded-lg text-blue-700 bg-blue-50/70 hover:bg-blue-100/80 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  title={hasGeminiApiKey ? "Detect using Gemini AI" : "Set up your Gemini API key in Settings"}
                  disabled={!title || aiProcessing}
                >
                  {hasGeminiApiKey ? (
                    <>
                      <SparklesIcon className="h-3.5 w-3.5 mr-1" />
                      <span>Gemini</span>
                    </>
                  ) : 'AI'}
                </button>
              )}
            </div>
          </div>
          
          {/* Show AI suggestion banner */}
          {aiSuggestion && aiSuggestion.category && (
            <div className="flex items-center gap-3 mb-5 p-4 bg-gradient-to-r from-indigo-50 to-purple-50/70 backdrop-blur-sm border-l-4 border-indigo-500 text-indigo-700 rounded-lg animate-fadeIn shadow-sm">
              <div className="bg-indigo-100 p-2 rounded-full">
                <SparklesIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-medium text-indigo-800">Gemini AI Suggestion</p>
                <div className="flex items-center mt-1">
                  <span className="text-lg mr-2">{aiSuggestion.icon}</span>
                  <p className="text-sm">
                    <span className="opacity-75">Based on</span> 
                    <span className="font-semibold mx-1">"{title}"</span>
                    <span className="opacity-75">categorized as</span>
                    <span className="font-semibold ml-1">{categoryOptions.find(c => c.id === aiSuggestion.category)?.name || aiSuggestion.category}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Amount Field */}
          <div className="relative group">
            <label className="block text-sm font-medium text-gray-700 mb-1 transition-all group-hover:text-blue-600">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-blue-100/70 p-1.5 rounded-md">
                <CurrencyDollarIcon className="h-5 w-5 text-blue-600" />
              </div>
              <input
                ref={amountRef}
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onBlur={() => handleBlur('amount')}
                className={`w-full pl-12 p-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${
                  amountError ? 'border-red-300 bg-red-50/50' : 'border-gray-300 bg-white/70 backdrop-blur-sm'
                } group-hover:shadow-md`}
                placeholder="0.00"
                required
              />
            </div>
            {amountError && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                {amountError}
              </p>
            )}
          </div>

          {/* Category Field */}
          <div className="relative group">
            <label className="block text-sm font-medium text-gray-700 mb-1 transition-all group-hover:text-blue-600">
              Category <span className="text-red-500">*</span>
            </label>
            {!showNewCategory ? (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-blue-100/70 p-1.5 rounded-md">
                    <TagIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full pl-12 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white/70 backdrop-blur-sm transition-all duration-300 group-hover:shadow-md"
                  >
                    <option value="">Select category</option>
                    {filteredCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.emoji} {cat.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none">
                    <ArrowDownIcon className="h-4 w-4 text-gray-500" />
                  </div>
                  {isAiProcessing && (
                    <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                      <div className="h-4 w-4 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
                    </div>
                  )}
                  {aiSuggestion && aiSuggestion.icon && (
                    <div className="absolute right-10 top-1/2 transform -translate-y-1/2 flex items-center">
                      <span className="text-indigo-600 text-lg" title="AI suggested category">
                        {aiSuggestion.icon}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewCategory(true)}
                  className="p-3 border border-gray-300 rounded-lg hover:bg-blue-50/70 hover:border-blue-300 transition-all duration-300 text-blue-600"
                  title="Add new category"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-blue-100/70 p-1.5 rounded-md">
                    <TagIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full pl-12 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white/70 backdrop-blur-sm transition-all duration-300 group-hover:shadow-md"
                    placeholder="New category name"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewCategory(false)}
                  className="p-3 border border-red-300 rounded-lg hover:bg-red-50/70 text-red-600 transition-all duration-300"
                  title="Cancel new category"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            )}
            {categoryError && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                {categoryError}
              </p>
            )}
          </div>

          {/* Date Field */}
          <div className="relative group">
            <label className="block text-sm font-medium text-gray-700 mb-1 transition-all group-hover:text-blue-600">
              Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-blue-100/70 p-1.5 rounded-md">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onBlur={() => handleBlur('date')}
                className={`w-full pl-12 py-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${
                  dateError ? 'border-red-300 bg-red-50/50' : 'border-gray-300 bg-white/70 backdrop-blur-sm'
                } group-hover:shadow-md`}
                required
              />
            </div>
            {dateError && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                {dateError}
              </p>
            )}
          </div>

          {/* Notes Field */}
          <div className="relative group">
            <label className="block text-sm font-medium text-gray-700 mb-1 transition-all group-hover:text-blue-600">
              Notes <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <div className="relative">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 min-h-[100px] bg-white/70 backdrop-blur-sm transition-all duration-300 group-hover:shadow-md"
                placeholder="Add any details or notes about this transaction..."
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                {notes.length > 0 ? `${notes.length} characters` : 'Add notes (optional)'}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between pt-4 mt-4 border-t border-gray-200/70">
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 shadow-sm hover:shadow"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  {transactionToEdit ? 'Update' : 'Add'} Transaction
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}