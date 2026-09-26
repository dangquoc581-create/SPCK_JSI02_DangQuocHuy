# Project Source

> CSS snapshots synchronized with current stylesheet files on 2026-09-26.

## Mục lục

- app.js

- auth.js

- chat.html

- config.js

- dangky.html

- dangnhap.html

- firestore.rules

- index.html

- profile.html

- style.css

- ui.css

- welcome.css

- welcome.html


## app.js

```javascript
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    where,
    writeBatch
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { firebaseConfig } from "./config.js";

// ! Khởi tạo Firebase Authentication.
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ! Lấy các phần tử hiển thị thông tin người dùng.
const userEmailElements = document.querySelectorAll("[data-user-email]");
const userNameElements = document.querySelectorAll("[data-user-name]");
const signOutButtons = document.querySelectorAll("[data-sign-out]");
const postForm = document.getElementById("post-form");
const postContent = document.getElementById("post-content");
const postsList = document.getElementById("posts-list");
const postStatus = document.getElementById("post-status");
const userInitials = document.querySelectorAll("[data-user-initials]");
const userAvatars = document.querySelectorAll("[data-user-avatar]");
let currentProfileAvatar = "";
let currentProfileDisplayName = "";
const editProfileButton = document.querySelector("[data-edit-profile]");
const cancelProfileButton = document.querySelector("[data-cancel-profile]");
const profileForm = document.getElementById("profile-form");
const profileStatus = document.getElementById("profile-status");
const profileName = document.getElementById("profile-name");
const profileBio = document.getElementById("profile-bio");
const profileLocation = document.getElementById("profile-location");
const profileOccupation = document.getElementById("profile-occupation");
const profileBioText = document.querySelector("[data-profile-bio]");
const profileLocationText = document.querySelector("[data-profile-location]");
const profileOccupationText = document.querySelector("[data-profile-occupation]");
const profileAvatarInput = document.getElementById("profile-avatar");
const messageUserButton = document.querySelector("[data-message-user]");
const messageCountElements = document.querySelectorAll("[data-message-count]");
const chatApp = document.getElementById("chat-app");
const conversationSearchInput = document.getElementById("conversation-search");
const chatUserSearchResults = document.getElementById("user-search-results");
const conversationList = document.getElementById("conversation-list");
const pendingMessageToggle = document.getElementById("pending-message-toggle");
const pendingMessageLabel = document.getElementById("pending-message-label");
const pendingMessageCount = document.getElementById("pending-message-count");
const pendingMessageList = document.getElementById("pending-message-list");
const activeChatHeader = document.getElementById("active-chat-header");
const messageList = document.getElementById("message-list");
const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");
const adminPanel = document.getElementById("admin-panel");
const adminUserList = document.getElementById("admin-user-list");
const adminSearchInput = document.getElementById("admin-user-search");
const adminSearchStatus = document.getElementById("admin-search-status");
const userSearchInput = document.getElementById("user-search");
const userSearchResults = document.getElementById("user-search-results");
const userSearchStatus = document.getElementById("user-search-status");
const ADMIN_UID = "LpxkjvP3GoPng51EHzseei9ANlD3";
const postCommentState = {};
const replyState = {};
const DEMO_USERS = [
    {
        uid: ADMIN_UID,
        email: "admin@demo.com",
        displayName: "admin",
        role: "admin",
        banned: false
    },
    {
        uid: "user-001",
        email: "alice@gmail.com",
        displayName: "alice",
        role: "user",
        banned: false
    },
    {
        uid: "user-002",
        email: "bob@gmail.com",
        displayName: "bob",
        role: "user",
        banned: true
    }
];
let allUsers = [];
let currentAuthenticatedUser = null;
let profileOwnerUid = null;
let chatConversations = [];
let activeConversationId = null;
let activeChatUser = null;
let stopMessagesListener = null;


function updateUserDetails(user) {
    const name = user.email?.split("@")[0] || "Bạn";
    const initials = name.slice(0, 2).toUpperCase();
    currentProfileDisplayName = name;

    userEmailElements.forEach((element) => {
        element.textContent = user.email || "";
    });

    userNameElements.forEach((element) => {
        element.textContent = name;
    });

    userInitials.forEach((element) => {
        element.textContent = initials;
    });
}


function updateProfileDetails(profile) {
    const name = profile.displayName || "Bạn";
    const bio = profile.bio || "Chưa cập nhật phần giới thiệu.";
    const location = profile.location || "Chưa cập nhật địa điểm";
    const occupation = profile.occupation || "Chưa cập nhật công việc / học tập";
    currentProfileAvatar = profile.avatarUrl || "";
    currentProfileDisplayName = name;

    userNameElements.forEach((element) => {
        element.textContent = name;
    });
    userEmailElements.forEach((element) => {
        element.textContent = profile.email || "";
    });
    userInitials.forEach((element) => {
        element.textContent = name.slice(0, 2).toUpperCase();
    });
    if (profileBioText) profileBioText.textContent = bio;
    if (profileLocationText) profileLocationText.textContent = `📍 ${location}`;
    if (profileOccupationText) profileOccupationText.textContent = `🎓 ${occupation}`;
    userAvatars.forEach((avatar) => {
        avatar.innerHTML = profile.avatarUrl
            ? `<img src="${escapeHtml(profile.avatarUrl)}" alt="Ảnh đại diện của ${escapeHtml(name)}">`
            : `<span data-user-initials>${escapeHtml(name.slice(0, 2).toUpperCase())}</span>`;
    });
}


async function loadProfile(user, persistMissing = true) {
    const fallbackProfile = {
        displayName: user.email?.split("@")[0] || "Bạn",
        email: user.email || "",
        bio: "",
        location: "",
        occupation: "",
        role: user.uid === ADMIN_UID ? "admin" : "user"
    };

    try {
        const profileSnapshot = await getDoc(doc(db, "users", user.uid));
        const profile = profileSnapshot.exists()
            ? { ...fallbackProfile, ...profileSnapshot.data() }
            : fallbackProfile;

        if (!profileSnapshot.exists() && persistMissing) {
            await setDoc(doc(db, "users", user.uid), {
                ...profile,
                email: user.email,
                uid: user.uid,
                createdAt: serverTimestamp()
            }, { merge: true });
        }

        updateProfileDetails(profile);
        if (!profileForm) return profile;

        profileName.value = profile.displayName || "";
        profileBio.value = profile.bio || "";
        profileLocation.value = profile.location || "";
        profileOccupation.value = profile.occupation || "";
        return profile;
    } catch (error) {
        updateProfileDetails(fallbackProfile);
        if (!profileForm) return fallbackProfile;

        profileName.value = fallbackProfile.displayName || "";
        profileBio.value = "";
        profileLocation.value = "";
        profileOccupation.value = "";
        return fallbackProfile;
    }
}


function renderUserSearchResults() {
    if (!userSearchInput || !userSearchResults || !userSearchStatus) {
        return;
    }

    const keyword = userSearchInput.value.trim().toLowerCase();
    if (!keyword) {
        userSearchStatus.textContent = "Nhập tên hoặc email để tìm người dùng.";
        userSearchResults.innerHTML = "";
        return;
    }

    const filteredUsers = allUsers.filter((userProfile) => {
        const searchText = [userProfile.displayName, userProfile.email]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
        return searchText.includes(keyword);
    });

    userSearchStatus.textContent = filteredUsers.length
        ? `Tìm thấy ${filteredUsers.length} người dùng`
        : "Không tìm thấy người dùng phù hợp.";
    userSearchResults.innerHTML = filteredUsers.map((userProfile) => {
        const name = userProfile.displayName || userProfile.email?.split("@")[0] || "Không tên";
        const initials = name.slice(0, 2).toUpperCase();
        const avatar = userProfile.avatarUrl
            ? `<img src="${escapeHtml(userProfile.avatarUrl)}" alt="Ảnh đại diện của ${escapeHtml(name)}">`
            : escapeHtml(initials);

        return `
            <a class="d-flex align-items-center gap-3 border rounded p-3 text-decoration-none text-reset"
                href="profile.html?uid=${encodeURIComponent(userProfile.uid)}">
                <span class="hc-avatar">${avatar}</span>
                <span>
                    <span class="fw-semibold d-block">${escapeHtml(name)}</span>
                    <small class="hc-muted">${escapeHtml(userProfile.email || "Chưa có email")}</small>
                </span>
            </a>
        `;
    }).join("");
}


async function loadUsersForSearch() {
    if (!userSearchInput || !userSearchResults) {
        return;
    }

        try {
            const usersSnapshot = await getDocs(collection(db, "users"));
            allUsers = usersSnapshot.docs.map((userDocument) => ({
                uid: userDocument.id,
                ...userDocument.data()
            }));
            renderUserSearchResults();
        } catch (error) {
            userSearchStatus.textContent = error.code === "permission-denied"
                ? "Bạn chưa có quyền tìm kiếm người dùng."
                : "Không thể tải danh sách người dùng.";
            console.error("User search load error:", error);
        }
    }


function isAdminUser(user, profile = null) {
    return Boolean(profile?.role === "admin" || user?.uid === ADMIN_UID);
}


function renderAdminUsers() {
    if (!adminUserList || !adminSearchInput) {
        return;
    }

    const keyword = adminSearchInput.value.trim().toLowerCase();
    const filteredUsers = !keyword
        ? allUsers
        : allUsers.filter((userProfile) => {
            const searchText = [
                userProfile.displayName,
                userProfile.email,
                userProfile.uid,
                userProfile.role
            ].filter(Boolean).join(" ").toLowerCase();

            return searchText.includes(keyword);
        });

    if (!filteredUsers.length) {
        adminSearchStatus.textContent = "Không tìm thấy người dùng.";
        adminUserList.innerHTML = '<p class="mb-0 hc-muted">Không có người dùng nào phù hợp.</p>';
        return;
    }

    adminSearchStatus.textContent = `Hiển thị ${filteredUsers.length} người dùng`;
    adminUserList.innerHTML = filteredUsers.map((userProfile) => {
        const isBanned = Boolean(userProfile.banned);
        const isSelf = currentAuthenticatedUser && userProfile.uid === currentAuthenticatedUser.uid;
        const statusText = isBanned ? "Bị cấm" : (userProfile.role === "admin" ? "Admin" : "User");

        return `
            <div class="border rounded p-3 bg-light-subtle">
                <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                    <div>
                        <div class="fw-semibold">${escapeHtml(userProfile.displayName || userProfile.email?.split("@")[0] || "Không tên")}</div>
                        <small class="hc-muted d-block">${escapeHtml(userProfile.email || "Chưa có email")}</small>
                        <small class="hc-muted d-block">UID: ${escapeHtml(userProfile.uid || "-")}</small>
                    </div>
                    <span class="badge ${isBanned ? "text-bg-danger" : "text-bg-secondary"}">${statusText}</span>
                </div>

                <div class="d-flex gap-2 mt-3 flex-wrap">
                    <button
                        type="button"
                        class="btn btn-sm ${isBanned ? "btn-success" : "btn-warning"}"
                        data-user-action="toggle-ban"
                        data-user-id="${escapeHtml(userProfile.uid || "")}"
                        ${isSelf ? "disabled" : ""}
                    >
                        ${isBanned ? "Bỏ cấm" : "Cấm"}
                    </button>
                    <button
                        type="button"
                        class="btn btn-sm btn-danger"
                        data-user-action="delete-user"
                        data-user-id="${escapeHtml(userProfile.uid || "")}"
                        ${isSelf ? "disabled" : ""}
                    >
                        Xóa
                    </button>
                </div>
            </div>
        `;
    }).join("");
}


async function loadUsersForAdmin() {
    if (!adminPanel || !adminUserList) {
        return;
    }

    try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        allUsers = usersSnapshot.docs.map((docSnapshot) => ({
            uid: docSnapshot.id,
            ...docSnapshot.data()
        }));
        renderAdminUsers();
    } catch (error) {
        allUsers = DEMO_USERS;
        adminSearchStatus.textContent = error.code === "permission-denied"
            ? "Firestore đang chặn quyền đọc người dùng. Đang hiển thị dữ liệu demo để test giao diện."
            : "Không thể tải danh sách người dùng.";
        adminUserList.innerHTML = '<p class="mb-0 text-warning">Dữ liệu demo đang được hiển thị vì Firestore chưa cho phép đọc collection users.</p>';
        renderAdminUsers();
        console.error("Load users error:", error);
    }
}


async function toggleUserBan(userId, nextBanned) {
    if (!userId) {
        return;
    }

    const targetRef = doc(db, "users", userId);
    await setDoc(targetRef, { banned: nextBanned, updatedAt: serverTimestamp() }, { merge: true });
    await loadUsersForAdmin();
}


async function deleteUserProfile(userId) {
    if (!userId) {
        return;
    }

    const targetRef = doc(db, "users", userId);
    await deleteDoc(targetRef);
    await loadUsersForAdmin();
}


function toggleProfileForm(show) {
    if (!profileForm) return;
    profileForm.hidden = !show;
    editProfileButton.hidden = show;
}


function compressAvatar(file) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        const objectUrl = URL.createObjectURL(file);

        image.onload = () => {
            const scale = Math.min(1, 512 / Math.max(image.width, image.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(image.width * scale));
            canvas.height = Math.max(1, Math.round(image.height * scale));
            canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(objectUrl);

            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error("avatar-compression-failed"));
                    return;
                }

                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(new Error("avatar-read-failed"));
                reader.readAsDataURL(blob);
            }, "image/jpeg", 0.8);
        };

        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("invalid-avatar"));
        };
        image.src = objectUrl;
    });
}


async function updateOwnPostDetails(userId, authorName, avatarUrl) {
    const postsSnapshot = await getDocs(query(
        collection(db, "posts"),
        where("authorId", "==", userId)
    ));

    let batch = writeBatch(db);
    let updatesInBatch = 0;

    for (const postDocument of postsSnapshot.docs) {
        const updates = { authorName };
        if (avatarUrl) {
            updates.avatarUrl = avatarUrl;
        }
        batch.update(postDocument.ref, updates);
        updatesInBatch += 1;

        if (updatesInBatch === 500) {
            await batch.commit();
            batch = writeBatch(db);
            updatesInBatch = 0;
        }
    }

    if (updatesInBatch > 0) {
        await batch.commit();
    }
}


async function handleProfileSubmit(event) {
    event.preventDefault();
    const user = auth.currentUser;
    if (!user || !profileStatus) return;

    profileStatus.textContent = "Đang lưu...";
    profileForm.querySelector("button[type=submit]").disabled = true;

    const profile = {
        displayName: profileName.value.trim(),
        bio: profileBio.value.trim(),
        location: profileLocation.value.trim(),
        occupation: profileOccupation.value.trim(),
        email: user.email,
        updatedAt: serverTimestamp()
    };

    try {
        const avatarFile = profileAvatarInput?.files[0];
        if (avatarFile) {
            if (!avatarFile.type.startsWith("image/") || avatarFile.size > 5 * 1024 * 1024) {
                throw new Error("invalid-avatar");
            }

            profile.avatarUrl = await compressAvatar(avatarFile);
        }
        await setDoc(doc(db, "users", user.uid), profile, { merge: true });
        await updateOwnPostDetails(user.uid, profile.displayName, profile.avatarUrl);
        updateProfileDetails(profile);
        profileStatus.textContent = "Đã lưu hồ sơ.";
        toggleProfileForm(false);
    } catch (error) {
        if (error.message === "invalid-avatar") {
            profileStatus.textContent = "Ảnh phải đúng định dạng và không quá 5 MB.";
        } else if (error.message === "avatar-compression-failed" || error.message === "avatar-read-failed") {
            profileStatus.textContent = "Không thể xử lý ảnh. Hãy chọn ảnh khác.";
        } else {
            profileStatus.textContent = `Không thể lưu hồ sơ (${error.code || "lỗi không xác định"}).`;
        }
        console.error("Profile save error:", error);
    } finally {
        profileForm.querySelector("button[type=submit]").disabled = false;
    }
}


function formatDate(timestamp) {
    if (!timestamp) {
        return "Vừa đăng";
    }

    return timestamp.toDate().toLocaleString("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short"
    });
}


function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;"
    }[character]));
}


function getCurrentAuthorName(user = auth.currentUser) {
    return currentProfileDisplayName || user?.email?.split("@")[0] || "Bạn";
}


async function renderPosts(snapshot) {
    if (!postsList) {
        return;
    }

    try {
        if (snapshot.empty) {
            postsList.innerHTML = '<p class="text-center hc-muted">Chưa có bài viết nào.</p>';
            return;
        }

        const postsHtml = await Promise.all(snapshot.docs.map(async (postDocument) => {
            const post = postDocument.data();
            const author = post.authorName || post.authorEmail?.split("@")[0] || "Bạn";
            const initials = author.slice(0, 2).toUpperCase();
            const postId = postDocument.id;
            const commentsEnabled = post.commentsEnabled !== false;
            const isCommentPanelOpen = postCommentState[postId] ?? true;
            const canManageComments = auth.currentUser && (
                auth.currentUser.uid === post.authorId || auth.currentUser.uid === ADMIN_UID
            );
            const canDeletePost = auth.currentUser && (
                auth.currentUser.uid === post.authorId || auth.currentUser.uid === ADMIN_UID
            );

            let comments = "";
            let commentsCount = Number(post.commentsCount || 0);

            try {
                const commentsSnapshot = await getDocs(query(
                    collection(db, "posts", postId, "comments"),
                    orderBy("createdAt", "asc")
                ));

                commentsCount = Number(post.commentsCount || commentsSnapshot.size || 0);

                const commentsList = await Promise.all(commentsSnapshot.docs.map(async (commentDocument) => {
                    const comment = commentDocument.data();
                    const commentId = commentDocument.id;
                    const replyKey = `${postId}:${commentId}`;
                    let repliesHtml = "";

                    try {
                        const repliesSnapshot = await getDocs(query(
                            collection(db, "posts", postId, "comments", commentId, "replies"),
                            orderBy("createdAt", "asc")
                        ));

                        repliesHtml = repliesSnapshot.docs.map((replyDocument) => {
                            const reply = replyDocument.data();
                            return `
                                <div class="hc-reply-item">
                                    <div class="small fw-semibold mb-1">${escapeHtml(reply.authorName || "Người dùng")}</div>
                                    <div class="small hc-muted">${escapeHtml(reply.content || "")}</div>
                                </div>
                            `;
                        }).join("");
                    } catch (replyError) {
                        console.warn("Reply load error:", replyError);
                        repliesHtml = "";
                    }

                    const isReplyOpen = Boolean(replyState[replyKey]);

                    return `
                        <div class="hc-comment-item">
                            <div class="small fw-semibold mb-1">${escapeHtml(comment.authorName || "Người dùng")}</div>
                            <div class="small hc-muted">${escapeHtml(comment.content || "")}</div>

                            <div class="hc-comment-actions">
                                <button type="button" class="hc-link-btn" data-reply-toggle="${escapeHtml(replyKey)}">↩ Reply</button>
                            </div>

                            ${isReplyOpen ? `
                                <div class="hc-reply-box">
                                    <div class="mb-2">
                                        ${repliesHtml || '<p class="small hc-muted mb-0">Chưa có phản hồi nào.</p>'}
                                    </div>
                                    <form class="hc-reply-form" data-reply-form="${escapeHtml(replyKey)}">
                                        <input
                                            type="text"
                                            class="form-control form-control-sm"
                                            name="reply-content"
                                            placeholder="Viết phản hồi..."
                                            maxlength="500"
                                            required
                                        >
                                        <button type="submit" class="btn btn-sm btn-hc">Gửi</button>
                                    </form>
                                </div>
                            ` : `
                                <div class="hc-replies-collapsed">${replyState[replyKey] ? 0 : commentsSnapshot.size} phản hồi</div>
                            `}
                        </div>
                    `;
                }));

                comments = commentsList.join("");
            } catch (commentError) {
                console.warn("Comment load error:", commentError);
                comments = '<p class="small hc-muted mb-0">Không thể tải bình luận.</p>';
            }

            let likedByCurrentUser = false;
            if (auth.currentUser) {
                try {
                    const likeSnapshot = await getDoc(doc(db, "posts", postId, "likes", auth.currentUser.uid));
                    likedByCurrentUser = likeSnapshot.exists();
                } catch (likeError) {
                    console.warn("Like status error:", likeError);
                }
            }

            const likeCount = Number(post.likesCount || 0);
            const showCommentPanel = commentsEnabled && isCommentPanelOpen;

            return `
                <article class="card hc-card mb-4">
                    <div class="card-body">
                        <header class="d-flex align-items-center gap-3 mb-3">
                            <span class="hc-avatar">${post.avatarUrl
            ? `<img src="${escapeHtml(post.avatarUrl)}" alt="Ảnh đại diện của ${escapeHtml(author)}">`
            : escapeHtml(initials)}</span>
                            <div>
                                <h2 class="h6 mb-0">${escapeHtml(author)}</h2>
                                <p class="small hc-muted mb-0">${formatDate(post.createdAt)}</p>
                            </div>
                        </header>
                        <p class="mb-3 post-text">${escapeHtml(post.content)}</p>

                        <div class="d-flex align-items-center gap-3 mb-3 small hc-muted">
                            <span>👍 ${likeCount}</span>
                            <span>💬 ${commentsCount}</span>
                        </div>

                        <div class="post-actions mb-3">
                            <button
                                type="button"
                                class="hc-action-btn ${likedByCurrentUser ? "active" : ""}"
                                data-like-post="${escapeHtml(postId)}"
                            >
                                ${likedByCurrentUser ? "👍 Đã thích" : "👍 Thích"}
                            </button>
                            <button
                                type="button"
                                class="hc-action-btn secondary"
                                data-comment-toggle="${escapeHtml(postId)}"
                            >
                                ${commentsEnabled ? (showCommentPanel ? "💬 Ẩn bình luận" : "💬 Hiện bình luận") : "💬 Mở bình luận"}
                            </button>
                            ${canManageComments ? `
                                <button
                                    type="button"
                                    class="hc-action-btn muted"
                                    data-toggle-comments-enabled="${escapeHtml(postId)}"
                                >
                                    ${commentsEnabled ? "🔒 Đóng bình luận" : "🔓 Mở bình luận"}
                                </button>
                            ` : ""}
                            ${canDeletePost ? `
                                <button
                                    type="button"
                                    class="hc-action-btn danger"
                                    data-delete-post="${escapeHtml(postId)}"
                                >
                                    🗑 Xóa bài
                                </button>
                            ` : ""}
                        </div>

                        <div class="hc-comment-panel ${showCommentPanel ? "" : "hidden"}">
                            <div class="mb-2">
                                ${comments || '<p class="small hc-muted mb-0">Chưa có bình luận nào.</p>'}
                            </div>

                            ${commentsEnabled ? `
                                <form class="hc-comment-form" data-comment-form="${escapeHtml(postId)}">
                                    <input
                                        type="text"
                                        class="form-control form-control-sm"
                                        name="comment-content"
                                        placeholder="Viết bình luận..."
                                        maxlength="500"
                                        required
                                    >
                                    <button type="submit" class="btn btn-sm btn-hc">Gửi</button>
                                </form>
                            ` : `
                                <div class="hc-comment-disabled">Bình luận đã bị đóng.</div>
                            `}
                        </div>
                    </div>
                </article>
            `;
        }));

        postsList.innerHTML = postsHtml.join("");
    } catch (error) {
        console.error("Render posts error:", error);
        postsList.innerHTML = '<p class="text-center text-danger">Không thể tải bài viết. Hãy kiểm tra Firestore Rules hoặc dữ liệu.</p>';
    }
}


let latestPostsSnapshot = null;

function renderPostsFromCurrentSnapshot() {
    if (!latestPostsSnapshot) {
        return;
    }

    renderPosts(latestPostsSnapshot);
}

function watchPosts() {
    if (!postsList) {
        return;
    }

    const postsQuery = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc"),
        limit(20)
    );

    onSnapshot(postsQuery, (snapshot) => {
        latestPostsSnapshot = snapshot;
        renderPosts(snapshot);
    }, () => {
        postsList.innerHTML = '<p class="text-center text-danger">Không thể tải bài viết. Hãy kiểm tra cấu hình Firestore.</p>';
    });
}


async function addReplyToComment(postId, commentId, content) {
    const user = auth.currentUser;
    if (!user || !content.trim()) {
        return;
    }

    await addDoc(collection(db, "posts", postId, "comments", commentId, "replies"), {
        authorId: user.uid,
        authorName: getCurrentAuthorName(user),
        content: content.trim(),
        createdAt: serverTimestamp()
    });
}


async function handlePostSubmit(event) {
    event.preventDefault();

    const content = postContent?.value.trim();
    const user = auth.currentUser;

    if (!content || !user || !postStatus) {
        return;
    }

    postStatus.textContent = "Đang đăng...";
    postForm.querySelector("button").disabled = true;

    try {
        const authorName = getCurrentAuthorName(user);
        await addDoc(collection(db, "posts"), {
            content,
            authorName,
            authorEmail: user.email,
            authorId: user.uid,
            avatarUrl: currentProfileAvatar || null,
            likesCount: 0,
            commentsCount: 0,
            commentsEnabled: true,
            createdAt: serverTimestamp()
        });
        postContent.value = "";
        postStatus.textContent = "Đã đăng bài.";
    } catch (error) {
        postStatus.textContent = "Không thể đăng bài. Hãy thử lại.";
    } finally {
        postForm.querySelector("button").disabled = false;
    }
}


async function addCommentToPost(postId, content) {
    const user = auth.currentUser;
    if (!user || !content.trim()) {
        return;
    }

    const postRef = doc(db, "posts", postId);
    const postSnapshot = await getDoc(postRef);
    const postData = postSnapshot.data() || {};

    if (postData.commentsEnabled === false) {
        return;
    }

    const currentCount = Number(postData.commentsCount || 0);

    await addDoc(collection(db, "posts", postId, "comments"), {
        authorId: user.uid,
        authorName: getCurrentAuthorName(user),
        content: content.trim(),
        createdAt: serverTimestamp()
    });

    await setDoc(postRef, {
        commentsCount: currentCount + 1
    }, { merge: true });
}


async function toggleCommentsEnabled(postId) {
    const postRef = doc(db, "posts", postId);
    const postSnapshot = await getDoc(postRef);
    const currentValue = Boolean(postSnapshot.data()?.commentsEnabled ?? true);

    await setDoc(postRef, {
        commentsEnabled: !currentValue
    }, { merge: true });
}


async function deletePost(postId) {
    if (!postId) {
        return;
    }

    const postRef = doc(db, "posts", postId);
    const postSnapshot = await getDoc(postRef);
    const postData = postSnapshot.data() || {};
    const currentUser = auth.currentUser;

    if (!currentUser) {
        return;
    }

    const canDelete = currentUser.uid === ADMIN_UID || currentUser.uid === postData.authorId;
    if (!canDelete) {
        window.alert("Bạn không có quyền xóa bài viết này.");
        return;
    }

    const confirmText = currentUser.uid === ADMIN_UID
        ? "Admin xác nhận xóa bài viết này?"
        : "Bạn có chắc muốn xóa bài viết của mình?";

    const confirmDelete = window.confirm(confirmText);
    if (!confirmDelete) {
        return;
    }

    await deleteDoc(postRef);
}


async function toggleLikePost(postId) {
    const user = auth.currentUser;
    if (!user) {
        return;
    }

    const likeRef = doc(db, "posts", postId, "likes", user.uid);
    const likeSnapshot = await getDoc(likeRef);
    const postRef = doc(db, "posts", postId);
    const postSnapshot = await getDoc(postRef);
    const currentLikeCount = Number(postSnapshot.data()?.likesCount || 0);

    if (likeSnapshot.exists()) {
        await deleteDoc(likeRef);
        await setDoc(postRef, {
            likesCount: Math.max(0, currentLikeCount - 1)
        }, { merge: true });
        return;
    }

    await setDoc(likeRef, {
        userId: user.uid,
        postId,
        createdAt: serverTimestamp()
    });

    await setDoc(postRef, {
        likesCount: currentLikeCount + 1
    }, { merge: true });
}


function getConversationId(firstUserId, secondUserId) {
    return [firstUserId, secondUserId].sort().join("__");
}


function getOtherParticipant(conversation) {
    const otherUserId = conversation.participantIds?.find(
        (participantId) => participantId !== currentAuthenticatedUser?.uid
    );
    const storedProfile = conversation.participantProfiles?.[otherUserId] || {};

    return {
        uid: otherUserId,
        ...storedProfile,
        displayName: storedProfile.displayName || storedProfile.email?.split("@")[0] || "Người dùng"
    };
}


function renderChatAvatar(userProfile) {
    const name = userProfile.displayName || "Người dùng";
    return userProfile.avatarUrl
        ? `<img src="${escapeHtml(userProfile.avatarUrl)}" alt="Ảnh đại diện của ${escapeHtml(name)}">`
        : escapeHtml(name.slice(0, 2).toUpperCase());
}


function renderPendingMessages() {
    if (!pendingMessageList || !pendingMessageLabel) {
        return;
    }

    const pendingConversations = chatConversations.filter(
        (conversation) => conversation.lastSenderId && conversation.lastSenderId !== currentAuthenticatedUser?.uid
    );
    const count = pendingConversations.length;
    pendingMessageLabel.textContent = `(${count})`;
    if (pendingMessageCount) {
        pendingMessageCount.textContent = count;
        pendingMessageCount.hidden = count === 0;
    }
    messageCountElements.forEach((element) => {
        element.textContent = count;
        element.hidden = count === 0;
    });

    pendingMessageList.innerHTML = pendingConversations.length
        ? pendingConversations.map((conversation) => {
            const otherUser = getOtherParticipant(conversation);
            return `
                <button type="button" class="btn btn-sm btn-light w-100 text-start d-flex gap-2 align-items-center mb-1"
                    data-chat-user-id="${escapeHtml(otherUser.uid || "")}">
                    <span class="hc-avatar hc-avatar-sm">${renderChatAvatar(otherUser)}</span>
                    <span class="text-truncate">
                        <strong class="d-block text-truncate">${escapeHtml(otherUser.displayName)}</strong>
                        <small class="hc-muted">${escapeHtml(conversation.lastMessage || "Tin nhắn mới")}</small>
                    </span>
                </button>
            `;
        }).join("")
        : '<p class="small hc-muted mb-0">Không có tin nhắn chờ.</p>';
}


function renderConversationList() {
    if (!conversationList) {
        return;
    }

    const keyword = conversationSearchInput?.value.trim().toLowerCase() || "";
    const visibleConversations = chatConversations.filter((conversation) => {
        const otherUser = getOtherParticipant(conversation);
        return !keyword || `${otherUser.displayName} ${otherUser.email || ""}`.toLowerCase().includes(keyword);
    });

    conversationList.innerHTML = visibleConversations.length
        ? visibleConversations.map((conversation) => {
            const otherUser = getOtherParticipant(conversation);
            const isPending = conversation.lastSenderId !== currentAuthenticatedUser?.uid;
            return `
                <button type="button" class="list-group-item list-group-item-action hc-chat-item d-flex gap-3 align-items-center ${conversation.id === activeConversationId ? "active" : ""}"
                    data-chat-user-id="${escapeHtml(otherUser.uid || "")}">
                    <span class="hc-avatar">${renderChatAvatar(otherUser)}</span>
                    <span class="flex-grow-1 text-start text-truncate">
                        <strong class="d-block text-truncate">${escapeHtml(otherUser.displayName)}</strong>
                        <small class="hc-muted d-block text-truncate">${escapeHtml(conversation.lastMessage || "Chưa có tin nhắn")}</small>
                    </span>
                    ${isPending ? '<span class="badge text-bg-danger rounded-pill">Mới</span>' : ""}
                </button>
            `;
        }).join("")
        : '<p class="small hc-muted p-3 mb-0">Chưa có cuộc trò chuyện nào.</p>';
}


function renderChatSearchResults(users) {
    if (!chatUserSearchResults) {
        return;
    }

    chatUserSearchResults.innerHTML = users.map((userProfile) => `
        <button type="button" class="btn btn-light border text-start d-flex gap-2 align-items-center"
            data-chat-user-id="${escapeHtml(userProfile.uid)}">
            <span class="hc-avatar hc-avatar-sm">${renderChatAvatar(userProfile)}</span>
            <span class="text-truncate">
                <strong class="d-block text-truncate">${escapeHtml(userProfile.displayName || "Người dùng")}</strong>
                <small class="hc-muted">${escapeHtml(userProfile.email || "")}</small>
            </span>
        </button>
    `).join("");
}


async function listenToActiveMessages() {
    if (!messageList || !activeConversationId) {
        return;
    }

    if (stopMessagesListener) {
        stopMessagesListener();
        stopMessagesListener = null;
    }

    let conversationExists = chatConversations.some(
        (conversation) => conversation.id === activeConversationId
    );

    if (!conversationExists) {
        try {
            const conversationSnapshot = await getDoc(doc(db, "chats", activeConversationId));
            conversationExists = conversationSnapshot.exists();
        } catch (error) {
            conversationExists = false;
        }
    }

    if (!conversationExists) {
        messageList.innerHTML = '<p class="hc-muted text-center m-auto">Hãy gửi lời chào đầu tiên.</p>';
        return;
    }

    const messagesQuery = query(
        collection(db, "chats", activeConversationId, "messages"),
        orderBy("createdAt", "asc")
    );
    stopMessagesListener = onSnapshot(messagesQuery, (snapshot) => {
        messageList.innerHTML = snapshot.empty
            ? '<p class="hc-muted text-center m-auto">Hãy gửi lời chào đầu tiên.</p>'
            : snapshot.docs.map((messageDocument) => {
                const message = messageDocument.data();
                const isMine = message.senderId === currentAuthenticatedUser.uid;
                return `
                    <div class="hc-bubble ${isMine ? "sent align-self-end" : "received"}">
                        ${escapeHtml(message.content || "")}
                        <small class="d-block ${isMine ? "text-white-50" : "hc-muted"}">${formatDate(message.createdAt)}</small>
                    </div>
                `;
            }).join("");
        messageList.scrollTop = messageList.scrollHeight;
    }, () => {
        messageList.innerHTML = '<p class="text-danger text-center">Không thể tải tin nhắn.</p>';
    });
}


async function openChatWithUser(userId) {
    if (!chatApp || !currentAuthenticatedUser || !userId || userId === currentAuthenticatedUser.uid) {
        return;
    }

    const userSnapshot = await getDoc(doc(db, "users", userId));
    if (!userSnapshot.exists()) {
        return;
    }

    activeChatUser = { uid: userId, ...userSnapshot.data() };
    activeConversationId = getConversationId(currentAuthenticatedUser.uid, userId);
    if (window.location.pathname.endsWith("chat.html")) {
        window.history.replaceState({}, "", `chat.html?user=${encodeURIComponent(userId)}`);
    }

    if (activeChatHeader) {
        activeChatHeader.innerHTML = `
            <span class="hc-avatar">${renderChatAvatar(activeChatUser)}</span>
            <div>
                <h2 class="h6 mb-0">${escapeHtml(activeChatUser.displayName || "Người dùng")}</h2>
                <small class="hc-muted">${escapeHtml(activeChatUser.email || "")}</small>
            </div>
            <a class="btn btn-sm btn-light ms-auto" href="profile.html?uid=${encodeURIComponent(userId)}">Xem hồ sơ</a>
        `;
    }
    if (messageForm) {
        messageForm.hidden = false;
    }
    renderConversationList();

    await listenToActiveMessages();
}


async function sendChatMessage(event) {
    event.preventDefault();
    const content = messageInput?.value.trim();
    if (!content || !activeChatUser || !currentAuthenticatedUser) {
        return;
    }

    const conversationId = getConversationId(currentAuthenticatedUser.uid, activeChatUser.uid);
    const participantIds = [currentAuthenticatedUser.uid, activeChatUser.uid].sort();
    const conversationRef = doc(db, "chats", conversationId);
    const currentProfile = {
        displayName: currentAuthenticatedUser.email?.split("@")[0] || "Bạn",
        email: currentAuthenticatedUser.email || "",
        avatarUrl: currentProfileAvatar || null
    };
    const targetProfile = {
        displayName: activeChatUser.displayName || activeChatUser.email?.split("@")[0] || "Người dùng",
        email: activeChatUser.email || "",
        avatarUrl: activeChatUser.avatarUrl || null
    };

    messageForm.querySelector("button[type=submit]").disabled = true;
    try {
        await setDoc(conversationRef, {
            participantIds,
            participantProfiles: {
                [currentAuthenticatedUser.uid]: currentProfile,
                [activeChatUser.uid]: targetProfile
            },
            lastMessage: content,
            lastSenderId: currentAuthenticatedUser.uid,
            lastMessageAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }, { merge: true });
        await listenToActiveMessages();
        await addDoc(collection(db, "chats", conversationId, "messages"), {
            senderId: currentAuthenticatedUser.uid,
            receiverId: activeChatUser.uid,
            content,
            createdAt: serverTimestamp()
        });
        messageInput.value = "";
    } catch (error) {
        window.alert(`Không thể gửi tin nhắn (${error.code || "unknown-error"}). Hãy Publish lại Firestore Rules.`);
        console.error("Send message error:", error);
    } finally {
        messageForm.querySelector("button[type=submit]").disabled = false;
    }
}


async function initializeChat(user) {
    if (!chatApp) {
        return;
    }

    const conversationsQuery = query(
        collection(db, "chats"),
        where("participantIds", "array-contains", user.uid)
    );
    onSnapshot(conversationsQuery, (snapshot) => {
        chatConversations = snapshot.docs.map((conversationDocument) => ({
            id: conversationDocument.id,
            ...conversationDocument.data()
        })).sort((first, second) => {
            const firstTime = first.lastMessageAt?.toMillis?.() || 0;
            const secondTime = second.lastMessageAt?.toMillis?.() || 0;
            return secondTime - firstTime;
        });
        renderConversationList();
        renderPendingMessages();
    }, () => {
        if (conversationList) conversationList.innerHTML = '<p class="text-danger p-3">Không thể tải cuộc trò chuyện.</p>';
    });

    const targetUserId = new URLSearchParams(window.location.search).get("user");
    if (targetUserId) {
        await openChatWithUser(targetUserId);
    }
}


function watchPendingMessageCount(user) {
    if (!messageCountElements.length) {
        return;
    }

    const conversationsQuery = query(
        collection(db, "chats"),
        where("participantIds", "array-contains", user.uid)
    );
    onSnapshot(conversationsQuery, (snapshot) => {
        const pendingCount = snapshot.docs.filter((conversationDocument) => {
            const conversation = conversationDocument.data();
            return conversation.lastSenderId && conversation.lastSenderId !== user.uid;
        }).length;

        messageCountElements.forEach((element) => {
            element.textContent = pendingCount;
            element.hidden = pendingCount === 0;
        });
    });
}


// ! Không giữ trang được bảo vệ trong lịch sử trình duyệt.
function redirectToLogin() {
    window.location.replace("dangnhap.html");
}


// ! Kiểm tra trạng thái đăng nhập và cập nhật giao diện.
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        redirectToLogin();
        return;
    }

    currentAuthenticatedUser = user;
    profileOwnerUid = new URLSearchParams(window.location.search).get("uid") || user.uid;
    updateUserDetails(user);
    watchPosts();

    try {
        const isOwnProfile = profileOwnerUid === user.uid;
        const profileUser = isOwnProfile ? user : { uid: profileOwnerUid, email: "" };
        const profile = await loadProfile(profileUser, isOwnProfile);

        if (editProfileButton) {
            editProfileButton.hidden = !isOwnProfile;
        }
        if (profileForm) {
            profileForm.hidden = true;
        }
        if (messageUserButton) {
            messageUserButton.hidden = isOwnProfile;
            messageUserButton.href = `chat.html?user=${encodeURIComponent(profileOwnerUid)}`;
        }

        if (userSearchInput) {
            await loadUsersForSearch();
        }
        watchPendingMessageCount(user);
        await initializeChat(user);
        const adminAccess = user.uid === ADMIN_UID || isAdminUser(user, profile);

        if (adminPanel) {
            adminPanel.hidden = !adminAccess;
        }

        if (adminAccess) {
            await loadUsersForAdmin();
        }
    } catch (error) {
        console.error("Profile load error:", error);
        const adminAccess = user.uid === ADMIN_UID;

        if (adminPanel) {
            adminPanel.hidden = !adminAccess;
        }

        if (adminAccess) {
            await loadUsersForAdmin();
        }

        if (!profileStatus) return;

        profileStatus.textContent = error.code === "permission-denied"
            ? "Firestore đang chặn đọc hồ sơ. Hãy Publish lại Firestore Rules."
            : `Không thể tải hồ sơ (${error.code || "lỗi không xác định"}).`;
    }
});


if (adminSearchInput) {
    adminSearchInput.addEventListener("input", renderAdminUsers);
}

if (userSearchInput) {
    userSearchInput.addEventListener("input", renderUserSearchResults);
}

if (conversationSearchInput) {
    conversationSearchInput.addEventListener("input", async () => {
        renderConversationList();
        const keyword = conversationSearchInput.value.trim().toLowerCase();
        if (!keyword || !chatUserSearchResults) {
            if (chatUserSearchResults) chatUserSearchResults.innerHTML = "";
            return;
        }

        try {
            const usersSnapshot = await getDocs(collection(db, "users"));
            const matchingUsers = usersSnapshot.docs
                .map((userDocument) => ({ uid: userDocument.id, ...userDocument.data() }))
                .filter((userProfile) => userProfile.uid !== currentAuthenticatedUser?.uid)
                .filter((userProfile) => `${userProfile.displayName || ""} ${userProfile.email || ""}`.toLowerCase().includes(keyword));
            renderChatSearchResults(matchingUsers);
        } catch (error) {
            chatUserSearchResults.innerHTML = '<p class="small text-danger">Không thể tìm người dùng.</p>';
            console.error("Chat user search error:", error);
        }
    });
}

if (pendingMessageToggle) {
    pendingMessageToggle.addEventListener("click", () => {
        pendingMessageList.hidden = !pendingMessageList.hidden;
    });
}

if (chatApp) {
    chatApp.addEventListener("click", (event) => {
        const chatUserButton = event.target.closest("[data-chat-user-id]");
        if (chatUserButton) {
            openChatWithUser(chatUserButton.dataset.chatUserId);
        }
    });
}

if (messageForm) {
    messageForm.addEventListener("submit", sendChatMessage);
}

if (adminUserList) {
    adminUserList.addEventListener("click", async (event) => {
        const actionButton = event.target.closest("[data-user-action]");
        if (!actionButton) {
            return;
        }

        const userId = actionButton.dataset.userId;
        const action = actionButton.dataset.userAction;

        if (!userId || userId === currentAuthenticatedUser?.uid) {
            return;
        }

        try {
            const targetUser = allUsers.find((item) => item.uid === userId);

            if (action === "toggle-ban") {
                const nextBanned = !Boolean(targetUser?.banned);
                const confirmed = window.confirm(nextBanned ? "Cấm người dùng này?" : "Bỏ cấm người dùng này?");

                if (!confirmed) {
                    return;
                }

                await toggleUserBan(userId, nextBanned);
                return;
            }

            if (action === "delete-user") {
                const confirmed = window.confirm("Bạn có chắc muốn xóa tài khoản người dùng này?");
                if (!confirmed) {
                    return;
                }

                await deleteUserProfile(userId);
            }
        } catch (error) {
            console.error("Admin action error:", error);
            window.alert("Không thể thực hiện hành động với người dùng này.");
        }
    });
}


// ! Gắn sự kiện đăng xuất.
signOutButtons.forEach((button) => {
    button.addEventListener("click", async () => {
        try {
            await signOut(auth);
            redirectToLogin();
        } catch (error) {
            // ! Giữ nguyên trang khi đăng xuất thất bại.
            window.alert("Không thể đăng xuất lúc này. Vui lòng thử lại.");
        }
    });
});

if (postForm) {
    postForm.addEventListener("submit", handlePostSubmit);
}

if (postsList) {
    postsList.addEventListener("click", async (event) => {
        const likeButton = event.target.closest("[data-like-post]");
        if (likeButton) {
            await toggleLikePost(likeButton.dataset.likePost);
            return;
        }

        const commentToggle = event.target.closest("[data-comment-toggle]");
        if (commentToggle) {
            const postId = commentToggle.dataset.commentToggle;
            postCommentState[postId] = !(postCommentState[postId] ?? true);
            renderPostsFromCurrentSnapshot();
            return;
        }

        const commentToggleEnabled = event.target.closest("[data-toggle-comments-enabled]");
        if (commentToggleEnabled) {
            await toggleCommentsEnabled(commentToggleEnabled.dataset.toggleCommentsEnabled);
            return;
        }

        const deleteButton = event.target.closest("[data-delete-post]");
        if (deleteButton) {
            await deletePost(deleteButton.dataset.deletePost);
            return;
        }

        const replyToggleButton = event.target.closest("[data-reply-toggle]");
        if (replyToggleButton) {
            const replyKey = replyToggleButton.dataset.replyToggle;
            replyState[replyKey] = !(replyState[replyKey] ?? false);
            renderPostsFromCurrentSnapshot();
        }
    });

    postsList.addEventListener("submit", async (event) => {
        const commentForm = event.target.closest("[data-comment-form]");
        if (commentForm) {
            event.preventDefault();

            const postId = commentForm.dataset.commentForm;
            const input = commentForm.querySelector("input[name='comment-content']");
            const content = input?.value.trim();

            if (!postId || !content) {
                return;
            }

            await addCommentToPost(postId, content);
            input.value = "";
            return;
        }

        const replyForm = event.target.closest("[data-reply-form]");
        if (!replyForm) {
            return;
        }

        event.preventDefault();

        const replyKey = replyForm.dataset.replyForm;
        const [postId, commentId] = replyKey.split(":");
        const input = replyForm.querySelector("input[name='reply-content']");
        const content = input?.value.trim();

        if (!postId || !commentId || !content) {
            return;
        }

        await addReplyToComment(postId, commentId, content);
        replyState[replyKey] = true;
        input.value = "";
        renderPostsFromCurrentSnapshot();
    });
}

if (editProfileButton) {
    editProfileButton.addEventListener("click", () => toggleProfileForm(true));
}

if (cancelProfileButton) {
    cancelProfileButton.addEventListener("click", () => toggleProfileForm(false));
}

if (profileForm) {
    profileForm.addEventListener("submit", handleProfileSubmit);
}
```

