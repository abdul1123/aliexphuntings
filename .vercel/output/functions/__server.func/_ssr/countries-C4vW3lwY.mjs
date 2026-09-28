//#region node_modules/.nitro/vite/services/ssr/assets/countries-C4vW3lwY.js
var COUNTRIES = [
	{
		code: "US",
		name: "United States",
		currency: "USD",
		site: "usa"
	},
	{
		code: "GB",
		name: "United Kingdom",
		currency: "GBP",
		site: "glo"
	},
	{
		code: "DE",
		name: "Germany",
		currency: "EUR",
		site: "glo"
	},
	{
		code: "FR",
		name: "France",
		currency: "EUR",
		site: "glo"
	},
	{
		code: "ES",
		name: "Spain",
		currency: "EUR",
		site: "glo"
	},
	{
		code: "IT",
		name: "Italy",
		currency: "EUR",
		site: "glo"
	},
	{
		code: "NL",
		name: "Netherlands",
		currency: "EUR",
		site: "glo"
	},
	{
		code: "BE",
		name: "Belgium",
		currency: "EUR",
		site: "glo"
	},
	{
		code: "PT",
		name: "Portugal",
		currency: "EUR",
		site: "glo"
	},
	{
		code: "PL",
		name: "Poland",
		currency: "PLN",
		site: "glo"
	},
	{
		code: "CA",
		name: "Canada",
		currency: "CAD",
		site: "glo"
	},
	{
		code: "MX",
		name: "Mexico",
		currency: "MXN",
		site: "glo"
	},
	{
		code: "BR",
		name: "Brazil",
		currency: "BRL",
		site: "glo"
	},
	{
		code: "AR",
		name: "Argentina",
		currency: "ARS",
		site: "glo"
	},
	{
		code: "CL",
		name: "Chile",
		currency: "CLP",
		site: "glo"
	},
	{
		code: "AU",
		name: "Australia",
		currency: "AUD",
		site: "glo"
	},
	{
		code: "NZ",
		name: "New Zealand",
		currency: "NZD",
		site: "glo"
	},
	{
		code: "JP",
		name: "Japan",
		currency: "JPY",
		site: "glo"
	},
	{
		code: "KR",
		name: "South Korea",
		currency: "KRW",
		site: "glo"
	},
	{
		code: "SG",
		name: "Singapore",
		currency: "SGD",
		site: "glo"
	},
	{
		code: "MY",
		name: "Malaysia",
		currency: "MYR",
		site: "glo"
	},
	{
		code: "TH",
		name: "Thailand",
		currency: "THB",
		site: "glo"
	},
	{
		code: "VN",
		name: "Vietnam",
		currency: "VND",
		site: "glo"
	},
	{
		code: "PH",
		name: "Philippines",
		currency: "PHP",
		site: "glo"
	},
	{
		code: "ID",
		name: "Indonesia",
		currency: "IDR",
		site: "glo"
	},
	{
		code: "IN",
		name: "India",
		currency: "INR",
		site: "glo"
	},
	{
		code: "PK",
		name: "Pakistan",
		currency: "PKR",
		site: "glo"
	},
	{
		code: "BD",
		name: "Bangladesh",
		currency: "BDT",
		site: "glo"
	},
	{
		code: "AE",
		name: "United Arab Emirates",
		currency: "AED",
		site: "glo"
	},
	{
		code: "SA",
		name: "Saudi Arabia",
		currency: "SAR",
		site: "glo"
	},
	{
		code: "IL",
		name: "Israel",
		currency: "ILS",
		site: "glo"
	},
	{
		code: "TR",
		name: "Turkey",
		currency: "TRY",
		site: "glo"
	},
	{
		code: "EG",
		name: "Egypt",
		currency: "EGP",
		site: "glo"
	},
	{
		code: "ZA",
		name: "South Africa",
		currency: "ZAR",
		site: "glo"
	}
];
var COUNTRY_BY_CODE = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]));
var SORT_OPTIONS = [
	{
		value: "best",
		label: "Best match"
	},
	{
		value: "orders",
		label: "Most orders"
	},
	{
		value: "price_asc",
		label: "Price: low to high"
	},
	{
		value: "price_desc",
		label: "Price: high to low"
	}
];
var SORT_QUERY = {
	best: null,
	orders: "total_tranpro_desc",
	price_asc: "price_asc",
	price_desc: "price_desc"
};
//#endregion
export { SORT_QUERY as i, COUNTRY_BY_CODE as n, SORT_OPTIONS as r, COUNTRIES as t };
