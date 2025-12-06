# System Patterns

## Architecture
The application will likely follow a Component-Based Architecture (likely React/Vite) to modularize the design found in `code.html`.

## Key Components
Based on `code.html`:
1.  **Layout**: Wrapper with Sidebar and Main Content.
2.  **Sidebar**: Navigation (Dashboard, Transactions, Reports, Settings) and User Profile.
3.  **Dashboard**:
    *   **Header**: Welcome message and summary text.
    *   **Stats Cards**: Total Balance, Income, Expense data display.
    *   **Recent Transactions Table**: List displaying transaction details (Name, Category, Date, Amount).
4.  **Transaction Modal/Form**: (To be implemented) For adding new transactions.

## Design Patterns
- **Tailwind CSS Utility Classes**: Preserving the styling from the source file.
- **Responsive Design**: Using Tailwind's responsive prefixes (defaults).