## auth.js

```javascript
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
    createUserWithEmailAndPassword,
    getAuth,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { firebaseConfig } from "./config.js";

// ! Khởi tạo Firebase Authentication.
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ! Lấy các phần tử dùng chung của trang xác thực.
const logForm = document.getElementById("logForm");
const regForm = document.getElementById("regForm");
const messageBox = document.getElementById("message");
const forgotPasswordButton = document.getElementById("forgot-password");


function showMessage(message, type = "success") {
    if (!messageBox) {
        return;
    }

    messageBox.textContent = message;
    messageBox.classList.toggle("is-error", type === "error");
}


// ! Chuyển lỗi Firebase thành thông báo dễ hiểu.
function getFriendlyErrorMessage(errorCode, action) {
    const messages = {
        "auth/email-already-in-use": "Email này đã được sử dụng. Vui lòng dùng email khác.",
        "auth/invalid-email": "Email không hợp lệ. Vui lòng kiểm tra lại.",
        "auth/weak-password": "Mật khẩu quá yếu. Vui lòng dùng ít nhất 6 ký tự.",
        "auth/invalid-credential": "Email hoặc mật khẩu không chính xác.",
        "auth/user-not-found": "Không tìm thấy tài khoản với email này.",
        "auth/wrong-password": "Mật khẩu không chính xác.",
        "auth/too-many-requests": "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau."
    };

    return messages[errorCode] || `Không thể ${action} lúc này. Vui lòng thử lại.`;
}


async function handleForgotPassword() {
    const emailInput = document.getElementById("logMail");
    const email = emailInput?.value.trim();

    if (!email) {
        showMessage("Nhập email trước khi yêu cầu đặt lại mật khẩu.", "error");
        emailInput?.focus();
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        showMessage("Đã gửi email đặt lại mật khẩu. Hãy kiểm tra hộp thư của bạn.");
    } catch (error) {
        showMessage(getFriendlyErrorMessage(error.code, "gửi email đặt lại mật khẩu"), "error");
    }
}


// ! Hiển thị thông báo sau khi đăng ký thành công.
function showRegistrationSuccessMessage() {
    const searchParams = new URLSearchParams(window.location.search);

    if (searchParams.get("registered") !== "true") {
        return;
    }

    showMessage("Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.");
    window.history.replaceState({}, document.title, "dangnhap.html");
}


// ! Xử lý đăng ký tài khoản.
async function handleRegister(event) {
    event.preventDefault();

    const email = document.getElementById("mailInput").value.trim();
    const password = document.getElementById("passwordInput").value;
    const confirmPassword = document.getElementById("confirmPassInput").value;

    if (!email || !password || !confirmPassword) {
        showMessage("Vui lòng nhập đầy đủ thông tin.", "error");
        return;
    }

    if (password !== confirmPassword) {
        showMessage("Mật khẩu xác nhận không khớp.", "error");
        return;
    }

    if (password.length < 6) {
        showMessage("Mật khẩu phải có ít nhất 6 ký tự.", "error");
        return;
    }

    try {
        await createUserWithEmailAndPassword(auth, email, password);

        // ! Firebase tự đăng nhập sau khi tạo tài khoản.
        await signOut(auth);

        window.location.href = "dangnhap.html?registered=true";
    } catch (error) {
        showMessage(getFriendlyErrorMessage(error.code, "đăng ký"), "error");
    }
}


// ! Xử lý đăng nhập.
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById("logMail").value.trim();
    const password = document.getElementById("logPass").value;

    if (!email || !password) {
        showMessage("Vui lòng nhập email và mật khẩu.", "error");
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = "index.html";
    } catch (error) {
        showMessage(getFriendlyErrorMessage(error.code, "đăng nhập"), "error");
    }
}


// ! Gắn sự kiện cho form hiện tại.
if (regForm) {
    regForm.addEventListener("submit", handleRegister);
}

if (logForm) {
    showRegistrationSuccessMessage();
    logForm.addEventListener("submit", handleLogin);
}

if (forgotPasswordButton) {
    forgotPasswordButton.addEventListener("click", handleForgotPassword);
}
```

