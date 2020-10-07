export const syncSmaValuesWithStockDate = (
  smaPeriod,
  calculatedSmaValues,
  stockData
) => {
  const jsIndexShiftSize = 1;

  const stockSmaValues = calculatedSmaValues.map((smaValue, smaIndex) => {
    const matchingStockDataIndex = smaPeriod + smaIndex - jsIndexShiftSize;
    const matchingStockData = stockData[matchingStockDataIndex];

    return {
      value: smaValue,
      TIMESTAMP: matchingStockData.TIMESTAMP,
    };
  });

  return stockSmaValues;
};

export const modifyDate = (
  periodType,
  periodSize,
  actionType,
  dateToModify = new Date()
) => {
  let modifiedDate;
  switch (periodType) {
    case 'y':
      modifiedDate =
        actionType === 'add'
          ? new Date(dateToModify).setFullYear(
              new Date(dateToModify).getFullYear() + Number(periodSize)
            )
          : new Date(dateToModify).setFullYear(
              new Date(dateToModify).getFullYear() - Number(periodSize)
            );
      break;
    case 'm':
      modifiedDate =
        actionType === 'add'
          ? new Date(dateToModify).setMonth(
              new Date(dateToModify).getMonth() + Number(periodSize)
            )
          : new Date(dateToModify).setMonth(
              new Date(dateToModify).getMonth() - Number(periodSize)
            );
      break;
    case 'w':
      modifiedDate =
        actionType === 'add'
          ? new Date(dateToModify).setDate(
              new Date(dateToModify).getDate() + Number(periodSize) * 7
            )
          : new Date(dateToModify).setDate(
              new Date(dateToModify).getDate() - Number(periodSize) * 7
            );
      break;
    case 'd':
      modifiedDate =
        actionType === 'add'
          ? new Date(dateToModify).setDate(
              new Date(dateToModify).getDate() + Number(periodSize)
            )
          : new Date(dateToModify).setDate(
              new Date(dateToModify).getDate() - Number(periodSize)
            );
      break;
    case 'h':
      modifiedDate =
        actionType === 'add'
          ? new Date(dateToModify).setHours(
              new Date(dateToModify).getHours() + Number(periodSize)
            )
          : new Date(dateToModify).setHours(
              new Date(dateToModify).getHours() - Number(periodSize)
            );
      break;
    case 'min':
      modifiedDate =
        actionType === 'add'
          ? new Date(dateToModify).setMinutes(
              new Date(dateToModify).getMinutes() + Number(periodSize)
            )
          : new Date(dateToModify).setMinutes(
              new Date(dateToModify).getMinutes() - Number(periodSize)
            );
      break;
    // no default
  }

  return modifiedDate;
};
