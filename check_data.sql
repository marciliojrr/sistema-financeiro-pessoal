SELECT 'RESERVES' as section;
SELECT name, "currentAmount", "targetAmount" FROM reserves;

SELECT 'DEBTS' as section;
SELECT description, "totalAmount", "remainingAmount", active FROM debts;

SELECT 'BUDGETS' as section;
SELECT b.month, b.year, b.amount as budget, c.name as category 
FROM budgets b LEFT JOIN financial_category c ON b."categoryId" = c.id;

SELECT 'DEC 2025 TRANSACTIONS' as section;
SELECT date, description, amount, type FROM financial_movements 
WHERE date >= '2025-12-01' AND date < '2026-01-01'
ORDER BY date;
