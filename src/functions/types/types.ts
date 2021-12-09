export type Note = {
  ids: number[];
  date: {
    day: string;
    month: string;
    date: number | string;
  };
  deliveryDay?: string
};

export const months = {
  January: 0,
  February: 1,
  March: 2,
  April: 3,
  May: 4,
  June: 5,
  July: 6,
  August: 7,
  September: 8,
  October: 9,
  November: 10,
  December: 11,
};
