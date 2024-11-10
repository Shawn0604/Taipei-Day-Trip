document.addEventListener('DOMContentLoaded', () => {
    const attractionImagesContainer = document.querySelector('.attraction-images');
    const attractionNameElement = document.querySelector('.attraction-name');
    const attractionCategoryandMrtElement = document.querySelector('.attraction-categoryandmrt');
    const descriptionElement = document.querySelector('.description');
    const addressElement = document.querySelector('.address');
    const transportElement = document.querySelector('.transport');
    const titleElement = document.querySelector('.title');
    const circleBar = document.querySelector('.circleBar');
    const priceTextElement = document.querySelector('.price-value');
    let currentImageIndex = 0;
    let data = null;
    let pricing = 2500;
    let globalUserId = null; 

    const fetchAttractionDetails = async () => {
        try {
            const attractionId = getAttractionIdFromUrl();
            const response = await fetch(`/api/attraction/${attractionId}`);
            const result = await response.json();
            data = result.data;

            updateAttractionDetails();
            setupImageSlider();
            updatePricing();
        } catch (error) {
            console.error('Error fetching attraction details:', error);
        }
    };

    const updateAttractionDetails = () => {
        attractionNameElement.textContent = data.name;
        attractionCategoryandMrtElement.textContent = `${data.category} at ${data.mrt}`;
        descriptionElement.textContent = data.description;
        addressElement.textContent = data.address;
        transportElement.textContent = `捷運站名：${data.mrt}站，${data.transport}`;
    };

    const setupImageSlider = () => {
        const mainImage = document.createElement('img');
        mainImage.src = data.images[currentImageIndex];
        mainImage.alt = 'Attraction Image';
        mainImage.classList.add('main-image');
        attractionImagesContainer.appendChild(mainImage);

        data.images.forEach((image, index) => {
            const circle = document.createElement('div');
            circle.classList.add('circle');
            if (index === currentImageIndex) {
                circle.classList.add('active');
            }
            circle.addEventListener('click', () => {
                currentImageIndex = index;
                mainImage.src = data.images[currentImageIndex];
                updateCircles();
            });
            circleBar.appendChild(circle);
        });

        document.querySelector('.right-arrow').addEventListener('click', () => {
            currentImageIndex = (currentImageIndex + 1) % data.images.length;
            mainImage.src = data.images[currentImageIndex];
            updateCircles();
        });

        document.querySelector('.left-arrow').addEventListener('click', () => {
            currentImageIndex = (currentImageIndex - 1 + data.images.length) % data.images.length;
            mainImage.src = data.images[currentImageIndex];
            updateCircles();
        });

        updateCircles();
    };

    const updateCircles = () => {
        const circles = document.querySelectorAll('.circle');
        circles.forEach((circle, index) => {
            if (index === currentImageIndex) {
                circle.classList.add('active');
            } else {
                circle.classList.remove('active');
            }
        });
    };

    const getAttractionIdFromUrl = () => {
        const urlParts = window.location.href.split('/');
        return urlParts[urlParts.length - 1];
    };

    titleElement.addEventListener('click', () => {
        window.location.href = 'http://52.54.170.66:8000/';
    });

    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === '上半天') {
                pricing = 2000;
            } else {
                pricing = 2500;
            }
            updatePricing();
        });
    });

    const updatePricing = () => {
        priceTextElement.textContent = `新台幣${pricing}元`;
    };

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const failLoginMessage = document.querySelector('.fail-login');
    const successLoginMessage = document.querySelector('.success-login');
    const failSignupMessage = document.querySelector('.fail-signup');
    const successSignupMessage = document.querySelector('.success-signup');

    failLoginMessage.style.display = 'none';
    successLoginMessage.style.display = 'none';
    failSignupMessage.style.display = 'none';
    successSignupMessage.style.display = 'none';

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // 阻止表單的默認提交行為

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

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
            if (!token) return;

            const response = await fetch('/api/user/auth', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                
                const userData = await response.json();
                // console.log('Response data:', userData);
                globalUserId = userData.data.id;
                // const userId = userData.data.id; // 获取data中的id
                // console.log('User ID:', userId);
            } else {
                window.location.href = '/';
                return false;
                // console.error('獲取用戶訊息失敗');
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
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
        
        const attractionId = getAttractionIdFromUrl();
const bookButton = document.getElementById('book-button');

if (bookButton) {
    bookButton.addEventListener('click', async function() {
        // 抓取選擇的日期、時間和導覽費用
        const chosenDate = document.getElementById('choose-date').value;
        const chosenTime = document.querySelector('input[name="time"]:checked').value;

        try {
            // 获取当前用户信息
            const token = localStorage.getItem('token');
            if (!token) {
                // 顯示登入框
                const popupmodal = document.getElementById('modal');
                const popupLogin = document.getElementById('popup-login');
                popupmodal.style.display = 'block';
                popupLogin.style.display = 'block';
                hideMessages();
                return;
            }

            // const responseUser = await fetch('/api/user/auth', {
            //     method: 'GET',
            //     headers: {
            //         'Authorization': `Bearer ${token}`
            //     }
            // });

            // if (!responseUser.ok) {
            //     throw new Error('Failed to fetch user info');
            // }

            // 获取全局用户ID
            // console.log('globalUserId', globalUserId);

            // 建立要發送的資料物件
            const bookingData = {
                attractionId: getAttractionIdFromUrl(),
                date: chosenDate,
                time: chosenTime,
                price: pricing,
                member_id: globalUserId
            };

            // 發送 POST 請求
            const response = await fetch('/api/booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(bookingData)
            });

            if (!response.ok) {
                throw new Error('Booking request failed');
            }

            const result = await response.json();
            // console.log('Booking created successfully:', result);

            // 清除錯誤訊息
            const errorMessages = document.querySelectorAll('.error-message');
            errorMessages.forEach(msg => msg.textContent = '');

            // 顯示成功訊息
            const successMessage = document.getElementById('success-message');
            if (successMessage) {
                successMessage.textContent = 'Booking created successfully!';
            }

            // 跳轉到 /booking 頁面
            window.location.href = '/booking';

        } catch (error) {
            console.error('Error creating booking:', error);
            // 顯示錯誤訊息
            const errorMessage = document.getElementById('error-message');
            if (errorMessage) {
                errorMessage.textContent = 'Booking failed. Please try again.';
            }
        }
    });
}

    };

    ClickActions();
    fetchAttractionDetails();
});





  
  
  