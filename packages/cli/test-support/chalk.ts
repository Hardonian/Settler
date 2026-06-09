const passthrough = (value: string): string => value;

const chalk = {
  red: passthrough,
  green: passthrough,
  yellow: passthrough,
  blue: passthrough,
  cyan: passthrough,
  gray: passthrough,
  bold: passthrough,
};

export default chalk;
