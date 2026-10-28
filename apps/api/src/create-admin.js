// Tạo hoặc đổi mật khẩu tài khoản ban tổ chức.
// Chạy: npm run create-admin -- email@vd.vn MatKhau "Họ tên"
import { hash as hashPassword } from 'bcryptjs';
import { query } from './db.js';

const [email, password, fullName = 'Ban tổ chức'] = process.argv.slice(2);
if (!email || !password) {
  console.log('Cách dùng: npm run create-admin -- email@vd.vn MatKhau "Họ tên"');
  process.exit(1);
}
const hash = await hashPassword(password, 10);
await query(
  `merge staff_users as t using (select @email as email) as s on t.email = s.email
   when matched then update set password_hash = @hash, full_name = @name
   when not matched then insert (email, password_hash, full_name, role) values (@email, @hash, @name, 'admin');`,
  { email, hash, name: fullName },
);
console.log(`Đã lưu tài khoản ${email}`);
process.exit(0);
