import {
    fetchMessagesAndSubscription,
    fetchProjects,
    fetchUserDetails,
    fetchSubscriptionTiers,
    sendMessage,
    fetchPasswordResetToken,
    deleteProject,
} from './apiServices.js';

// Global variables
let jwt = localStorage.getItem('jwt'); // Initialize JWT from localStorage
let chatOutput = document.getElementById('chatOutput');
let chatForm = document.getElementById('chatForm');
let pricingModal = document.getElementById('pricingModal');
let pricingBtn = document.getElementById('pricingBtn');
let closeModal = document.getElementsByClassName('close');
let intervalId; // Polling management
// Variables related to authentication
let loginModal = document.getElementById('loginModal');
let loginError = document.getElementById('loginError');
let signInError = document.getElementById('signInError');
let forgotPasswordModal = document.getElementById('forgotPasswordModal');
let loginBtn = document.getElementById('loginBtn');
let modalHeader = loginModal.querySelector('h2');
let loginForm = document.getElementById('loginForm');
let forgotPasswordForm = document.getElementById('forgotPasswordForm');
let forgotPasswordError = document.getElementById('forgotPasswordError');
let resetPasswordForm = document.getElementById('resetPasswordForm');
let resetPasswordError = document.getElementById('resetPasswordError');
let forgotPasswordLink = document.getElementById('forgotPasswordLink');
let loginLink = document.getElementById('loginLink');
let signUpLink = document.getElementById('signupLink');
const urlParams = new URLSearchParams(window.location.search);
const passwordResetToken = urlParams.get('token');
let deleteProjectBtn = document.getElementById('deleteProjectBtn');
let promptDeleteProject = document.getElementById('promptDeleteProject');
let storedProjectId = localStorage.getItem('selectedProjectId'); // Retrieve the projectId
let currentMessages = loadMessagesFromLocalStorage(); // Fetch Messages

function isLoggedIn() {
    const token = jwt;
    return token != null && !isTokenExpired(token);
}

function isTokenExpired(token) {
    const payloadBase64 = token.split('.')[1];
    const decodedJson = atob(payloadBase64); // Decodes a string of Base64-encoded data into bytes
    const decoded = JSON.parse(decodedJson);
    const exp = decoded.exp;
    const now = Date.now().valueOf() / 1000;
    return now > exp;
}

function setJwt(newJwt) {
    localStorage.setItem('jwt', newJwt); // Store JWT in localStorage
    jwt = newJwt;
}

// Utility Functions
function saveMessagesToLocalStorage(messages) {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
}

function loadMessagesFromLocalStorage() {
    const messages = localStorage.getItem('chatMessages');
    return messages ? JSON.parse(messages) : [];
}

async function fetchInitialData() {
    await populatePricingModal();
    await populateUserDetails();
    await populateProjectSelector();

    if (
        isLoggedIn() &&
        Object.keys(await fetchProjects(jwt, isLoggedIn)).length > 0
    ) {
        promptDeleteProject.style.display = 'block';
    }

    // Restore chat output from local storage
    currentMessages.forEach((message) =>
        appendMessage(
            chatOutput,
            message,
            message.role === 'user' ? 'user-message' : 'bot-message'
        )
    );
}

// Update Chat
function updateChat(newMessages) {
    // Create a Set of current message IDs for quick lookup
    const currentMessageIds = new Set(
        currentMessages.map((msg) => msg.messageId)
    );
    const newMessageIds = new Set(newMessages.map((msg) => msg.messageId));

    // Add new messages
    newMessages.forEach((message) => {
        if (!currentMessageIds.has(message.messageId)) {
            appendMessage(
                chatOutput,
                message,
                message.role === 'user' ? 'user-message' : 'bot-message'
            );
        }
    });

    // Remove old messages
    currentMessages.forEach((message) => {
        if (!newMessageIds.has(message.messageId)) {
            const messageElement = document.getElementById(message.messageId);
            if (messageElement) {
                chatOutput.removeChild(messageElement);
            }
        }
    });

    // Update existing messages if needed
    newMessages.forEach((message) => {
        const currentMessage = currentMessages.find(
            (msg) => msg.messageId === message.messageId
        );
        if (currentMessage && currentMessage.content !== message.content) {
            const messageElement = document.getElementById(message.messageId);
            if (messageElement) {
                updateMessageContent(messageElement, message.content);
            }
        }
    });

    // Ensure messages are in the correct order
    currentMessages = newMessages.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );
    saveMessagesToLocalStorage(currentMessages);
}

function updateMessageContent(messageElement, newContent) {
    messageElement.textContent = newContent;
}

// End of messaging logic

function updateSubscriptionAmount(amount) {
    document.getElementById('remainingTokens').textContent =
        `Remaining: $${amount}`;
}

