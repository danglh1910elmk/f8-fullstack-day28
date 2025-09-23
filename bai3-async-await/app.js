const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);
const API_BASE = "https://jsonplaceholder.typicode.com";

async function sendRequest(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP code: ${response.status}`);
    }
    return response.json();
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

searchUserBtn.addEventListener("click", async () => {
    const userID = +userIDInput.value;

    if (!userID || userID < 1 || userID > 10) {
        // trường hợp nhấn tìm kiếm nhưng input để trống hoặc trong khoảng không hợp lệ
        showError(
            "Nhập 1 số từ 1 đến 10",
            userErrorElement,
            userErrorTextElement,
            userProfileCard
        );
        // clear input
        userIDInput.value = "";
        // focus
        userIDInput.focus();
        return;
    }

    userErrorElement.style.display = "none"; // ẩn thông báo lỗi, nếu có
    userLoadingElement.style.display = "block"; // hiển thị trạng thái loading khi click
    const url = `${API_BASE}/users/${userID}`;

    try {
        const user = await sendRequest(url);
        displayUserInfo(user);
    } catch (error) {
        showError(
            "Có lỗi xảy ra khi tải thông tin user",
            userErrorElement,
            userErrorTextElement,
            userProfileCard
        );

        throw new Error(`HTTP code: ${error}`);
    } finally {
        userLoadingElement.style.display = "none"; // ẩn trạng thái loading
        // clear input
        userIDInput.value = "";
        // focus
        userIDInput.focus();
    }
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

async function loadMorePosts(amount) {
    let newPosts = []; // posts cần hiển thị

    // kiểm tra số lượng tải thêm có lớn hơn tổng số posts?
    if (displayedPostCount === allPosts.length) {
        alert("Đã tải hết posts!");
        return;
    }

    // nếu số lượng post đã hiển thị + SL post sắp hiển thị > tổng SL post
    if (displayedPostCount + amount > allPosts.length) {
        newPosts = allPosts.slice(displayedPostCount, allPosts.length); // gán = số post còn lại
        displayedPostCount = allPosts.length; // gán = tổng SL post
    } else {
        newPosts = allPosts.slice(
            displayedPostCount,
            displayedPostCount + amount
        );
        displayedPostCount = displayedPostCount + amount;
    }

    postsLoadingElement.style.display = "block"; // hiển thị hiệu ứng loading posts

    try {
        // 1 mảng các promise
        const userRequests = newPosts.map((post) => {
            const userUrl = `${API_BASE}/users/${post.userId}`;
            return sendRequest(userUrl);
        });

        const users = await Promise.all(userRequests);

        // render
        renderPosts(newPosts, users);
    } catch (error) {
        postsErrorElement.style.display = "block"; // hiển thị thông báo lỗi
        throw new Error(`HTTP code: ${error}`);
    } finally {
        postsLoadingElement.style.display = "none"; // ẩn hiệu ứng loading posts
    }
}

async function initialLoad() {
    // Tự động load 5 posts đầu tiên khi vào trang
    postsLoadingElement.style.display = "block"; // hiển thị hiệu ứng loading posts
    // const url = `${API_BASE}/posts`;
    const url = `${API_BASE}/posts?_limit=11`;

    try {
        const posts = await sendRequest(url);
        allPosts = posts;
        const firstFivePosts = posts.slice(0, 5);

        // hiển thị nút load more posts
        loadMoreBtn.style.display = "block";

        // nếu số lượng posts >=5 thì tăng displayedPostCount lên 5, nếu không gán = posts.length
        posts.length >= 5
            ? (displayedPostCount = 5)
            : (displayedPostCount = posts.length);

        // lấy user -> suy ra userName để gắn vào mỗi post
        const userRequests = firstFivePosts.map((post) => {
            const userUrl = `${API_BASE}/users/${post.userId}`;

            return sendRequest(userUrl);
        });

        const users = await Promise.all(userRequests);

        // render
        renderPosts(firstFivePosts, users);
    } catch (error) {
        postsErrorElement.style.display = "block";
        throw new Error(`HTTP code: ${error}`);
    } finally {
        postsLoadingElement.style.display = "none"; // ẩn hiệu ứng loading
    }
}

// khi nhấn vào Xem comments
postsContainer.addEventListener("click", async (e) => {
    const postItem = e.target.closest(".post-item");
    const commentsContainer = postItem?.querySelector(".comments-container");
    const showCommentsButton = e.target.closest(".show-comments-btn");
    const commentsLoadingElement = postItem?.querySelector(".comments-loading");
    const commentsErrorElement = postItem?.querySelector(".comments-error");

    // nếu không nhấn trúng showCommentsButton thì không làm gì
    if (!showCommentsButton) return;

    const postId = showCommentsButton.dataset.postId;
    const commentUrl = `${API_BASE}/posts/${postId}/comments`;
    commentsLoadingElement.style.display = "block"; // hiển thị hiệu ứng loading comments

    try {
        // lấy ra các comments của postId đó
        const comments = await sendRequest(commentUrl);
        // render
        renderComments(comments, commentsContainer);
    } catch (error) {
        commentsErrorElement.style.display = "block";
        throw new Error(`HTTP code: ${error}`);
    } finally {
        commentsLoadingElement.style.display = "none"; // ẩn hiệu ứng loading comments
    }
});

// chức năng Load more comments
loadMoreBtn.addEventListener("click", () => {
    loadMorePosts(5);
});

initialLoad();

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

loadTodosBtn.addEventListener("click", async () => {
    canFilter = false;
    const userID = +todoUserIdInput.value;

    if (!userID || userID < 1 || userID > 10) {
        // trường hợp nhấn tìm kiếm nhưng input để trống hoặc trong khoảng không hợp lệ
        showError(
            "Nhập 1 số từ 1 đến 10",
            todosErrorElement,
            todosErrorTextElement,
            todoListContainer
        );
        resetStats();
        // clear input
        todoUserIdInput.value = "";
        // focus
        todoUserIdInput.focus();
        return;
    }

    todosErrorElement.style.display = "none"; // ẩn thông báo lỗi, nếu đang hiện
    todosLoadingElement.style.display = "block"; // hiển thị hiệu ứng loading
    const url = `${API_BASE}/users/${userID}/todos`;

    try {
        const todoList = await sendRequest(url);
        allTodoList = todoList;
        canFilter = true;

        addActiveClass(filterAllBtn); // thêm active vào filterAllBtn
        updateStats(todoList);
        renderTodoList(todoList);
    } catch (error) {
        showError(
            "Có lỗi xảy ra khi tải todos",
            todosErrorElement,
            todosErrorTextElement,
            todoListContainer
        );
        resetStats();

        throw new Error(`HTTP code: ${error}`);
    } finally {
        todosLoadingElement.style.display = "none"; // ẩn hiệu ứng loading
        // clear input
        todoUserIdInput.value = "";
        // focus
        todoUserIdInput.focus();
    }
});

filterAllBtn.addEventListener("click", () => {
    if (!canFilter) return;

    addActiveClass(filterAllBtn);
    renderTodoList(allTodoList);
});

filterCompletedBtn.addEventListener("click", () => {
    if (!canFilter) return;

    const completedTodoList = allTodoList.filter((task) => {
        return task.completed === true;
    });

    addActiveClass(filterCompletedBtn);
    renderTodoList(completedTodoList);
});

filterIncompleteBtn.addEventListener("click", () => {
    if (!canFilter) return;

    const incompleteTodoList = allTodoList.filter((task) => {
        return task.completed === false;
    });

    addActiveClass(filterIncompleteBtn);
    renderTodoList(incompleteTodoList);
});
