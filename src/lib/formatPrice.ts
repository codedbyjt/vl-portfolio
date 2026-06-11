export function formatShopPrice(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) return "";

  const numericValue = trimmed.replace(/[£,]/g, "").replace(/\s/g, "");

  if (/^\d+(\.\d{1,2})?$/.test(numericValue)) {
    const amount = Number(numericValue);

    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  return trimmed;
}