// Populate project dropdown
async function populateProjectSelector() {
    if (!isLoggedIn()) {
        return;
    }
    const projects = await fetchProjects(jwt, isLoggedIn);
    projects.forEach((project) => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        projectSelector.appendChild(option);
    });

    // Show dropdown if there are projects

    if (projects.length > 0) {
        projectSelector.style.display = 'inline-block';

        if (storedProjectId) {
            projectSelector.value = storedProjectId;
        } else {
            promptDeleteProject.style.display = 'none';
        }
    } else {
        projectSelector.options[0].textContent = 'No Projects Found';
        promptDeleteProject.style.display = 'none';
    }
}

chatForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!isLoggedIn()) {
        loginModal.style.display = 'block';
        return;
    }

    let projectId = localStorage.getItem('selectedProjectId');
    if (projectId === null) {
        alert(
            'Oops, you have no projects selected! Create or select a project first.'
        );
        return;
    }

    const messageInput = document.getElementById('messageInput');
    const message = { content: messageInput.value };

    messageInput.value = ''; // Clear input field

    await sendMessage(message.content, projectId, jwt);
});

// Populate user details in the account dropdown
async function populateUserDetails() {
    const userDetails = await fetchUserDetails(jwt);
    if (userDetails) {
        document.getElementById('userEmail').textContent =
            `Email: ${userDetails.email}`;
        document.getElementById('userMobile').textContent =
            `Mobile: ${userDetails.mobile}`;
        document.getElementById('userSubscription').textContent =
            `Subscription: ${userDetails.subscription}`;
        document.getElementById('remainingTokens').textContent =
            `Amount remaining: $ ${userDetails.amountLeft}`;
    } else {
        console.error('No user details found or error fetching details');
    }
}

// Populate pricing modal with subscription tiers
async function populatePricingModal() {
    const pricingModal = document.getElementById('pricingModal');
    const pricingContainer = pricingModal.querySelector('.pricing-container');

    // Clear existing content
    pricingContainer.innerHTML = '';

    const subscriptionTiers = await fetchSubscriptionTiers();
    subscriptionTiers.forEach((tier) => {
        const pricingCard = document.createElement('div');
        pricingCard.className = 'pricing-card';

        pricingCard.innerHTML = `
      <h3>${tier.name}</h3>
      <p class="price">${tier.price > 0 ? '$' + tier.price : 'Free'}</p>
      ${
          tier.overageCost
              ? `<p class="overage-cost">Overage: ${tier.overageCost}</p>`
              : ''
      }
      <div style="height: 140px"><p class="description">${
          tier.benefits
      }</p></div>
      <button class="select-plan">Select Plan</button>
    `;

        // Inside populatePricingModal function, after appending pricingCard
        pricingCard
            .querySelector('.select-plan')
            .addEventListener('click', function () {
                const planType = this.closest('.pricing-card')
                    .querySelector('h3')
                    .textContent.trim();
                const planAmount = this.closest('.pricing-card')
                    .querySelector('.price')
                    .textContent.match(/\d+/)[0]; // Extract numerical value

                selectPlanselectPlan(
                    planType,
                    planAmount,
                    jwt,
                    populateUserDetails
                );
            });

        pricingContainer.appendChild(pricingCard);
    });
}

document.addEventListener('click', function (event) {
    let accountDropdown = document.getElementById('accountDropdown');

    // Check if the click is inside the dropdown or on the loginBtn
    let isClickInsideDropdown = accountDropdown.contains(event.target);
    let isClickOnLoginBtn = loginBtn.contains(event.target);

    // Hide the dropdown only if the click is outside both the dropdown and the loginBtn
    if (
        accountDropdown.style.display === 'block' &&
        !isClickInsideDropdown &&
        !isClickOnLoginBtn
    ) {
        accountDropdown.style.display = 'none';
    }
});

signUpLink.addEventListener('click', function (event) {
    event.preventDefault();
    switchToSignup();
});

loginLink.addEventListener('click', function (event) {
    event.preventDefault();
    switchToLogin();
});

forgotPasswordLink.addEventListener('click', function (event) {
    event.preventDefault();
    forgotPasswordModal.style.display = 'block';
    loginModal.style.display = 'none';
});

loginBtn.onclick = function () {
    if (isLoggedIn()) {
        // Toggle the account dropdown
        accountDropdown.style.display =
            accountDropdown.style.display === 'none' ? 'block' : 'none';
        // Fetch and display user information
        userEmail.textContent = `Email: ${getCurrentUserEmail()}`;
        userSubscription.textContent = `Subscription: ${getCurrentUserSubscription()}`;
    } else {
        loginModal.style.display = 'block';
    }
};

logoutBtn.onclick = function () {
    localStorage.clear();
    jwt = null; // Clear the jwt variable
    updateLoginButton();
    accountDropdown.style.display = 'none';
    localStorage.setItem('selectedProjectId', null);
    window.location.reload();
};

