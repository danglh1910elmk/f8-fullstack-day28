const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);
const API_BASE = "https://jsonplaceholder.typicode.com";

// 2.1. Tạo Promise wrapper cho XHR
function sendRequest(method, url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.send();

        xhr.onload = function () {
            if (this.status >= 200 && this.status < 400) {
                const data = JSON.parse(this.responseText);
                resolve(data);
            } else {
                reject(this.status);
            }
        };

        xhr.onerror = function () {
            reject("Network Error!");
        };
    });
}

// ===================================================
// ========== Chức năng 1: User Prole Card ===========
// ===================================================
const searchUserBtn = $("#search-user-btn");
const userIDInput = $("#user-id-input");

const userLoadingElement = $("#user-loading");
const userErrorElement = $("#user-error");
const userErrorTextElement = $("#user-error-text");
const userProfileCard = $("#user-profile-card");
const userAvatar = $("#user-avatar");
const userName = $("#user-name");
const userEmail = $("#user-email");
const userPhone = $("#user-phone");
const userWebsite = $("#user-website");
const userCompany = $("#user-company");
const userAddress = $("#user-address");

function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

function showError(message, errorElement, errorTextElement, container) {
    errorTextElement.textContent = message;
    errorElement.style.display = "block";
    container && (container.style.display = "none");
}

function displayUserInfo(user) {
    userProfileCard.style.display = "block";

    userAvatar.textContent = user?.name[0];
    userName.textContent = user.name;
    userEmail.textContent = user.email;
    userPhone.textContent = user.phone;
    userWebsite.textContent = user.website;
    userCompany.textContent = user.company.name;
    userAddress.textContent = `${user.address.street}, ${user.address.city}`;
}

searchUserBtn.addEventListener("click", () => {
    const userID = +userIDInput.value;

    // input để trống
    if (!userID) {
        showError(
            "Không được để trống User ID!",
            userErrorElement,
            userErrorTextElement,
            userProfileCard
        );

        userIDInput.value = ""; // clear input
        userIDInput.focus();
        return;
    }

    userErrorElement.style.display = "none"; // ẩn thông báo lỗi, nếu có
    userLoadingElement.style.display = "block"; // hiển thị trạng thái loading khi click

    const url = `${API_BASE}/users/${userID}`;

    sendRequest("GET", url)
        .then((user) => {
            displayUserInfo(user);
        })
        .catch((error) => {
            // xử lý lỗi
            let errorMessage = "";

            if (error === 404) {
                errorMessage = "User không tồn tại!";
            } else if (error >= 500 && error < 600) {
                errorMessage = "Lỗi Server!";
            } else if (error === "Network Error!") {
                errorMessage = error;
            } else {
                errorMessage = "Có lỗi xảy ra khi tải thông tin user";
            }

            showError(
                errorMessage,
                userErrorElement,
                userErrorTextElement,
                userProfileCard
            );

            throw new Error(`HTTP code: ${error}`);
        })
        .finally(() => {
            userLoadingElement.style.display = "none"; // ẩn trạng thái loading

            userIDInput.value = ""; // clear input
            userIDInput.focus(); // focus
        });
});

// =====================================================
// ========== Chức năng 2: Posts và Comments ===========
// =====================================================
const postsLoadingElement = $("#posts-loading");
const postsErrorElement = $("#posts-error");
const postsErrorText = $("#posts-error-text");
const postsContainer = $("#posts-container");
const loadMoreBtn = $("#load-more-posts-btn");

let allPosts = [];
let displayedPostCount = 0; // số lượng posts đã hiển thị

function renderPosts(posts, users) {
    const html = posts
        .map((post, index) => {
            return `<div class="post-item" data-post-id="${post.id}">
                    <h4 class="post-title">
                        Post Title: <span>
                            ${escapeHTML(post.title)}
                        </span>
                    </h4>
                    <p class="post-body">
                        Post Content: <span>
                            ${escapeHTML(post.body)}
                        </span>
                    </p>
                    <p class="post-author">
                        Post Author: <span>
                            ${users[index].name}
                        </span>
                    </p>
                    <button class="show-comments-btn" data-post-id="${post.id}">
                        Xem comments
                    </button>

                    <div class="loading-spinner comments-loading">
                        <p>🔄 Đang tải comments...</p>
                    </div>

                    <div class="error-message comments-error">
                        <p class="comments-error-text">
                            Có lỗi xảy ra khi tải comments
                        </p>
                    </div>

                    <div class="comments-container" data-post-id="${post.id}">
                    </div>
                </div>`;
        })
        .join("");
    postsContainer.innerHTML += html;
}

function renderComments(comments, container) {
    container.style.display = "block";

    const html = comments
        .map((comment) => {
            return `<div class="comment-item">
                    <div class="comment-author">
                        Name:
                        <span>
                            ${escapeHTML(comment.name)}
                        </span>
                    </div>
                    <div class="comment-email">
                        Email: <span>
                            ${escapeHTML(comment.email)}
                        </span>
                    </div>
                    <div class="comment-body">
                        Content:
                        <span>
                            ${escapeHTML(comment.body)}
                        </span>
                    </div>
                </div>`;
        })
        .join("");
    container.innerHTML = html;
}

