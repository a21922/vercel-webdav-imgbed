import nextConnect from "next-connect";
import multer from "multer";
import { createClient } from "webdav";
import sharp from "sharp";


const upload = multer();
const client = createClient(
process.env.WEBDAV_URL,
{
username: process.env.WEBDAV_USERNAME,
password: process.env.WEBDAV_PASSWORD,
}
);


const apiRoute = nextConnect();
apiRoute.use(upload.array("file"));


apiRoute.post(async (req, res) => {
const result = [];


for (const file of req.files) {
const timestamp = Date.now();
const fileName = `${timestamp}-${file.originalname}`;
const thumbName = `${timestamp}-thumb-${file.originalname}`;


try {
await client.putFileContents(`${process.env.WEBDAV_BASE_PATH}${fileName}`, file.buffer, { overwrite: true });
const thumbBuffer = await sharp(file.buffer).resize({ width: 200 }).toBuffer();
await client.putFileContents(`${process.env.WEBDAV_BASE_PATH}${thumbName}`, thumbBuffer, { overwrite: true });


result.push({
url: `${process.env.BASE_IMAGE_URL}${fileName}`,
thumbUrl: `${process.env.BASE_IMAGE_URL}${thumbName}`,
});
} catch (err) {
result.push({ error: err.message });
}
}


res.status(200).json(result);
});


export const config = { api: { bodyParser: false } };
export default apiRoute;
