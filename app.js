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
    
    // 🔒 불펌 및 이미지/글자 드래그 방지 스타일 강제 주입
    const dragStyle = document.createElement("style");
    dragStyle.innerHTML = `
        * {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            -webkit-user-drag: none;
        }
        input, textarea {
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
            user-select: text !important;
        }
    `;
    document.head.appendChild(dragStyle);

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
    function drawCard(docId, title, price, shortDesc, longDesc, imageUrls, order, type) {
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
                <div style="position:absolute; top:15px; left:15px; z-index:10; display:flex; gap:5px;">
                    <button class="move-up-btn" data-id="${docId}" data-order="${order}" style="background:#FFF; color:#4A2E1B; border:3px solid #4A2E1B; border-radius:50%; width:32px; height:32px; font-weight:bold; cursor:pointer; box-shadow:0 3px 0 #4A2E1B; font-size:0.8rem; display:flex; justify-content:center; align-items:center;">▲</button>
                    <button class="move-down-btn" data-id="${docId}" data-order="${order}" style="background:#FFF; color:#4A2E1B; border:3px solid #4A2E1B; border-radius:50%; width:32px; height:32px; font-weight:bold; cursor:pointer; box-shadow:0 3px 0 #4A2E1B; font-size:0.8rem; display:flex; justify-content:center; align-items:center;">▼</button>
                </div>
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
            openDetailModal(docId, title, price, longDesc, imgs, type); 
        });

        typeContainer.appendChild(newCard);
    }

    // 🔼 위로 한 칸 보내기 기능
    document.addEventListener("click", async (e) => {
        if (e.target.classList.contains("move-up-btn")) {
            e.stopPropagation();
            const currentId = e.target.getAttribute("data-id");
            const currentOrder = parseInt(e.target.getAttribute("data-order"));

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

    // 🔍 상세 팝업창(모달) 열기 함수 (★익명 기능 완전 탑재판★)
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
                    <p id="long-desc-area" style="font-size:1rem; line-height:1.7; color:#5C4033; white-space:pre-wrap; word-break:break-all; margin:0; padding:0;"></p>
                    <div id="type-display-area" style="font-size:0.9rem; color:#888; margin-top:12px; font-weight:bold;"></div>
                    
                    <hr style="border:0; border-top:2px dashed #4A2E1B; margin:20px 0;">
                    
                    <!-- 💬 후기 구역 -->
                    <h3 style="font-size:1.2rem; color:#4A2E1B; margin-bottom:10px;">🧁 시식 후기</h3>
                    <div id="reviews-list" style="margin-bottom:15px; max-height:200px; overflow-y:auto; background:#FFF; border:2px solid #4A2E1B; border-radius:10px; padding:10px;">
                        <p style="color:#aaa; font-size:0.9rem; text-align:center;">후기를 불러오는 중...</p>
                    </div>
                    
                    <!-- ✏️ 후기 작성 칸 (익명 체크박스 추가됨!) -->
                    <div style="display:flex; flex-direction:column; gap:5px; margin-top:10px;">
                        <div style="display:flex; gap:5px;">
                            <input type="text" id="review-nickname" placeholder="닉네임" style="width:30%; padding:8px; border:2px solid #4A2E1B; border-radius:8px; font-size:0.9rem;">
                            <input type="text" id="review-content" placeholder="맛있는 후기를 남겨주세요!" style="width:55%; padding:8px; border:2px solid #4A2E1B; border-radius:8px; font-size:0.9rem;">
                            <button id="submit-review-btn" style="width:15%; background:#FFDE6A; border:2px solid #4A2E1B; border-radius:8px; font-weight:bold; cursor:pointer; font-size:0.8rem;">등록</button>
                        </div>
                        <div style="display:flex; align-items:center; gap:5px; margin-left:2px;">
                            <input type="checkbox" id="review-anon-check" style="cursor:pointer; width:15px; height:15px;">
                            <label for="review-anon-check" style="font-size:0.85rem; color:#5C4033; cursor:pointer; font-weight:bold;">익명으로 남기기 (주인장만 내 이름을 볼 수 있습니다 🤫)</label>
                        </div>
                    </div>
                    <p style="font-size:0.75rem; color:#E67E22; margin-top:5px; font-weight:bold;">* 후기는 주인장 승인 후 메뉴판에 노출됩니다! 🍯</p>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 첫 줄 공백 방지 및 내용 주입
        const cleanText = longDesc.trim();
        const formattedText = cleanText.replace(/(https?:\/\/[^\s]+)/g, (match) => `<a href="${match}" target="_blank" style="color:#D35400; text-decoration:underline;">${match}</a>`);
        document.getElementById("long-desc-area").innerHTML = formattedText;
        document.getElementById("type-display-area").innerText = type ? `Typo: ${type}` : "타입 정보 없음";

        // 📥 후기 가져오기 실시간 함수
        const reviewsList = document.getElementById("reviews-list");
        db.collection("reviews")
          .where("cardId", "==", cardId)
          .orderBy("timestamp", "asc")
          .onSnapshot((snapshot) => {
              reviewsList.innerHTML = "";
              if (snapshot.empty) {
                  reviewsList.innerHTML = `<p style="color:#aaa; font-size:0.9rem; text-align:center;">아직 도착한 후기가 없어요. 첫 후기를 남겨보세요! 🧁</p>`;
                  return;
              }
              
              snapshot.forEach((doc) => {
                  const rData = doc.data();
                  const isAdmin = getAdminStatus();
                  
                  // 일반 유저에겐 승인된 것만 노출, 관리자에겐 대기 글도 노출
                  if (rData.isApproved || isAdmin) {
                      const rDiv = document.createElement("div");
                      rDiv.style.padding = "5px 0";
                      rDiv.style.borderBottom = "1px dashed #DDD";
                      rDiv.style.display = "flex";
                      rDiv.style.justifyContent = "space-between";
                      rDiv.style.alignItems = "center";
                      
                      // 이름 결정 로직: 익명 체크했고 승인 완료된 상태면 일반 유저에겐 "익명의 손님"으로 출력
                      let displayName = rData.nickname;
                      if (rData.isAnonymous) {
                          if (isAdmin) {
                              // 👑 람님 화면에는 원래 이름 뒤에 (익명 요청)이라고 표시해 줍니다!
                              displayName = `${rData.nickname} 🔒(익명요청)`;
                          } else {
                              // 👥 일반 손님 화면에는 철저히 숨겨서 출력!
                              displayName = "익명";
                          }
                      }

                      let adminApproveBtn = "";
                      if (isAdmin && !rData.isApproved) {
                          adminApproveBtn = `<button class="approve-review-btn" data-id="${doc.id}" style="background:#2ECC71; color:white; border:none; border-radius:4px; padding:2px 6px; font-size:0.75rem; cursor:pointer; margin-left:5px;">승인하기</button>`;
                      }
                      
                      let deleteReviewBtn = "";
                      if (isAdmin) {
                          deleteReviewBtn = `<span class="delete-review-btn" data-id="${doc.id}" style="color:#FF6B6B; cursor:pointer; font-size:0.8rem; margin-left:8px;">❌</span>`;
                      }

                      rDiv.innerHTML = `
                          <span style="font-size:0.9rem; color:#5C4033;">
                              <strong>${displayName}:</strong> ${rData.content} 
                              ${rData.isApproved ? '' : '<span style="color:#E67E22; font-size:0.75rem;">(대기중)</span>'}
                          </span>
                          <div>${adminApproveBtn}${deleteReviewBtn}</div>
                      `;
                      reviewsList.appendChild(rDiv);
                  }
              });
              
              if(reviewsList.innerHTML === "") {
                  reviewsList.innerHTML = `<p style="color:#aaa; font-size:0.9rem; text-align:center;">아직 도착한 후기가 없어요. 첫 후기를 남겨보세요! 🧁</p>`;
              }
          });

        // ✏️ 후기 등록 버튼 누를 때
        modal.querySelector("#submit-review-btn").onclick = () => {
            const nickname = modal.querySelector("#review-nickname").value.trim();
            const content = modal.querySelector("#review-content").value.trim();
            const isAnonymous = modal.querySelector("#review-anon-check").checked; // 익명 체크박스 여부 확인!
            
            if (!nickname || !content) {
                alert("닉네임과 후기 내용을 모두 적어주세요! 🍰");
                return;
            }
            
            db.collection("reviews").add({
                cardId: cardId,
                nickname: nickname,
                content: content,
                isApproved: false, 
                isAnonymous: isAnonymous, // 익명 상태 함께 저장!
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                alert("후기가 성공적으로 접수되었습니다!\n주인장 승인 후 메뉴판에 표시됩니다! 🍮");
                modal.querySelector("#review-nickname").value = "";
                modal.querySelector("#review-content").value = "";
                modal.querySelector("#review-anon-check").checked = false;
            });
        };

        // 👑 관리자 전용 후기 승인 및 삭제 이벤트 바인딩
        reviewsList.onclick = (e) => {
            if (e.target.classList.contains("approve-review-btn")) {
                const rId = e.target.getAttribute("data-id");
                db.collection("reviews").doc(rId).update({ isApproved: true }).then(() => {
                    alert("후기를 승인하여 메뉴판에 등록했습니다! 🍞");
                });
            }
            if (e.target.classList.contains("delete-review-btn")) {
                if (confirm("이 후기를 영구 삭제하시겠습니까?")) {
                    const rId = e.target.getAttribute("data-id");
                    db.collection("reviews").doc(rId).delete().then(() => {
                        alert("후기가 삭제되었습니다.");
                    });
                }
            }
        };

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

        // 닫기 이벤트
        const closeModal = () => modal.remove();
        modal.querySelectorAll(".close-modal").forEach(btn => btn.onclick = closeModal);
        modal.onclick = (e) => { if (e.target === modal) closeModal(); };
    }

    // 🚚 데이터 불러오기
    db.collection("commission_types").orderBy("order", "asc").get().then((snapshot) => {
        snapshot.forEach((doc) => {
            const data = doc.data();
            const shortDesc = data.shortDesc || data.desc || "";
            const longDesc = data.longDesc || data.desc || "";
            const imgs = data.imageUrl || [];
            const order = data.order || 0;
            const type = data.type || ""; 
            drawCard(doc.id, data.title, data.price, shortDesc, longDesc, imgs, order, type);
        });
    });

    // 🎨 이미지 압축 마법 함수
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

    // 🎨 다중 업로드 등록 버튼 기능
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
                    order: nextOrder, 
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });

                drawCard(docRef.id, title, price, shortDesc, longDesc, base64Images, nextOrder, "");
                alert("창고에 안전하게 다중 샘플 등록 완료! 🍮");
                location.reload(); 

            } catch (err) {
                alert("등록 실패- 에러: " + err.message);
                submitBtn.disabled = false;
                submitBtn.innerText = "새 빵 등록하기(업로드)";
            }
        });
    }

    checkLoginStatus();
});