function loadMorePosts(amount) {
    let newPosts = []; // posts cần hiển thị

    // kiểm tra số lượng tải thêm có lớn hơn tổng số posts?
    if (displayedPostCount === allPosts.length) {
        alert("Đã tải hết posts!");
        return;
    }

    // nếu số lượng post đã hiển thị + SL post sắp hiển thị > tổng SL post
    if (displayedPostCount + amount > allPosts.length) {
        newPosts = allPosts.slice(displayedPostCount, allPosts.length);
        displayedPostCount = allPosts.length;
    } else {
        newPosts = allPosts.slice(
            displayedPostCount,
            displayedPostCount + amount
        );
        displayedPostCount = displayedPostCount + amount;
    }

    postsLoadingElement.style.display = "block"; // hiển thị hiệu ứng loading posts
    postsErrorElement.style.display = "none";

    // 1 mảng các promise
    const userRequests = newPosts.map((post) => {
        const userUrl = `${API_BASE}/users/${post.userId}`;
        return sendRequest("GET", userUrl);
    });
    Promise.all(userRequests)
        .then((users) => {
            // render posts
            renderPosts(newPosts, users);
        })
        .catch((error) => {
            let errorMessage = "";

            if (error === "Network Error!") {
                errorMessage = error;
            } else {
                errorMessage = "Có lỗi xảy ra khi tải posts!";
            }

            showError(errorMessage, postsErrorElement, postsErrorText);
            throw new Error(`HTTP code: ${error}`);
        })
        .finally(() => {
            postsLoadingElement.style.display = "none"; // ẩn hiệu ứng loading posts
        });
}

// Tự động load 5 posts đầu tiên khi vào trang
postsLoadingElement.style.display = "block"; // hiển thị hiệu ứng loading posts
// const postsUrl = `${API_BASE}/posts`;
const postsUrl = `${API_BASE}/posts?_limit=11`;

sendRequest("GET", postsUrl)
    .then((posts) => {
        allPosts = posts;
        const firstFivePosts = posts.slice(0, 5);

        // hiển thị nút load more posts
        loadMoreBtn.style.display = "block";

        // nếu số lượng posts >=5 thì tăng displayedPostCount lên 5, nếu không, gán = posts.length
        posts.length >= 5
            ? (displayedPostCount = 5)
            : (displayedPostCount = posts.length);

        // đề bài yêu cầu phải hiện tên tác giả trên mỗi bài post
        // lấy user -> suy ra userName để gắn vào mỗi post
        const userRequests = firstFivePosts.map((post) => {
            const userUrl = `${API_BASE}/users/${post.userId}`;

            return sendRequest("GET", userUrl);
        });

        return Promise.all(userRequests); // trả về 1 Promise duy nhất
    })
    .then((users) => {
        // users là mảng chứa các giá trị được resolved của các promise trong userRequests

        const firstFivePosts = allPosts.slice(0, 5);
        renderPosts(firstFivePosts, users);
    })
    .catch((error) => {
        let errorMessage = "";

        if (error === "Network Error!") {
            errorMessage = error;
        } else {
            errorMessage = "Có lỗi xảy ra khi tải posts!";
        }

        showError(
            errorMessage,
            postsErrorElement,
            postsErrorText,
            postsContainer
        );

        throw new Error(`HTTP code: ${error}`);
    })
    .finally(() => {
        postsLoadingElement.style.display = "none"; // ẩn hiệu ứng loading
    });

// khi nhấn vào Xem comments
postsContainer.addEventListener("click", (e) => {
    const showCommentsButton = e.target.closest(".show-comments-btn");
    // nếu không nhấn trúng showCommentsButton thì không làm gì
    if (!showCommentsButton) return;

    const postItem = e.target.closest(".post-item");
    const commentsContainer = postItem.querySelector(".comments-container");
    const commentsLoadingElement = postItem.querySelector(".comments-loading");
    const commentsErrorElement = postItem.querySelector(".comments-error");
    const commentsErrorTextElement = postItem.querySelector(
        ".comments-error-text"
    );

    const postId = showCommentsButton.dataset.postId;
    const commentUrl = `${API_BASE}/posts/${postId}/comments`;

    commentsErrorElement.style.display = "none";
    commentsLoadingElement.style.display = "block"; // hiển thị hiệu ứng loading comments

    sendRequest("GET", commentUrl)
        .then((comments) => {
            renderComments(comments, commentsContainer);
        })
        .catch((error) => {
            // lỗi
            if (error === "Network Error!") {
                commentsErrorTextElement.textContent = error;
            } else {
                commentsErrorTextElement.textContent =
                    "Có lỗi xảy ra khi tải comments!";
            }
            commentsErrorElement.style.display = "block";

            throw new Error(`HTTP code: ${error}`);
        })
        .finally(() => {
            commentsLoadingElement.style.display = "none"; // ẩn hiệu ứng loading comments
        });
});

