# HuyChat Demo - Full Project Context

> Tai lieu nay ghi lai trang thai hien tai cua project demo HuyChat, kien truc, chuc nang, du lieu Firebase, rules, cac file nguon, luong xu ly va cac gioi han dang biet.
>
> Cap nhat: 2026-09-26
>
> Project root: `SPCK_JSI02_DangQuocHuy copy/`

## 1. Tom tat project

HuyChat la mot demo mang xa hoi nho chay tren frontend HTML/CSS/JavaScript module. Firebase duoc dung cho:

- Firebase Authentication: dang ky, dang nhap, dang xuat, quen mat khau.
- Cloud Firestore: profile, bai viet, like, binh luan, reply, user search va nhan tin 1-1.
- Firebase Storage chua duoc dung. Avatar hien tai duoc nen thanh Data URL va luu trong Firestore.
- WebRTC goi dien chua duoc trien khai.
- Backend/server rieng chua co.

Project la demo hoc tap, khong phai san pham production. Landing page da duoc viet lai de chi mo ta cac tinh nang dang ton tai.

## 2. Chuc nang hien co

### Xac thuc

- Dang ky bang email va mat khau.
- Xac nhan mat khau luc dang ky.
- Dang nhap bang email va mat khau.
- Dang xuat.
- Gui email dat lai mat khau bang Firebase Auth.
- Chuyen loi Firebase thanh thong bao tieng Viet.

### Profile

- Tu dong tao document `users/{uid}` sau lan dang nhap dau tien.
- Sua ten hien thi.
- Sua gioi thieu.
- Sua dia diem.
- Sua cong viec/hoc tap.
- Chon avatar anh.
- Nen avatar ve toi da 512 px va luu Data URL.
- Xem profile cua user khac qua `profile.html?uid=...`.
- An nut sua khi dang xem profile nguoi khac.
- Hien nut nhan tin khi xem profile nguoi khac.

### Bang tin

- Dang bai viet text toi da 1000 ky tu.
- Hien 20 bai viet moi nhat.
- Like/unlike.
- Dem like.
- Binh luan.
- Tra loi binh luan.
- Dong/mo binh luan cho bai cua minh; admin cung co the quan ly.
- Xoa bai cua minh.
- Admin co the xoa bai.
- Ten hien thi duoc luu vao bai viet, binh luan va reply.
- Khi doi ten profile, ten tac gia tren cac bai viet cu cua chinh user duoc cap nhat theo batch.
- Khi doi avatar, avatar tren cac bai viet cu cua chinh user duoc cap nhat neu co avatar moi.

### Tim user

- Tim theo ten hien thi hoac email.
- Hien avatar, ten, email.
- Click ket qua de mo profile user.

### Nhan tin 1-1

- Moi cap user co mot conversation id co dinh: hai UID sap xep va noi bang `__`.
- Danh sach conversation cap nhat realtime.
- Tim user trong sidebar chat.
- Mo chat tu profile.
- Gui tin nhan text toi da 2000 ky tu.
- Hien tin nhan realtime bang `onSnapshot`.
- Tin nhan cho duoc xac dinh khi `lastSenderId` khac UID hien tai.
- Badge tin nhan cho tren trang chu.
- Conversation moi hien trang thai rong thay vi bao loi khi chua co document chat.

### Admin demo

Admin duoc nhan dien boi UID co dinh trong `app.js` va `firestore.rules`:

```text
LpxkjvP3GoPng51EHzseei9ANlD3
```

Admin co the:

- Xem danh sach user.
- Tim user theo ten, email, UID, role.
- Cam/bo cam theo field `banned`.
- Xoa document profile user.
- Xoa bai viet.

Luu y: thao tac "Xoa user" hien chi xoa document Firestore `users/{uid}`, khong xoa Firebase Authentication user. Neu muon xoa tai khoan Auth can backend Firebase Admin SDK hoac Cloud Function.

### Giao dien hien tai

- Giao dien CSS theo phong cach mang xa hoi xanh-trang: nen `#f0f2f5`, mau chinh `#0866ff`, the trang va chu toi.
- Bang tin co composer, bai dang va hang tuong tac Like/Binh luan; chat, profile, auth va welcome dung chung he mau.
- `ui.css` chua style dung chung va bang tin; `style.css` chua trang auth; `welcome.css` chua trang welcome.
- Cac thay doi giao dien chi nam trong CSS, khong thay doi HTML, JavaScript hay luong Firebase.
- Da kiem tra CSS diagnostics va overflow tren viewport desktop/mobile.

