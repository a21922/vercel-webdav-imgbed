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

  // 粘贴事件上传
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

      {/* 文件选择自动上传 */}
      <input
        type="file"
        multiple
        onChange={(e) => {
          if (e.target.files.length > 0) handleUpload([...e.target.files]);
          e.target.value = null; // 清空选择，允许重复上传同一文件
        }}
      />

      <div style={{ marginTop: "20px" }}>
        {uploaded.map((item, idx) => (
          <div key={idx} style={{ marginBottom: "10px" }}>
            {item.error ? (
              <p>上传失败：{item.error}</p>
            ) : (
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