## chat.html

```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tin nhắn | HuyChat</title>

    <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css"
        rel="stylesheet"
        integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB"
        crossorigin="anonymous"
    >
    <link rel="stylesheet" href="ui.css">
</head>

<body>
    <!-- ! Điều hướng -->
    <nav class="navbar hc-navbar sticky-top border-bottom">
        <div class="container">
            <a
                class="navbar-brand d-flex align-items-center gap-2 hc-brand"
                href="index.html"
            >
                <span class="hc-logo">H</span>
                HuyChat
            </a>

            <div class="d-flex gap-2">
                <a class="btn btn-sm btn-light" href="index.html">
                    Trang chủ
                </a>
                <a class="btn btn-sm btn-light" href="profile.html">
                    Hồ sơ
                </a>
                <button
                    class="btn btn-sm btn-outline-secondary"
                    data-sign-out
                >
                    Đăng xuất
                </button>
            </div>
        </div>
    </nav>

    <main class="container py-4">
        <div id="chat-app" class="card hc-card overflow-hidden">
            <div class="row g-0">
                <aside class="col-lg-4 border-end">
                    <div class="p-3 border-bottom">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h1 class="h5 fw-bold mb-0">Tin nhắn</h1>
                            <span id="pending-message-count" class="badge text-bg-danger" hidden>0</span>
                        </div>
                        <input id="conversation-search" class="form-control mb-3" type="search" placeholder="Tìm người để nhắn...">
                        <div class="hc-pending-box mb-3">
                            <button id="pending-message-toggle" class="btn btn-sm btn-light w-100 text-start" type="button">
                                Tin nhắn chờ <span id="pending-message-label" class="hc-muted">(0)</span>
                            </button>
                            <div id="pending-message-list" class="hc-pending-list mt-2" hidden></div>
                        </div>
                        <div id="user-search-results" class="d-grid gap-2 mb-3"></div>
                    </div>
                    <div id="conversation-list" class="list-group list-group-flush hc-chat-list p-2"></div>
                </aside>

                <section class="col-lg-8 d-flex flex-column">
                    <header id="active-chat-header" class="d-flex align-items-center gap-3 p-3 border-bottom">
                        <span class="hc-muted">Chọn một người để bắt đầu nhắn tin.</span>
                    </header>
                    <div id="message-list" class="hc-messages p-3 d-flex flex-column gap-3">
                        <p class="hc-muted text-center m-auto">Các tin nhắn của bạn sẽ xuất hiện ở đây.</p>
                    </div>
                    <form id="message-form" class="p-3 border-top d-flex gap-2" hidden>
                        <label class="visually-hidden" for="message-input">Nhập tin nhắn</label>
                        <input id="message-input" class="form-control" maxlength="2000" placeholder="Nhập tin nhắn..." autocomplete="off">
                        <button class="btn btn-hc" type="submit">Gửi</button>
                    </form>
                </section>

            </div>
        </div>
    </main>

    <script
        type="module"
        src="app.js"
    ></script>
</body>
</html>
```