// chức năng Load more comments
loadMoreBtn.addEventListener("click", () => {
    loadMorePosts(5);
});

// ===================================================
// ======== Chức năng 3: Todo List với Filter ========
// ===================================================
const todoUserIdInput = $("#todo-user-id-input");
const loadTodosBtn = $("#load-todos-btn");

const filterAllBtn = $("#filter-all");
const filterCompletedBtn = $("#filter-completed");
const filterIncompleteBtn = $("#filter-incomplete");

const totalTodos = $("#total-todos");
const completedTodos = $("#completed-todos");
const incompleteTodos = $("#incomplete-todos");

const todosLoadingElement = $("#todos-loading");
const todosErrorElement = $("#todos-error");
const todosErrorTextElement = $("#todos-error-text");
const todoListContainer = $("#todo-list");

function renderTodoList(todoList) {
    todoListContainer.style.display = "block";

    const html = todoList
        .map((task) => {
            return `<div
                    class="todo-item ${
                        task.completed ? "completed" : "incomplete"
                    }"
                    data-todo-id="${task.id}"
                    data-completed="${task.completed}"
                >
                    <div class="todo-checkbox"></div>
                    <div class="todo-text">${escapeHTML(task.title)}</div>
                </div>`;
        })
        .join("");

    todoListContainer.innerHTML = html;
}

// reset stats mỗi khi có lỗi
function resetStats() {
    totalTodos.textContent = 0;
    completedTodos.textContent = 0;
    incompleteTodos.textContent = 0;
}

function updateStats(todoList) {
    let completedTaskCount = 0;
    let incompleteTaskCount = 0;

    todoList.forEach((task) => {
        task.completed === true ? completedTaskCount++ : incompleteTaskCount++;
    });

    totalTodos.textContent = todoList.length;
    completedTodos.textContent = completedTaskCount;
    incompleteTodos.textContent = incompleteTaskCount;
}

function addActiveClass(targetElement) {
    $(".filter-btn.active").classList.remove("active");
    targetElement.classList.add("active");
}

let allTodoList = [];
let canFilter = false; // chỉ cho phép filter khi đã load thành công

loadTodosBtn.addEventListener("click", () => {
    canFilter = false;
    const userID = +todoUserIdInput.value;

    // input để trống
    if (!userID) {
        showError(
            "Không được để trống User ID!",
            todosErrorElement,
            todosErrorTextElement,
            todoListContainer
        );
        resetStats();

        todoUserIdInput.value = ""; // clear input
        todoUserIdInput.focus(); // focus
        return;
    }

    todosErrorElement.style.display = "none"; // ẩn thông báo lỗi, nếu đang hiện
    todosLoadingElement.style.display = "block"; // hiển thị hiệu ứng loading

    const userUrl = `${API_BASE}/users/${userID}`;

    sendRequest("GET", userUrl)
        .then((user) => {
            // load todo list of this user
            return sendRequest("GET", `${userUrl}/todos`);
        })
        .then((todoList) => {
            allTodoList = todoList;
            canFilter = true;

            addActiveClass(filterAllBtn); // add 'active' class to filterAllBtn
            updateStats(todoList);
            renderTodoList(todoList);
        })
        .catch((error) => {
            let errorMessage = "";

            if (error === 404) {
                errorMessage = "User không tồn tại!";
            } else if (error >= 500 && error < 600) {
                errorMessage = "Lỗi Server!";
            } else if (error === "Network Error!") {
                errorMessage = error;
            } else {
                errorMessage = "Có lỗi xảy ra khi tải thông tin user";
            }

            showError(
                errorMessage,
                todosErrorElement,
                todosErrorTextElement,
                todoListContainer
            );

            resetStats();

            throw new Error(`HTTP code: ${error}`);
        })
        .finally(() => {
            todosLoadingElement.style.display = "none"; // ẩn trạng thái loading khi load xong

            todoUserIdInput.value = ""; // clear input
            todoUserIdInput.focus(); // focus
        });
});

filterAllBtn.addEventListener("click", () => {
    if (!canFilter) return;

    addActiveClass(filterAllBtn);
    renderTodoList(allTodoList);
});

filterCompletedBtn.addEventListener("click", () => {
    if (!canFilter) return;

    const completedTodoList = allTodoList.filter((task) => {
        return task.completed;
    });

    addActiveClass(filterCompletedBtn);
    renderTodoList(completedTodoList);
});

filterIncompleteBtn.addEventListener("click", () => {
    if (!canFilter) return;

    const incompleteTodoList = allTodoList.filter((task) => {
        return !task.completed;
    });

    addActiveClass(filterIncompleteBtn);
    renderTodoList(incompleteTodoList);
});
