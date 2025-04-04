export default function BudgetProgress({ category, spent, budget }) {
    const percentage = (spent / budget) * 100;
    const remaining = budget - spent;
    const isOver = percentage > 100;
  
    return (
      <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-gray-100/50 hover:shadow-md transition-all duration-300 group">
        <div className="flex justify-between mb-2 items-center">
          <h4 className="font-medium text-gray-800 group-hover:text-gray-900 transition-colors duration-300">{category}</h4>
          <span className={`${isOver ? 'text-red-600' : 'text-gray-600'} font-medium`}>
            ${spent.toFixed(2)} / ${budget.toFixed(2)}
          </span>
        </div>
        
        <div className="h-3 bg-gray-200/60 rounded-full overflow-hidden">
          <div
            className={`h-full ${isOver 
              ? 'bg-gradient-to-r from-red-400 to-red-500 animate-gradient-shift' 
              : 'bg-gradient-to-r from-blue-400 to-blue-500 animate-gradient-shift'}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
  
        <div className="mt-3 text-sm">
          {isOver ? (
            <span className="text-red-600 bg-red-50/70 px-2 py-1 rounded-lg inline-block animate-glow">
              Over budget by ${Math.abs(remaining).toFixed(2)}
            </span>
          ) : (
            <span className="text-green-600 bg-green-50/70 px-2 py-1 rounded-lg inline-block animate-glow">
              ${remaining.toFixed(2)} remaining
            </span>
          )}
        </div>
      </div>
    );
  }