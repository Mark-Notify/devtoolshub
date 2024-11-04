// pages/api/unserialize.js

import { unserialize } from 'php-serialize';

export default function handler(req, res) {
  const phpSerializedData = 'a:2:{s:3:"foo";s:3:"bar";s:3:"baz";s:3:"qux";}';
  
  // แปลงข้อมูลจาก PHP serialization เป็น JavaScript object
  const data = unserialize(phpSerializedData);

  res.status(200).json({ data });
}
