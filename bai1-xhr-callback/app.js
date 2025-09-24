const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);
const API_BASE = "https://jsonplaceholder.typicode.com";

// 1.1. Tạo utility function để gọi API với XHR
function sendRequest(method, url, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.send();

    xhr.onload = function () {
        if (this.status >= 200 && this.status < 400) {
            // giả lập mạng chậm
            setTimeout(() => {
                const data = JSON.parse(this.responseText);
                callback(null, data);
            }, 500);
        } else {
            const error = this.status;
            callback(error, null);
        }
    };

    xhr.onerror = function () {
        callback("Network Error!", null);
    };
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
    const url = `${API_BASE}/users/${userID}`;

    // input để trống
    if (!userID) {
        showError(
            "Không được để trống User ID!",
            userErrorElement,
            userErrorTextElement,
            userProfileCard
        );

        userIDInput.value = ""; // clear input
        userIDInput.focus(); // focus
        return;
    }

    userErrorElement.style.display = "none"; // ẩn thông báo lỗi, nếu có
    userLoadingElement.style.display = "block"; // hiển thị trạng thái loading khi click

    sendRequest("GET", url, (error, user) => {
        userLoadingElement.style.display = "none"; // ẩn trạng thái loading khi load xong

        if (!error) {
            displayUserInfo(user);
        } else {
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
        }

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

function generatePostItem(post, userName) {
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
                        ${escapeHTML(userName)}
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

// Tự động load 5 posts đầu tiên khi vào trang
postsLoadingElement.style.display = "block"; // hiển thị hiệu ứng loading
sendRequest("GET", `${API_BASE}/posts?_limit=5`, (error, posts) => {
    // postsLoadingElement.style.display = "none"; // ẩn hiệu ứng loading khi load xong

    if (!error) {
        posts.forEach((post) => {
            const userUrl = `${API_BASE}/users/${post.userId}`;
            // đề bài yêu cầu phải hiện tên tác giả trên mỗi bài post
            sendRequest("GET", userUrl, (error, user) => {
                postsLoadingElement.style.display = "none"; // ẩn hiệu ứng loading khi load xong

                if (!error) {
                    // tạo postItem sau đó thêm vào postsContainer
                    const postItem = generatePostItem(post, user.name);
                    // postsContainer.innerHTML += postItem;
                    postsContainer.insertAdjacentHTML("beforeend", postItem);
                } else {
                    // xử lý lỗi
                    postsErrorElement.style.display = "block";
                    postsErrorText.textContent =
                        "Có lỗi xảy ra khi tải tên tác giả!";

                    throw new Error(`HTTP code: ${error}`);
                }
            });
        });
    } else {
        // xử lý lỗi
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

        postsLoadingElement.style.display = "none"; // ẩn hiệu ứng loading khi load xong

        throw new Error(`HTTP code: ${error}`);
    }
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
    const url = `${API_BASE}/posts/${postId}/comments`;
    commentsLoadingElement.style.display = "block"; // hiển thị hiệu ứng loading

    sendRequest("GET", url, (error, comments) => {
        commentsLoadingElement.style.display = "none"; // ẩn hiệu ứng loading

        if (!error) {
            renderComments(comments, commentsContainer);
        } else {
            // lỗi
            if (error === "Network Error!") {
                commentsErrorTextElement.textContent = error;
            } else {
                commentsErrorTextElement.textContent =
                    "Có lỗi xảy ra khi tải comments!";
            }
            commentsErrorElement.style.display = "block";

            throw new Error(`HTTP code: ${error}`);
        }
    });
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

    // ! nếu user không tồn tại, VD gọi https://jsonplaceholder.typicode.com/users/1000/todos -> vẫn trả về 200, không phải 404 nên em phải gọi API 2 lần
    sendRequest("GET", userUrl, (error, user) => {
        if (!error) {
            // load todo list of this user
            sendRequest("GET", `${userUrl}/todos`, (error, todoList) => {
                todosLoadingElement.style.display = "none"; // ẩn trạng thái loading khi load xong

                if (!error) {
                    allTodoList = todoList;
                    canFilter = true;

                    addActiveClass(filterAllBtn); // add 'active' class to filterAllBtn
                    updateStats(todoList);
                    renderTodoList(todoList);
                } else {
                    // xử lý lỗi
                    showError(
                        "Có lỗi xảy ra khi tải todos",
                        todosErrorElement,
                        todosErrorTextElement,
                        todoListContainer
                    );
                    resetStats();

                    throw new Error(`HTTP code: ${error}`);
                }
            });
        } else {
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
                todosErrorElement,
                todosErrorTextElement,
                todoListContainer
            );

            todosLoadingElement.style.display = "none"; // ẩn trạng thái loading khi load xong
            resetStats();

            throw new Error(`HTTP code: ${error}`);
        }

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
