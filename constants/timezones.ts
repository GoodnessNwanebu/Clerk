// Comprehensive map of country codes to their primary timezones
export const COUNTRY_TIMEZONES: Record<string, string> = {
    // North America
    'US': 'America/New_York',      // Eastern Time (most populous)
    'CA': 'America/Toronto',       // Eastern Time
    'MX': 'America/Mexico_City',   // Central Time
    
    // Central America & Caribbean
    'GT': 'America/Guatemala',     // Central Time
    'BZ': 'America/Belize',        // Central Time
    'SV': 'America/El_Salvador',   // Central Time
    'HN': 'America/Tegucigalpa',   // Central Time
    'NI': 'America/Managua',       // Central Time
    'CR': 'America/Costa_Rica',    // Central Time
    'PA': 'America/Panama',        // Eastern Time
    'CU': 'America/Havana',        // Eastern Time
    'JM': 'America/Jamaica',       // Eastern Time
    'HT': 'America/Port-au-Prince', // Eastern Time
    'DO': 'America/Santo_Domingo', // Atlantic Time
    'PR': 'America/Puerto_Rico',   // Atlantic Time
    'AG': 'America/Antigua',       // Atlantic Time
    'BS': 'America/Nassau',        // Eastern Time
    'BB': 'America/Barbados',      // Atlantic Time
    'GD': 'America/Grenada',       // Atlantic Time
    'LC': 'America/St_Lucia',      // Atlantic Time
    'VC': 'America/St_Vincent',    // Atlantic Time
    'KN': 'America/St_Kitts',      // Atlantic Time
    'DM': 'America/Dominica',      // Atlantic Time
    
    // South America
    'BR': 'America/Sao_Paulo',     // Brasília Time
    'AR': 'America/Argentina/Buenos_Aires', // Argentina Time
    'CL': 'America/Santiago',      // Chile Time
    'CO': 'America/Bogota',        // Colombia Time
    'EC': 'America/Guayaquil',     // Ecuador Time
    'PE': 'America/Lima',          // Peru Time
    'BO': 'America/La_Paz',        // Bolivia Time
    'PY': 'America/Asuncion',      // Paraguay Time
    'UY': 'America/Montevideo',    // Uruguay Time
    'VE': 'America/Caracas',       // Venezuela Time
    'GY': 'America/Guyana',        // Guyana Time
    'SR': 'America/Paramaribo',    // Suriname Time
    'GF': 'America/Cayenne',       // French Guiana Time
    
    // Europe
    'GB': 'Europe/London',         // GMT/BST
    'DE': 'Europe/Berlin',         // CET/CEST
    'FR': 'Europe/Paris',          // CET/CEST
    'IT': 'Europe/Rome',           // CET/CEST
    'ES': 'Europe/Madrid',         // CET/CEST
    'NL': 'Europe/Amsterdam',      // CET/CEST
    'BE': 'Europe/Brussels',       // CET/CEST
    'AT': 'Europe/Vienna',         // CET/CEST
    'CH': 'Europe/Zurich',         // CET/CEST
    'SE': 'Europe/Stockholm',      // CET/CEST
    'NO': 'Europe/Oslo',           // CET/CEST
    'DK': 'Europe/Copenhagen',     // CET/CEST
    'FI': 'Europe/Helsinki',       // EET/EEST
    'PL': 'Europe/Warsaw',         // CET/CEST
    'CZ': 'Europe/Prague',         // CET/CEST
    'HU': 'Europe/Budapest',       // CET/CEST
    'RO': 'Europe/Bucharest',      // EET/EEST
    'BG': 'Europe/Sofia',          // EET/EEST
    'HR': 'Europe/Zagreb',         // CET/CEST
    'SI': 'Europe/Ljubljana',      // CET/CEST
    'SK': 'Europe/Bratislava',     // CET/CEST
    'LT': 'Europe/Vilnius',        // EET/EEST
    'LV': 'Europe/Riga',           // EET/EEST
    'EE': 'Europe/Tallinn',        // EET/EEST
    'IE': 'Europe/Dublin',         // GMT/IST
    'PT': 'Europe/Lisbon',         // WET/WEST
    'GR': 'Europe/Athens',         // EET/EEST
    'CY': 'Asia/Nicosia',          // EET/EEST
    'MT': 'Europe/Malta',          // CET/CEST
    'LU': 'Europe/Luxembourg',     // CET/CEST
    'IS': 'Atlantic/Reykjavik',    // GMT
    'AD': 'Europe/Andorra',        // CET/CEST
    'MC': 'Europe/Monaco',         // CET/CEST
    'SM': 'Europe/San_Marino',     // CET/CEST
    'VA': 'Europe/Vatican',        // CET/CEST
    'LI': 'Europe/Vaduz',          // CET/CEST
    'AL': 'Europe/Tirane',         // CET/CEST
    'BA': 'Europe/Sarajevo',       // CET/CEST
    'ME': 'Europe/Podgorica',      // CET/CEST
    'MK': 'Europe/Skopje',         // CET/CEST
    'RS': 'Europe/Belgrade',       // CET/CEST
    'UA': 'Europe/Kiev',           // EET/EEST
    'BY': 'Europe/Minsk',          // MSK
    'MD': 'Europe/Chisinau',       // EET/EEST
    'RU': 'Europe/Moscow',         // MSK
    'AM': 'Asia/Yerevan',          // AMT
    'AZ': 'Asia/Baku',             // AZT
    'GE': 'Asia/Tbilisi',          // GET
    
    // Africa
    'NG': 'Africa/Lagos',          // WAT
    'ZA': 'Africa/Johannesburg',   // SAST
    'EG': 'Africa/Cairo',          // EET/EEST
    'KE': 'Africa/Nairobi',        // EAT
    'GH': 'Africa/Accra',          // GMT
    'UG': 'Africa/Kampala',        // EAT
    'ET': 'Africa/Addis_Ababa',    // EAT
    'TZ': 'Africa/Dar_es_Salaam',  // EAT
    'RW': 'Africa/Kigali',         // CAT
    'BI': 'Africa/Bujumbura',      // CAT
    'CD': 'Africa/Kinshasa',       // WAT
    'CG': 'Africa/Brazzaville',    // WAT
    'CM': 'Africa/Douala',         // WAT
    'GA': 'Africa/Libreville',     // WAT
    'GQ': 'Africa/Malabo',         // WAT
    'ST': 'Africa/Sao_Tome',       // GMT
    'CF': 'Africa/Bangui',         // WAT
    'TD': 'Africa/Ndjamena',       // WAT
    'SD': 'Africa/Khartoum',       // CAT
    'SS': 'Africa/Juba',           // CAT
    'DJ': 'Africa/Djibouti',       // EAT
    'ER': 'Africa/Asmara',         // EAT
    'SO': 'Africa/Mogadishu',      // EAT
    'MG': 'Indian/Antananarivo',   // EAT
    'MU': 'Indian/Mauritius',      // MUT
    'SC': 'Indian/Mahe',           // SCT
    'KM': 'Indian/Comoro',         // EAT
    'MW': 'Africa/Blantyre',       // CAT
    'ZM': 'Africa/Lusaka',         // CAT
    'ZW': 'Africa/Harare',         // CAT
    'BW': 'Africa/Gaborone',       // CAT
    'NA': 'Africa/Windhoek',       // WAT
    'LS': 'Africa/Maseru',         // SAST
    'SZ': 'Africa/Mbabane',        // SAST
    'MZ': 'Africa/Maputo',         // CAT
    'CV': 'Atlantic/Cape_Verde',   // CVT
    'SN': 'Africa/Dakar',          // GMT
    'GM': 'Africa/Banjul',         // GMT
    'GN': 'Africa/Conakry',        // GMT
    'GW': 'Africa/Bissau',         // GMT
    'SL': 'Africa/Freetown',       // GMT
    'LR': 'Africa/Monrovia',       // GMT
    'CI': 'Africa/Abidjan',        // GMT
    'BF': 'Africa/Ouagadougou',    // GMT
    'ML': 'Africa/Bamako',         // GMT
    'NE': 'Africa/Niamey',         // WAT
    'TG': 'Africa/Lome',           // GMT
    'BJ': 'Africa/Porto-Novo',     // WAT
    'MR': 'Africa/Nouakchott',     // GMT
    'TN': 'Africa/Tunis',          // CET/CEST
    'DZ': 'Africa/Algiers',        // CET/CEST
    'MA': 'Africa/Casablanca',     // WET/WEST
    'LY': 'Africa/Tripoli',        // EET
    'AO': 'Africa/Luanda',         // WAT
    
    // Asia
    'CN': 'Asia/Shanghai',         // CST
    'JP': 'Asia/Tokyo',            // JST
    'KR': 'Asia/Seoul',            // KST
    'KP': 'Asia/Pyongyang',        // KST
    'IN': 'Asia/Kolkata',          // IST
    'PK': 'Asia/Karachi',          // PKT
    'BD': 'Asia/Dhaka',            // BST
    'LK': 'Asia/Colombo',          // IST
    'NP': 'Asia/Kathmandu',        // NPT
    'BT': 'Asia/Thimphu',          // BTT
    'MM': 'Asia/Yangon',           // MMT
    'TH': 'Asia/Bangkok',          // ICT
    'VN': 'Asia/Ho_Chi_Minh',      // ICT
    'LA': 'Asia/Vientiane',        // ICT
    'KH': 'Asia/Phnom_Penh',       // ICT
    'MY': 'Asia/Kuala_Lumpur',     // MYT
    'SG': 'Asia/Singapore',        // SGT
    'ID': 'Asia/Jakarta',          // WIB
    'PH': 'Asia/Manila',           // PHT
    'TW': 'Asia/Taipei',           // CST
    'MN': 'Asia/Ulaanbaatar',      // ULAT
    'KZ': 'Asia/Almaty',           // ALMT
    'KG': 'Asia/Bishkek',          // KGT
    'UZ': 'Asia/Tashkent',         // UZT
    'TJ': 'Asia/Dushanbe',         // TJT
    'TM': 'Asia/Ashgabat',         // TMT
    'AF': 'Asia/Kabul',            // AFT
    'IR': 'Asia/Tehran',           // IRST
    'IQ': 'Asia/Baghdad',          // AST
    'SA': 'Asia/Riyadh',           // AST
    'AE': 'Asia/Dubai',            // GST
    'OM': 'Asia/Muscat',           // GST
    'YE': 'Asia/Aden',             // AST
    'JO': 'Asia/Amman',            // EET/EEST
    'LB': 'Asia/Beirut',           // EET/EEST
    'SY': 'Asia/Damascus',         // EET/EEST
    'IL': 'Asia/Jerusalem',        // IST
    'BH': 'Asia/Bahrain',          // AST
    'QA': 'Asia/Qatar',            // AST
    'KW': 'Asia/Kuwait',           // AST
    'MV': 'Indian/Maldives',       // MVT
    'BN': 'Asia/Brunei',           // BNT
    'TL': 'Asia/Dili',             // TLT
    'PG': 'Pacific/Port_Moresby',  // PGT
    'FJ': 'Pacific/Fiji',          // FJT
    'NC': 'Pacific/Noumea',        // NCT
    'VU': 'Pacific/Efate',         // VUT
    'SB': 'Pacific/Guadalcanal',   // SBT
    'TO': 'Pacific/Tongatapu',     // TOT
    'WS': 'Pacific/Apia',          // WST
    'KI': 'Pacific/Tarawa',        // GILT
    'TV': 'Pacific/Funafuti',      // TVT
    'NR': 'Pacific/Nauru',         // NRT
    'PW': 'Pacific/Palau',         // PWT
    'FM': 'Pacific/Pohnpei',       // PONT
    'MH': 'Pacific/Majuro',        // MHT
    'CK': 'Pacific/Rarotonga',     // CKT
    'NU': 'Pacific/Niue',          // NUT
    'TK': 'Pacific/Fakaofo',       // TKT
    'WF': 'Pacific/Wallis',        // WFT
    'AS': 'Pacific/Pago_Pago',     // SST
    'GU': 'Pacific/Guam',          // ChST
    'MP': 'Pacific/Saipan',        // ChST
    'PF': 'Pacific/Tahiti',        // TAHT
    
    // Oceania
    'AU': 'Australia/Sydney',      // AEST/AEDT
    'NZ': 'Pacific/Auckland',      // NZST/NZDT
    
    // Default fallback
    'OTHER': 'UTC',                // Default for other countries
  };
  