## 3. Cau truc file

| File | Vai tro |
|---|---|
| `welcome.html` | Landing page cong khai, mo ta dung cac tinh nang demo |
| `welcome.css` | CSS rieng cho landing page |
| `dangky.html` | Form dang ky email/mat khau |
| `dangnhap.html` | Form dang nhap va quen mat khau |
| `auth.js` | Logic Firebase Authentication |
| `index.html` | Bang tin, tim user, admin panel |
| `profile.html` | Profile cua minh hoac profile user khac |
| `chat.html` | Giao dien chat 1-1, conversation, tin cho |
| `app.js` | Logic Firestore va UI chinh cua app |
| `ui.css` | CSS dung chung cho app, profile, chat, feed |
| `style.css` | CSS trang dang nhap/dang ky va thong bao |
| `PROJECT_SOURCE.md` | Ban tong hop cac file nguon, bao gom snapshot stylesheet |
| `config.js` | Firebase web configuration |
| `firestore.rules` | Firestore Security Rules |
| `PROJECT_CONTEXT.md` | Tai lieu nay |

## 4. Diem vao cua ung dung

### Landing

`welcome.html` la trang cong khai. Cac CTA chinh:

- `dangky.html`
- `dangnhap.html`

### Auth

`dangky.html` va `dangnhap.html` cung nap:

```html
<script type="module" src="./auth.js"></script>
```

### Trang sau dang nhap

`index.html`, `profile.html` va `chat.html` cung nap:

```html
<script type="module" src="app.js"></script>
```

`app.js` dung `onAuthStateChanged`. Neu khong co user, app chuyen ve `dangnhap.html`.

## 5. Firebase config

File hien tai: [config.js](config.js)

```javascript
// ! Cấu hình Firebase dùng chung cho ứng dụng.
export const firebaseConfig = {
  apiKey: "AIzaSyCLcyr5-nSQ3r1L6_ElMnhdw2ZfRe4Im-k",
  authDomain: "spckjsi02dangquochuy.firebaseapp.com",
  projectId: "spckjsi02dangquochuy",
  storageBucket: "spckjsi02dangquochuy.firebasestorage.app",
  messagingSenderId: "716868205313",
  appId: "1:716868205313:web:102627441af2e82bb4b900",
  measurementId: "G-MKHJPRM9QP"
};
```

Firebase Web API key khong phai mat khau server. Bao mat chinh nam o Authentication, Firestore Rules va viec khong de lo secret backend.

## 6. Schema Firestore

### `users/{uid}`

