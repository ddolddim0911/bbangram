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
    const getAdminStatus = () => sessionStorage.getItem("isAdmin") === "true";

    function drawCard(docId, title, price, shortDesc, longDesc, imageUrls, order) {
        const typeContainer = document.getElementById("type-container");
        const newCard = document.createElement("div");
        newCard.className = "type-card";
        newCard.style.position = "relative";
        
        const imgs = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
        const mainImg = imgs[0] || "";

        let adminBtnsHtml = getAdminStatus() ? `
            <div style="position:absolute; top:15px; left:15px; z-index:10; display:flex; gap:5px;">
                <button class="move-up-btn" data-id="${docId}" data-order="${order}">▲</button>
                <button class="move-down-btn" data-id="${docId}" data-order="${order}">▼</button>
            </div>
            <div style="position:absolute; top:15px; right:15px; z-index:10; display:flex; gap:5px;">
                <button class="edit-card-btn" data-id="${docId}">✏️</button>
                <button class="delete-card-btn" data-id="${docId}">❌</button>
            </div>
        ` : "";

        newCard.innerHTML = `
            ${adminBtnsHtml}
            <div style="width:100%; height:200px; background-image:url('${mainImg}'); background-size:cover; background-position:center; border-radius:15px 15px 0 0; background-repeat:no-repeat;"></div>
            <div class="card-info" style="padding:15px;">
                <h2>${title}</h2>
                <p class="price">${price}</p>
                <p class="desc">${shortDesc}</p>
            </div>
        `;

        newCard.onclick = (e) => {
            if(e.target.tagName === 'BUTTON') return;
            openDetailModal(title, price, longDesc, imgs);
        };
        typeContainer.appendChild(newCard);
    }

    function openDetailModal(title, price, longDesc, imgs) {
        let idx = 0;
        const modal = document.createElement("div");
        Object.assign(modal.style, { position:"fixed", top:0, left:0, width:"100%", height:"100%", backgroundColor:"rgba(0,0,0,0.7)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:1000 });
        
        modal.innerHTML = `
            <div style="width:90%; max-width:500px; background:#FFFDF8; padding:20px; border-radius:20px; border:3px solid #4A2E1B; position:relative;">
                <div style="height:350px; display:flex; justify-content:center; align-items:center; background:#f0e6d2; border:2px solid #4A2E1B; border-radius:15px; margin-bottom:15px; position:relative;">
                    <img id="modal-img" src="${imgs[0]}" style="max-width:100%; max-height:100%; object-fit:contain;">
                    ${imgs.length > 1 ? `
                        <button id="prev" style="position:absolute; left:10px; cursor:pointer;">◀</button>
                        <button id="next" style="position:absolute; right:10px; cursor:pointer;">▶</button>
                        <div id="counter" style="position:absolute; bottom:10px; font-weight:bold; color:#4A2E1B;">1 / ${imgs.length}</div>
                    ` : ''}
                </div>
                <h2>${title}</h2>
                <p style="color:#D35400; font-weight:bold;">${price}</p>
                <p style="white-space:pre-wrap;">${longDesc}</p>
                <button id="close" style="width:100%; padding:10px; background:#FFDE6A; border:2px solid #4A2E1B; cursor:pointer;">닫기</button>
            </div>
        `;
        document.body.appendChild(modal);

        if(imgs.length > 1) {
            modal.querySelector("#prev").onclick = () => { idx = (idx-1+imgs.length)%imgs.length; modal.querySelector("#modal-img").src = imgs[idx]; modal.querySelector("#counter").innerText = `${idx+1} / ${imgs.length}`; };
            modal.querySelector("#next").onclick = () => { idx = (idx+1)%imgs.length; modal.querySelector("#modal-img").src = imgs[idx]; modal.querySelector("#counter").innerText = `${idx+1} / ${imgs.length}`; };
        }
        modal.querySelector("#close").onclick = () => modal.remove();
    }

    async function swapOrder(id, order, dir) {
        const snap = await db.collection("commission_types").orderBy("order", dir === 'up' ? "desc" : "asc").get();
        let target = null;
        snap.docs.forEach(doc => {
            const docOrder = doc.data().order || 0;
            if((dir === 'up' && docOrder < order) || (dir === 'down' && docOrder > order)) {
                if(!target || (dir === 'up' ? docOrder > target.data().order : docOrder < target.data().order)) target = doc;
            }
        });
        if(target) {
            const batch = db.batch();
            batch.update(db.collection("commission_types").doc(id), { order: target.data().order });
            batch.update(db.collection("commission_types").doc(target.id), { order: order });
            await batch.commit();
            location.reload();
        }
    }

    document.addEventListener("click", e => {
        if(e.target.classList.contains("move-up-btn")) swapOrder(e.target.dataset.id, parseInt(e.target.dataset.order), 'up');
        if(e.target.classList.contains("move-down-btn")) swapOrder(e.target.dataset.id, parseInt(e.target.dataset.order), 'down');
        if(e.target.classList.contains("delete-card-btn")) { if(confirm("삭제할까요?")) db.collection("commission_types").doc(e.target.dataset.id).delete().then(() => location.reload()); }
    });

    db.collection("commission_types").orderBy("order", "asc").get().then(snap => {
        snap.forEach(doc => {
            const d = doc.data();
            drawCard(doc.id, d.title, d.price, d.shortDesc, d.longDesc, d.imageUrl, d.order);
        });
    });
});