// multer-config.js

import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const fileOriginalName = file.originalname;
    cb(null, fileOriginalName);
  },
});

export const upload = multer({ storage: storage });
