export function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length
  if (n < 14) return NaN

  const meanX = x.reduce((a, b) => a + b, 0) / n
  const meanY = y.reduce((a, b) => a + b, 0) / n

  const num = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0)
  const denX = Math.sqrt(x.reduce((sum, xi) => sum + (xi - meanX) ** 2, 0))
  const denY = Math.sqrt(y.reduce((sum, yi) => sum + (yi - meanY) ** 2, 0))

  if (denX === 0 || denY === 0) return NaN
  return num / (denX * denY)
}

export function interpretCorrelation(r: number): '강한 상관' | '중간 상관' | '약한 상관' | '없음' {
  const abs = Math.abs(r)
  if (abs >= 0.5) return '강한 상관'
  if (abs >= 0.3) return '중간 상관'
  if (abs >= 0.1) return '약한 상관'
  return '없음'
}
