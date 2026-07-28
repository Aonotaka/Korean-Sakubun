function getSessionQuestionCount(requestedCount, mode) {
  const baseCount = Number(requestedCount) || 5;
  if (mode === 'reply') {
    return Math.max(baseCount * 2, 8);
  }
  return baseCount;
}

module.exports = {
  getSessionQuestionCount,
};