## config.js

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

## dangky.html

```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đăng ký | HuyChat</title>

    <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css"
        rel="stylesheet"
        integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB"
        crossorigin="anonymous"
    >
    <link rel="stylesheet" href="ui.css">
    <link rel="stylesheet" href="style.css">
</head>

<body class="auth-page">
    <!-- ! Trang đăng ký -->
    <main class="container py-4">
        <div class="row min-vh-100 align-items-center justify-content-center">
            <div class="col-12 col-sm-10 col-md-8 col-lg-5">
                <section class="card hc-card auth-card">
                    <div class="card-body p-4 p-md-5">
                        <div class="text-center mb-4">
                            <!-- <span class="hc-logo auth-logo">H</span> -->
                            <p class="small text-uppercase text-primary fw-semibold mt-3 mb-2">
                                Bắt đầu ngay hôm nay
                            </p>
                            <h1 class="h2 fw-bold">Tạo tài khoản</h1>
                            <p class="hc-muted mb-0">
                                Tham gia cộng đồng HuyChat chỉ trong vài bước.
                            </p>
                        </div>

                        <!-- ! Form đăng ký -->
                        <form id="regForm" novalidate>
                            <div class="mb-3">
                                <label class="form-label fw-medium" for="mailInput">
                                    Email
                                </label>
                                <input
                                    class="form-control form-control-lg"
                                    type="email"
                                    id="mailInput"
                                    autocomplete="email"
                                    placeholder="name@example.com"
                                    required
                                >
                            </div>

                            <div class="mb-3">
                                <label class="form-label fw-medium" for="passwordInput">
                                    Mật khẩu
                                </label>
                                <input
                                    class="form-control form-control-lg"
                                    type="password"
                                    id="passwordInput"
                                    autocomplete="new-password"
                                    placeholder="Ít nhất 6 ký tự"
                                    required
                                >
                            </div>

                            <div class="mb-4">
                                <label class="form-label fw-medium" for="confirmPassInput">
                                    Xác nhận mật khẩu
                                </label>
                                <input
                                    class="form-control form-control-lg"
                                    type="password"
                                    id="confirmPassInput"
                                    autocomplete="new-password"
                                    placeholder="Nhập lại mật khẩu"
                                    required
                                >
                            </div>

                            <button class="btn btn-hc btn-lg w-100" type="submit">
                                Tạo tài khoản
                            </button>
                        </form>

                        <div
                            id="message"
                            class="mt-3"
                            role="alert"
                            aria-live="polite"
                        ></div>

                        <p class="text-center hc-muted mt-4 mb-0">
                            Đã có tài khoản?
                            <a class="fw-semibold text-decoration-none" href="dangnhap.html">
                                Đăng nhập
                            </a>
                        </p>
                    </div>
                </section>
            </div>
        </div>
    </main>

    <!-- ! Xử lý đăng ký với Firebase -->
    <script type="module" src="./auth.js"></script>
</body>
</html>
```

