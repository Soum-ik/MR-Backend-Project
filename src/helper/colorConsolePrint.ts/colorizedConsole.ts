import colors from 'colors';

colors.enable();

export const print = {
  rainbow: (str: string) => console.log(colors.rainbow(str)),
  yellow: (any: any) => console.log(colors.yellow(any)),
  red: (any: any, err: any) => console.error(colors.red(any), err),
  green: (any: any) => console.log(colors.green(any)),
  blue: (any: any) => console.log(colors.blue(any)),
};
