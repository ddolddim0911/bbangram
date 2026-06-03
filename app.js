// 🔥 파이어베이스 설정 및 초기화
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

// 🔒 F12 개발자 도구 및 마우스 우클릭 차단
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', (e) => {
    if (e.key === 'F12') { e.preventDefault(); return false; }
    if (e.ctrlKey && e.shiftKey && e.key === 'I') { e.preventDefault(); return false; }
    if (e.ctrlKey && e.shiftKey && e.key === 'J') { e.preventDefault(); return false; }
    if (e.ctrlKey && e.key === 'u') { e.preventDefault(); return false; }
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); return false; }
});

// 🔒 불펌 및 이미지/글자 드래그 방지
const dragStyle = document.createElement("style");
dragStyle.innerHTML = `
    * { -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; -webkit-user-drag: none; }
    input, textarea { -webkit-user-select: text !important; -moz-user-select: text !important; -ms-user-select: text !important; user-select: text !important; }
`;
document.head.appendChild(dragStyle);

// 🔑 관리자 로그인 기능
const adminLoginBtn = document.getElementById("admin-login-btn");
if (adminLoginBtn) {
    adminLoginBtn.onclick = () => {
        const email = prompt("관리자 이메일을 입력하세요:");
        const password = prompt("비밀번호를 입력하세요:");

        if (email && password) {
            firebase.auth().signInWithEmailAndPassword(email, password)
                .then(() => {
                    alert("마스터 로그인 성공! 👑");
                    location.reload(); 
                })
                .catch(() => alert("로그인 실패: 신 정보가 틀렸습니다!"));
        }
    };
}

// 👑 관리자 권한 체크 함수들
function getAdminStatus() {
    return firebase.auth().currentUser !== null;
}

function checkLoginStatus() {
    const adminPanel = document.getElementById("admin-panel");
    if (adminPanel) {
        adminPanel.style.display = getAdminStatus() ? "block" : "none";
    }
}

// 📥 카드 화면에 그리기
function drawCard(docId, title, price, shortDesc, longDesc, imageUrls, order, type) {
    const typeContainer = document.getElementById("type-container");
    if (!typeContainer) return;

    const newCard = document.createElement("div");
    newCard.className = "type-card";
    newCard.style.position = "relative"; 
    newCard.style.cursor = "pointer";    

    const imgs = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
    const mainImg = imgs[0] || "";

    let adminBtnsHtml = "";
    if (getAdminStatus()) {
        adminBtnsHtml = `
            <div style="position:absolute; top:15px; left:15px; z-index:10; display:flex; gap:5px;">
                <button class="move-up-btn" data-id="${docId}" data-order="${order}" style="background:#FFF; color:#4A2E1B; border:3px solid #4A2E1B; border-radius:50%; width:32px; height:32px; font-weight:bold; cursor:pointer;">▲</button>
                <button class="move-down-btn" data-id="${docId}" data-order="${order}" style="background:#FFF; color:#4A2E1B; border:3px solid #4A2E1B; border-radius:50%; width:32px; height:32px; font-weight:bold; cursor:pointer;">▼</button>
            </div>
            <div style="position:absolute; top:15px; right:15px; z-index:10; display:flex; gap:8px;">
                <button class="edit-card-btn" data-id="${docId}" style="background:#FFDE6A; color:#4A2E1B; border:3px solid #4A2E1B; border-radius:50%; width:35px; height:35px; font-weight:bold; cursor:pointer;">✏️</button>
                <button class="delete-card-btn" data-id="${docId}" style="background:#FF6B6B; color:white; border:3px solid #4A2E1B; border-radius:50%; width:35px; height:35px; font-weight:bold; cursor:pointer;">❌</button>
            </div>
        `;
    }

    newCard.innerHTML = `
        ${adminBtnsHtml}
        <div class="card-img" style="background-image: url('${mainImg}');"></div>
        <div class="card-info">
            <h2>${title}</h2>
            <p class="price">${price}</p>
            <p class="desc">${shortDesc}</p> 
        </div>
    `;

    newCard.addEventListener("click", (e) => {
        const tc = e.target.classList;
        if (tc.contains("delete-card-btn") || tc.contains("edit-card-btn") || tc.contains("move-up-btn") || tc.contains("move-down-btn")) return;
        openDetailModal(docId, title, price, longDesc, imgs, type); 
    });

    typeContainer.appendChild(newCard);
}