```javascript
{
  uid: string,
  email: string,
  displayName: string,
  bio: string,
  location: string,
  occupation: string,
  avatarUrl: string | null,
  role: "user" | "admin",
  banned: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

`role` va `banned` duoc bao ve trong rule de user thuong khong tu nang quyen.

### `posts/{postId}`

```javascript
{
  content: string,
  authorId: string,
  authorName: string,
  authorEmail: string,
  avatarUrl: string | null,
  likesCount: number,
  commentsCount: number,
  commentsEnabled: boolean,
  createdAt: Timestamp
}
```

Subcollection like:

```text
posts/{postId}/likes/{userId}
```

Document like:

```javascript
{
  userId: string,
  postId: string,
  createdAt: Timestamp
}
```

Subcollection comment:

```text
posts/{postId}/comments/{commentId}
```

Document comment:

```javascript
{
  authorId: string,
  authorName: string,
  content: string,
  createdAt: Timestamp
}
```

Subcollection reply:

```text
posts/{postId}/comments/{commentId}/replies/{replyId}
```

Document reply:

```javascript
{
  authorId: string,
  authorName: string,
  content: string,
  createdAt: Timestamp
}
```

### `chats/{conversationId}`

Conversation ID duoc tao bang:

```javascript
[firstUserId, secondUserId].sort().join("__")
```

Document conversation:

```javascript
{
  participantIds: [string, string],
  participantProfiles: {
    [uid]: {
      displayName: string,
      email: string,
      avatarUrl: string | null
    }
  },
  lastMessage: string,
  lastSenderId: string,
  lastMessageAt: Timestamp,
  updatedAt: Timestamp
}
```

Subcollection tin nhan:

```text
chats/{conversationId}/messages/{messageId}
```

Document message:

```javascript
{
  senderId: string,
  receiverId: string,
  content: string,
  createdAt: Timestamp
}
```

## 7. Luong xac thuc

### Dang ky

1. User nhap email, mat khau, xac nhan mat khau.
2. Client kiem tra field rong.
3. Client kiem tra hai mat khau trung nhau.
4. Client kiem tra mat khau toi thieu 6 ky tu.
5. Goi `createUserWithEmailAndPassword`.
6. Firebase tu dang nhap user moi.
7. App goi `signOut` de yeu cau user dang nhap lai.
8. Chuyen toi `dangnhap.html?registered=true`.

### Dang nhap

1. User nhap email va mat khau.
2. Goi `signInWithEmailAndPassword`.
3. Thanh cong thi chuyen toi `index.html`.
4. `app.js` doc profile va bat cac listener.

### Quen mat khau

1. User nhap email tren `dangnhap.html`.
2. Bam `Quen mat khau?`.
3. Goi `sendPasswordResetEmail`.
4. Firebase gui email theo action code settings cua project.

## 8. Luong profile

`app.js` lay UID profile tu query string:

```text
profile.html?uid=TARGET_UID
```

Neu khong co `uid`, app dung `auth.currentUser.uid`.

- Profile cua minh: cho hien nut sua va form.
- Profile nguoi khac: an nut sua, hien nut `Nhắn tin`.
- `loadProfile` doc `users/{uid}`.
- Neu profile cua minh chua co document, app tao document fallback.
- Neu document cu thieu field, app merge voi fallback de khong bi trang.

## 9. Luong bang tin

`watchPosts()` tao query:

```javascript
query(
  collection(db, "posts"),
  orderBy("createdAt", "desc"),
  limit(20)
)
```

Moi khi snapshot thay doi, `renderPosts` render lai bai viet. Moi bai co:

- Author header.
- Avatar.
- Content.
- Like count.
- Comment count.
- Like button.
- Toggle comment.
- Reply toggle.
- Delete neu user la author hoac admin.

## 10. Luong doi ten hien thi

Nguon ten hien thi hien tai la `currentProfileDisplayName`.

- Sau khi dang nhap, fallback la phan truoc dau `@` cua email.
- Sau khi load profile, neu co `displayName` thi dung ten do.
- Bai viet moi dung `getCurrentAuthorName()`.
- Comment moi dung `getCurrentAuthorName()`.
- Reply moi dung `getCurrentAuthorName()`.
- Khi submit profile, `updateOwnPostDetails` dung `writeBatch` de cap nhat `authorName` tren cac bai cua user.
- Avatar bai cu chi duoc update neu user chon avatar moi.

## 11. Luong chat

1. `initializeChat` query cac chat co `participantIds` chua UID hien tai.
2. Conversation list duoc sap xep theo `lastMessageAt`.
3. Sidebar co the tim user trong collection `users`.
4. Click user goi `openChatWithUser`.
5. Neu conversation chua ton tai, hien trang thai `Hãy gửi lời chào đầu tiên.`.
6. Khong subscribe vao message subcollection khi conversation chua ton tai.
7. Khi gui tin dau tien, app tao/cap nhat conversation truoc.
8. Sau do app bat listener message.
9. Moi tin nhan duoc render theo `senderId` de phan biet sent/received.
10. Tin cho la conversation co `lastSenderId` khac UID hien tai.

## 12. Firestore Rules hien tai

File nguon: [firestore.rules](firestore.rules)

```text
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return signedIn()
        && (
          request.auth.uid == 'LpxkjvP3GoPng51EHzseei9ANlD3'
          || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
        );
    }

    match /users/{userId} {
      allow read: if signedIn();
      allow create: if signedIn() && request.auth.uid == userId;
      allow update: if isAdmin()
        || (signedIn()
          && request.auth.uid == userId
          && request.resource.data.role == resource.data.role
          && request.resource.data.banned == resource.data.banned);
      allow delete: if isAdmin();
    }

    match /posts/{postId} {
      allow read: if signedIn();
      allow create: if signedIn() && request.resource.data.authorId == request.auth.uid;
      allow update: if signedIn() && (
        resource.data.authorId == request.auth.uid || isAdmin()
        || request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['likesCount', 'commentsCount'])
      );
      allow delete: if signedIn()
        && (resource.data.authorId == request.auth.uid || isAdmin());

      match /likes/{userId} {
        allow read: if signedIn();
        allow create: if signedIn() && request.auth.uid == userId;
        allow delete: if signedIn() && request.auth.uid == userId;
      }

      match /comments/{commentId} {
        allow read: if signedIn();
        allow create: if signedIn() && request.resource.data.authorId == request.auth.uid;
        allow update, delete: if signedIn()
          && (resource.data.authorId == request.auth.uid || isAdmin());

        match /replies/{replyId} {
          allow read: if signedIn();
          allow create: if signedIn() && request.resource.data.authorId == request.auth.uid;
          allow update, delete: if signedIn()
            && (resource.data.authorId == request.auth.uid || isAdmin());
        }
      }
    }

    match /chats/{chatId} {
      allow read: if signedIn()
        && resource.data.participantIds.hasAny([request.auth.uid]);
      allow create: if signedIn()
        && request.resource.data.participantIds.size() == 2
        && request.resource.data.participantIds.hasAny([request.auth.uid]);
      allow update: if signedIn()
        && resource.data.participantIds.hasAny([request.auth.uid])
        && request.resource.data.participantIds.size() == 2
        && resource.data.participantIds.hasAll(request.resource.data.participantIds)
        && request.resource.data.participantIds.hasAll(resource.data.participantIds);
      allow delete: if signedIn()
        && resource.data.participantIds.hasAny([request.auth.uid]);

      match /messages/{messageId} {
        allow read: if signedIn()
          && get(/databases/$(database)/documents/chats/$(chatId)).data.participantIds.hasAny([request.auth.uid]);
        allow create: if signedIn()
          && request.resource.data.senderId == request.auth.uid
          && request.resource.data.receiverId != request.auth.uid
          && request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participantIds
          && request.resource.data.receiverId in get(/databases/$(database)/documents/chats/$(chatId)).data.participantIds;
        allow update, delete: if false;
      }
    }
  }
}
```

### Y nghia rules

- User dang nhap moi doc duoc `users`, can thiet cho tim kiem va profile.
- User chi tao/sua profile cua chinh minh.
- User thuong khong duoc doi `role` va `banned`.
- Admin duoc sua/xoa profile user.
- User chi tao post voi `authorId` la UID cua minh.
- User chi xoa post cua minh; admin xoa duoc moi post.
- Like chi do chinh user tao/xoa voi document UID cua minh.
- Comment/reply phai ghi dung `authorId` hien tai.
- Chat chi doc/ghi neu la mot trong hai participant.
- Tin nhan chi duoc tao boi sender dung voi auth UID va receiver nam trong conversation.

Nho Publish file rules tren Firebase Console sau moi thay doi. Project hien chua co Firebase CLI trong moi truong nay.

## 13. Toan bo file nguon

Day la danh sach link toi **toan bo ma nguon hien tai**, khong phai ban sao cu. Mo cac link nay de xem dung code dang chay:

- [app.js](app.js) - 1497 dong, logic Firebase/Firestore/UI chinh.
- [auth.js](auth.js) - 149 dong, auth va reset password.
- [config.js](config.js) - Firebase config.
- [firestore.rules](firestore.rules) - Security Rules.
- [welcome.html](welcome.html) - landing page.
- [welcome.css](welcome.css) - landing styles.
- [dangky.html](dangky.html) - register page.
- [dangnhap.html](dangnhap.html) - login/reset password page.
- [index.html](index.html) - feed/search/admin page.
- [profile.html](profile.html) - profile page.
- [chat.html](chat.html) - private chat page.
- [ui.css](ui.css) - shared UI styles.
- [style.css](style.css) - auth page styles.

### Tai sao khong copy 1497 dong `app.js` vao day?

`app.js` la file dieu khien trung tam va thay doi thuong xuyen. Neu copy nguyen file vao tai lieu, tai lieu se nhanh chong lech voi code chay that. Link o tren tro truc tiep toi source hien tai va giu duoc tinh chinh xac. Cac config, schema, rules va luong quan trong da duoc ghi day du trong tai lieu nay.

## 14. Cach chay demo

Project la static frontend. Co the chay bang Live Server trong VS Code hoac mot static server.

Vi du:

```bash
cd "/Users/hongphan/Desktop/JSI02-LVV/SPCK_JSI02_DangQuocHuy copy"
```

Sau do mo `welcome.html` bang Live Server.

Khong nen mo bang `file://` neu trinh duyet chan ES modules hoac Firebase request.

