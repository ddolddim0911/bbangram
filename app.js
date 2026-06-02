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
    
    // 불펌 방지 기능
    document.addEventListener("contextmenu", e => e.preventDefault());
    document.addEventListener("selectstart", e => e.preventDefault());

    // 🔑 비밀 암호 로그인 기능
    const loginBtn = document.getElementById("login-btn");
    if (loginBtn) {
        loginBtn.addEventListener("click", () => {
            const password = prompt("비밀방 마스터 암호를 입력하세요:");
            if (password === "yena1012!") { 
                alert("비밀방 로그인 성공! 🍯");
                sessionStorage.setItem("isAdmin", "true");
                checkLoginStatus();
                location.reload();
            } else {
                alert("암호가 틀렸습니다! 🛑");
            }
        });
    }

    function getAdminStatus() {
        return sessionStorage.getItem("isAdmin") === "true";
    }

    function checkLoginStatus() {
        const adminPanel = document.getElementById("admin-panel");
        if (adminPanel) {
            if (getAdminStatus()) {
                adminPanel.style.display = "block";
            } else {
                adminPanel.style.display = "none";
            }
        }
    }

    // 📥 카드 그리기 함수
    function drawCard(docId, title, price, shortDesc, longDesc, imageUrls, order, allCardsData) {
        const typeContainer = document.getElementById("type-container");
        const newCard = document.createElement("div");
        newCard.className = "type-card";
        newCard.style.position = "relative"; 
        newCard.style.cursor = "pointer";    

        const imgs = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
        const mainImg = imgs[0] || "";

        let adminBtnsHtml = "";
        if (getAdminStatus()) {
            adminBtnsHtml = `
                <!-- 좌측 상단: 위아래 순서 변경 화살표 버튼 ↕️ -->
                <div style="position:absolute; top:15px; left:15px; z-index:10; display:flex; gap:5px;">
                    <button class="move-up-btn" data-id="${docId}" data-order="${order}" style="background:#FFF; color:#4A2E1B; border:3px solid #4A2E1B; border-radius:50%; width:32px; height:32px; font-weight:bold; cursor:pointer; box-shadow:0 3px 0 #4A2E1B; font-size:0.8rem; display:flex; justify-content:center; align-items:center;">▲</button>
                    <button class="move-down-btn" data-id="${docId}" data-order="${order}" style="background:#FFF; color:#4A2E1B; border:3px solid #4A2E1B; border-radius:50%; width:32px; height:32px; font-weight:bold; cursor:pointer; box-shadow:0 3px 0 #4A2E1B; font-size:0.8rem; display:flex; justify-content:center; align-items:center;">▼</button>
                </div>
                <!-- 우측 상단: 수정 및 삭제 버튼 🛠️ -->
                <div style="position:absolute; top:15px; right:15px; z-index:10; display:flex; gap:8px;">
                    <button class="edit-card-btn" data-id="${docId}" style="background:#FFDE6A; color:#4A2E1B; border:3px solid #4A2E1B; border-radius:50%; width:35px; height:35px; font-weight:bold; cursor:pointer; box-shadow:0 3px 0 #4A2E1B;">✏️</button>
                    <button class="delete-card-btn" data-id="${docId}" style="background:#FF6B6B; color:white; border:3px solid #4A2E1B; border-radius:50%; width:35px; height:35px; font-weight:bold; cursor:pointer; box-shadow:0 3px 0 #4A2E1B;">❌</button>
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
            openDetailModal(title, price, longDesc, imgs);
        });

        typeContainer.appendChild(newCard);
    }

    // 🔼 위로 한 칸 보내기 기능
    document.addEventListener("click", async (e) => {
        if (e.target.classList.contains("move-up-btn")) {
            e.stopPropagation();
            const currentId = e.target.getAttribute("data-id");
            const currentOrder = parseInt(e.target.getAttribute("data-order"));

            // 내 바로 위에 있는 카드 찾기
            const snapshot = await db.collection("commission_types").orderBy("order", "desc").get();
            let prevDoc = null;
            
            snapshot.docs.forEach(doc => {
                const docOrder = doc.data().order || 0;
                if (docOrder < currentOrder) {
                    if (!prevDoc || docOrder > prevDoc.data().order) {
                        prevDoc = doc;
                    }
                }
            });

            if (prevDoc) {
                // 내 순서와 윗 카드의 순서를 맞바꾸기
                const prevId = prevDoc.id;
                const prevOrder = prevDoc.data().order;

                const batch = db.batch();
                batch.update(db.collection("commission_types").doc(currentId), { order: prevOrder });
                batch.update(db.collection("commission_types").doc(prevId), { order: currentOrder });
                await batch.commit();
                location.reload();
            } else {
                alert("이미 맨 위에 있는 빵입니다! 🍞");
            }
        }
    });

    // 🔽 아래로 한 칸 보내기 기능
    document.addEventListener("click", async (e) => {
        if (e.target.classList.contains("move-down-btn")) {
            e.stopPropagation();
            const currentId = e.target.getAttribute("data-id");
            const currentOrder = parseInt(e.target.getAttribute("data-order"));

            // 내 바로 아래에 있는 카드 찾기
            const snapshot = await db.collection("commission_types").orderBy("order", "asc").get();
            let nextDoc = null;
            
            snapshot.docs.forEach(doc => {
                const docOrder = doc.data().order || 0;
                if (docOrder > currentOrder) {
                    if (!nextDoc || docOrder < nextDoc.data().order) {
                        nextDoc = doc;
                    }
                }
            });

            if (nextDoc) {
                // 내 순서와 아랫 카드의 순서를 맞바꾸기
                const nextId = nextDoc.id;
                const nextOrder = nextDoc.data().order;

                const batch = db.batch();
                batch.update(db.collection("commission_types").doc(currentId), { order: nextOrder });
                batch.update(db.collection("commission_types").doc(nextId), { order: currentOrder });
                await batch.commit();
                location.reload();
            } else {
                alert("이미 맨 아래에 있는 빵입니다! 🍞");
            }
        }
    });

    // ❌ 빵 폐기하기(삭제) 기능
    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("delete-card-btn")) {
            e.stopPropagation(); 
            if (confirm("정말 이 빵(타입)을 창고에서 폐기하시겠습니까? 🛑")) {
                const docId = e.target.getAttribute("data-id");
                db.collection("commission_types").doc(docId).delete().then(() => {
                    alert("창고에서 안전하게 폐기 완료되었습니다!");
                    location.reload(); 
                }).catch(err => alert("폐기 실패: " + err.message));
            }
        }
    });

    // ✏️ 관리자 [수정] 단추 작동
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
    if (closeEditBtn) { closeEditBtn.addEventListener("click", () => { document.getElementById("edit-modal").style.display = "none"; }); }

    // ✏️ 수정 완료 버튼 클릭 시 작동
    const updateBtn = document.getElementById("update-btn");
    if (updateBtn) {
        updateBtn.addEventListener("click", () => {
            const docId = document.getElementById("edit-doc-id").value;
            const title = document.getElementById("edit-title").value;
            const price = document.getElementById("edit-price").value;
            const shortDesc = document.getElementById("edit-short-desc").value;
            const longDesc = document.getElementById("edit-long-desc").value;
            const imageFiles = document.getElementById("edit-image").files;

            if (!title || !price || !shortDesc || !longDesc) {
                alert("빈칸이 있으면 수정할 수 없어요! 🎨");
                return;
            }

            updateBtn.disabled = true;
            updateBtn.innerText = "수정된 빵 다이어트 중... 🥖";

            if (imageFiles.length > 0) {
                const resizePromises = Array.from(imageFiles).slice(0, 5).map(file => resizeImage(file));
                Promise.all(resizePromises).then((base64Images) => {
                    saveToFirestore(docId, { title, price, shortDesc, longDesc, imageUrl: base64Images });
                });
            } else {
                saveToFirestore(docId, { title, price, shortDesc, longDesc });
            }
        });
    }

    function saveToFirestore(docId, updateData) {
        db.collection("commission_types").doc(docId).update(updateData).then(() => {
            alert("빵집 메뉴판 수정 성공! 🍮");
            location.reload();
        }).catch(err => {
            alert("수정 실패: " + err.message);
            updateBtn.disabled = false;
            updateBtn.innerText = "수정 완료하기 📋";
        });
    }

// 🔍 상세 팝업창(모달) 열기 함수
function openDetailModal(title, price, longDesc, imgs) {
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
        <div class="window-frame" style="width:100%; max-width:500px; background:#FFFDF8; animation: popUp 0.25s ease-out; border: 3px solid #4A2E1B; border-radius: 20px; overflow: hidden;">
            <div class="window-header" style="background: #FFDE6A; padding: 10px; display: flex; align-items: center; border-bottom: 3px solid #4A2E1B;">
                <div class="window-buttons" style="display:flex; gap: 5px;">
                    <span class="win-dot red close-modal" style="width:12px; height:12px; border-radius:50%; background-color:#FF6B6B; cursor:pointer;"></span>
                    <span class="win-dot yellow" style="width:12px; height:12px; border-radius:50%; background-color:#ffdd1d;"></span>
                    <span class="win-dot green" style="width:12px; height:12px; border-radius:50%; background-color:#ffeb9a;"></span>
                </div>
                <div class="window-address-bar" style="margin-left: 15px; font-weight: bold; color: #4A2E1B;">📋 빵집 상세 메뉴판</div>
            </div>
            <div class="window-content" style="max-height:70vh; overflow-y:auto; padding:20px;">
                 <div style="position:relative; width:100%; height:400px; background: transparent; border:3px solid #4A2E1B; border-radius:18px; display:flex; justify-content:center; align-items:center; overflow:hidden; margin-bottom:20px;">
                     <img id="modal-slider-img" src="${imgs[0]}" style="max-width:100%; max-height:100%; object-fit:contain; display:block;">
                    ${showArrows ? `
                        <button id="prev-img-btn" style="position:absolute; top:50%; left:10px; transform:translateY(-50%); background:#FFDE6A; border:2px solid #4A2E1B; border-radius:50%; width:35px; height:35px; font-weight:bold; cursor:pointer;">◀</button>
                        <button id="next-img-btn" style="position:absolute; top:50%; right:10px; transform:translateY(-50%); background:#FFDE6A; border:2px solid #4A2E1B; border-radius:50%; width:35px; height:35px; font-weight:bold; cursor:pointer;">▶</button>
                    ` : ''}
                </div>
                ${showArrows ? `<div id="img-counter" style="text-align:center; margin-bottom:10px; font-weight:bold; color:#4A2E1B;">1 / ${imgs.length}</div>` : ''}
                <h2 style="font-size:1.6rem; font-weight:900; color:#4A2E1B; margin-bottom:8px;">${title}</h2>
                <p style="font-size:1.3rem; color:#D35400; font-weight:800; margin-bottom:15px; border-bottom:3px dashed #FFDE6A; padding-bottom:8px;">${price}</p>
                <p style="font-size:1rem; line-height:1.7; color:#5C4033; white-space:pre-wrap; word-break:break-all;">${longDesc}</p>
                <button class="close-modal" style="width:100%; margin-top:20px; padding:12px; background:#FFDE6A; border:3px solid #4A2E1B; border-radius:12px; font-weight:bold; color:#4A2E1B; cursor:pointer;">닫기 🥖</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 이미지 슬라이더 로직
    if (showArrows) {
        const sliderImg = modal.querySelector("#modal-slider-img");
        const counterTxt = modal.querySelector("#img-counter");
        modal.querySelector("#prev-img-btn").onclick = (e) => {
            e.stopPropagation();
            currentImgIdx = (currentImgIdx === 0) ? imgs.length - 1 : currentImgIdx - 1;
            sliderImg.src = imgs[currentImgIdx];
            counterTxt.innerText = `${currentImgIdx + 1} / ${imgs.length}`;
        };
        modal.querySelector("#next-img-btn").onclick = (e) => {
            e.stopPropagation();
            currentImgIdx = (currentImgIdx === imgs.length - 1) ? 0 : currentImgIdx + 1;
            sliderImg.src = imgs[currentImgIdx];
            counterTxt.innerText = `${currentImgIdx + 1} / ${imgs.length}`;
        };
    }

    // 닫기 이벤트 통합
    const closeModal = () => modal.remove();
    modal.querySelectorAll(".close-modal").forEach(btn => btn.onclick = closeModal);
    modal.onclick = (e) => { if (e.target === modal) closeModal(); };
}

    // 🚚 창고에서 order(순서) 기준으로 정렬해서 가져오기!
    db.collection("commission_types").orderBy("order", "asc").get().then((snapshot) => {
        snapshot.forEach((doc) => {
            const data = doc.data();
            const shortDesc = data.shortDesc || data.desc || "";
            const longDesc = data.longDesc || data.desc || "";
            const imgs = data.imageUrl || [];
            const order = data.order || 0;
            drawCard(doc.id, data.title, data.price, shortDesc, longDesc, imgs, order);
        });
    });

    // 🎨 이미지 다이어트(압축) 마법 함수
    function resizeImage(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    let width = img.width;
                    let height = img.height;

                    const MAX_WIDTH = 1024;
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0, width, height);

                    const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
                    resolve(compressedBase64);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // 🎨 다중 업로드 등록 버튼 기능 (등록 시 고유 순서 번호 부여)
    const submitBtn = document.getElementById("submit-btn");
    if (submitBtn) {
        submitBtn.addEventListener("click", async () => {
            const title = document.getElementById("type-title").value;
            const price = document.getElementById("type-price").value;
            const shortDesc = document.getElementById("type-short-desc").value; 
            const longDesc = document.getElementById("type-long-desc").value;   
            const imageFiles = document.getElementById("type-image").files;

            if (!title || !price || !shortDesc || !longDesc || imageFiles.length === 0) {
                alert("빈칸 없이 모든 항목과 그림 파일을 최소 1장 이상 등록해 주세요! 🎨");
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerText = "빵 맛있게 다이어트 시키는 중... 🥖";

            try {
                // 현재 등록된 빵 중 가장 높은 order 번호 찾기 (순서가 꼬이지 않게 계속 뒤로 붙임)
                const snapshot = await db.collection("commission_types").orderBy("order", "desc").limit(1).get();
                let nextOrder = 1;
                if (!snapshot.empty) {
                    nextOrder = (snapshot.docs[0].data().order || 0) + 1;
                }

                const resizePromises = Array.from(imageFiles).slice(0, 5).map(file => resizeImage(file));
                const base64Images = await Promise.all(resizePromises);

                const docRef = await db.collection("commission_types").add({
                    title: title,
                    price: price,
                    shortDesc: shortDesc,
                    longDesc: longDesc,
                    imageUrl: base64Images, 
                    order: nextOrder, // 고유 순서 번호 저장!
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });

                drawCard(docRef.id, title, price, shortDesc, longDesc, base64Images, nextOrder);
                alert("창고에 안전하게 다중 샘플 등록 완료! 🍮");
                location.reload(); // 순서 배치를 정확히 그리기 위해 리로드

            } catch (err) {
                alert("등록 실패- 에러: " + err.message);
                submitBtn.disabled = false;
                submitBtn.innerText = "새 빵 등록하기(업로드)";
            }
        });
    }

    checkLoginStatus();
});