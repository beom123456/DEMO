const cds = require('@sap/cds');
const express = require('express'); 
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

cds.on('bootstrap', app => {
  app.use('/upload/image', upload.single('productImage'), async (req, res) => {
    const imagePath = '/uploads/' + req.file.filename;
    res.status(200).json({ path: imagePath });
  }); 

  app.use('/uploads', express.static(uploadDir));
});

module.exports = cds.server;
