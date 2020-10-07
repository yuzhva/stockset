import { modifyDate } from './utils';

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
    modifyDate(PERIOD_TYPE.Y, periodSize, 'subtract'),
  [PERIOD_TYPE.M]: (periodSize) =>
    modifyDate(PERIOD_TYPE.M, periodSize, 'subtract'),
  [PERIOD_TYPE.W]: (periodSize) =>
    modifyDate(PERIOD_TYPE.W, periodSize, 'subtract'),
  [PERIOD_TYPE.D]: (periodSize) =>
    modifyDate(PERIOD_TYPE.D, periodSize, 'subtract'),
  [PERIOD_TYPE.H]: (periodSize) =>
    modifyDate(PERIOD_TYPE.H, periodSize, 'subtract'),
  [PERIOD_TYPE.MIN]: (periodSize) =>
    modifyDate(PERIOD_TYPE.MIN, periodSize, 'subtract'),
};

export const BAR_TYPE = {
  M: 'm',
  W: 'w',
  D: 'd',
  H: 'h',
  MIN: 'min',
};