## 15. Cach cau hinh Firebase

1. Tao/chon Firebase project.
2. Bat Email/Password trong Authentication.
3. Tao Firestore Database.
4. Paste noi dung [firestore.rules](firestore.rules) vao Firestore Rules.
5. Bấm Publish.
6. Kiem tra `projectId`, `authDomain`, `appId` trong [config.js](config.js).
7. Neu dung reset password, kiem tra Auth email templates va authorized domains.

## 16. Kiem tra nhanh

Lenh da dung de kiem tra syntax:

```bash
node --check "SPCK_JSI02_DangQuocHuy copy/auth.js"
node --check "SPCK_JSI02_DangQuocHuy copy/app.js"
```

Diagnostics hien tai cua HTML/JS khong co loi.

Firebase CLI chua duoc cai trong moi truong kiem tra, vi vay `firestore.rules` can duoc validate/publish truc tiep tren Firebase Console.

## 17. Checklist test thu cong

### Auth

- [ ] Dang ky email moi.
- [ ] Dang nhap bang email/mat khau.
- [ ] Nhap sai mat khau.
- [ ] Bam quen mat khau va kiem tra email.
- [ ] Dang xuat.

### Profile

- [ ] Sua display name.
- [ ] Sua bio/location/occupation.
- [ ] Upload avatar hop le.
- [ ] Mo profile nguoi khac.
- [ ] Kiem tra nut nhan tin.