## dangnhap.html

```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đăng nhập | HuyChat</title>

    <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css"
        rel="stylesheet"
        integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB"
        crossorigin="anonymous"
    >
    <link rel="stylesheet" href="ui.css">
    <link rel="stylesheet" href="style.css">
</head>

<body class="auth-page">
    <!-- ! Trang đăng nhập -->
    <main class="container py-4">
        <div class="row min-vh-100 align-items-center justify-content-center">
            <div class="col-12 col-sm-10 col-md-8 col-lg-5">

                <section class="card hc-card auth-card">
                    <div class="card-body p-4 p-md-5">

                        <div class="text-center mb-4">
                            <!-- <span class="hc-logo auth-logo">
                                H
                            </span> -->

                            <p class="small text-uppercase text-primary fw-semibold mt-3 mb-2">
                                Chào mừng trở lại
                            </p>

                            <h1 class="h2 fw-bold">
                                Đăng nhập HuyChat
                            </h1>

                            <p class="hc-muted mb-0">
                                Kết nối và chia sẻ cùng mọi người.
                            </p>
                        </div>

                        <!-- ! Form đăng nhập -->
                        <form id="logForm" novalidate>
                            <div class="mb-3">
                                <label
                                    class="form-label fw-medium"
                                    for="logMail"
                                >
                                    Email
                                </label>

                                <input
                                    class="form-control form-control-lg"
                                    type="email"
                                    id="logMail"
                                    autocomplete="email"
                                    placeholder="name@example.com"
                                    required
                                >
                            </div>

                            <div class="mb-4">
                                <label
                                    class="form-label fw-medium"
                                    for="logPass"
                                >
                                    Mật khẩu
                                </label>

                                <input
                                    class="form-control form-control-lg"
                                    type="password"
                                    id="logPass"
                                    autocomplete="current-password"
                                    placeholder="Nhập mật khẩu"
                                    required
                                >
                            </div>

                            <button
                                class="btn btn-hc btn-lg w-100"
                                type="submit"
                            >
                                Đăng nhập
                            </button>

                            <button
                                id="forgot-password"
                                class="btn btn-link w-100 mt-2 text-decoration-none"
                                type="button"
                            >
                                Quên mật khẩu?
                            </button>
                        </form>

                        <div
                            id="message"
                            class="mt-3"
                            role="alert"
                            aria-live="polite"
                        ></div>

                        <p class="text-center hc-muted mt-4 mb-0">
                            Chưa có tài khoản?
                            <a
                                class="fw-semibold text-decoration-none"
                                href="dangky.html"
                            >
                                Đăng ký ngay
                            </a>
                        </p>

                    </div>
                </section>

            </div>
        </div>
    </main>

    <!-- ! Xử lý đăng nhập với Firebase -->
    <script
        type="module"
        src="./auth.js"
    ></script>
</body>
</html>
```

## firestore.rules

```firestore
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
      // Users need to read public profile data for the search feature.
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
      // The client updates like/comment counters from authenticated actions.
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

## index.html

```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bảng tin | HuyChat</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">
    <link rel="stylesheet" href="ui.css">
