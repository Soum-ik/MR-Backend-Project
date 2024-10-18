import multer from 'multer';
import path from 'path';

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  console.log('File received:', file);
  // Allow all file types for now
  cb(null, true);
  // If you want to restrict file types, use something like this:
  // const allowedFileTypes = /jpeg|jpg|png|gif/;
  // const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  // const mimetype = allowedFileTypes.test(file.mimetype);
  // if (extname && mimetype) {
  //   return cb(null, true);
  // } else {
  //   cb('Error: Images only!');
  // }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB file size limit
});
console.log(upload, "upload");

export default upload;
