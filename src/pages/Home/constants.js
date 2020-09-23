export const PERIOD_TYPE = {
  Y: 'y',
  M: 'm',
  W: 'w',
  D: 'd',
  H: 'h',
  MIN: 'min',
};

export const DATE_SUBTRACTOR_BY_PERIOD_TYPE = {
  [PERIOD_TYPE.Y]: (periodSize) =>
    new Date().setFullYear(new Date().getFullYear() - Number(periodSize)),
  [PERIOD_TYPE.M]: (periodSize) =>
    new Date().setMonth(new Date().getMonth() - Number(periodSize)),
  [PERIOD_TYPE.W]: (periodSize) =>
    new Date().setDate(new Date().getDate() - Number(periodSize) * 7),
  [PERIOD_TYPE.D]: (periodSize) =>
    new Date().setDate(new Date().getDate() - Number(periodSize)),
  [PERIOD_TYPE.H]: (periodSize) =>
    new Date().setHours(new Date().getHours() - Number(periodSize)),
  [PERIOD_TYPE.MIN]: (periodSize) =>
    new Date().setMinutes(new Date().getMinutes() - Number(periodSize)),
};

export const BAR_TYPE = {
  M: 'm',
  W: 'w',
  D: 'd',
  H: 'h',
  MIN: 'min',
};
