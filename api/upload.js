import { createClient } from "webdav";
import formidable from "formidable";
import fs from "fs";
import sharp from "sharp";

export const config = {
  api: { bodyParser: false },
};

const client = createClient(
  process.env.WEBDAV_URL,
  {
    username: process.env.WEBDAV_USERNAME,
    password: process.env.WEBDAV_PASSWORD,
  }
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const form = formidable({ multiples: true });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: err.message });

    const fileArray = Array.isArray(files.file) ? files.file : [files.file];
    const result = [];

    for (const file of fileArray) {
      const fileData = fs.readFileSync(file.filepath);
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.originalFilename}`;
      const thumbName = `${timestamp}-thumb-${file.originalFilename}`;

      try {
        // 上传原图
        await client.putFileContents(`${process.env.WEBDAV_BASE_PATH}${fileName}`, fileData, { overwrite: true });

        // 生成缩略图（宽度 200px）
        const thumbBuffer = await sharp(fileData).resize({ width: 200 }).toBuffer();
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
}
