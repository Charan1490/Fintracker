import React, { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import TransactionForm from '../components/TransactionForm';
import { 
  PencilIcon, TrashIcon, CurrencyDollarIcon, FunnelIcon, 
  ArrowDownIcon, ArrowUpIcon, CalendarIcon, MagnifyingGlassIcon, 
  ChevronDownIcon, XCircleIcon, InformationCircleIcon
} from '@heroicons/react/24/outline';

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

// Memoized Transaction Table Row component
const TransactionRow = React.memo(({ transaction, onEdit, onDelete, index }) => {
  const [isHovering, setIsHovering] = useState(false);
  
  return (
    <tr 
      key={transaction.id} 
      className={`hover:bg-gray-50 transition-colors duration-200 animate-fadeIn`}
      style={{ animationDelay: `${index * 50}ms` }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
        <div className="flex items-center">
          <CalendarIcon className="h-4 w-4 text-gray-400 mr-1.5" />
          {transaction.date}
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{transaction.title}</div>
        {transaction.notes && (
          <div className="text-xs text-gray-500 truncate max-w-xs">{transaction.notes}</div>
        )}
      </td>
      <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
        <div className="flex items-center">
          {transaction.amount > 0 ? 
            <ArrowUpIcon className={`h-4 w-4 mr-1 ${isHovering ? 'animate-float' : ''}`} /> : 
            <ArrowDownIcon className={`h-4 w-4 mr-1 ${isHovering ? 'animate-float' : ''}`} />
          }
          ${Math.abs(transaction.amount).toFixed(2)}
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
        <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full bg-gray-100 transition-all duration-200 ${isHovering ? 'bg-blue-50' : ''}`}>
          {transaction.category && categoryMap[transaction.category] ? 
            <span 
              className={`transform transition-transform ${isHovering ? 'scale-110' : ''}`}
              style={{ display: 'inline-block' }}
            >
              {categoryMap[transaction.category].emoji}
            </span> : ''}
          <span className="ml-1">
            {transaction.category && categoryMap[transaction.category] ? 
              categoryMap[transaction.category].name : transaction.category}
          </span>
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
        <div className={`transition-opacity duration-200 ${isHovering ? 'opacity-100' : 'opacity-70'}`}>
          <button
            onClick={() => onEdit(transaction)}
            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors duration-200"
            aria-label="Edit"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(transaction.id)}
            className="text-red-600 hover:text-red-800 p-1 ml-2 rounded hover:bg-red-50 transition-colors duration-200"
            aria-label="Delete"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
});

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [editTransaction, setEditTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'income', 'expense'
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({ 
    start: '', 
    end: new Date().toISOString().split('T')[0]
  });
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [sortOption, setSortOption] = useState('date-desc'); // 'date-desc', 'date-asc', 'amount-desc', 'amount-asc'
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState(''); // 'success', 'error'

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = onSnapshot(
      collection(db, 'transactions', auth.currentUser.uid, 'userTransactions'),
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: new Date(doc.data().date).toLocaleDateString(),
          rawDate: doc.data().date // Keep raw date for filtering
        }));
        setTransactions(docs);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore error:', err);
        setLoading(false);
        showNotification('Error loading transactions', 'error');
      }
    );

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    
    try {
      await deleteDoc(doc(db, 'transactions', auth.currentUser.uid, 'userTransactions', id));
      showNotification('Transaction deleted successfully', 'success');
    } catch (err) {
      console.error('Delete failed:', err);
      showNotification('Failed to delete transaction', 'error');
    }
  };

  const showNotification = (message, type) => {
    setNotificationMessage(message);
    setNotificationType(type);
    
    // Clear notification after 3 seconds
    setTimeout(() => {
      setNotificationMessage('');
      setNotificationType('');
    }, 3000);
  };

  const applyFilters = () => {
    let filtered = [...transactions];
    
    // Type filter
    if (filter === 'income') filtered = filtered.filter(t => t.amount > 0);
    if (filter === 'expense') filtered = filtered.filter(t => t.amount < 0);
    
    // Text search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchLower) || 
        t.category.toLowerCase().includes(searchLower) ||
        (t.notes && t.notes.toLowerCase().includes(searchLower))
      );
    }
    
    // Date range filter
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      filtered = filtered.filter(t => new Date(t.rawDate) >= startDate);
    }
    
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59); // End of the selected day
      filtered = filtered.filter(t => new Date(t.rawDate) <= endDate);
    }
    
    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }
    
    // Sorting
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'date-desc':
          return new Date(b.rawDate) - new Date(a.rawDate);
        case 'date-asc':
          return new Date(a.rawDate) - new Date(b.rawDate);
        case 'amount-desc':
          return Math.abs(b.amount) - Math.abs(a.amount);
        case 'amount-asc':
          return Math.abs(a.amount) - Math.abs(b.amount);
        default:
          return new Date(b.rawDate) - new Date(a.rawDate);
      }
    });
    
    return filtered;
  };

  const filteredTransactions = useMemo(() => applyFilters(), [
    transactions, filter, search, dateRange, categoryFilter, sortOption
  ]);
  
  const clearFilters = () => {
    setFilter('all');
    setSearch('');
    setDateRange({ start: '', end: new Date().toISOString().split('T')[0] });
    setCategoryFilter('all');
    setSortOption('date-desc');
    setIsAdvancedFilterOpen(false);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filter !== 'all') count++;
    if (search) count++;
    if (dateRange.start) count++;
    if (categoryFilter !== 'all') count++;
    if (sortOption !== 'date-desc') count++;
    return count;
  };
  
  const activeFilterCount = getActiveFilterCount();

  // Get stats for the filtered transactions
  const getStats = useMemo(() => {
    if (!filteredTransactions.length) return { income: 0, expenses: 0, balance: 0 };
    
    const income = filteredTransactions.reduce((sum, t) => 
      t.amount > 0 ? sum + t.amount : sum, 0);
    const expenses = filteredTransactions.reduce((sum, t) => 
      t.amount < 0 ? sum + Math.abs(t.amount) : sum, 0);
    
    return {
      income,
      expenses,
      balance: income - expenses,
      count: filteredTransactions.length
    };
  }, [filteredTransactions]);

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-12">
        <div className="animate-pulse">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-center mt-4 text-gray-600">Loading your transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-12 animate-fadeIn">
      {/* Notification */}
      {notificationMessage && (
        <div 
          className={`fixed top-4 right-4 px-6 py-3 rounded-md shadow-lg animate-slideInRight z-50 ${
            notificationType === 'success' ? 'bg-green-100 border-l-4 border-green-500 text-green-700' : 
            'bg-red-100 border-l-4 border-red-500 text-red-700'
          }`}
        >
          {notificationMessage}
        </div>
      )}
    
      <header className="mb-8 animate-slideInRight">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Transactions</h1>
        <p className="mt-2 text-gray-600">Manage and track your income and expenses</p>
      </header>

      {/* Filter stats summary */}
      {activeFilterCount > 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md mb-6 animate-fadeIn">
          <div className="flex items-start">
            <InformationCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-800">Filtered Results</h3>
              <div className="mt-1 text-sm text-blue-700">
                <p>Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}</p>
                <div className="flex flex-wrap gap-4 mt-2">
                  <div className="flex items-center">
                    <ArrowUpIcon className="h-4 w-4 text-green-600 mr-1" />
                    <span>Income: ${getStats.income.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center">
                    <ArrowDownIcon className="h-4 w-4 text-red-600 mr-1" />
                    <span>Expenses: ${getStats.expenses.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className={getStats.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                      Balance: ${getStats.balance.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transaction Form */}
        <div className="lg:col-span-1 animate-slideInUp" style={{ animationDelay: '100ms' }}>
          <TransactionForm 
            transactionToEdit={editTransaction}
            onComplete={() => setEditTransaction(null)}
          />
        </div>

        {/* Transactions List */}
        <div className="lg:col-span-2 animate-slideInUp" style={{ animationDelay: '200ms' }}>
          <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg">
            {/* Search and Basic Filters */}
            <div className="p-4 sm:p-6 border-b border-gray-100">
              <div className="flex flex-col space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search transactions..."
                    className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <XCircleIcon className="h-5 w-5 text-gray-400 hover:text-gray-500 transition-colors duration-200" />
                    </button>
                  )}
                </div>
                
                {/* Filter Buttons */}
                <div className="flex flex-wrap justify-between items-center">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setFilter('all')}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${filter === 'all' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      All
                    </button>
                    <button 
                      onClick={() => setFilter('income')}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${filter === 'income' ? 'bg-green-100 text-green-700 shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      <ArrowUpIcon className="h-4 w-4 mr-1" />
                      Income
                    </button>
                    <button 
                      onClick={() => setFilter('expense')}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${filter === 'expense' ? 'bg-red-100 text-red-700 shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      <ArrowDownIcon className="h-4 w-4 mr-1" />
                      Expenses
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
                    className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 relative transition-all duration-200"
                  >
                    <FunnelIcon className="h-4 w-4 mr-1" />
                    <span>Filters</span>
                    <ChevronDownIcon className={`h-4 w-4 ml-1 transform transition-transform duration-300 ${isAdvancedFilterOpen ? 'rotate-180' : ''}`} />
                    {activeFilterCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center animate-pulse-shadow">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </div>
                
                {/* Advanced Filters */}
                <div 
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isAdvancedFilterOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-md mt-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                      <div className="flex space-x-2 items-center">
                        <input
                          type="date"
                          value={dateRange.start}
                          onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                          className="block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="date"
                          value={dateRange.end}
                          onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                          className="block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      >
                        <option value="all">All Categories</option>
                        {Object.entries(categoryMap).map(([id, { name, emoji }]) => (
                          <option key={id} value={id}>{emoji} {name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                      <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        className="block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      >
                        <option value="date-desc">Date (Newest first)</option>
                        <option value="date-asc">Date (Oldest first)</option>
                        <option value="amount-desc">Amount (Highest first)</option>
                        <option value="amount-asc">Amount (Lowest first)</option>
                      </select>
                    </div>
                    
                    <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
                      <button
                        onClick={clearFilters}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                      >
                        Clear all filters
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {filteredTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredTransactions.map((transaction, index) => (
                      <TransactionRow 
                        key={transaction.id}
                        transaction={transaction}
                        onEdit={setEditTransaction}
                        onDelete={handleDelete}
                        index={index}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <FunnelIcon className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-float" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No transactions found</h3>
                <p className="text-gray-500 mb-4">
                  {activeFilterCount > 0 
                    ? 'Try adjusting your filters or search criteria' 
                    : 'Start by adding your first transaction.'}
                </p>
                {activeFilterCount > 0 && (
                  <button 
                    onClick={clearFilters} 
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 hover:shadow"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}