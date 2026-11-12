export const colors = {
  red: '#D5484E',
  coral: '#EB6367',
  pink: '#FAA7A9',
  cream: '#FBF0ED',
  ink: '#383338',
};

export const radius = { card: 20, button: 10, pill: 99 };
export const space = { s: 8, m: 12, l: 16, xl: 20 };

export const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};
