export default function BudgetProgress({ category, spent, budget }) {
    const percentage = (spent / budget) * 100;
    const remaining = budget - spent;
    const isOver = percentage > 100;
  
    return (
      <div className="bg-white p-4 rounded shadow">
        <div className="flex justify-between mb-2">
          <h4 className="font-medium">{category}</h4>
          <span className={`${isOver ? 'text-red-600' : 'text-gray-600'}`}>
            ${spent.toFixed(2)} / ${budget.toFixed(2)}
          </span>
        </div>
        
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${isOver ? 'bg-red-500' : 'bg-blue-500'}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
  
        <div className="mt-2 text-sm">
          {isOver ? (
            <span className="text-red-600">
              Over budget by ${Math.abs(remaining).toFixed(2)}
            </span>
          ) : (
            <span className="text-green-600">
              ${remaining.toFixed(2)} remaining
            </span>
          )}
        </div>
      </div>
    );
  }