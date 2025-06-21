import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "el-grimorio.firebaseapp.com",
  projectId: "el-grimorio",
  storageBucket: "el-grimorio.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");

loginBtn.addEventListener("click", () => {
  signInWithPopup(auth, provider)
    .then((result) => {
      console.log("Bienvenido:", result.user.displayName);
    })
    .catch((error) => {
      console.error("Error al iniciar sesión", error);
    });
});

logoutBtn.addEventListener("click", () => {
  signOut(auth);
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    document.getElementById("note-form").style.display = "block";
    loadNotes(user.uid);
  } else {
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    document.getElementById("note-form").style.display = "none";
    document.getElementById("notes-container").innerHTML = "<p>Inicia sesión para ver tus notas.</p>";
  }
});

document.getElementById("note-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const note = document.getElementById("note").value;
  const reminder = document.getElementById("reminder").checked;
  const images = document.getElementById("image-upload").files;
  const user = auth.currentUser;

  if (!user) return;

  let imageUrls = [];
  for (const file of images) {
    const storageRef = ref(storage, `images/${file.name}`);
    await uploadBytes(storageRef, file);
    imageUrls.push(`images/${file.name}`);
  }

  await addDoc(collection(db, "notes"), {
    note,
    reminder,
    imageUrls,
    createdAt: new Date(),
    uid: user.uid
  });

  document.getElementById("note").value = "";
  document.getElementById("reminder").checked = false;
  document.getElementById("image-upload").value = "";

  loadNotes(user.uid);
});

async function loadNotes(uid) {
  const q = query(collection(db, "notes"), where("uid", "==", uid));
  const querySnapshot = await getDocs(q);
  const notesContainer = document.getElementById("notes-container");
  notesContainer.innerHTML = "";

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const card = document.createElement("div");
    card.classList.add("note-card");
    card.innerHTML = `
      <h3>Nota</h3>
      <p>${data.note}</p>
      ${data.reminder ? "<p>🔔 Con recordatorio</p>" : ""}
      ${(data.imageUrls || []).map(url => 
        `<img src="https://firebasestorage.googleapis.com/v0/b/el-grimorio.appspot.com/o/${encodeURIComponent(url)}?alt=media" width="100">`).join('')}
    `;
    notesContainer.appendChild(card);
  });
}
