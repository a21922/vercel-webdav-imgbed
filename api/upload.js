import nextConnect from "next-connect";


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
const basePath = (process.env.WEBDAV_BASE_PATH || '/images/').replace(/\\/g, '/');


for (const file of req.files) {
const timestamp = Date.now();
const fileName = `${timestamp}-${file.originalname}`;
const thumbName = `${timestamp}-thumb-${file.originalname}`;


try {
const filePath = `${basePath}${fileName}`;
const thumbPath = `${basePath}${thumbName}`;


console.log("Uploading to WebDAV path:", filePath);


await client.putFileContents(filePath, file.buffer, { overwrite: true });
const thumbBuffer = await sharp(file.buffer).resize({ width: 200 }).toBuffer();
await client.putFileContents(thumbPath, thumbBuffer, { overwrite: true });


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


// pages/index.js
import { useState, useEffect } from "react";


export default function Home() {
const [uploaded, setUploaded] = useState([]);


const handleUpload = async (fileList) => {
if (!fileList || fileList.length === 0) return;
const formData = new FormData();
for (const file of fileList) formData.append("file", file);


const res = await fetch("/api/upload", { method: "POST", body: formData });
const data = await res.json();
setUploaded((prev) => [...prev, ...data]);
};


useEffect(() => {
const handlePaste = (e) => {
const items = e.clipboardData.items;
const pastedFiles = [];
for (let i = 0; i < items.length; i++) {
if (items[i].kind === "file") pastedFiles.push(items[i].getAsFile());
}
if (pastedFiles.length > 0) handleUpload(pastedFiles);
};
window.addEventListener("paste", handlePaste);
return () => window.removeEventListener("paste", handlePaste);
}, []);


return (
<div style={{ padding: "50px" }}>
<h2>上传图片或粘贴截图</h2>
<input type="file" multiple onChange={(e) => handleUpload([...e.target.files])} />
<div style={{ marginTop: "20px" }}>
{uploaded.map((item, idx) => (
<div key={idx} style={{ marginBottom: "10px" }}>
{item.error ? <p>上传失败：{item.error}</p> : (
<>
<p>原图：<a href={item.url} target="_blank">{item.url}</a></p>
<img src={item.thumbUrl} alt="thumb" style={{ maxWidth: "150px" }} />
</>
)}
</div>
))}
</div>
</div>
);
}
