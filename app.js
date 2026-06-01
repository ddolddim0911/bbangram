const firebaseConfig = {
    apiKey: "AIzaSyAzQIq6NTAJlRKDX9VQjd3bXzLlGYh5wn0",
    authDomain: "my-commission-8d480.firebaseapp.com",
    projectId: "my-commission-8d480",
    storageBucket: "my-commission-8d480.firebasestorage.app",
    messagingSenderId: "42651577345",
    appId: "1:42651577345:web:eb29745a17b3dacb2843c0"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(); 

document.addEventListener("DOMContentLoaded", () => {
    document.addEventListener("contextmenu", e => e.preventDefault());
    document.addEventListener("selectstart", e => e.preventDefault());

    const loginBtn = document.getElementById("login-btn");
    if (loginBtn) {
        loginBtn.addEventListener("click", () => {
            const password = prompt("비밀방 마스터 암호를 입력하세요:");
            if (password === "1234") { 
                sessionStorage.setItem("isAdmin", "true");
                location.reload();
            } else {
                alert("암호가 틀렸습니다!");
            }
        });
    }

    function getAdminStatus() { return sessionStorage.getItem("isAdmin") === "true"; }

    function drawCard(docId, title, price, shortDesc, longDesc, imageUrls, order) {
        const typeContainer = document.getElementById("type-container");
        const newCard = document.createElement("div");
        newCard.className = "type-card";
        newCard.style.position = "relative"; 
        newCard.style.cursor = "pointer";    

        const imgs = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
        const mainImg = imgs[0] || "";

        let adminBtnsHtml = getAdminStatus() ? `
            <div style="position:absolute; top:15px; left:15px; z-index:10; display:flex; gap:5px;">
                <button class="move-up-btn" data-id="${docId}" data-order="${order}" style="background:#FFF; border:2px solid #4A2E1B; border-radius:50%; width:30px; height:30px; cursor:pointer;">▲</button>
                <button class="move-down-btn" data-id="${docId}" data-order="${order}" style="background:#FFF; border:2px solid #4A2E1B; border-radius:50%; width:30px; height:30px; cursor:pointer;">▼</button>
            </div>
            <div style="position:absolute; top:15px; right:15px; z-index:10; display:flex; gap:5px;">
                <button class="edit-card-btn" data-id="${docId}" style="background:#FFDE6A; border:2px solid #4A2E1B; border-radius:50%; width:30px; height:30px; cursor:pointer;">✏️</button>
                <button class="delete-card-btn" data-id="${docId}" style="background:#FF6B6B; color:white; border:2px solid #4A2E1B; border-radius:50%; width:30px; height:30px; cursor:pointer;">❌</button>
            </div>
        ` : "";

        newCard.innerHTML = `${adminBtnsHtml}<div class="card-img" style="background-image: url('${mainImg}');"></div><div class="card-info"><h2>${title}</h2><p class="price">${price}</p><p class="desc">${shortDesc}</p></div>`;

        newCard.addEventListener("click", (e) => {
            const tc = e.target.classList;
            if (tc.contains("delete-card-btn") || tc.contains("edit-card-btn") || tc.contains("move-up-btn") || tc.contains("move-down-btn")) return;
            openDetailModal(title, price, longDesc, imgs);
        });
        typeContainer.appendChild(newCard);
    }

    async function swapOrder(currentId, currentOrder, direction) {
        const snapshot = await db.collection("commission_types").orderBy("order", direction === 'up' ? "desc" : "asc").get();
        let targetDoc = null;
        snapshot.docs.forEach(doc => {
            const docOrder = doc.data().order || 0;
            if ((direction === 'up' && docOrder < currentOrder) || (direction === 'down' && docOrder > currentOrder)) {
                if (!targetDoc || (direction === 'up' ? docOrder > targetDoc.data().order : docOrder < targetDoc.data().order)) targetDoc = doc;
            }
        });

        if (targetDoc) {
            const batch = db.batch();
            batch.update(db.collection("commission_types").doc(currentId), { order: targetDoc.data().order });
            batch.update(db.collection("commission_types").doc(targetDoc.id), { order: currentOrder });
            await batch.commit();
            location.reload();
        }
    }

    document.addEventListener("click", e => {
        if (e.target.classList.contains("move-up-btn")) swapOrder(e.target.dataset.id, parseInt(e.target.dataset.order), 'up');
        if (e.target.classList.contains("move-down-btn")) swapOrder(e.target.dataset.id, parseInt(e.target.dataset.order), 'down');
        if (e.target.classList.contains("delete-card-btn")) {
            if (confirm("정말 폐기하시겠습니까?")) db.collection("commission_types").doc(e.target.dataset.id).delete().then(() => location.reload());
        }
    });

    function openDetailModal(title, price, longDesc, imgs) {
        let currentImgIdx = 0;
        const modal = document.createElement("div");
        Object.assign(modal.style, { position: "fixed", top:0, left:0, width:"100%", height:"100%", backgroundColor:"rgba(0,0,0,0.5)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:1000 });
        
        modal.innerHTML = `
            <div style="width:90%; max-width:500px; background:#FFFDF8; padding:20px; border-radius:20px; border:3px solid #4A2E1B; position:relative;">
                <div style="height:300px; display:flex; justify-content:center; align-items:center; background:#f0e6d2; border:2px solid #4A2E1B; border-radius:15px; margin-bottom:15px;">
                    <img id="modal-img" src="${imgs[0]}" style="max-width:100%; max-height:100%; object-fit:contain;">
                </div>
                <h2>${title}</h2>
                <p style="white-space:pre-wrap;">${longDesc}</p>
                <button id="close-modal" style="width:100%; padding:10px; background:#FFDE6A; border:2px solid #4A2E1B; cursor:pointer;">닫기</button>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector("#close-modal").onclick = () => modal.remove();
    }

    db.collection("commission_types").orderBy("order", "asc").get().then(snapshot => {
        snapshot.forEach(doc => {
            const data = doc.data();
            drawCard(doc.id, data.title, data.price, data.shortDesc, data.longDesc, data.imageUrl, data.order);
        });
    });
});