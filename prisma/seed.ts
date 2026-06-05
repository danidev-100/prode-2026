import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

interface MatchInput {
  matchNumber: number
  date: string
  time: string
  venue: string
  stage: string
  homeTeam: string | null
  awayTeam: string | null
  group?: string | null
}

function parseDateTime(dateStr: string, timeStr: string, venue: string): Date {
  const timezoneOffsets: Record<string, number> = {
    "MetLife": -4, "Lincoln": -4, "Gillette": -4, "Hard Rock": -4, "Mercedes-Benz": -4,
    "BMO": -4, "AT&T": -5, "NRG": -5, "Arrowhead": -5,
    "Estadio Azteca": -6, "Estadio BBVA": -6, "Estadio Akron": -6,
    "SoFi": -7, "Levi's": -7, "Lumen": -7, "BC Place": -7,
  }

  let tzOffset = -4
  for (const [key, offset] of Object.entries(timezoneOffsets)) {
    if (venue.includes(key)) { tzOffset = offset; break }
  }

  const months: Record<string, number> = {
    January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
    July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
  }

  const parts = dateStr.split(" ")
  const month = months[parts[0]]
  const day = parseInt(parts[1].replace(",", ""))
  const year = parseInt(parts[2])

  const timeParts = timeStr.match(/(\d+):(\d+)/)!
  let hours = parseInt(timeParts[1])
  const minutes = parseInt(timeParts[2])
  const isPM = timeStr.includes("p.m.") && hours !== 12
  if (isPM) hours += 12
  if (timeStr.includes("a.m.") && hours === 12) hours = 0

  return new Date(Date.UTC(year, month, day, hours - tzOffset, minutes))
}