pricingBtn.onclick = function () {
    pricingModal.style.display = 'block';
};

for (const element of closeModal) {
    element.onclick = function () {
        this.parentElement.parentElement.style.display = 'none';
        switchToLogin();
    };
}

window.onclick = function (event) {
    if (event.target == loginModal || event.target == pricingModal) {
        event.target.style.display = 'none';
        if (event.target == loginModal) {
            switchToLogin();
        }
    }
};

function switchToSignup() {
    loginForm.style.display = 'none';
    document.getElementById('signupForm').style.display = 'flex';
    document.getElementById('login-panel').style.display = 'none';
    modalHeader.innerText = 'Sign Up';
}

function switchToLogin() {
    loginForm.style.display = 'flex';
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('login-panel').style.display = 'block';
    modalHeader.innerText = 'Login';
}

function appendMessage(element, message, className) {
    const messageDiv = document.createElement('div');
    messageDiv.setAttribute(
        'id',
        message.messageId ||
            `${Math.random().toString(36).substr(2, 5)}-message-${Math.random()
                .toString(36)
                .substr(2, 10)}`
    );
    messageDiv.classList.add('chat-message', className);

    const timestampSpan = document.createElement('span');
    timestampSpan.classList.add('timestamp');
    timestampSpan.innerText = formatTimestamp(message.timestamp || new Date());

    messageDiv.innerText = message.content;
    messageDiv.appendChild(timestampSpan);

    element.appendChild(messageDiv);
    chatOutput.scrollTop = chatOutput.scrollHeight;
}

function formatTimestamp(date) {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function updateLoginButton() {
    if (isLoggedIn()) {
        loginBtn.innerText = 'Account';
        // Add any additional UI changes for logged-in state here
    } else {
        loginBtn.innerText = 'Login';
        // Revert to the original state if logged out
        accountDropdown.style.display = 'none';
    }
}

loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    axios
        .post('/login', {
            email: email,
            password: password,
        })
        .then(function (response) {
            setJwt(response.data.token);
            loginModal.style.display = 'none';
            updateLoginButton();
            loginError.style.display = 'none'; // Hide error message on successful login
            window.location.reload();
        })
        .catch(function (error) {
            if (error.response && error.response.status === 401) {
                // Update the error message and display it
                loginError.textContent =
                    'Incorrect credentials, please try again.';
                loginError.style.display = 'block';
            }
        });
});

forgotPasswordForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const forgotEmail = document.getElementById('forgotEmail').value;

    axios
        .post('/forgot-password', {
            email: forgotEmail,
        })
        .then(function (response) {
            forgotPasswordError.style.display = 'block';
            forgotPasswordError.textContent = response.data;
            setTimeout(() => {
                displayModal('forgotPasswordModal', false);
            }, 5000);
        })
        .catch(function (error) {
            forgotPasswordError.style.display = 'block';
            console.error(error);
            forgotPasswordError.textContent =
                'An error occurred. Contact the administrator for assistance.';
            setTimeout(() => {
                displayModal('forgotPasswordModal', false);
            }, 5000);
        });
});

function startPolling() {
    if (!intervalId) {
        intervalId = setInterval(async () => {
            await fetchMessagesAndSubscription(
                jwt,
                updateChat,
                updateSubscriptionAmount
            );
        }, 50);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    initializeUI();
    await populatePricingModal(); // Fetch pricing details without logging in

    const retrievedToken = await fetchPasswordResetToken(passwordResetToken);
    const tokenData = retrievedToken.token;

    if (tokenData) {
        displayModal('resetPasswordModal', true); // Display the reset password modal if the toek exists in the URL

        resetPasswordForm.addEventListener('submit', function (e) {
            e.preventDefault();
            let hiddenToken = document.getElementById('hiddenToken').value;
            const newPassword = document.getElementById('newPassword').value;
            const newPasswordConfirm =
                document.getElementById('confirmPassword').value;
            hiddenToken = tokenData;

            if (newPassword !== newPasswordConfirm) {
                resetPasswordError.style.display = 'block';
                resetPasswordError.textContent = 'Passwords do not match';
                return;
            }

            axios
                .post('/reset-password', {
                    token: hiddenToken,
                    password: newPassword,
                    password2: newPasswordConfirm,
                })
                .then((response) => {
                    resetPasswordError.style.display = 'block';
                    resetPasswordError.textContent = response.data;

                    setTimeout(() => {
                        window.location.replace('/');
                    }, 5000);
                })
                .catch((error) => {
                    resetPasswordError.style.display = 'block';
                    resetPasswordError.textContent = error.response.data;
                });
        });
    }

    if (isLoggedIn()) {
        await fetchInitialData();
        // Start polling for new messages
        startPolling();
    }
    setupEventHandlers();
});

