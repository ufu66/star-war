const express = require("express");
const path = require("path");

const app = express();

const PORT = 3000;

// ให้ Express อ่าน JSON
app.use(express.json());

// เปิดไฟล์หน้าเว็บจากโฟลเดอร์โปรเจกต์
app.use(express.static(__dirname));

// หน้าแรก
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});