</head>
<body>
    <nav class="navbar hc-navbar sticky-top border-bottom">
        <div class="container">
            <a class="navbar-brand d-flex align-items-center gap-2 hc-brand" href="index.html">
                <!-- <span class="hc-logo">H</span> -->
                HuyChat
            </a>
            <div class="d-flex align-items-center gap-2">
                <span class="hc-avatar" data-user-avatar><span data-user-initials>HC</span></span>
                <span class="small d-none d-sm-block" data-user-name>Huy</span>
                <a class="btn btn-sm btn-light" href="profile.html">Hồ sơ</a>
                <a class="btn btn-sm btn-light" href="chat.html">Tin nhắn <span data-message-count class="badge text-bg-danger" hidden>0</span></a>
                <button class="btn btn-sm btn-outline-secondary" data-sign-out>Đăng xuất</button>
            </div>
        </div>
    </nav>

    <main class="container py-4">
        <div class="row justify-content-center">
            <section class="col-lg-8">
                <div class="card hc-card mb-4">
                    <div class="card-body">
                        <div class="d-flex gap-3">
                            <span class="hc-avatar" data-user-avatar><span data-user-initials>HC</span></span>
                            <form id="post-form" class="flex-grow-1">
                                <label class="visually-hidden" for="post-content">Bạn đang nghĩ gì?</label>
                                <textarea id="post-content" class="form-control hc-composer" rows="3" maxlength="1000" placeholder="Bạn đang nghĩ gì?"></textarea>
                                <div class="d-flex justify-content-between align-items-center gap-3 mt-3">
                                    <small id="post-status" class="hc-muted" role="status"></small>
                                    <button class="btn btn-hc" type="submit">Đăng bài</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <div id="user-search-panel" class="card hc-card mb-4">
                    <div class="card-body">
                        <h2 class="h5 mb-3">Tìm người dùng</h2>
                        <label class="visually-hidden" for="user-search">Tìm người dùng</label>
                        <input
                            id="user-search"
                            type="search"
                            class="form-control"
                            placeholder="Tìm theo tên hoặc email"
                            autocomplete="off"
                        >
                        <p id="user-search-status" class="small hc-muted mt-3 mb-2" role="status"></p>
                        <div id="user-search-results" class="d-grid gap-2" aria-live="polite"></div>
                    </div>
                </div>

                <div id="admin-panel" class="card hc-card mb-4" hidden>
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h2 class="h5 mb-0">Quản lý người dùng</h2>
                            <span class="badge text-bg-primary">Admin</span>
                        </div>

                        <div class="input-group mb-3">
                            <span class="input-group-text">🔎</span>
                            <input
                                id="admin-user-search"
                                type="search"
                                class="form-control"
                                placeholder="Tìm người dùng theo tên, email hoặc UID"
                                aria-label="Tìm người dùng"
                            >
                        </div>

                        <p id="admin-search-status" class="small hc-muted mb-3">Đang tải danh sách người dùng...</p>
                        <div id="admin-user-list" class="d-grid gap-2" aria-live="polite"></div>
                    </div>
                </div>

                <div id="posts-list" aria-live="polite">
                    <p class="text-center hc-muted">Đang tải bài viết...</p>
                </div>
            </section>
        </div>
    </main>

    <script type="module" src="app.js"></script>
</body>
</html>
```

## profile.html

```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Hồ sơ | HuyChat</title>

    <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css"
        rel="stylesheet"
        integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB"
        crossorigin="anonymous"
    >
    <link rel="stylesheet" href="ui.css">
</head>

<body>

    <!-- ! Điều hướng -->
    <nav class="navbar hc-navbar sticky-top border-bottom">
        <div class="container">

            <a
                class="navbar-brand d-flex align-items-center gap-2 hc-brand"
                href="index.html"
            >
                <span class="hc-logo">
                    H
                </span>
                HuyChat
            </a>

            <div class="d-flex gap-2">

                <a
                    class="btn btn-sm btn-light"
                    href="index.html"
                >
                    Trang chủ
                </a>

                <button
                    class="btn btn-sm btn-outline-secondary"
                    data-sign-out
                >
                    Đăng xuất
                </button>

            </div>
        </div>
    </nav>

    <!-- ! Nội dung hồ sơ -->
    <main class="container py-4">
        <div class="row justify-content-center">
            <div class="col-lg-9">

                <section class="card hc-card mb-4 overflow-hidden">

                    <div class="hc-profile-cover"></div>

                    <div class="card-body px-4 pb-4">

                        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3">

                            <span class="hc-avatar hc-avatar-lg hc-profile-avatar" data-user-avatar>
                                <!-- <span data-user-initials>HC</span> -->
                            </span>

                            <button class="btn btn-hc" type="button" data-edit-profile>
                                Chỉnh sửa hồ sơ
                            </button>
                            <a class="btn btn-outline-primary" data-message-user href="chat.html" hidden>
                                Nhắn tin
                            </a>

                        </div>

                        <h1
                            class="h3 fw-bold mb-1"
                            data-user-name
                        >
                            <!-- Huy -->
                        </h1>

                        <p
                            class="hc-muted mb-3"
                            data-user-email
                        ></p>

                        <p class="mb-3" data-profile-bio>
                            <!-- Hiện tại mình đang phát triển trang web HuyChat. -->
                        </p>

                        <div class="d-flex flex-wrap gap-3 small hc-muted">

                            <span data-profile-location>
                                <!-- 📍 Hồ Chí Minh, Việt Nam -->
                            </span>

                            <span data-profile-occupation>
                                <!-- 🎓 Học sinh -->
                            </span>

                        </div>

                    </div>

                    <form class="card-body border-top hc-profile-form" id="profile-form" hidden>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label" for="profile-name">Tên hiển thị</label>
                                <input class="form-control" id="profile-name" maxlength="60" required>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label" for="profile-avatar">Ảnh đại diện</label>
                                <input class="form-control" id="profile-avatar" type="file" accept="image/*">
                                <small class="hc-muted">Tối đa 5 MB</small>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label" for="profile-location">Địa điểm</label>
                                <input class="form-control" id="profile-location" maxlength="80">
                            </div>
                            <div class="col-12">
                                <label class="form-label" for="profile-occupation">Công việc / học tập</label>
                                <input class="form-control" id="profile-occupation" maxlength="80">
                            </div>
                            <div class="col-12">
                                <label class="form-label" for="profile-bio">Giới thiệu</label>
                                <textarea class="form-control" id="profile-bio" rows="3" maxlength="240"></textarea>
                            </div>
                        </div>
                        <div class="d-flex align-items-center gap-3 mt-3">
                            <button class="btn btn-hc" type="submit">Lưu thay đổi</button>
                            <button class="btn btn-light" type="button" data-cancel-profile>Hủy</button>
                            <small class="hc-muted" id="profile-status" role="status"></small>
                        </div>
                    </form>
                </section>

            </div>
        </div>
    </main>

    <script
        type="module"
        src="app.js"
    ></script>

</body>
</html>
```

## style.css

```css
/* ! Bố cục trang xác thực */

.auth-page {
    min-height: 100vh;
    background: var(--hc-bg);
}

.auth-card {
    position: relative;
    overflow: hidden;
    border-radius: 1rem;
    box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.12);
}

.auth-card::before {
    position: absolute;
    inset: 0 0 auto;
    height: 0.3rem;
    background: #0866ff;
    content: "";
}

.auth-logo {
    width: 3.5rem;
    height: 3.5rem;
    font-size: 1.45rem;
    box-shadow: 0 0.5rem 1rem rgba(8, 102, 255, 0.2);
}

.auth-page .text-primary {
    color: var(--hc-primary) !important;
}

.auth-page .form-control-lg {
    min-height: 3.25rem;
    border-radius: 0.7rem;
}

/* ! Thông báo xác thực */

/* ! auth.js dùng is-error cho thông báo lỗi. */
#message:not(:empty) {
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    background: #eef9f2;
    color: #17683b;
    font-size: 0.9rem;
}

#message.is-error {
    background: #fff0f1;
    color: #b42336;
}
```

## ui.css

```css
/* ! Biến màu dùng chung */

:root {
    --hc-primary: #0866ff;
    --hc-ink: #1c1e21;
    --hc-muted: #65676b;
    --hc-bg: #f0f2f5;
    --hc-accent: #42b72a;
    --hc-border: #d8dadf;
}

/* ! Kiểu dùng chung */

html {
    overflow-x: clip;
}

body {
    min-height: 100vh;
    overflow-x: clip;
    background: var(--hc-bg);
    color: var(--hc-ink);
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
}

/* ! Điều hướng và thương hiệu */

.hc-navbar {
    min-height: 3.5rem;
    background: #fff;
    border-color: transparent !important;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}

.hc-brand {
    color: var(--hc-primary);
    font-weight: 800;
    letter-spacing: 0;
}

.hc-logo,
.hc-avatar {
    display: inline-grid;
    place-items: center;
    flex: 0 0 auto;
    border-radius: 50%;
    font-weight: 700;
    color: #fff;
}

.hc-logo {
    width: 2.25rem;
    height: 2.25rem;
    background: var(--hc-primary);
    box-shadow: none;
}

.hc-avatar {
    width: 2.5rem;
    height: 2.5rem;
    background: linear-gradient(
        135deg,
        #f2a65a,
        #d5618c
    );
    font-size: 0.85rem;
}

.hc-avatar-lg {
    width: 6.5rem;
    height: 6.5rem;
    aspect-ratio: 1;
    box-sizing: border-box;
    overflow: hidden;
    border: 4px solid #fff;
    font-size: 1.8rem;
    box-shadow: 0 0.5rem 1.5rem rgba(28, 32, 60, 0.16);
}

.hc-avatar img {
    display: block;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    border-radius: inherit;
    object-fit: cover;
}

.hc-nav-link {
    color: var(--hc-muted);
    border-radius: 0.65rem;
    font-weight: 500;
}

.hc-nav-link:hover,
.hc-nav-link.active {
    color: var(--hc-primary);
    background: #e7f3ff;
}

/* ! Thẻ và bảng tin */

