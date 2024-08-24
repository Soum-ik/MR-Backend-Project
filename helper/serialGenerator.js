const statement = (num) => {
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

export const designSerialGenerator = (serial = 0) => {
  const modifiedSerial = serial
    .toString()
    .split("")
    .map((num) => {
      return statement(num);
    })
    .join("");
  return `MR${modifiedSerial}DN`;
};
export const projectSerialGenerator = (serial = 0) => {
  const modifiedSerial = serial
    .toString()
    .split("")
    .map((num) => {
      return statement(num);
    })
    .join("");
  return `MR${modifiedSerial}PN`;
};
