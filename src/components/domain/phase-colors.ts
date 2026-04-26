const phaseFamilyMap: Record<string, string> = {
  "var(--phase-menstrual)": "menstrual",
  "var(--phase-follicular)": "follicular",
  "var(--phase-ovulation)": "ovulation",
  "var(--phase-luteal)": "luteal"
};

export function getPhaseShadeColor(phaseColor: string, shade: 100 | 200 | 400) {
  const family = phaseFamilyMap[phaseColor];

  if (!family) {
    return phaseColor;
  }

  return `var(--phase-${family}-${shade})`;
}

export function getPhaseStickerFillColor(phaseColor?: string) {
  return phaseColor ? getPhaseShadeColor(phaseColor, 200) : "#BAE6FD";
}

export function getPhaseEnergyColors(phaseColor?: string) {
  return {
    backgroundColor: phaseColor ? getPhaseShadeColor(phaseColor, 100) : "#BAE6FD",
    fillColor: phaseColor ?? "#0EA5E9"
  };
}
