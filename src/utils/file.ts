import fs from 'fs';
import path from 'path';

export const initFolder = () => {
  const uploadsPathFolder = path.resolve('uploads');
  if (!fs.existsSync(uploadsPathFolder)) {
    fs.mkdirSync(uploadsPathFolder, {
      recursive: true // Tạo nested folder
    });
  }
};