function initializeUI() {
    updateLoginButton();
    initializeCountryCodeInput();
}

function setupEventHandlers() {
    document
        .getElementById('projectSelector')
        .addEventListener('change', handleProjectSelection);
    document
        .getElementById('createProjectBtn')
        .addEventListener('click', showCreateProjectModal);
    promptDeleteProject.addEventListener('click', () =>
        displayModal('deleteProjectModal', true)
    );
    deleteProjectBtn.addEventListener('click', deleteCurrentProject);
    window.addEventListener('click', closeModalOnClickOutside);
    document
        .getElementById('createProjectForm')
        .addEventListener('submit', handleProjectCreation);
    document
        .getElementById('signupForm')
        .addEventListener('submit', handleUserSignup);
}

function handleProjectSelection() {
    const selectedProjectId = this.value;
    const currentProjectId = localStorage.getItem('selectedProjectId');
    if (selectedProjectId && selectedProjectId !== currentProjectId) {
        localStorage.setItem('selectedProjectId', selectedProjectId);
        window.location.reload();
    }
}

function showCreateProjectModal() {
    if (!isLoggedIn()) {
        displayModal('loginModal', true);
        loginError.style.display = 'block';
        loginError.textContent = 'You need to login to perform that action.';

        setTimeout(() => {
            loginError.textContent = '';
        }, 4000);
    } else {
        displayModal('createProjectModal', true);
    }
}

async function deleteCurrentProject() {
    await deleteProject(storedProjectId, jwt);
    localStorage.setItem('selectedProjectId', null);
    window.location.reload();
}

function closeModalOnClickOutside(event) {
    if (event.target === document.getElementById('createProjectModal')) {
        displayModal('createProjectModal', false);
    }
}

async function handleProjectCreation(event) {
    event.preventDefault();
    const projectNameInput = document
        .getElementById('projectNameInput')
        .value.trim();
    if (projectNameInput) {
        await createProject(projectNameInput);
    }
}

async function createProject(projectName) {
    const projectId = 'proj_' + Date.now();
    localStorage.setItem('selectedProjectId', projectId);
    try {
        await axios.post(
            '/api/user/create-project',
            { projectId, projectName },
            { headers: { Authorization: `Bearer ${jwt}` } }
        );
        displayModal('createProjectModal', false);
        window.location.reload();
    } catch (error) {
        console.error('Error saving project:', error);
    }
}

function handleUserSignup(event) {
    event.preventDefault();
    const signupData = collectSignupFormData();
    if (validateSignupData(signupData)) {
        performSignup(signupData);
    }
}

function collectSignupFormData() {
    return {
        password: document.getElementById('signupPassword').value,
        email: document.getElementById('signupEmail').value,
        mobileNumber: document.getElementById('mobileNumber').value,
        countryCode: document.getElementById('countryCode').value,
    };
}

function validateSignupData({ password, email, mobileNumber, countryCode }) {
    if (!email.includes('@')) {
        signInError.textContent = 'Please enter a valid email';
        signInError.style.display = 'block';
        return false;
    }
    if (!/^\d{3,15}$/.test(mobileNumber)) {
        signInError.textContent =
            'Incorrect mobile number format, please try again.';
        signInError.style.display = 'block';
        return false;
    }
    if (
        countryCode.length < 2 ||
        countryCode.length > 4 ||
        countryCode[0] !== '+'
    ) {
        signInError.textContent = 'Invalid country code.';
        signInError.style.display = 'block';
        return false;
    }
    if (password.length < 5) {
        signInError.textContent =
            'Password must be at least 5 characters long.';
        signInError.style.display = 'block';
        return false;
    }
    return true;
}

async function performSignup({ mobileNumber, password, email, countryCode }) {
    try {
        await axios.post('/register', {
            mobileNumber: countryCode + mobileNumber,
            password,
            email,
        });
        await loginUser(email, password);
    } catch (error) {
        displaySignupError(error);
    }
}

async function loginUser(email, password) {
    try {
        const response = await axios.post(
            '/login',
            { email, password },
            { withCredentials: true }
        );
        setJwt(response.data.token);
        displayModal('loginModal', false);
        updateLoginButton();
        window.location.reload();
    } catch (error) {
        console.error('Login failed:', error);
        displaySignupError(error);
    }
}

function displaySignupError(error) {
    loginError.textContent =
        error.response && error.response.data
            ? error.response.data
            : 'An error occurred. Please try again.';
    loginError.style.display = 'block';
}

function displayModal(modalId, show) {
    const modal = document.getElementById(modalId);
    modal.style.display = show ? 'block' : 'none';
}

function initializeCountryCodeInput() {
    let countryCodeInput = document.getElementById('countryCode');
    if (countryCodeInput.value.length === 0) {
        countryCodeInput.value = '+';
    }
}
