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
const adminPanel = document.getElementById("admin-panel");
const adminUserList = document.getElementById("admin-user-list");
const adminSearchInput = document.getElementById("admin-user-search");
const adminSearchStatus = document.getElementById("admin-search-status");
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


function updateUserDetails(user) {
    const name = user.email?.split("@")[0] || "Bạn";
    const initials = name.slice(0, 2).toUpperCase();

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

    userNameElements.forEach((element) => {
        element.textContent = name;
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


async function loadProfile(user) {
    const fallbackProfile = {
        displayName: user.email?.split("@")[0] || "Bạn",
        bio: "",
        location: "",
        occupation: "",
        role: user.uid === ADMIN_UID ? "admin" : "user"
    };

    try {
        const profileSnapshot = await getDoc(doc(db, "users", user.uid));
        const profile = profileSnapshot.exists() ? profileSnapshot.data() : fallbackProfile;

        if (!profileSnapshot.exists()) {
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


async function updateOwnPostAvatars(userId, avatarUrl) {
    const postsSnapshot = await getDocs(query(
        collection(db, "posts"),
        where("authorId", "==", userId)
    ));

    let batch = writeBatch(db);
    let updatesInBatch = 0;

    for (const postDocument of postsSnapshot.docs) {
        batch.update(postDocument.ref, { avatarUrl });
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
        if (profile.avatarUrl) {
            await updateOwnPostAvatars(user.uid, profile.avatarUrl);
        }
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
        authorName: user.email?.split("@")[0] || "Bạn",
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
        const authorName = user.email?.split("@")[0] || "Bạn";
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
        authorName: user.email?.split("@")[0] || "Bạn",
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
    updateUserDetails(user);
    watchPosts();

    try {
        const profile = await loadProfile(user);
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
