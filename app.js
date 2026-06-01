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
    function drawCard(docId, title, price, shortDesc, longDesc, imageUrls) {
        const typeContainer = document.getElementById("type-container");
        const newCard = document.createElement("div");
        newCard.className = "type-card";
        newCard.style.position = "relative"; 
        newCard.style.cursor = "pointer";    

        // 하위 호환성: 이미지가 배열이 아니라 문자열 1개면 배열로 감싸주기
        const imgs = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
        const mainImg = imgs[0] || "";

        let adminBtnsHtml = "";
        if (getAdminStatus()) {
            adminBtnsHtml = `
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
            if (e.target.classList.contains("delete-card-btn") || e.target.classList.contains("edit-card-btn")) return;
            openDetailModal(title, price, longDesc, imgs);
        });

        typeContainer.appendChild(newCard);
    }

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

    // ✏️ 관리자 [수정] 단추 눌렀을 때 작동하는 마법
    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("edit-card-btn")) {
            e.stopPropagation();
            const docId = e.target.getAttribute("data-id");
            
            // 기존 데이터를 창고에서 임시로 가져와서 수정창 칸에 미리 채워줍니다!
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

    // 수정 창 닫기 버튼들
    const closeEditBtn = document.getElementById("close-edit-btn");
    if (closeEditBtn) { closeEditBtn.addEventListener("click", () => { document.getElementById("edit-modal").style.display = "none"; }); }

    // ✏️ 진짜 수정 데이터 창고에 업데이트 완료 버튼 누를 때
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
            updateBtn.innerText = "수정된 빵 다시 굽는 중... 🥖";

            // 만약 새 사진들을 등록했다면 새로 읽어오고, 아니면 기존 사진 유지하기 기법!
            if (imageFiles.length > 0) {
                const readPromises = Array.from(imageFiles).slice(0, 5).map(file => {
                    return new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target.result);
                        reader.readAsDataURL(file);
                    });
                });

                Promise.all(readPromises).then((base64Images) => {
                    saveToFirestore(docId, { title, price, shortDesc, longDesc, imageUrl: base64Images });
                });
            } else {
                // 사진 수정 안 할 땐 텍스트만 쏙 업그레이드
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


    // 🔍 상세 팝업창(모달) 열기 함수 (다중 이미지 좌우 슬라이드 지원! ↕️)
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

        // 이미지가 여러 장일 때만 화살표와 인디케이터 단추 보여주기 세팅
        const showArrows = imgs.length > 1;

        modal.innerHTML = `
            <div class="window-frame" style="width:100%; max-width:500px; background:#FFFDF8; animation: popUp 0.25s ease-out;">
                <div class="window-header">
                    <div class="window-buttons">
                        <span class="win-dot red close-modal" style="background-color:#ffae00; cursor:pointer;"></span>
                        <span class="win-dot yellow" style="background-color:#ffdd1d;"></span>
                        <span class="win-dot green" style="background-color:#ffeb9a;"></span>
                    </div>
                    <div class="window-address-bar">📋 빵집 상세 메뉴판</div>
                </div>
                <div class="window-content" style="max-height:80vh; overflow-y:auto; padding:20px;">
                    
                    <div style="position:relative; width:100%; margin-bottom:20px;">
                        <img id="modal-slider-img" src="${imgs[0]}" style="width:100%; height:auto; border:3px solid #4A2E1B; border-radius:18px; box-shadow:4px 4px 0 #4A2E1B; display:block;">
                        
                        ${showArrows ? `
                            <button id="prev-img-btn" style="position:absolute; top:50%; left:10px; transform:translateY(-50%); background:#FFDE6A; border:3px solid #4A2E1B; border-radius:50%; width:35px; height:35px; font-weight:bold; cursor:pointer; box-shadow:0 3px 0 #4A2E1B;">◀</button>
                            <button id="next-img-btn" style="position:absolute; top:50%; right:10px; transform:translateY(-50%); background:#FFDE6A; border:3px solid #4A2E1B; border-radius:50%; width:35px; height:35px; font-weight:bold; cursor:pointer; box-shadow:0 3px 0 #4A2E1B;">▶</button>
                            <div id="img-counter" style="text-align:center; margin-top:10px; font-weight:bold; color:#4A2E1B; font-size:0.9rem;">1 / ${imgs.length}</div>
                        ` : ''}
                    </div>

                    <h2 style="font-size:1.6rem; font-weight:900; color:#4A2E1B; margin-bottom:8px;">${title}</h2>
                    <p style="font-size:1.3rem; color:#D35400; font-weight:800; margin-bottom:15px; border-bottom:3px dashed #FFDE6A; padding-bottom:8px;">${price}</p>
                    <p style="font-size:1rem; line-height:1.7; color:#5C4033; white-space:pre-wrap; word-break:break-all;">${longDesc}</p>
                    <button class="close-modal" style="width:100%; margin-top:20px; padding:12px; background:#FFDE6A; border:3px solid #4A2E1B; border-radius:12px; font-weight:bold; color:#4A2E1B; cursor:pointer; box-shadow:0 4px 0 #4A2E1B;">닫기 🥖</button>
                </div>
            </div>
        `;

        const style = document.createElement("style");
        style.innerHTML = `@keyframes popUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }`;
        document.head.appendChild(style);

        document.body.appendChild(modal);

        // 슬라이더 버튼 작동 마법
        if (showArrows) {
            const sliderImg = modal.querySelector("#modal-slider-img");
            const counterTxt = modal.querySelector("#img-counter");
            
            modal.querySelector("#prev-img-btn").addEventListener("click", () => {
                currentImgIdx = (currentImgIdx === 0) ? imgs.length - 1 : currentImgIdx - 1;
                sliderImg.src = imgs[currentImgIdx];
                counterTxt.innerText = `${currentImgIdx + 1} / ${imgs.length}`;
            });

            modal.querySelector("#next-img-btn").addEventListener("click", () => {
                currentImgIdx = (currentImgIdx === imgs.length - 1) ? 0 : currentImgIdx + 1;
                sliderImg.src = imgs[currentImgIdx];
                counterTxt.innerText = `${currentImgIdx + 1} / ${imgs.length}`;
            });
        }

        modal.querySelectorAll(".close-modal").forEach(btn => {
            btn.addEventListener("click", () => modal.remove());
        });
        modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });
    }

    // 🚚 창고에서 데이터 다 긁어오기
    db.collection("commission_types").orderBy("timestamp", "asc").get().then((snapshot) => {
        snapshot.forEach((doc) => {
            const data = doc.data();
            const shortDesc = data.shortDesc || data.desc || "";
            const longDesc = data.longDesc || data.desc || "";
            // 옛날 데이터(imageUrl)와 새 데이터(imageUrl 배열) 모두 호환되도록 처리
            const imgs = data.imageUrl || [];
            drawCard(doc.id, data.title, data.price, shortDesc, longDesc, imgs);
        });
    });

    // 🎨 다중 업로드 등록 버튼 기능!
    const submitBtn = document.getElementById("submit-btn");
    if (submitBtn) {
        submitBtn.addEventListener("click", () => {
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
            submitBtn.innerText = "빵 맛있게 굽는 중... 🥖";

            // 파일 여러 개(최대 5장)를 비동기로 차례차례 읽어오는 마법의 약속(Promise)
            const readPromises = Array.from(imageFiles).slice(0, 5).map(file => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(file);
                });
            });

            Promise.all(readPromises).then((base64Images) => {
                db.collection("commission_types").add({
                    title: title,
                    price: price,
                    shortDesc: shortDesc,
                    longDesc: longDesc,
                    imageUrl: base64Images, // 배열 형태로 쏙 저장!
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                }).then((docRef) => {
                    drawCard(docRef.id, title, price, shortDesc, longDesc, base64Images);
                    alert("창고에 여러 샘플 등록 완료! 🍮");

                    document.getElementById("type-title").value = "";
                    document.getElementById("type-price").value = "";
                    document.getElementById("type-short-desc").value = "";
                    document.getElementById("type-long-desc").value = "";
                    document.getElementById("type-image").value = "";
                    submitBtn.disabled = false;
                    submitBtn.innerText = "새 빵 등록하기(업로드)";
                }).catch((err) => {
                    alert("등록 실패- 에러: " + err.message);
                    submitBtn.disabled = false;
                    submitBtn.innerText = "새 빵 등록하기(업로드)";
                });
            });
        });
    }

    checkLoginStatus();
});