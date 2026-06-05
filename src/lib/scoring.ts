export function calculatePoints(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number
): number {
  let points = 0

  const predResult = Math.sign(predHome - predAway)
  const actualResult = Math.sign(actualHome - actualAway)

  if (predResult === actualResult) {
    points += 2
  }

  if (predHome === actualHome && predAway === actualAway) {
    points += 1
  }

  return points
}
