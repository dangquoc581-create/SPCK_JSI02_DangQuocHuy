import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { firebaseConfig } from "./config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Helper
const getElement = (id) => document.getElementById(id);


// Forms
const logForm = getElement("logForm");
const regForm = getElement("regForm");
const messageBox = getElement("message");


// Show message
const showMessage = (text) => {
    if (messageBox) {
        messageBox.textContent = text;
    }
};


// ====================
// REGISTER
// ====================

if (regForm) {

    regForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const username = getElement("userInput").value.trim();
        const password = getElement("passwordInput").value;
        const confirmPassword = getElement("confirmPassInput").value;
        const email = getElement("mailInput").value.trim();


        // Check empty fields
        if (!username || !password || !confirmPassword || !email) {

            showMessage("Nhap day du thong tin pls");
            return;

        }


        // Check password confirmation
        if (password !== confirmPassword) {

            showMessage("Mat khau khong trung nhau");
            return;

        }


        // Check password length
        if (password.length < 6) {

            showMessage("Mat khau phai co it nhat 6 ky tu");
            return;

        }


        try {

            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            showMessage("Dang ky thanh cong!");

            console.log("Registered:", email);
            console.log("Username:", username);

        } catch (error) {

            console.error(error);

            showMessage(`Loi dang ky: ${error.message}`);

        }

    });

}


// ====================
// LOGIN
// ====================

if (logForm) {

    logForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const email = getElement("logMail").value.trim();
        const password = getElement("logPass").value;


        // Check empty fields
        if (!email || !password) {

            showMessage("Nhap email va mat khau pls");
            return;

        }


        try {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            showMessage("Dang nhap thanh cong!");

            console.log("Logged in:", email);

        } catch (error) {

            console.log(error);

            showMessage(`Loi dang nhap: ${error.message}`);

        }

    });

}