document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const failLoginMessage = document.querySelector('.fail-login');
    const successLoginMessage = document.querySelector('.success-login');
    const failSignupMessage = document.querySelector('.fail-signup');
    const successSignupMessage = document.querySelector('.success-signup');

    // 隐藏所有提示信息
    failLoginMessage.style.display = 'none';
    successLoginMessage.style.display = 'none';
    failSignupMessage.style.display = 'none';
    successSignupMessage.style.display = 'none';

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // 阻止表单的默认提交行为

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        // console.log('Attempting to login with:', email, password);
        
        try {
            const response = await fetch('/api/user/auth', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();
            // console.log('Login response:', data); 

            if (response.ok) {
                localStorage.setItem('token', data.token);  
                showLogoutButton();  
                document.querySelector('.success-login').style.display = 'block';  
                document.querySelector('.fail-login').style.display = 'none'; 
                hideModal();
                fetchCurrentUser();
            } else {
                document.querySelector('.success-login').style.display = 'none';  
                document.querySelector('.fail-login').style.display = 'block';  
            }
        } catch (error) {
            console.error('登入時出現錯誤:', error);
        }
    });

    const fetchCurrentUser = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Token 不存在');
                return;
            }
    
            const response = await fetch('/api/user/auth', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
    
            if (response.ok) {
                const userResponse = await response.json();
                const username = userResponse.data.name;
                const bigText = document.querySelector('.bigtext');
                bigText.innerHTML = `${username}，行程預定成功`;
                // console.log('User info:', user);
                // 在这里处理用户信息，例如更新页面上的用户信息展示等操作
            } else {
                if (response.status === 401) {
                    console.error('未授权需要重新登录');
                } else if (response.status === 404) {
                    console.error('用户未找到');
                } else {
                    console.error('获取用户信息失败，HTTP 状态码:', response.status);
                }
            }
        } catch (error) {
            console.error('获取用户信息时出错:', error);
        }
    };
    
    

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault(); 

        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        try {
            const response = await fetch('/api/user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password
                })
            });

            if (!response.ok) {
                const errorMessage = await response.json();
                if (response.status === 400 && errorMessage.detail.message === 'Email already registered') {
                    failSignupMessage.style.display = 'block';
                    successSignupMessage.style.display = 'none';
                } else {
                    throw new Error(errorMessage.detail);
                }
            } else {
                successSignupMessage.style.display = 'block';
                failSignupMessage.style.display = 'none';
            }

            registerForm.reset();
        } catch (error) {
            console.error('Registration error:', error.message);
        }
    });

    const token = localStorage.getItem('token');
    if (token) {
        showLogoutButton();
        fetchCurrentUser(); 
    } else {
        showLoginButton();
    }

    function hideModal() {
        const popupmodal = document.getElementById('modal');
        const popupLogin = document.getElementById('popup-login');
        popupmodal.style.display = 'none';
        popupLogin.style.display = 'none';
    }

    function showLogoutButton() {
        document.querySelector('.login-button').style.display = 'none';
        document.querySelector('.logout-button').style.display = 'block';
    }

    function showLoginButton() {
        document.querySelector('.login-button').style.display = 'block';
        document.querySelector('.logout-button').style.display = 'none';
    }

    document.querySelector('.logout-button').addEventListener('click', function() {
        localStorage.removeItem('token');  
        showLoginButton();  
    });

    const ClickActions = () => {
        const popupmodal = document.getElementById('modal');
        const popupLogin = document.getElementById('popup-login');
        const popupSignup = document.getElementById('popup-signup');
        const closeButtons = document.querySelectorAll('.popup-close');
        const failLoginMessage = document.querySelector('.fail-login');
        const successLoginMessage = document.querySelector('.success-login');
        const failSignupMessage = document.querySelector('.fail-signup');
        const successSignupMessage = document.querySelector('.success-signup');
    
        const handleButtonClick = (event) => {
            const target = event.target;
    
            if (target.classList.contains('login-button')) {
                popupmodal.style.display = 'block';
                popupLogin.style.display = 'block';
                hideMessages();
                event.stopPropagation();
            } else if (target.classList.contains('popup-close') || target.id === 'modal') {
                popupmodal.style.display = 'none';
                popupLogin.style.display = 'none';
                popupSignup.style.display = 'none';
                hideMessages();
                event.stopPropagation();
            } else if (target.classList.contains('pop-register-button')) {
            } else if (target.id === 'signup-link') {
                popupLogin.style.display = 'none';
                popupSignup.style.display = 'block';
                hideMessages();
            } else if (target.id === 'login-link') {
                popupSignup.style.display = 'none';
                popupLogin.style.display = 'block';
                hideMessages();
            }
        };
    
        const hideMessages = () => {
            failLoginMessage.style.display = 'none';
            successLoginMessage.style.display = 'none';
            failSignupMessage.style.display = 'none';
            successSignupMessage.style.display = 'none';
        };
    
        document.addEventListener('click', handleButtonClick);
    
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                popupmodal.style.display = 'none';
                popupLogin.style.display = 'none';
                popupSignup.style.display = 'none';
                hideMessages();
            });
        });


        const bookingButton = document.getElementById('booking-button');
        bookingButton.addEventListener('click', () => {
        const token = localStorage.getItem('token');
        if (token) {
            window.location.href = '/booking';  
        } else {
            popupmodal.style.display = 'block';  
            popupLogin.style.display = 'block';
            hideMessages();
        }
    });
    };
    ClickActions();

    function getUrlParameter(name) {
        name = name.replace(/[[]/, '\\[').replace(/[\]]/, '\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        var results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    const orderNumber = getUrlParameter('number');
    const smallText = document.querySelector('.smalltext');
    
    if (orderNumber) {
        smallText.textContent = `${orderNumber}`;
    } else {
        smallText.textContent = '無法顯示訂單編號';
    }

    const titleElement = document.querySelector('.title');

    titleElement.addEventListener('click', () => {
        window.location.href = 'http://52.54.170.66:8000/';
    });


    const showLogoutButton = () => {
        document.querySelector('.login-button').style.display = 'none';
        document.querySelector('.logout-button').style.display = 'block';
    };

    document.querySelector('.logout-button').addEventListener('click', function() {
        localStorage.removeItem('token');  
        redirectToHomePage();  
    });
    
    const redirectToHomePage = () => {
        window.location.href = '/'; 
    };
});












