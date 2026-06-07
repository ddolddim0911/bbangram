// 설정 정보 (깃허브나 vercel에 올려서 공개되어도 위의 '보안 규칙' 덕분에 안전합니다!)
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
                .catch(() => alert("로그인 실패: 인증 정보가 틀렸습니다!"));
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

// ❌ 카드 삭제 버튼 기능
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

// ✏️ 카드 수정 버튼 기능
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

// 🧁 후기 승낙(승인) 버튼 기능
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("approve-review-btn")) {
        e.stopPropagation();
        const reviewId = e.target.getAttribute("data-id");
        
        db.collection("reviews").doc(reviewId).update({
            isApproved: true
        }).then(() => {
            alert("후기 승낙 완료! 이제 일반 방문자에게도 보입니다. 🍮");
        }).catch((err) => alert("승인 실패: " + err.message));
    }
});

// 🧁 후기 삭제 버튼 기능
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-review-btn")) {
        e.stopPropagation();
        if (confirm("이 후기를 정말 삭제하시겠습니까? 🛑")) {
            const reviewId = e.target.getAttribute("data-id");
            
            db.collection("reviews").doc(reviewId).delete().then(() => {
                alert("후기가 삭제되었습니다!");
            }).catch((err) => alert("삭제 실패: " + err.message));
        }
    }
});

// 🔍 상세 보기 팝업 모달 함수
function openDetail