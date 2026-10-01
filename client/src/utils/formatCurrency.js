export function formatCurrency(amount) {
  // Prisma sends Decimal as a string; parse it for display.
  const value = typeof amount === 'string' ? Number(amount) : amount;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}