const matchesCsv = `1|June 11, 2026|1:00 p.m.|Estadio Azteca, Mexico City|Group A|Mexico|South Africa
2|June 11, 2026|8:00 p.m.|Estadio Akron, Zapopan|Group A|South Korea|Czech Republic
3|June 12, 2026|3:00 p.m.|BMO Field, Toronto|Group B|Canada|Bosnia and Herzegovina
4|June 12, 2026|6:00 p.m.|SoFi Stadium, Inglewood|Group D|United States|Paraguay
5|June 13, 2026|9:00 p.m.|Gillette Stadium, Foxborough|Group C|Haiti|Scotland
6|June 13, 2026|9:00 p.m.|BC Place, Vancouver|Group D|Australia|Turkey
7|June 13, 2026|6:00 p.m.|MetLife Stadium, East Rutherford|Group C|Brazil|Morocco
8|June 13, 2026|12:00 p.m.|Levi's Stadium, Santa Clara|Group B|Qatar|Switzerland
9|June 14, 2026|7:00 p.m.|Lincoln Financial Field, Philadelphia|Group E|Ivory Coast|Ecuador
10|June 14, 2026|12:00 p.m.|NRG Stadium, Houston|Group E|Germany|Curaçao
11|June 14, 2026|3:00 p.m.|AT&T Stadium, Arlington|Group F|Netherlands|Japan
12|June 14, 2026|8:00 p.m.|Estadio BBVA, Guadalupe|Group F|Sweden|Tunisia
13|June 15, 2026|6:00 p.m.|Hard Rock Stadium, Miami Gardens|Group H|Saudi Arabia|Uruguay
14|June 15, 2026|12:00 p.m.|Mercedes-Benz Stadium, Atlanta|Group H|Spain|Cape Verde
15|June 15, 2026|6:00 p.m.|SoFi Stadium, Inglewood|Group G|Iran|New Zealand
16|June 15, 2026|12:00 p.m.|Lumen Field, Seattle|Group G|Belgium|Egypt
17|June 16, 2026|3:00 p.m.|MetLife Stadium, East Rutherford|Group I|France|Senegal
18|June 16, 2026|6:00 p.m.|Gillette Stadium, Foxborough|Group I|Iraq|Norway
19|June 16, 2026|8:00 p.m.|Arrowhead Stadium, Kansas City|Group J|Argentina|Algeria
20|June 16, 2026|9:00 p.m.|Levi's Stadium, Santa Clara|Group J|Austria|Jordan
21|June 17, 2026|7:00 p.m.|BMO Field, Toronto|Group L|Ghana|Panama
22|June 17, 2026|3:00 p.m.|AT&T Stadium, Arlington|Group L|England|Croatia
23|June 17, 2026|12:00 p.m.|NRG Stadium, Houston|Group K|Portugal|DR Congo
24|June 17, 2026|8:00 p.m.|Estadio Azteca, Mexico City|Group K|Uzbekistan|Colombia
25|June 18, 2026|12:00 p.m.|Mercedes-Benz Stadium, Atlanta|Group A|Czech Republic|South Africa
26|June 18, 2026|12:00 p.m.|SoFi Stadium, Inglewood|Group B|Switzerland|Bosnia and Herzegovina
27|June 18, 2026|3:00 p.m.|BC Place, Vancouver|Group B|Canada|Qatar
28|June 18, 2026|7:00 p.m.|Estadio Akron, Zapopan|Group A|Mexico|South Korea
29|June 19, 2026|8:30 p.m.|Lincoln Financial Field, Philadelphia|Group C|Brazil|Haiti
30|June 19, 2026|6:00 p.m.|Gillette Stadium, Foxborough|Group C|Scotland|Morocco
31|June 19, 2026|8:00 p.m.|Levi's Stadium, Santa Clara|Group D|Turkey|Paraguay
32|June 19, 2026|12:00 p.m.|Lumen Field, Seattle|Group D|United States|Australia
33|June 20, 2026|4:00 p.m.|BMO Field, Toronto|Group E|Germany|Ivory Coast
34|June 20, 2026|7:00 p.m.|Arrowhead Stadium, Kansas City|Group E|Ecuador|Curaçao
35|June 20, 2026|12:00 p.m.|NRG Stadium, Houston|Group F|Netherlands|Sweden
36|June 20, 2026|10:00 p.m.|Estadio BBVA, Guadalupe|Group F|Tunisia|Japan
37|June 21, 2026|6:00 p.m.|Hard Rock Stadium, Miami Gardens|Group H|Uruguay|Cape Verde
38|June 21, 2026|12:00 p.m.|Mercedes-Benz Stadium, Atlanta|Group H|Spain|Saudi Arabia
39|June 21, 2026|12:00 p.m.|SoFi Stadium, Inglewood|Group G|Belgium|Iran
40|June 21, 2026|6:00 p.m.|BC Place, Vancouver|Group G|New Zealand|Egypt
41|June 22, 2026|8:00 p.m.|MetLife Stadium, East Rutherford|Group I|Norway|Senegal
42|June 22, 2026|5:00 p.m.|Lincoln Financial Field, Philadelphia|Group I|France|Iraq
43|June 22, 2026|12:00 p.m.|AT&T Stadium, Arlington|Group J|Argentina|Austria
44|June 22, 2026|8:00 p.m.|Levi's Stadium, Santa Clara|Group J|Jordan|Algeria
45|June 23, 2026|4:00 p.m.|Gillette Stadium, Foxborough|Group L|England|Ghana
46|June 23, 2026|7:00 p.m.|BMO Field, Toronto|Group L|Panama|Croatia
47|June 23, 2026|12:00 p.m.|NRG Stadium, Houston|Group K|Portugal|Uzbekistan
48|June 23, 2026|8:00 p.m.|Estadio Akron, Zapopan|Group K|Colombia|DR Congo
49|June 24, 2026|6:00 p.m.|Hard Rock Stadium, Miami Gardens|Group C|Scotland|Brazil
50|June 24, 2026|6:00 p.m.|Mercedes-Benz Stadium, Atlanta|Group C|Morocco|Haiti
51|June 24, 2026|12:00 p.m.|BC Place, Vancouver|Group B|Switzerland|Canada
52|June 24, 2026|12:00 p.m.|Lumen Field, Seattle|Group B|Bosnia and Herzegovina|Qatar
53|June 24, 2026|7:00 p.m.|Estadio Azteca, Mexico City|Group A|Czech Republic|Mexico
54|June 24, 2026|7:00 p.m.|Estadio BBVA, Guadalupe|Group A|South Africa|South Korea
55|June 25, 2026|4:00 p.m.|Lincoln Financial Field, Philadelphia|Group E|Curaçao|Ivory Coast
56|June 25, 2026|4:00 p.m.|MetLife Stadium, East Rutherford|Group E|Ecuador|Germany
57|June 25, 2026|6:00 p.m.|AT&T Stadium, Arlington|Group F|Japan|Sweden
58|June 25, 2026|6:00 p.m.|Arrowhead Stadium, Kansas City|Group F|Tunisia|Netherlands
59|June 25, 2026|7:00 p.m.|SoFi Stadium, Inglewood|Group D|Turkey|United States
60|June 25, 2026|7:00 p.m.|Levi's Stadium, Santa Clara|Group D|Paraguay|Australia
61|June 26, 2026|3:00 p.m.|Gillette Stadium, Foxborough|Group I|Norway|France
62|June 26, 2026|3:00 p.m.|BMO Field, Toronto|Group I|Senegal|Iraq
63|June 26, 2026|8:00 p.m.|Lumen Field, Seattle|Group G|Egypt|Iran
64|June 26, 2026|8:00 p.m.|BC Place, Vancouver|Group G|New Zealand|Belgium
65|June 26, 2026|7:00 p.m.|NRG Stadium, Houston|Group H|Cape Verde|Saudi Arabia
66|June 26, 2026|6:00 p.m.|Estadio Akron, Zapopan|Group H|Uruguay|Spain
67|June 27, 2026|5:00 p.m.|MetLife Stadium, East Rutherford|Group L|Panama|England
68|June 27, 2026|5:00 p.m.|Lincoln Financial Field, Philadelphia|Group L|Croatia|Ghana
69|June 27, 2026|9:00 p.m.|Arrowhead Stadium, Kansas City|Group J|Algeria|Austria
70|June 27, 2026|9:00 p.m.|AT&T Stadium, Arlington|Group J|Jordan|Argentina
71|June 27, 2026|7:30 p.m.|Hard Rock Stadium, Miami Gardens|Group K|Colombia|Portugal
72|June 27, 2026|7:30 p.m.|Mercedes-Benz Stadium, Atlanta|Group K|DR Congo|Uzbekistan
73|June 28, 2026|12:00 p.m.|SoFi Stadium, Inglewood|Round of 32|Runner-up Group A|Runner-up Group B
74|June 29, 2026|4:30 p.m.|Gillette Stadium, Foxborough|Round of 32|Winner Group E|3rd Group A/B/C/D/F
75|June 29, 2026|7:00 p.m.|Estadio BBVA, Guadalupe|Round of 32|Winner Group F|Runner-up Group C
76|June 29, 2026|12:00 p.m.|NRG Stadium, Houston|Round of 32|Winner Group C|Runner-up Group F
77|June 30, 2026|5:00 p.m.|MetLife Stadium, East Rutherford|Round of 32|Winner Group I|3rd Group C/D/F/G/H
78|June 30, 2026|12:00 p.m.|AT&T Stadium, Arlington|Round of 32|Runner-up Group E|Runner-up Group I
79|June 30, 2026|7:00 p.m.|Estadio Azteca, Mexico City|Round of 32|Winner Group A|3rd Group C/E/F/H/I
80|July 1, 2026|12:00 p.m.|Mercedes-Benz Stadium, Atlanta|Round of 32|Winner Group L|3rd Group E/H/I/J/K
81|July 1, 2026|5:00 p.m.|Levi's Stadium, Santa Clara|Round of 32|Winner Group D|3rd Group B/E/F/I/J
82|July 1, 2026|1:00 p.m.|Lumen Field, Seattle|Round of 32|Winner Group G|3rd Group A/E/H/I/J
83|July 2, 2026|7:00 p.m.|BMO Field, Toronto|Round of 32|Runner-up Group K|Runner-up Group L
84|July 2, 2026|12:00 p.m.|SoFi Stadium, Inglewood|Round of 32|Winner Group H|Runner-up Group J
85|July 2, 2026|8:00 p.m.|BC Place, Vancouver|Round of 32|Winner Group B|3rd Group E/F/G/I/J
86|July 3, 2026|6:00 p.m.|Hard Rock Stadium, Miami Gardens|Round of 32|Winner Group J|Runner-up Group H
87|July 3, 2026|8:30 p.m.|Arrowhead Stadium, Kansas City|Round of 32|Winner Group K|3rd Group D/E/I/J/L
88|July 3, 2026|1:00 p.m.|AT&T Stadium, Arlington|Round of 32|Runner-up Group D|Runner-up Group G
89|July 4, 2026|4:00 p.m.|Gillette Stadium, Foxborough|Round of 16|Winner Match 74|Winner Match 77
90|July 4, 2026|12:00 p.m.|NRG Stadium, Houston|Round of 16|Winner Match 73|Winner Match 75
91|July 5, 2026|4:00 p.m.|MetLife Stadium, East Rutherford|Round of 16|Winner Match 78|Winner Match 76
92|July 5, 2026|6:00 p.m.|Estadio Azteca, Mexico City|Round of 16|Winner Match 79|Winner Match 80
93|July 6, 2026|2:00 p.m.|AT&T Stadium, Arlington|Round of 16|Winner Match 83|Winner Match 84
94|July 6, 2026|5:00 p.m.|Lumen Field, Seattle|Round of 16|Winner Match 82|Winner Match 85
95|July 7, 2026|12:00 p.m.|Mercedes-Benz Stadium, Atlanta|Round of 16|Winner Match 86|Winner Match 88
96|July 7, 2026|1:00 p.m.|BC Place, Vancouver|Round of 16|Winner Match 81|Winner Match 87
97|July 9, 2026|4:00 p.m.|Gillette Stadium, Foxborough|Quarterfinals|Winner Match 89|Winner Match 90
98|July 10, 2026|12:00 p.m.|SoFi Stadium, Inglewood|Quarterfinals|Winner Match 93|Winner Match 94
99|July 11, 2026|5:00 p.m.|Hard Rock Stadium, Miami Gardens|Quarterfinals|Winner Match 91|Winner Match 92
100|July 11, 2026|8:00 p.m.|Arrowhead Stadium, Kansas City|Quarterfinals|Winner Match 95|Winner Match 96
101|July 14, 2026|2:00 p.m.|AT&T Stadium, Arlington|Semifinals|Winner Match 97|Winner Match 98
102|July 15, 2026|3:00 p.m.|Mercedes-Benz Stadium, Atlanta|Semifinals|Winner Match 99|Winner Match 100
103|July 18, 2026|5:00 p.m.|Hard Rock Stadium, Miami Gardens|Third place|Loser Match 101|Loser Match 102
104|July 19, 2026|3:00 p.m.|MetLife Stadium, East Rutherford|Final|Winner Match 101|Winner Match 102`

