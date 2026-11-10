# Star Wars Character Database

เว็บแอป React + Vite สำหรับค้นหาตัวละคร Star Wars แยกตามภาพยนตร์ ดูข้อมูลยาน และบันทึกรายการโปรด ข้อมูลหลักมาจาก SWAPI

## เริ่มต้นใช้งาน

```sh
npm install
npm run dev
```

เปิดเว็บ Vite ที่ `http://localhost:5173` โดย Vite ส่ง `/api` ไปยัง Express ที่ `http://localhost:3000`

สร้าง production build และรัน Express:

```sh
npm start
```

สคริปต์ `start` สร้างไฟล์ด้วย Vite ลง `public/` ก่อน แล้ว Express ให้บริการ frontend และ API ใน process เดียวกัน

## Deploy บน Vercel

โปรเจกต์ใช้ Express preset โดย Vercel build frontend ลง `public/` เพื่อให้ CDN เสิร์ฟ static assets และส่ง API ผ่าน Express function ไฟล์โลโก้ต้นทางอยู่ใน `static/` และถูกคัดลอกเข้าผล build อัตโนมัติ

รันทดสอบ DSA:

```sh
npm test
```

## Component tree

```text
App
├── FilmExplorer
├── CharacterToolbar
├── CharacterGrid
│   └── CharacterCard
├── CharacterDetailDialog
└── StarshipDialog

LoadingState (ใช้ร่วมใน FilmExplorer, CharacterGrid, CharacterDetailDialog และ StarshipDialog)
```

`App` ถือ state ร่วมของภาพยนตร์ ตัวละคร คำค้น การเรียง รายการถูกใจ และ dialog ส่วนแต่ละ component รับข้อมูล/เหตุการณ์ผ่าน props ทำให้ส่วนแสดงผลแยกจากการจัดการข้อมูลและทดสอบเป็นส่วน ๆ ได้

## Backend และ API

Express ไม่ใช่เพียง static server แต่เป็น service layer สำหรับเรียก SWAPI:

- `GET /api/films` ส่งคืนรายการภาพยนตร์
- `GET /api/people` รวมผลตัวละครจากทุกหน้า SWAPI
- `GET /api/starships/:id`, `/api/species/:id`, `/api/planets/:id` ดึงรายละเอียดตาม resource ที่อนุญาต
- `GET /api/health` แสดงสถานะและสถิติ cache

Backend ใช้ allowlist ของ resource และตรวจรูปแบบ ID ก่อนเรียก upstream โดยประกอบ URL จาก host SWAPI ที่กำหนดตายตัว จึงไม่เปิด arbitrary URL proxy มี timeout, แปลง upstream/network error เป็น JSON และรวมคำขอเดียวกันที่กำลังทำงานอยู่

## UX states

การโหลดภาพยนตร์ ตัวละคร และยานแยกสถานะ `loading`, `empty`, `error` และ `success` เมื่อเกิด error มีปุ่มลองใหม่ ข้อมูลตัวละครกรองตามภาค คำค้น และรายการถูกใจได้ทันทีโดยไม่ต้องส่งฟอร์ม

## DSA และประสิทธิภาพ

- **React — กรองตัวละครตามภาค:** สร้าง `Set` จาก URL ตัวละครในภาพยนตร์หนึ่งครั้ง แล้วตรวจสมาชิกเฉลี่ย `O(1)` ต่อคน การกรองใช้ pass เดียว `O(P + F)` รวมการสร้าง Set โดย `P` คือจำนวนตัวละครทั้งหมดและ `F` คือจำนวน URL ของตัวละครในภาคนั้น หากใช้ `Array.includes` สำหรับทุกคนจะเป็น `O(P × F)`. `useMemo` รักษาผลลัพธ์ไว้จนกว่าข้อมูลหรือ filter จะเปลี่ยน
- **Express — response cache:** ใช้ `Map` ที่เก็บ insertion order เป็น LRU จำกัดสูงสุด 256 รายการและอายุ 5 นาที การค้นหา/เลื่อน cache hit/เพิ่มรายการเป็น `O(1)` โดยเฉลี่ย และ eviction ลบรายการที่ใช้นานที่สุดใน `O(1)`. Concurrent request ของ key เดียวกันแชร์ Promise เดียว ลดคำขอซ้ำไปยัง SWAPI
- **การเรียง:** เรียงเฉพาะผลที่ผ่าน filter จำนวน `K` รายการ ใช้ `O(K log K)` ไม่เรียงข้อมูลทั้งหมดก่อนกรอง
