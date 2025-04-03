import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const categories = ['Food', 'Transport', 'Housing', 'Utilities'];

export default function BudgetForm({ category, currentBudget, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentBudget) setAmount(currentBudget.toString());
  }, [currentBudget]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!amount || isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    
    try {
      await setDoc(doc(db, 'budgets', auth.currentUser.uid, 'userBudgets', category), {
        amount: Number(amount),
        category,
        createdAt: new Date().toISOString()
      });
      onSuccess?.();
    } catch (err) {
      setError('Failed to save budget');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="text-lg font-bold mb-2">{category} Budget</h3>
      
      {error && (
        <div className="flex items-center gap-2 mb-4 p-2 bg-red-100 text-red-700 rounded">
          <ExclamationTriangleIcon className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Monthly budget"
          className="flex-1 p-2 border rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Saving...' : currentBudget ? 'Update' : 'Set'}
        </button>
      </form>
    </div>
  );
}