function parseMatch(line: string): MatchInput | null {
  const parts = line.split("|")
  if (parts.length < 7) return null

  const isKnockout = parts[4].startsWith("Round of") ||
    parts[4] === "Quarterfinals" ||
    parts[4] === "Semifinals" ||
    parts[4] === "Third place" ||
    parts[4] === "Final"

  let stage = parts[4]
  if (stage.startsWith("Group")) {
    stage = "GROUP"
  } else if (stage === "Round of 32") {
    stage = "R32"
  } else if (stage === "Round of 16") {
    stage = "R16"
  } else if (stage === "Quarterfinals") {
    stage = "QUARTER"
  } else if (stage === "Semifinals") {
    stage = "SEMI"
  } else if (stage === "Third place") {
    stage = "THIRD_PLACE"
  } else if (stage === "Final") {
    stage = "FINAL"
  }

  const group = parts[4].startsWith("Group") ? parts[4].replace("Group ", "") : null
  const homeTeam = isKnockout ? null : parts[5]
  const awayTeam = isKnockout ? null : parts[6]
  const knockoutHome = isKnockout ? parts[5] : null
  const knockoutAway = isKnockout ? parts[6] : null

  return {
    matchNumber: parseInt(parts[0]),
    date: parts[1],
    time: parts[2],
    venue: parts[3],
    stage,
    homeTeam: homeTeam || knockoutHome,
    awayTeam: awayTeam || knockoutAway,
    group,
  }
}

async function seed() {
  console.log("Seeding matches...")

  const lines = matchesCsv.trim().split("\n")

  for (const line of lines) {
    const match = parseMatch(line)
    if (!match) continue

    const dateTime = parseDateTime(match.date, match.time, match.venue)

    await prisma.match.upsert({
      where: { matchNumber: match.matchNumber },
      update: {
        date: dateTime,
        venue: match.venue,
        stage: match.stage,
        group: (match as any).group || null,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
      },
      create: {
        matchNumber: match.matchNumber,
        date: dateTime,
        venue: match.venue,
        stage: match.stage,
        group: (match as any).group || null,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        status: "SCHEDULED",
      },
    })
  }

  console.log(`Seeded ${lines.length} matches`)
  await prisma.$disconnect()
}

seed().catch((e) => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})
