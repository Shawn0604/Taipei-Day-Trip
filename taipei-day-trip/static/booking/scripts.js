document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const failLoginMessage = document.querySelector('.fail-login');
    const successLoginMessage = document.querySelector('.success-login');
    const failSignupMessage = document.querySelector('.fail-signup');
    const successSignupMessage = document.querySelector('.success-signup');
    let globalUserId = null; 
    let globalUsername = null; 

    // 隐藏所有提示信息
    failLoginMessage.style.display = 'none';
    successLoginMessage.style.display = 'none';
    failSignupMessage.style.display = 'none';
    successSignupMessage.style.display = 'none';

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // 阻止表单的默认提交行为

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
                localStorage.setItem('member_id', data.member_id); // Save member_id
                globalUserId = data.member_id; // Set globalUserId
                showLogoutButton();  
                document.querySelector('.success-login').style.display = 'block';  
                document.querySelector('.fail-login').style.display = 'none'; 
                hideModal();
                fetchCurrentUser();
                fetchBookings(); // 登录成功后获取预订信息
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
                const userData = await response.json();
                console.log('Response data:', userData);
                globalUserId = userData.data.id;
                globalUsername = userData.data.name;
                console.log(globalUserId,globalUsername)
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

    const fetchBookings = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('Token 不存在');
            return;
        }

        if (!globalUserId) {
            console.error('Member ID 不存在');
            return;
        }

        try {
            const response = await fetch(`/api/booking?member_id=${globalUserId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const bookings = data.data;
                updateBookingInfo(bookings);
            } else {
                console.error('获取预订信息失败，HTTP 状态码:', response.status);
            }
        } catch (error) {
            console.error('获取预订信息时出错:', error);
        }
    };

    const updateBookingInfo = async (bookings) => {
        const bigText = document.querySelector('.bigtext');
        const smallText = document.querySelector('.smalltext');
      
        if (bookings.length > 0) {
          bigText.innerHTML = `您好，<span id="user-name">${globalUsername}</span>，待預定的行程如下：`;
          smallText.style.display = 'none';
      
          for (const booking of bookings) {
            // Fetch attraction details
            const attractionDetails = await fetchAttractionDetails(booking.attractionId);
      
            // Fill in the details
            document.getElementById('attraction-name').textContent = `台北一日遊: ${attractionDetails.name}`;
            document.getElementById('booking-date').innerHTML = `<span class="bold-label"></span> ${booking.date}`;
            document.getElementById('booking-time').innerHTML = `<span class="bold-label"></span> ${booking.time}`;
            document.getElementById('booking-price').innerHTML = `<span class="bold-label"></span> ${booking.price}`;
            document.getElementById('attraction-address').textContent = ` ${attractionDetails.address}`;
      
            // Display the attraction image
            const attractionImage = document.getElementById('attraction-image');
            attractionImage.src = attractionDetails.images[0]; // Assuming images is an array
      
            // Optionally, you can create bookingInfo element and append to bigText
          }
        } else {
          smallText.style.display = 'block';
        }
      };
      
    
    const fetchAttractionDetails = async (attractionId) => {
        try {
            const response = await fetch(`/api/attraction/${attractionId}`);
            if (response.ok) {
                const data = await response.json();
                return data.data;
            } else {
                console.error('获取景点信息失败，HTTP 状态码:', response.status);
                return null;
            }
        } catch (error) {
            console.error('获取景点信息时出错:', error);
            return null;
        }
    };
    

    const token = localStorage.getItem('token');
    if (token) {
        showLogoutButton();
        fetchCurrentUser().then(() => fetchBookings()); // 确保 fetchCurrentUser 完成后再调用 fetchBookings
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
        localStorage.removeItem('member_id');
        globalUserId = null; // Reset globalUserId
        showLoginButton();  
    });

    const ClickActions = () => {
        const popupmodal = document.getElementById('modal');
        const popupLogin = document.getElementById('popup-login');
        const popupSignup = document.getElementById('popup-signup');
        const closeButtons = document.querySelectorAll('.popup-close');
    
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
});













