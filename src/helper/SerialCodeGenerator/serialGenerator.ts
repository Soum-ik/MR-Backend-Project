const statement = (num: string): string => {
  switch (num) {
    case "2":
      return "N";
    case "4":
      return "P";
    case "6":
      return "R";
    case "8":
      return "T";
    case "0":
      return "Z";
    default:
      return num;
  }
};

export const designSerialGenerator = (serial: number = 0): string => {
  const modifiedSerial = serial
    .toString()
    .split("")
    .map((num) => statement(num))
    .join("");
  return `MR${modifiedSerial}DN`;
};

export const projectSerialGenerator = (serial: number = 0): string => {
  const modifiedSerial = serial
    .toString()
    .split("")
    .map((num) => statement(num))
    .join("");
  return `MR${modifiedSerial}PN`;
};
