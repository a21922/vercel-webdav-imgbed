import nextConnect from "next-connect";
import multer from "multer";
import { createClient } from "webdav";
import sharp from "sharp";

const upload = multer(); // 内存存储

const client = createClient(
  process.env.WEBDAV_URL,
  {
    username: process.env.WEBDAV_USERNAME,
    password: process.env.WEBDAV_PASSWORD,
  }
);

const apiRoute = nextConnect({
  onError(error, req, res) {
    res.status(501).json({ error: `Something went wrong: ${error.message}` });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method '${req.method}' not allowed` });
  },
});

apiRoute.use(upload.array("file"));

apiRoute.post(async (req, res) => {
  const result = [];

  for (const file of req.files) {
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.originalname}`;
    const thumbName = `${timestamp}-thumb-${file.originalname}`;

    try {
      // 上传原图
      await client.putFileContents(`${process.env.WEBDAV_BASE_PATH}${fileName}`, file.buffer, { overwrite: true });

      // 生成缩略图
      const thumbBuffer = await sharp(file.buffer).resize({ width: 200 }).toBuffer();
      await client.putFileContents(`${process.env.WEBDAV_BASE_PATH}${thumbName}`, thumbBuffer, { overwrite: true });

      result.push({
        url: `${process.env.BASE_IMAGE_URL}${fileName}`,
        thumbUrl: `${process.env.BASE_IMAGE_URL}${thumbName}`,
      });
    } catch (error) {
      result.push({ error: error.message });
    }
  }

  res.status(200).json(result);
});

export const config = {
  api: {
    bodyParser: false, // 必须禁用内置 bodyParser
  },
};

export default apiRoute;
