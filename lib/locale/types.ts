export interface LocaleConfig {
  country: string;
  countryCode: string;
  currency: string;
  currencySymbol: string;
  taxName: string;
  taxRate: number;
  areaUnit: string;
  lengthUnit: string;
  businessIdLabel: string;
  businessIdFormat: string;
  states: { value: string; label: string }[];
  paintBrands: string[];
}
