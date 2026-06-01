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
    function drawCard(docId, title, price, shortDesc, longDesc, imageUrl) {
        const typeContainer = document.getElementById("type-container");
        const newCard = document.createElement("div");
        newCard.className = "type-card";
        newCard.style.position = "relative"; 
        newCard.style.cursor = "pointer";    

        let deleteBtnHtml = "";
        if (getAdminStatus()) {
            deleteBtnHtml = `<button class="delete-card-btn" data-id="${docId}" style="position:absolute; top:15px; right:15px; background:#FF6B6B; color:white; border:3px solid #4A2E1B; border-radius:50%; width:35px; height:35px; font-weight:bold; cursor:pointer; z-index:10; box-shadow:0 3px 0 #4A2E1B;">❌</button>`;
        }

        newCard.innerHTML = `
            ${deleteBtnHtml}
            <div class="card-img" style="background-image: url('${imageUrl}');"></div>
            <div class="card-info">
                <h2>${title}</h2>
                <p class="price">${price}</p>
                <p class="desc">${shortDesc}</p> 
            </div>
        `;

        newCard.addEventListener("click", (e) => {
            if (e.target.classList.contains("delete-card-btn")) return;
            openDetailModal(title, price, longDesc, imageUrl);
        });

        typeContainer.appendChild(newCard);
    }

    // ❌ 빵 폐기하기(삭제) 기능
    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("delete-card-btn")) {
            e.stopPropagation(); 
            if (confirm("정말 이 빵을 창고에서 폐기하시겠습니까? 🛑")) {
                const docId = e.target.getAttribute("data-id");
                db.collection("commission_types").doc(docId).delete().then(() => {
                    alert("창고에서 안전하게 폐기 완료되었습니다!");
                    location.reload(); 
                }).catch(err => alert("폐기 실패: " + err.message));
            }
        }
    });

    // 🔍 상세 팝업창(모달) 열기 함수
    function openDetailModal(title, price, longDesc, imageUrl) {
        if (document.getElementById("detail-modal")) return;

        const modal = document.createElement("div");
        modal.id = "detail-modal";
        Object.assign(modal.style, {
            position: "fixed", top: "0", left: "0", width: "100%", height: "100%",
            backgroundColor: "rgba(74, 46, 27, 0.4)", zIndex: "1000",
            display: "flex", justifyContent: "center", alignItems: "center", padding: "20px"
        });

        modal.innerHTML = `
            <div class="window-frame" style="width:100%; max-width:500px; background:#FFFDF8; animation: popUp 0.25s ease-out;">
                <div class="window-header">
                    <div class="window-buttons">
                        <span class="win-dot red close-modal" style="background-color:#ffae00;"></span>
                        <span class="win-dot yellow" style="background-color:#ffdd1d;"></span>
                        <span class="win-dot green" style="background-color:#ffeb9a;"></span>
                    </div>
                    <div class="window-address-bar">📋 빵집 상세 메뉴판</div>
                </div>
                <div class="window-content" style="max-height:80vh; overflow-y:auto; padding:20px;">
                    <img src="${imageUrl}" style="width:100%; border:3px solid #4A2E1B; border-radius:18px; box-shadow:4px 4px 0 #4A2E1B; margin-bottom:20px;">
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
            drawCard(doc.id, data.title, data.price, shortDesc, longDesc, data.imageUrl);
        });
    });

    // 🎨 [오류 해결!] 분리된 입력창에 맞춘 업로드 기능
    const submitBtn = document.getElementById("submit-btn");
    if (submitBtn) {
        submitBtn.addEventListener("click", () => {
            const title = document.getElementById("type-title").value;
            const price = document.getElementById("type-price").value;
            const shortDesc = document.getElementById("type-short-desc").value; 
            const longDesc = document.getElementById("type-long-desc").value;   
            const imageFile = document.getElementById("type-image").files[0];

            if (!title || !price || !shortDesc || !longDesc || !imageFile) {
                alert("빈칸 없이 모든 항목과 그림 파일을 등록해 주세요! 🎨");
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerText = "빵 맛있게 굽는 중... 🥖";

            const reader = new FileReader();
            reader.onload = function(e) {
                const base64ImageUrl = e.target.result;

                db.collection("commission_types").add({
                    title: title,
                    price: price,
                    shortDesc: shortDesc,
                    longDesc: longDesc,
                    imageUrl: base64ImageUrl, 
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                }).then((docRef) => {
                    drawCard(docRef.id, title, price, shortDesc, longDesc, base64ImageUrl);
                    alert("창고에 등록 완료! 🍮");

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
            };

            reader.readAsDataURL(imageFile);
        });
    }

    checkLoginStatus();
});