.hc-card {
    border: 0;
    border-radius: 0.5rem;
    background: #fff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}

.hc-post-image {
    height: 13rem;
    border-radius: 0.75rem;
    background: linear-gradient(135deg, #dce9ff, #e9f0fa 58%, #d9e4f5);
}

.hc-composer {
    border-color: var(--hc-border);
    border-radius: 0.6rem;
    resize: none;
}

.form-control,
.form-select,
.input-group-text {
    border-color: var(--hc-border);
}

.form-control,
.form-select {
    color: var(--hc-ink);
}

.form-control::placeholder {
    color: #93a3a0;
}

.form-control:focus,
.form-select:focus {
    border-color: #8ab7ff;
    box-shadow: 0 0 0 0.2rem rgba(8, 102, 255, 0.15);
}

.post-text {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
}

.hc-muted {
    color: var(--hc-muted);
}

/* ! Hồ sơ */

.hc-profile-cover {
    height: 11rem;
    border-radius: 1rem 1rem 0 0;
    background: linear-gradient(115deg, #0866ff, #3987ff 62%, #8ebaff);
}

.hc-profile-avatar {
    margin-top: -3.5rem;
}

/* ! Trò chuyện */

.hc-chat-list {
    max-height: calc(100vh - 11.5rem);
    overflow-y: auto;
}

.hc-chat-item {
    border: 0;
    border-radius: 0.75rem !important;
    margin-bottom: 0.25rem;
}

.hc-chat-item.active {
    background: #e7f3ff;
    color: var(--hc-ink);
}

.hc-messages {
    height: calc(100vh - 17rem);
    min-height: 25rem;
    overflow-y: auto;
    background: #f0f2f5;
}

.hc-bubble {
    max-width: min(80%, 32rem);
    padding: 0.65rem 0.85rem;
    border-radius: 1rem;
}

.hc-bubble.received {
    background: #fff;
    border-bottom-left-radius: 0.25rem;
}

.hc-bubble.sent {
    background: var(--hc-primary);
    color: #fff;
    border-bottom-right-radius: 0.25rem;
}

.post-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.625rem;
}

.hc-action-btn {
    border: 0;
    background: transparent;
    color: var(--hc-muted);
    border-radius: 0.4rem;
    padding: 0.55rem 0.8rem;
    font-size: 0.82rem;
    font-weight: 600;
    transition: all 0.2s ease;
}

.hc-action-btn:hover {
    background: #f0f2f5;
}

.hc-action-btn.active {
    background: #e7f3ff;
    color: var(--hc-primary);
}

.hc-action-btn.secondary {
    background: transparent;
    color: var(--hc-muted);
}

.hc-action-btn.muted {
    background: #f5f7fb;
    color: var(--hc-muted);
}

.hc-action-btn.danger {
    background: #fff1f2;
    color: #d92d4d;
    border-color: rgba(217, 45, 77, 0.12);
}

.hc-comment-panel {
    border-top: 1px solid #eef0f7;
    padding-top: 1rem;
    margin-top: 0.25rem;
}

.hc-comment-panel.hidden {
    display: none;
}

.hc-comment-item {
    background: #f0f2f5;
    border: 0;
    border-radius: 1rem;
    padding: 0.7rem 0.8rem;
    margin-bottom: 0.5rem;
}

.hc-comment-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 0.4rem;
}

.hc-link-btn {
    border: none;
    background: transparent;
    padding: 0;
    color: var(--hc-primary);
    font-size: 0.75rem;
    font-weight: 600;
}

.hc-comment-form,
.hc-reply-form {
    display: flex;
    gap: 0.65rem;
    align-items: center;
}

.hc-comment-form .form-control,
.hc-reply-form .form-control {
    border-radius: 999px;
}

.hc-reply-box {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid #edf0f6;
}

.hc-reply-item {
    background: #f0f2f5;
    border: 0;
    border-radius: 0.7rem;
    padding: 0.55rem 0.7rem;
    margin-bottom: 0.4rem;
}

.hc-replies-collapsed {
    margin-top: 0.5rem;
    color: var(--hc-muted);
    font-size: 0.72rem;
}

.hc-comment-disabled {
    color: var(--hc-muted);
    font-size: 0.82rem;
    background: #f6f9f7;
    border: 1px dashed #d4e1dc;
    border-radius: 0.75rem;
    padding: 0.75rem 0.9rem;
}

/* ! Nút bấm */

.btn-hc {
    --bs-btn-bg: var(--hc-primary);
    --bs-btn-border-color: var(--hc-primary);
    --bs-btn-hover-bg: #075ce5;
    --bs-btn-hover-border-color: #075ce5;
    --bs-btn-active-bg: #064fc4;
    --bs-btn-active-border-color: #064fc4;
    color: #fff;
    box-shadow: none;
    transition: transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
}

.btn-hc:hover {
    color: #fff;
    filter: brightness(0.97);
}

.btn-outline-primary {
    --bs-btn-color: var(--hc-primary);
    --bs-btn-border-color: rgba(8, 102, 255, 0.45);
    --bs-btn-hover-bg: var(--hc-primary);
    --bs-btn-hover-border-color: var(--hc-primary);
    --bs-btn-hover-color: #fff;
}

a {
    color: var(--hc-primary);
}

a:hover {
    color: #075ce5;
}

::selection {
    color: #fff;
    background: #0866ff;
}

@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        scroll-behavior: auto !important;
        transition-duration: 0.01ms !important;
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
    }
}

/* ! Responsive */

@media (max-width: 991.98px) {
    .hc-sidebar {
        display: none;
    }

    .hc-messages {
        height: 26rem;
    }
}

.navbar .btn-light {
    border: 0;
    background: transparent;
    color: var(--hc-muted);
    font-weight: 600;
}

.navbar .btn-light:hover {
    background: #f0f2f5;
    color: var(--hc-ink);
}

.navbar .btn-outline-secondary {
    --bs-btn-color: #4b4f56;
    --bs-btn-border-color: #d8dadf;
    --bs-btn-hover-color: #1c1e21;
    --bs-btn-hover-bg: #f0f2f5;
    --bs-btn-hover-border-color: #d8dadf;
}

.hc-composer {
    border: 0;
    background: #f0f2f5;
    padding: 0.8rem 1rem;
}

#posts-list .hc-card .card-body {
    padding: 1rem;
}

#posts-list .post-text {
    line-height: 1.55;
}

#posts-list .post-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.25rem;
    padding: 0.4rem 0;
    border-top: 1px solid #e4e6eb;
    border-bottom: 1px solid #e4e6eb;
}

#posts-list .hc-action-btn {
    display: flex;
    min-width: 0;
    min-height: 2.5rem;
    align-items: center;
    justify-content: center;
    transition: background-color 140ms ease, color 140ms ease;
}

#posts-list .hc-action-btn.active {
    background: transparent;
    color: var(--hc-primary);
}

#posts-list .hc-comment-panel {
    margin-top: 0;
    border-top: 0;
}

.hc-chat-list {
    background: #fff;
}

.hc-chat-item {
    padding: 0.7rem;
}

.hc-chat-item:hover {
    background: #f0f2f5;
}

.hc-chat-item.active:hover {
    background: #e7f3ff;
}

.hc-chat-item .hc-avatar {
    width: 3rem;
    height: 3rem;
}

@media (max-width: 575.98px) {
    #posts-list .hc-card .card-body {
        padding: 0.85rem;
    }

    .post-actions {
        gap: 0.2rem;
    }

    .hc-action-btn {
        padding-inline: 0.4rem;
        font-size: 0.76rem;
    }
}
```

## welcome.css

```css
/* ! Hero và bản xem trước trò chuyện */

.py-lg-6 {
    padding-top: 5rem;
    padding-bottom: 5rem;
}

.welcome-hero {
    overflow: hidden;
    background:
        radial-gradient(circle at 15% 25%, rgba(119, 105, 235, 0.16), transparent 28rem),
        radial-gradient(circle at 90% 80%, rgba(75, 156, 230, 0.16), transparent 25rem);
}

.welcome-eyebrow {
    display: inline-block;
    padding: 0.4rem 0.8rem;
    border-radius: 99rem;
    background: #eeedff;
    color: var(--hc-primary);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}

.welcome-gradient-text {
    color: var(--hc-primary);
}

.chat-preview {
    position: relative;
    max-width: 31rem;
    border: 1px solid #e2e4ed;
    border-radius: 1.25rem;
    background: #fff;
    box-shadow: 0 1.25rem 3.5rem rgba(59, 57, 118, 0.16);
}

.chat-preview-header,
.chat-preview-footer {
    padding: 1rem 1.25rem;
}

.chat-preview-header {
    border-bottom: 1px solid #edf0f4;
}

.chat-preview-body {
    display: flex;
    min-height: 15rem;
    flex-direction: column;
    gap: 0.8rem;
    padding: 1.25rem;
    background: #fbfbfd;
}

.chat-preview-footer {
    display: flex;
    border-top: 1px solid #edf0f4;
}

.preview-message {
    max-width: 82%;
    padding: 0.7rem 0.85rem;
    border-radius: 1rem;
    font-size: 0.9rem;
}

.preview-message.received {
    align-self: flex-start;
    border-bottom-left-radius: 0.25rem;
    background: #e9eaf1;
}

.preview-message.sent {
    align-self: flex-end;
    border-bottom-right-radius: 0.25rem;
    background: var(--hc-primary);
    color: #fff;
}

.preview-dot {
    display: inline-block;
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 50%;
    background: #35b878;
}

.preview-notification {
    position: absolute;
    right: -2rem;
    bottom: 2.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    background: #fff;
    font-size: 0.8rem;
}

.preview-icon {
    color: var(--hc-primary);
}

/* ! Tính năng và cộng đồng */

.welcome-section-heading {
    max-width: 40rem;
}

.feature-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.feature-card:hover {
    transform: translateY(-0.25rem);
    box-shadow: 0 0.8rem 1.5rem rgba(31, 35, 61, 0.1);
}

.feature-icon {
    display: inline-grid;
    width: 2.75rem;
    height: 2.75rem;
    place-items: center;
    border-radius: 0.8rem;
    background: #eeedff;
    color: var(--hc-primary);
    font-size: 1.4rem;
    font-weight: 700;
}

.avatar-stack {
    display: flex;
    align-items: center;
}

.avatar-stack > * {
    margin-right: -0.65rem;
    border: 3px solid var(--hc-bg);
}