// 🔼 위로 / 🔽 아래로 순서 이동 버튼 작동
document.addEventListener("click", async (e) => {
    const isUp = e.target.classList.contains("move-up-btn");
    const isDown = e.target.classList.contains("move-down-btn");
    
    if (isUp || isDown) {
        e.stopPropagation();
        const currentId = e.target.getAttribute("data-id");
        const currentOrder = parseInt(e.target.getAttribute("data-order"));

        const snapshot = await db.collection("commission_types").orderBy("order", isUp ? "desc" : "asc").get();
        let targetDoc = null;
        
        snapshot.docs.forEach(doc => {
            const docOrder = doc.data().order || 0;
            if (isUp && docOrder < currentOrder) {
                if (!targetDoc || docOrder > targetDoc.data().order) targetDoc = doc;
            } else if (isDown && docOrder > currentOrder) {
                if (!targetDoc || docOrder < targetDoc.data().order) targetDoc = doc;
            }
        });

        if (targetDoc) {
            const batch = db.batch();
            batch.update(db.collection("commission_types").doc(currentId), { order: targetDoc.data().order });
            batch.update(db.collection("commission_types").doc(targetDoc.id), { order: currentOrder });
            await batch.commit();
            location.reload();
        } else {
            alert(isUp ? "이미 맨 위에 있습니다! 🍞" : "이미 맨 아래에 있습니다! 🍞");
        }
    }
});

// ❌ 삭제 버튼 기능
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-card-btn")) {
        e.stopPropagation(); 
        if (confirm("정말 이 항목을 삭제하시겠습니까? 🛑")) {
            const docId = e.target.getAttribute("data-id");
            db.collection("commission_types").doc(docId).delete().then(() => {
                alert("삭제 완료되었습니다!");
                location.reload(); 
            });
        }
    }
});

// ✏️ 수정 버튼 기능
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("edit-card-btn")) {
        e.stopPropagation();
        const docId = e.target.getAttribute("data-id");
        db.collection("commission_types").doc(docId).get().then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                document.getElementById("edit-doc-id").value = doc.id;
                document.getElementById("edit-title").value = data.title || "";
                document.getElementById("edit-price").value = data.price || "";
                document.getElementById("edit-short-desc").value = data.shortDesc || data.desc || "";
                document.getElementById("edit-long-desc").value = data.longDesc || data.desc || "";
                document.getElementById("edit-modal").style.display = "flex";
            }
        });
    }
});

const closeEditBtn = document.getElementById("close-edit-btn");
if (closeEditBtn) { closeEditBtn.onclick = () => { document.getElementById("edit-modal").style.display = "none"; }; }

const updateBtn = document.getElementById("update-btn");
if (updateBtn) {
    updateBtn.onclick = () => {
        const docId = document.getElementById("edit-doc-id").value;
        const title = document.getElementById("edit-title").value;
        const price = document.getElementById("edit-price").value;
        const shortDesc = document.getElementById("edit-short-desc").value;
        const longDesc = document.getElementById("edit-long-desc").value;
        const imageFiles = document.getElementById("edit-image").files;

        if (!title || !price || !shortDesc || !longDesc) { return alert("빈칸을 채워주세요!"); }

        updateBtn.disabled = true;
        if (imageFiles.length > 0) {
            const resizePromises = Array.from(imageFiles).slice(0, 5).map(file => resizeImage(file));
            Promise.all(resizePromises).then(base64Images => saveToFirestore(docId, { title, price, shortDesc, longDesc, imageUrl: base64Images }));
        } else {
            saveToFirestore(docId, { title, price, shortDesc, longDesc });
        }
    };
}

function saveToFirestore(docId, updateData) {
    db.collection("commission_types").doc(docId).update(updateData).then(() => {
        alert("수정 성공! 🍮");
        location.reload();
    });
}

