import type { LocaleConfig } from "./types";

export const AU_LOCALE: LocaleConfig = {
  country: "Australia",
  countryCode: "AU",
  currency: "AUD",
  currencySymbol: "$",
  taxName: "GST",
  taxRate: 0.1,
  areaUnit: "m\u00B2",
  lengthUnit: "m",
  businessIdLabel: "ABN",
  businessIdFormat: "XX XXX XXX XXX",
  states: [
    { value: "NSW", label: "New South Wales" },
    { value: "VIC", label: "Victoria" },
    { value: "QLD", label: "Queensland" },
    { value: "WA", label: "Western Australia" },
    { value: "SA", label: "South Australia" },
    { value: "TAS", label: "Tasmania" },
    { value: "ACT", label: "Australian Capital Territory" },
    { value: "NT", label: "Northern Territory" },
  ],
  paintBrands: [
    "Dulux",
    "Taubmans",
    "Wattyl",
    "Haymes",
    "British Paints",
    "Solver",
  ],
};