### Feed

- [ ] Dang bai.
- [ ] Like/unlike.
- [ ] Comment.
- [ ] Reply.
- [ ] Xoa bai cua minh.
- [ ] Doi display name va kiem tra bai cu.

### Chat

- [ ] Tim user.
- [ ] Mo conversation moi.
- [ ] Mo conversation cu.
- [ ] Gui tin tu tai khoan A.
- [ ] Tra loi tu tai khoan B.
- [ ] Kiem tra tin cho.
- [ ] Kiem tra badge trang chu.

### Rules

- [ ] User A khong sua duoc profile user B.
- [ ] User A khong xoa duoc post user B.
- [ ] User khong doc duoc chat khong lien quan.
- [ ] User khong tao message voi senderId gia.
- [ ] Admin co the quan ly user/post theo dung UID.

## 18. Gioi han hien tai

- Chua co goi audio/video.
- Chua co follow/friend request.
- Chua co notification collection rieng.
- Chua co upload anh bai viet.
- Avatar luu Data URL trong Firestore, khong phu hop anh lon/production.
- Search user dang doc ca collection users va filter o client, khong phu hop quy mo lon.
- Tin nhan chua co read receipt, typing indicator hay pagination.
- Counter like/comment cap nhat theo client, co the xung dot neu nhieu request dong thoi.
- Admin UID dang hard-code trong client va rules; production nen dung custom claims.
- Xoa profile khong xoa Firebase Authentication account.
- Khong co backend de chong spam, moderation nang cao hay audit log.

## 19. De xuat neu phat trien tiep

Uu tien hop ly:

1. Them Firebase Storage cho avatar va anh bai viet.
2. Dung Cloud Functions/transactions cho counter.
3. Dung custom claims cho admin.
4. Them read receipt va pagination cho chat.
5. Them notification khi co message/comment.
6. Them edit post.
7. Them goi audio/video bang WebRTC sau khi chat text on dinh.

## 20. Ghi chu bao tri

- Khi them field vao profile, cap nhat `loadProfile`, `updateProfileDetails`, form trong `profile.html`, search renderer va rules neu can.
- Khi them collection Firestore, phai cap nhat ca code va `firestore.rules`.
- Khi doi auth flow, kiem tra ca `dangky.html`, `dangnhap.html` va `auth.js`.
- Khong xoa `displayName`: no dang duoc dung trong profile, search, post, comment, reply va chat.
- Khong coi `welcome.html` la bang dieu khien; day chi la landing page cong khai.
- Sau khi sua rules, luon Publish tren Firebase Console va test bang hai tai khoan khac nhau.

---

## Ket luan

Trang demo hien da co day du phan cot cua mot mang xa hoi nho: Auth, profile, feed, interaction, user search, private messaging va admin demo. `PROJECT_CONTEXT.md` nay la tai lieu tong hop context va link den source that. Source code van nam trong cac file JS/HTML/CSS/rules rieng de de chay, debug va khong bi lech khi cap nhat.
