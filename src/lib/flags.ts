/** Mapa de nombre de país → código ISO 3166-1 alpha-2 (o subdivisión para UK) */
const COUNTRY_TO_CODE: Record<string, string> = {
  Algeria: "dz",
  Argentina: "ar",
  Australia: "au",
  Austria: "at",
  Belgium: "be",
  "Bosnia and Herzegovina": "ba",
  Brazil: "br",
  Canada: "ca",
  "Cape Verde": "cv",
  Colombia: "co",
  Croatia: "hr",
  "Czech Republic": "cz",
  "Curaçao": "cw",
  "DR Congo": "cd",
  Ecuador: "ec",
  Egypt: "eg",
  England: "gb-eng",
  France: "fr",
  Germany: "de",
  Ghana: "gh",
  Haiti: "ht",
  Iran: "ir",
  Iraq: "iq",
  "Ivory Coast": "ci",
  Japan: "jp",
  Jordan: "jo",
  Mexico: "mx",
  Morocco: "ma",
  Netherlands: "nl",
  "New Zealand": "nz",
  Norway: "no",
  Panama: "pa",
  Paraguay: "py",
  Portugal: "pt",
  Qatar: "qa",
  "Saudi Arabia": "sa",
  Scotland: "gb-sct",
  Senegal: "sn",
  "South Africa": "za",
  "South Korea": "kr",
  Spain: "es",
  Sweden: "se",
  Switzerland: "ch",
  Tunisia: "tn",
  Turkey: "tr",
  "United States": "us",
  Uruguay: "uy",
  Uzbekistan: "uz",
}

/** Lista de los 48 países clasificados al Mundial 2026 (orden alfabético) */
export const QUALIFIED_TEAMS = Object.keys(COUNTRY_TO_CODE).sort()

/**
 * Devuelve la URL de la bandera desde flagcdn.com o null si el país no está mapeado.
 * @param countryName - Nombre del país en inglés tal como aparece en la DB
 * @param width - Ancho en píxeles (default 40)
 */
export function getFlagUrl(
  countryName: string | null,
  width = 40
): string | null {
  if (!countryName) return null

  // Knockout placeholder texts like "Winner Group A" or "Runner-up Group B"
  if (countryName.startsWith("Winner") || countryName.startsWith("Runner-up") || countryName.startsWith("Loser") || countryName.includes("3rd Group")) {
    return null
  }

  const code = COUNTRY_TO_CODE[countryName]
  if (!code) return null

  return `https://flagcdn.com/w${width}/${code}.png`
}
