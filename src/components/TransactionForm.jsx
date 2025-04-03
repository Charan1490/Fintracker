import { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { 
  ExclamationTriangleIcon, XMarkIcon, PlusIcon, 
  CheckCircleIcon, ArrowPathIcon, CurrencyDollarIcon,
  DocumentTextIcon, CalendarIcon, TagIcon
} from '@heroicons/react/24/outline';

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
  
  // Refs
  const formRef = useRef(null);
  const amountRef = useRef(null);

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
        return !value.trim() ? 'Title is required' : null;
      case 'amount':
        return !value ? 'Amount is required' : null;
      case 'date':
        return !value ? 'Date is required' : null;
      default:
        return null;
    }
  };

  const titleError = getFieldError('title', title);
  const amountError = getFieldError('amount', amount);
  const dateError = getFieldError('date', date);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 transition-all duration-300 hover:shadow-lg animate-fadeIn">
      {transactionToEdit ? (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <CurrencyDollarIcon className="h-6 w-6 text-blue-600 mr-2" />
            Edit Transaction
          </h3>
          <button 
            onClick={() => onComplete?.()} 
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
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
        <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded animate-fadeIn">
          <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-green-700 rounded animate-fadeIn">
          <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
          <span>{transactionToEdit ? 'Transaction updated successfully!' : 'Transaction added successfully!'}</span>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="transition-all duration-300">
        <div className="space-y-5">
          {/* Transaction Type Selector */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              type="button"
              className={`py-2 px-4 rounded-md border flex justify-center items-center gap-2 transition-all duration-300 ${
                type === 'expense' 
                  ? 'border-red-500 bg-red-50 text-red-700 shadow-sm' 
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setType('expense')}
            >
              <span className="text-lg">💸</span>
              <span>Expense</span>
            </button>
            <button
              type="button"
              className={`py-2 px-4 rounded-md border flex justify-center items-center gap-2 transition-all duration-300 ${
                type === 'income' 
                  ? 'border-green-500 bg-green-50 text-green-700 shadow-sm' 
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setType('income')}
            >
              <span className="text-lg">💰</span>
              <span>Income</span>
            </button>
          </div>

          {/* Title & Amount Group */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DocumentTextIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => handleBlur('title')}
                  className={`w-full pl-10 p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                    titleError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="E.g., Grocery shopping"
                  required
                />
                {titleError && (
                  <p className="mt-1 text-sm text-red-600">{titleError}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                <input
                  ref={amountRef}
                  type="text"
                  value={amount}
                  onChange={(e) => {
                    // Allow only numbers and decimal point
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    setAmount(value);
                  }}
                  onBlur={() => {
                    handleBlur('amount');
                    if (amount && !isNaN(parseFloat(amount))) {
                      setAmount(parseFloat(amount).toFixed(2));
                    }
                  }}
                  onFocus={(e) => {
                    // Remove formatting when input is focused
                    const value = e.target.value.replace(/,/g, '');
                    setAmount(value);
                  }}
                  className={`w-full pl-7 p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                    amountError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                  required
                />
                {amountError && (
                  <p className="mt-1 text-sm text-red-600">{amountError}</p>
                )}
              </div>
            </div>
          </div>

          {/* Date & Category Group */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  onBlur={() => handleBlur('date')}
                  className={`w-full pl-10 p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                    dateError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                />
                {dateError && (
                  <p className="mt-1 text-sm text-red-600">{dateError}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              {!showNewCategory ? (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <TagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none"
                    >
                      {filteredCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.emoji} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(true)}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
                    title="Add new category"
                  >
                    <PlusIcon className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 animate-fadeIn">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="New category name"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(false)}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Notes Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <span>Notes</span>
              <span className="ml-1 text-xs text-gray-500">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              placeholder="Add any additional details here..."
              rows="3"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.01]"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                {transactionToEdit ? 'Updating...' : 'Saving...'}
              </span>
            ) : (
              <span>{transactionToEdit ? 'Update Transaction' : 'Add Transaction'}</span>
            )}
          </button>

          {/* Reset Button (only show when not editing) */}
          {!transactionToEdit && (
            <button
              type="button"
              onClick={resetForm}
              className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Reset Form
            </button>
          )}
        </div>
      </form>
    </div>
  );
}