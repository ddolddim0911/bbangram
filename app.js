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
    // 🔑 로그인 및 기본 UI
    const getAdminStatus = () => sessionStorage.getItem("isAdmin") === "true";
    
    // 카드 그리기 (카드 이미지는 꽉 채우기 'cover' 유지!)
    function drawCard(docId, title, price, shortDesc, longDesc, imageUrls, order) {
        const typeContainer = document.getElementById("type-container");
        const newCard = document.createElement("div");
        newCard.className = "type-card";
        
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

        // .card-img 스타일을 CSS 대신 직접 부여하여 꽉 차게 설정
        newCard.innerHTML = `
            ${adminBtnsHtml}
            <div style="width:100%; height:200px; background-image:url('${mainImg}'); background-size:cover; background-position:center; border-radius:10px;"></div>
            <div class="card-info"><h2>${title}</h2><p class="price">${price}</p><p class="desc">${shortDesc}</p></div>
        `;

        newCard.onclick = (e) => {
            if(e.target.tagName === 'BUTTON') return;
            openDetailModal(title, longDesc, imgs);
        };
        typeContainer.appendChild(newCard);
    }

    // 모달 상세 보기 (모달 안 사진은 비율 유지 'contain')
    function openDetailModal(title, longDesc, imgs) {
        let idx = 0;
        const modal = document.createElement("div");
        Object.assign(modal.style, { position:"fixed", top:0, left:0, width:"100%", height:"100%", backgroundColor:"rgba(0,0,0,0.6)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:1000 });
        
        modal.innerHTML = `
            <div style="width:90%; max-width:500px; background:#FFFDF8; padding:20px; border-radius:20px; border:3px solid #4A2E1B; position:relative;">
                <div style="height:300px; display:flex; justify-content:center; align-items:center; background:#f0e6d2; border:2px solid #4A2E1B; border-radius:15px; margin-bottom:15px; position:relative;">
                    <img id="modal-img" src="${imgs[0]}" style="max-width:100%; max-height:100%; object-fit:contain;">
                    ${imgs.length > 1 ? `
                        <button id="prev" style="position:absolute; left:5px;">◀</button>
                        <button id="next" style="position:absolute; right:5px;">▶</button>
                    ` : ''}
                </div>
                <h2>${title}</h2>
                <p style="white-space:pre-wrap;">${longDesc}</p>
                <button id="close" style="width:100%; padding:10px; background:#FFDE6A; border:2px solid #4A2E1B;">닫기</button>
            </div>
        `;
        document.body.appendChild(modal);

        if(imgs.length > 1) {
            modal.querySelector("#prev").onclick = () => { idx = (idx-1+imgs.length)%imgs.length; modal.querySelector("#modal-img").src = imgs[idx]; };
            modal.querySelector("#next").onclick = () => { idx = (idx+1)%imgs.length; modal.querySelector("#modal-img").src = imgs[idx]; };
        }
        modal.querySelector("#close").onclick = () => modal.remove();
    }

    // 데이터 불러오기
    db.collection("commission_types").orderBy("order", "asc").get().then(snapshot => {
        snapshot.forEach(doc => {
            const data = doc.data();
            drawCard(doc.id, data.title, data.price, data.shortDesc, data.longDesc, data.imageUrl, data.order);
        });
    });
});