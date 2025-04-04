// Gemini API service for AI features
import axios from 'axios';

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

class GeminiService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = GEMINI_API_ENDPOINT;
  }

  async generateContent(prompt) {
    try {
      const response = await axios.post(
        `${this.baseURL}?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        }
      );
      
      return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }

  // AI features methods
  async predictCategory(description) {
    const prompt = `Based on this transaction description, categorize it into EXACTLY ONE of these specific categories (don't make up new ones): 
food (restaurants, cafes, dining out)
grocery (supermarkets, food stores)
transport (gas, fuel, uber, public transit)
entertainment (movies, concerts, streaming services)
shopping (retail, clothing, online purchases)
housing (rent, mortgage, home expenses)
utilities (electric, water, internet, phone bills)
healthcare (medical, dental, pharmacy)
education (tuition, books, courses)
personal (haircuts, spa, fitness)
travel (hotels, flights, vacations)
subscription (regular memberships, subscriptions)
other_expense (miscellaneous expenses)
salary (regular employment income)
freelance (contract work, gigs)
gift (presents, donations received)
investment (returns from investments)
refund (returned purchases, reimbursements)
other_income (miscellaneous income)
    
Transaction: "${description}"
    
Return only the category name (a single word from the list above) with no additional text.`;
    
    return this.generateContent(prompt);
  }

  async generateInsights(transactions) {
    const transactionData = JSON.stringify(transactions.slice(0, 50));
    
    const prompt = `Based on these financial transactions, generate 3-5 meaningful insights about spending patterns, income trends, or financial behaviors. For each insight, provide a title, brief description, and optional actionable suggestion.
    
    Transactions: ${transactionData}
    
    Format your response as a JSON array of insights with the following structure:
    [
      {
        "title": "Insight title",
        "description": "Brief description of the insight",
        "action": "Suggested action the user could take"
      }
    ]`;
    
    const response = await this.generateContent(prompt);
    try {
      return JSON.parse(response);
    } catch (e) {
      console.error('Error parsing Gemini API response:', e);
      return [];
    }
  }

  async generateBudgetRecommendations(transactions, existingBudgets) {
    const transactionData = JSON.stringify(transactions.slice(0, 50));
    const budgetData = JSON.stringify(existingBudgets || []);
    
    const prompt = `Based on these financial transactions and existing budgets, recommend 3-5 budget adjustments or new budget categories.
    
    Transactions: ${transactionData}
    Existing Budgets: ${budgetData}
    
    Format your response as a JSON array with the following structure:
    [
      {
        "category": "Category name",
        "currentBudget": number or null if no existing budget,
        "recommendedBudget": number,
        "reasoning": "Brief explanation for this recommendation",
        "icon": "An emoji that represents this category"
      }
    ]`;
    
    const response = await this.generateContent(prompt);
    try {
      return JSON.parse(response);
    } catch (e) {
      console.error('Error parsing Gemini API response:', e);
      return [];
    }
  }

  async predictFutureExpenses(transactions) {
    const transactionData = JSON.stringify(transactions.slice(0, 50));
    
    const prompt = `Based on these financial transactions, predict future expenses for the next month by category.
    
    Transactions: ${transactionData}
    
    Format your response as a JSON object with the following structure:
    {
      "totalPredicted": number,
      "categories": [
        {
          "name": "Category name",
          "amount": number,
          "icon": "An emoji that represents this category"
        }
      ]
    }`;
    
    const response = await this.generateContent(prompt);
    try {
      return JSON.parse(response);
    } catch (e) {
      console.error('Error parsing Gemini API response:', e);
      return { totalPredicted: 0, categories: [] };
    }
  }

  async recommendActions(transactions) {
    const transactionData = JSON.stringify(transactions.slice(0, 50));
    
    const prompt = `Based on these financial transactions, provide 3-5 financial action recommendations.
    
    Transactions: ${transactionData}
    
    Format your response as a JSON array with the following structure:
    [
      {
        "title": "Recommendation title",
        "description": "Description of the recommendation",
        "impact": "High/Medium/Low",
        "timeframe": "Short-term/Medium-term/Long-term"
      }
    ]`;
    
    const response = await this.generateContent(prompt);
    try {
      return JSON.parse(response);
    } catch (e) {
      console.error('Error parsing Gemini API response:', e);
      return [];
    }
  }

  async enrichTransactionData(description) {
    const prompt = `Based on this transaction description, provide merchant information and determine its category. Use EXACTLY one of these specific categories (don't make up new ones): 
food (restaurants, cafes, dining out)
grocery (supermarkets, food stores)
transport (gas, fuel, uber, public transit)
entertainment (movies, concerts, streaming services)
shopping (retail, clothing, online purchases)
housing (rent, mortgage, home expenses)
utilities (electric, water, internet, phone bills)
healthcare (medical, dental, pharmacy)
education (tuition, books, courses)
personal (haircuts, spa, fitness)
travel (hotels, flights, vacations)
subscription (regular memberships, subscriptions)
other_expense (miscellaneous expenses)
salary (regular employment income)
freelance (contract work, gigs)
gift (presents, donations received)
investment (returns from investments)
refund (returned purchases, reimbursements)
other_income (miscellaneous income)

Transaction: "${description}"
    
Format your response as a JSON object with the following structure:
{
  "merchantName": "Detected merchant name",
  "category": "Exactly one of the categories from the list above",
  "icon": "An emoji that represents this category"
}`;
    
    const response = await this.generateContent(prompt);
    try {
      return JSON.parse(response);
    } catch (e) {
      console.error('Error parsing Gemini API response:', e);
      return { merchantName: '', category: 'other_expense', icon: '📋' };
    }
  }
}

export default GeminiService; 