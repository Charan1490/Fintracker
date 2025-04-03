# Personal Finance Tracker

A comprehensive finance management application built with React and Firebase that helps users track their income, expenses, and budget.

![Finance Tracker Screenshot](screenshot.png)

## Features

- **User Authentication**: Secure login and registration through Firebase Authentication
- **Dashboard**: Visual overview of your financial status with charts and insights
- **Transactions**: Track income and expenses with detailed categorization
- **Budget Management**: Set and monitor budgets by category
- **Responsive Design**: Optimized for both desktop and mobile experiences
- **Real-time Updates**: Changes sync immediately across devices
- **Data Filtering**: Filter and search transactions by date, category, and amount
- **Dark/Light Mode**: Choose your preferred theme

## Tech Stack

- **Frontend**: React, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore Database)
- **Charting**: Recharts
- **Icons**: Heroicons
- **Animations**: Custom CSS animations

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/finance-tracker.git
   cd finance-tracker
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn
   ```

3. Create a `.env` file in the root directory with your Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

4. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## Deployment

### Vercel

1. Fork this repository to your GitHub account
2. Connect your GitHub account to Vercel
3. Create a new project in Vercel and select the repository
4. Add environment variables with your Firebase configuration
5. Deploy!

### Netlify

1. Fork this repository to your GitHub account
2. Connect your GitHub account to Netlify
3. Create a new site from Git in Netlify and select the repository
4. Add environment variables with your Firebase configuration
5. Deploy!

## Firebase Setup

1. Create a new Firebase project
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Set up the following Firestore security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /transactions/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /budgets/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Firebase Database Structure

```
/transactions/{userId}/userTransactions/{transactionId}
  - title: string
  - amount: number (positive for income, negative for expenses)
  - category: string
  - date: timestamp
  - notes: string (optional)
  - createdAt: timestamp

/budgets/{userId}/userBudgets/{budgetId}
  - category: string
  - amount: number
  - period: string (e.g., "monthly")
  - createdAt: timestamp
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [React](https://reactjs.org/)
- [Firebase](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/)
- [Heroicons](https://heroicons.com/)
