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