// 🔍 상세 보기 팝업 모달 함수
function openDetailModal(cardId, title, price, longDesc, imgs, type) {
    if (document.getElementById("detail-modal")) return;

    let currentImgIdx = 0;
    const modal = document.createElement("div");
    modal.id = "detail-modal";
    Object.assign(modal.style, {
        position: "fixed", top: "0", left: "0", width: "100%", height: "100%",
        backgroundColor: "rgba(74, 46, 27, 0.4)", zIndex: "1000",
        display: "flex", justifyContent: "center", alignItems: "center", padding: "20px"
    });

    const showArrows = imgs.length > 1;

    modal.innerHTML = `
        <div class="window-frame" style="width:100%; max-width:500px; background:#FFFDF8; border: 3px solid #4A2E1B; border-radius: 20px; overflow: hidden;">
            <div class="window-header" style="background: #FFDE6A; padding: 10px; display: flex; align-items: center; border-bottom: 3px solid #4A2E1B;">
                <div style="display:flex; gap: 5px;">
                    <span class="win-dot red close-modal" style="width:12px; height:12px; border-radius:50%; background-color:#FF6B6B; cursor:pointer;"></span>
                </div>
                <div style="margin-left: 15px; font-weight: bold; color: #4A2E1B;">📋 상세 메뉴판</div>
            </div>
            <div class="window-content" style="max-height:70vh; overflow-y:auto; padding:20px;">
                <div style="position:relative; width:100%; height:400px; border:3px solid #4A2E1B; border-radius:18px; display:flex; justify-content:center; align-items:center; overflow:hidden; margin-bottom:20px;">
                    <img id="modal-slider-img" src="${imgs[0]}" style="max-width:100%; max-height:100%; object-fit:contain;">
                    ${showArrows ? `
                        <button id="prev-img-btn" style="position:absolute; top:50%; left:10px; transform:translateY(-50%); background:#FFDE6A; border:2px solid #4A2E1B; border-radius:50%; width:35px; height:35px; font-weight:bold; cursor:pointer;">◀</button>
                        <button id="next-img-btn" style="position:absolute; top:50%; right:10px; transform:translateY(-50%); background:#FFDE6A; border:2px solid #4A2E1B; border-radius:50%; width:35px; height:35px; font-weight:bold; cursor:pointer;">▶</button>
                    ` : ''}
                </div>
                <h2 style="font-size:1.6rem; color:#4A2E1B; margin-bottom:8px;">${title}</h2>
                <p id="long-desc-area" style="font-size:1rem; line-height:1.7; color:#5C4033; white-space:pre-wrap; word-break:break-all;"></p>
                <div id="type-display-area" style="font-size:0.9rem; color:#888; margin-top:12px; font-weight:bold;"></div>
                <hr style="border:0; border-top:2px dashed #4A2E1B; margin:20px 0;">
                <h3 style="font-size:1.2rem; color:#4A2E1B; margin-bottom:10px;">🧁 후기</h3>
                <div id="reviews-list" style="margin-bottom:15px; max-height:200px; overflow-y:auto; background:#FFF; border:2px solid #4A2E1B; border-radius:10px; padding:10px;"></div>
                <div style="display:flex; flex-direction:column; gap:5px;">
                    <div style="display:flex; gap:5px;">
                        <input type="text" id="review-nickname" placeholder="닉네임" style="width:30%; padding:8px; border:2px solid #4A2E1B; border-radius:8px;">
                        <input type="text" id="review-content" placeholder="후기를 남겨주세요!" style="width:55%; padding:8px; border:2px solid #4A2E1B; border-radius:8px;">
                        <button id="submit-review-btn" style="width:15%; background:#FFDE6A; border:2px solid #4A2E1B; border-radius:8px; font-weight:bold; cursor:pointer;">등록</button>
                    </div>
                    <div style="display:flex; align-items:center; gap:5px;"><input type="checkbox" id="review-anon-check"><label for="review-anon-check" style="font-size:0.85rem;">익명</label></div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("long-desc-area").innerText = longDesc;
    document.getElementById("type-display-area").innerText = type ? `Typo: ${type}` : "타입 없음";

    const reviewsList = document.getElementById("reviews-list");
    db.collection("reviews").where("cardId", "==", cardId).orderBy("timestamp", "asc").onSnapshot((snapshot) => {
        reviewsList.innerHTML = snapshot.empty ? `<p style="color:#aaa; text-align:center;">첫 후기를 남겨보세요!</p>` : "";
        snapshot.forEach((doc) => {
            const rData = doc.data();
            const isAdmin = getAdminStatus();
            if (rData.isApproved || isAdmin) {
                const rDiv = document.createElement("div");
                rDiv.style.padding = "5px 0";
                rDiv.innerHTML = `<span><strong>${rData.isAnonymous && !isAdmin ? "익명" : rData.nickname}:</strong> ${rData.content}</span>`;
                reviewsList.appendChild(rDiv);
            }
        });
    });

    modal.querySelector("#submit-review-btn").onclick = () => {
        const nickname = modal.querySelector("#review-nickname").value.trim();
        const content = modal.querySelector("#review-content").value.trim();
        if (!nickname || !content) return alert("내용을 입력하세요!");
        db.collection("reviews").add({
            cardId, nickname, content, isApproved: false, isAnonymous: modal.querySelector("#review-anon-check").checked,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => alert("후기가 접수되었습니다! 주인장 승인 후 노출됩니다."));
    };

    if (showArrows) {
        modal.querySelector("#prev-img-btn").onclick = () => { currentImgIdx = currentImgIdx === 0 ? imgs.length - 1 : currentImgIdx - 1; modal.querySelector("#modal-slider-img").src = imgs[currentImgIdx]; };
        modal.querySelector("#next-img-btn").onclick = () => { currentImgIdx = currentImgIdx === imgs.length - 1 ? 0 : currentImgIdx + 1; modal.querySelector("#modal-slider-img").src = imgs[currentImgIdx]; };
    }

    const closeModal = () => modal.remove();
    modal.querySelector(".close-modal").onclick = closeModal;
    modal.onclick = (e) => { if (e.target === modal) closeModal(); };
}

// 🌟 핵심 구동: 페이지 열리자마자 데이터 바로 로딩
firebase.auth().onAuthStateChanged((user) => {
    const typeContainer = document.getElementById("type-container");
    if (typeContainer) typeContainer.innerHTML = "";
    checkLoginStatus();

    db.collection("commission_types").orderBy("order", "asc").get().then((snapshot) => {
        snapshot.forEach((doc) => {
            const data = doc.data();
            drawCard(doc.id, data.title, data.price, data.shortDesc || data.desc, data.longDesc || data.desc, data.imageUrl || [], data.order || 0, data.type || "");
        });
    });
});

// 🎨 이미지 리사이징 및 신규 등록
function resizeImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width; let height = img.height;
                if (width > 1024) { height *= 1024 / width; width = 1024; }
                canvas.width = width; canvas.height = height;
                canvas.getContext("2d").drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL("image/jpeg", 0.7));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

const submitBtn = document.getElementById("submit-btn");
if (submitBtn) {
    submitBtn.onclick = async () => {
        const title = document.getElementById("type-title").value;
        const price = document.getElementById("type-price").value;
        const shortDesc = document.getElementById("type-short-desc").value;
        const longDesc = document.getElementById("type-long-desc").value;
        const imageFiles = document.getElementById("type-image").files;

        if (!title || !price || !shortDesc || !longDesc || imageFiles.length === 0) return alert("모든 칸을 채워주세요!");

        submitBtn.disabled = true;
        const snapshot = await db.collection("commission_types").orderBy("order", "desc").limit(1).get();
        const nextOrder = snapshot.empty ? 1 : (snapshot.docs[0].data().order || 0) + 1;

        const resizePromises = Array.from(imageFiles).slice(0, 5).map(file => resizeImage(file));
        const base64Images = await Promise.all(resizePromises);

        await db.collection("commission_types").add({ title, price, shortDesc, longDesc, imageUrl: base64Images, order: nextOrder, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
        alert("등록 완료! 🍮");
        location.reload();
    };
}