.avatar-blue {
    background: linear-gradient(135deg, #4b9ce6, #6d69df);
}

.avatar-green {
    background: linear-gradient(135deg, #48ac83, #4e92c8);
}

.avatar-pink {
    background: linear-gradient(135deg, #d878ba, #9c72d9);
}

.avatar-more {
    display: inline-grid;
    width: 2.5rem;
    height: 2.5rem;
    place-items: center;
    border-radius: 50%;
    background: #e9eaf1;
    color: var(--hc-muted);
    font-size: 0.8rem;
    font-weight: 700;
}

.community-card {
    height: 100%;
}

.community-card-offset {
    margin-top: 2.25rem;
}

/* ! Giới thiệu và chân trang */

.about-panel {
    color: #fff;
    background: linear-gradient(120deg, #5e56d7, #498fdb);
}

.welcome-eyebrow-light {
    background: rgba(255, 255, 255, 0.16);
    color: #fff;
}

.welcome-footer {
    background: #252640;
    color: #fff;
}

.footer-muted,
.footer-links {
    color: #bfc1d5;
}

.footer-links {
    text-decoration: none;
    overflow-wrap: anywhere;
}

.footer-links li + li {
    margin-top: 0.5rem;
}

.footer-links:hover {
    color: #fff;
}

/* ! Responsive */

@media (max-width: 991.98px) {
    .preview-notification {
        right: 1rem;
    }
}

@media (max-width: 575.98px) {
    .py-lg-6 {
        padding-top: 3rem;
        padding-bottom: 3rem;
    }

    .preview-notification {
        position: static;
        width: fit-content;
        margin: 0 1rem 1rem auto;
        border: 1px solid #edf0f4;
    }

    .community-card-offset {
        margin-top: 1.25rem;
    }
}

.welcome-hero {
    background:
        radial-gradient(circle at 15% 25%, rgba(8, 127, 131, 0.14), transparent 28rem),
        radial-gradient(circle at 90% 80%, rgba(228, 122, 97, 0.13), transparent 25rem),
        linear-gradient(120deg, #f7fbf8, #eff7f3 58%, #fbf4ed);
}

.welcome-eyebrow,
.feature-icon {
    background: #e5f3ee;
}

.welcome-gradient-text,
.welcome-eyebrow,
.feature-icon,
.preview-icon {
    color: #087f83;
}

.chat-preview {
    border-color: #dfeae5;
    border-radius: 0.9rem;
    box-shadow: 0 1.25rem 3.5rem rgba(24, 53, 54, 0.13);
    transform: rotate(1.2deg);
    transition: transform 220ms ease, box-shadow 220ms ease;
}

.chat-preview:hover {
    transform: rotate(0deg) translateY(-3px);
    box-shadow: 0 1.5rem 3.8rem rgba(24, 53, 54, 0.17);
}

.chat-preview-header,
.chat-preview-footer {
    border-color: #e8efec;
}

.chat-preview-body {
    background: #f7faf8;
}

.preview-message.received,
.avatar-more {
    background: #e8efec;
}

.preview-message.sent {
    background: #087f83;
}

.feature-card:hover {
    box-shadow: 0 0.8rem 1.5rem rgba(24, 53, 54, 0.1);
}

.avatar-blue {
    background: linear-gradient(135deg, #498ca1, #087f83);
}

.avatar-green {
    background: linear-gradient(135deg, #48a985, #277f72);
}

.avatar-pink {
    background: linear-gradient(135deg, #ed9b7b, #cf6980);
}

.about-panel {
    background: linear-gradient(120deg, #086e72, #14968b 68%, #438e78);
}

.welcome-footer {
    background: #183536;
}

@media (prefers-reduced-motion: reduce) {
    .chat-preview,
    .feature-card {
        transition: none;
    }
}

.welcome-hero {
    background: #f0f2f5;
}

.welcome-eyebrow,
.feature-icon {
    background: #e7f3ff;
}

.welcome-gradient-text,
.welcome-eyebrow,
.feature-icon,
.preview-icon {
    color: #0866ff;
}

.chat-preview {
    border-color: #e4e6eb;
    border-radius: 0.5rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
    transform: none;
}

.chat-preview:hover {
    transform: translateY(-2px);
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.12);
}

.chat-preview-header,
.chat-preview-footer {
    border-color: #e4e6eb;
}

.chat-preview-body {
    background: #f0f2f5;
}

.preview-message.received,
.avatar-more {
    background: #e4e6eb;
}

.preview-message.sent {
    background: #0866ff;
}

.feature-card:hover {
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.12);
}

.about-panel {
    background: #0866ff;
}

.welcome-footer {
    background: #1c1e21;
}

@media (prefers-reduced-motion: reduce) {
    .chat-preview,
    .feature-card {
        transition: none;
    }
}
```

## welcome.html

```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HuyChat | Mạng xã hội demo</title>

    <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css"
        rel="stylesheet"
        integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB"
        crossorigin="anonymous"
    >
    <link rel="stylesheet" href="ui.css">
    <link rel="stylesheet" href="welcome.css">
</head>

<body>
    <!-- ! Điều hướng công khai -->
    <nav class="navbar navbar-expand-lg hc-navbar sticky-top border-bottom">
        <div class="container">
            <a class="navbar-brand d-flex align-items-center gap-2 hc-brand" href="welcome.html">
                <span class="hc-logo">H</span>
                HuyChat
            </a>

            <button
                class="navbar-toggler border-0"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#welcomeNav"
                aria-controls="welcomeNav"
                aria-expanded="false"
                aria-label="Mở điều hướng"
            >
                <span class="navbar-toggler-icon"></span>
            </button>

            <div class="collapse navbar-collapse" id="welcomeNav">
                <ul class="navbar-nav mx-lg-auto gap-lg-2 py-3 py-lg-0">
                    <li class="nav-item">
                        <a class="nav-link hc-nav-link px-3" href="#features">Tính năng</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link hc-nav-link px-3" href="#about">Về HuyChat</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link hc-nav-link px-3" href="#contact">Liên hệ</a>
                    </li>
                </ul>

                <div class="d-flex flex-column flex-lg-row gap-2">
                    <a class="btn btn-outline-primary" href="dangnhap.html">Đăng nhập</a>
                    <a class="btn btn-hc" href="dangky.html">Đăng ký</a>
                </div>
            </div>
        </div>
    </nav>

    <!-- ! Nội dung trang chào mừng -->
    <main>
        <section class="welcome-hero py-5 py-lg-6">
            <div class="container py-lg-5">
                <div class="row align-items-center g-5">
                    <div class="col-lg-6">
                        <span class="welcome-eyebrow">Mạng xã hội demo</span>
                        <h1 class="display-4 fw-bold mt-3 mb-4">
                            Chào mừng đến với <span class="welcome-gradient-text">HuyChat</span>
                        </h1>
                        <p class="lead hc-muted mb-4">
                            Một không gian nhỏ để đăng bài, tương tác, tìm người dùng và nhắn tin trực tiếp.
                        </p>
                        <div class="d-flex flex-column flex-sm-row gap-3">
                            <a class="btn btn-hc btn-lg px-4" href="dangky.html">Tạo tài khoản</a>
                            <a class="btn btn-outline-primary btn-lg px-4" href="dangnhap.html">Đăng nhập</a>
                        </div>
                        <p class="small hc-muted mt-4 mb-0">Đăng nhập bằng email · Dữ liệu lưu trên Firebase · Bản demo học tập</p>
                    </div>

                    <div class="col-lg-6">
                        <div class="chat-preview mx-auto">
                            <div class="chat-preview-header d-flex align-items-center gap-3">
                                <span class="hc-avatar">LA</span>
                                <div class="flex-grow-1">
                                    <strong class="d-block">Linh Anh</strong>
                                    <small class="text-secondary">Ví dụ cuộc trò chuyện</small>
                                </div>
                                <span class="small text-secondary">Tin nhắn 1-1</span>
                            </div>

                            <div class="chat-preview-body">
                                <div class="preview-message received">Chào Huy, bạn tham gia buổi gặp cuối tuần chứ?</div>
                                <div class="preview-message sent">Chắc chắn rồi! Mình sẽ mang theo vài ý tưởng mới. ✨</div>
                                <div class="preview-message received">Tuyệt quá, hẹn gặp bạn nhé!</div>
                            </div>

                            <div class="chat-preview-footer d-flex align-items-center gap-2">
                                <span class="preview-dot"></span>
                                <span class="flex-grow-1 text-secondary small">Nhập tin nhắn...</span>
                                <span class="text-primary fw-bold">➤</span>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ! Tính năng -->
        <section id="features" class="py-5 bg-white">
            <div class="container py-lg-4">
                <div class="text-center mx-auto welcome-section-heading mb-5">
                    <span class="welcome-eyebrow">Tất cả trong một nơi</span>
                    <h2 class="display-6 fw-bold mt-3">Kết nối theo cách bạn muốn</h2>
                    <p class="hc-muted mb-0">Các chức năng hiện có trong phiên bản demo.</p>
                </div>

                <div class="row g-4">
                    <div class="col-sm-6 col-lg-3">
                        <article class="card hc-card h-100 feature-card">
                            <div class="card-body p-4">
                                <span class="feature-icon">✦</span>
                                <h3 class="h5 fw-bold mt-4">Bảng tin</h3>
                                <p class="hc-muted mb-0">Đăng bài và xem các bài viết mới nhất.</p>
                            </div>
                        </article>
                    </div>
                    <div class="col-sm-6 col-lg-3">
                        <article class="card hc-card h-100 feature-card">
                            <div class="card-body p-4">
                                <span class="feature-icon">♡</span>
                                <h3 class="h5 fw-bold mt-4">Tương tác</h3>
                                <p class="hc-muted mb-0">Thích, bình luận và trả lời bình luận.</p>
                            </div>
                        </article>
                    </div>
                    <div class="col-sm-6 col-lg-3">
                        <article class="card hc-card h-100 feature-card">
                            <div class="card-body p-4">
                                <span class="feature-icon">◉</span>
                                <h3 class="h5 fw-bold mt-4">Nhắn tin 1-1</h3>
                                <p class="hc-muted mb-0">Tìm người dùng và trò chuyện riêng theo thời gian thực.</p>
                            </div>
                        </article>
                    </div>
                    <div class="col-sm-6 col-lg-3">
                        <article class="card hc-card h-100 feature-card">
                            <div class="card-body p-4">
                                <span class="feature-icon">◎</span>
                                <h3 class="h5 fw-bold mt-4">Hồ sơ &amp; kết nối</h3>
                                <p class="hc-muted mb-0">Chỉnh sửa hồ sơ, tìm người dùng và xem profile.</p>
                            </div>
                        </article>
                    </div>
                </div>
            </div>
        </section>

        <!-- ! Cộng đồng -->
        <section class="py-5">
            <div class="container py-lg-4">
                <div class="row align-items-center g-5">
                    <div class="col-lg-6">
                        <span class="welcome-eyebrow">Trải nghiệm demo</span>
                        <h2 class="display-6 fw-bold mt-3">Từ bài đăng đến cuộc trò chuyện riêng.</h2>
                        <p class="hc-muted mb-4">Bạn có thể bắt đầu bằng một bài viết, tìm một profile và chuyển sang nhắn tin 1-1 trong cùng hệ thống.</p>
                        <div class="avatar-stack" aria-label="Các thành viên minh họa">
                            <span class="hc-avatar">LA</span>
                            <span class="hc-avatar avatar-blue">MN</span>
                            <span class="hc-avatar avatar-green">TH</span>
                            <span class="hc-avatar avatar-pink">PL</span>
                            <span class="avatar-more">Demo</span>
                        </div>
                    </div>
                    <div class="col-lg-6">
                        <div class="row g-3">
                            <div class="col-6">
                                <article class="card hc-card community-card community-card-offset">
                                    <div class="card-body p-4">
                                        <p class="mb-3">“Mình thích cảm giác mọi thứ được sắp xếp thật đơn giản.”</p>
                                        <div class="d-flex align-items-center gap-2">
                                            <span class="hc-avatar avatar-blue">MN</span>
                                            <small><strong>Minh</strong><br><span class="hc-muted">Thành viên demo</span></small>
                                        </div>
                                    </div>
                                </article>
                            </div>
                            <div class="col-6">
                                <article class="card hc-card community-card">
                                    <div class="card-body p-4">
                                        <p class="mb-3">“Một nơi gọn gàng để giữ liên lạc với bạn bè.”</p>
                                        <div class="d-flex align-items-center gap-2">
                                            <span class="hc-avatar avatar-green">TH</span>
                                            <small><strong>Tuấn</strong><br><span class="hc-muted">Thành viên demo</span></small>
                                        </div>
                                    </div>
                                </article>
                            </div>
                        </div>
                        
                    </div>
                </div>
            </div>
        </section>

        <!-- ! Giới thiệu -->
        <section id="about" class="py-5 bg-white">
            <div class="container py-lg-4">
                <div class="card border-0 about-panel overflow-hidden">
                    <div class="card-body p-4 p-md-5">
                        <div class="row align-items-center g-4">
                            <div class="col-lg-8">
                                <span class="welcome-eyebrow welcome-eyebrow-light">Về HuyChat</span>
                                    <h2 class="display-6 fw-bold mt-3">Một bản demo nhỏ, tập trung vào các chức năng cốt lõi.</h2>
                                    <p class="mb-0 opacity-75">HuyChat sử dụng Firebase Authentication và Firestore để minh họa đăng nhập, profile, bảng tin, tương tác và nhắn tin 1-1.</p>
                            </div>
                            <div class="col-lg-4 text-lg-end">
                                <a class="btn btn-light btn-lg" href="dangky.html">Tham gia HuyChat</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ! Liên hệ -->
        <section id="contact" class="py-5">
            <div class="container py-lg-4">
                <div class="row g-5">
                    <div class="col-lg-5">
                        <span class="welcome-eyebrow">Liên hệ</span>
                        <h2 class="display-6 fw-bold mt-3">Có điều muốn chia sẻ?</h2>
                        <p class="hc-muted">Đây là bản demo học tập. Bạn có thể gửi email nếu muốn trao đổi về project.</p>
                        <a class="text-decoration-none fw-semibold" href="mailto:dangquoc581@gmail.com">dangquoc581@gmail.com</a>
                        <p class="hc-muted small mt-3 mb-0">Facebook · Instagram · YouTube <span class="ms-1">(demo)</span></p>
                    </div>
                    <div class="col-lg-7">
                        <div class="card hc-card">
                            <div class="card-body p-4 p-md-5">
                                <h3 class="h5 fw-bold">Trao đổi về project</h3>
                                <p class="hc-muted mb-4">Email là kênh liên hệ hiện có trong bản demo.</p>
                                <a class="btn btn-hc" href="mailto:dangquoc581@gmail.com">Gửi email</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <!-- ! Chân trang -->
    <footer class="welcome-footer py-5">
        <div class="container">
            <div class="row g-4">
                <div class="col-md-5">
                    <a class="d-inline-flex align-items-center gap-2 text-white text-decoration-none fw-bold fs-5" href="welcome.html">
                        <span class="hc-logo">H</span>
                        HuyChat
                    </a>
                    <p class="mt-3 mb-0 footer-muted">Một nơi đơn giản để kết nối, trò chuyện và chia sẻ.</p>
                </div>
                <div class="col-6 col-md-3">
                    <h2 class="h6">Khám phá</h2>
                    <ul class="list-unstyled footer-links mb-0">
                        <li><a href="#features">Tính năng</a></li>
                        <li><a href="#about">Về HuyChat</a></li>
                        <li><a href="dangky.html">Đăng ký</a></li>
                    </ul>
                </div>
                <div class="col-6 col-md-4">
                    <h2 class="h6">Liên hệ</h2>
                    <a class="footer-links" href="mailto:dangquoc581@gmail.com">dangquoc581@gmail.com</a>
                    <p class="footer-muted small mt-2 mb-0">Nội dung và thông tin liên hệ đều là bản minh họa.</p>
                </div>
            </div>
            <div class="border-top border-secondary-subtle mt-4 pt-4 footer-muted small">© 2026 HuyChat. All rights reserved.</div>
        </div>
    </footer>

    <!-- ! Bootstrap cho điều hướng trên di động -->
    <script
        src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"
        integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI"
        crossorigin="anonymous"
    ></script>
</body>
</html>
```
