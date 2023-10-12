const dotenv = require("dotenv");
dotenv.config();
const express = require('express');
const router = express.Router();

const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3')

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
const S3_BUCKET_REGION = process.env.S3_BUCKET_REGION;
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY;
const S3_SECRET_KEY = process.env.S3_SECRET_KEY;

// Configure AWS
// aws.config.update({
//   credentials: {
//     accessKeyId: S3_ACCESS_KEY,
//     secretAccessKey: S3_SECRET_KEY
//   },
//   region: S3_BUCKET_REGION
// })

// const s3 = new aws.S3();

// const upload = multer({
//   storage: multerS3({
//     s3: s3,
//     bucket: S3_BUCKET_NAME,
//     metadata: function (req, file, cb) {
//       cb(null, { photographer: req.body.photographer }); // Add the photographer property
//     },
//     key: function (req, file, cb) {
//       cb(null, Date.now().toString() + '-' + file.originalname);
//     },
//   }),
// });

// router.post('/upload', upload.array('s3Images', 1), (req, res) => {
//   // Handle the file upload and any additional processing here
//   res.json({ message: 'File uploaded successfully' });
// });

const s3 = new S3Client({
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY
  },
  region: S3_BUCKET_REGION
})

const uploadWithMulter = () => multer({
  storage: multerS3({
    s3: s3,
    bucket: S3_BUCKET_NAME,
    metadata: function(req, file, cb) {
      cb(null, { photographer: req.body.photographer });
    }, 
    key: function(req, file, cb) {
      cb(null, Date.now().toString() + '-' + file.originalname);
    }
  })
}).array("s3Images", 4);

const uploadToAws = (req, res, next) => {
  const upload = uploadWithMulter();

  upload(req, res, err => {
    if (err) {
      console.log(err)
      res.json({ err, msg: 'Error occured while uploading'})
      return
    };

    res.json({msg: 'files uploaded successfully', files: req.files })
  })
}

router.post('/upload', uploadToAws);

module.exports = router;