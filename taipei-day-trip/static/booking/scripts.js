document.addEventListener('DOMContentLoaded', async () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const failLoginMessage = document.querySelector('.fail-login');
    const successLoginMessage = document.querySelector('.success-login');
    const failSignupMessage = document.querySelector('.fail-signup');
    const successSignupMessage = document.querySelector('.success-signup');
    let globalUserId = null;
    let globalUsername = null;
    let globalUseremail = null;
    let isAuthenticated = false; // 是否已經驗證過用戶
    let bookingInfo = null;

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

                // 登录成功后只在需要时获取用户信息
                if (!isAuthenticated) {
                    await fetchCurrentUser();
                    isAuthenticated = true;
                }
                fetchBookings(); // 登录成功后获取预订信息
            } else {
                document.querySelector('.success-login').style.display = 'none';
                document.querySelector('.fail-login').style.display = 'block';
            }
        } catch (error) {
            console.error('登入時出現錯誤:', error);
        }
    });

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

    const checkAuthentication = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('Token 不存在');
            redirectToHomePage();
            return false;
        }
        return true;
    };
    

    const fetchCurrentUser = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Token 不存在');
                window.location.href = '/'; // 導向首頁
                return false;
            }

            const response = await fetch('/api/user/auth', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.error('未授權，需要重新登錄');
                } else if (response.status === 404) {
                    console.error('用戶未找到');
                } else {
                    console.error('獲取用戶信息失敗，HTTP 狀態碼:', response.status);
                }
                window.location.href = '/'; // 導向首頁
                return false;
            }

            const userData = await response.json();
            // console.log('Response data:', userData);
            globalUserId = userData.data.id;
            globalUsername = userData.data.name;
            globalUseremail = userData.data.email;

            // 設置輸入框的值
            document.querySelector('.nameinput').value = globalUsername;
            document.querySelector('.emailinput').value = globalUseremail;

            // console.log(globalUserId);
            // console.log(globalUsername);
            // console.log(globalUseremail);

            return true;
        } catch (error) {
            console.error('獲取用戶信息時出錯:', error);
            // 處理錯誤情況，例如顯示錯誤信息
            window.location.href = '/'; // 導向首頁
            return false;
        }
    };
    
    const fetchBookings = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('Token 不存在');
            return;
        }
    
        try {
            const response = await fetch(`/api/booking`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
    
            if (response.ok) {
                const data = await response.json();
                bookingInfo = data.data;
                const booking = data.data; // Use data.data to access the booking object directly
                if (booking) { // 確保有有效的 booking
                    updateBookingInfo(booking); // Pass the booking object to updateBookingInfo
                } else {
                    console.error('獲取到的預訂信息無效:', data);
                }
            } else {
                const bigText = document.querySelector('.bigtext');
                bigText.innerHTML = `您好，<span id="user-name">${globalUsername}</span>，待預定的行程如下：`;
                const smallText = document.querySelector('.smalltext');
                const navigationContent = document.querySelector('.navigation-content');
                navigationContent.style.display = 'none';
                smallText.style.display = 'block'; 
                console.error('獲取預訂信息失敗，HTTP 狀態碼:', response.status);
            }
        } catch (error) {
            console.error('獲取預訂訊息時出錯:', error);
        }
    };
    
    
    const updateBookingInfo = (booking) => {
        const bigText = document.querySelector('.bigtext');
        const smallText = document.querySelector('.smalltext');
        const navigationContent = document.querySelector('.navigation-content');
    
        // Always display bigText
        bigText.innerHTML = `您好，<span id="user-name">${globalUsername}</span>，待預定的行程如下：`;
    
        if (booking.attraction !== null) {
            // If booking exists, display navigation content
            navigationContent.style.display = 'block';
            smallText.style.display = 'none'; // Hide smallText
    
            const attraction = booking.attraction;
    
            // Fill in the details
            document.getElementById('attraction-name-detail').textContent = attraction.name;
            document.getElementById('booking-date').innerHTML = booking.date;
            document.getElementById('booking-time').innerHTML = booking.time;
            document.getElementById('booking-price').innerHTML = booking.price;
            document.getElementById('total-price').innerHTML = `總價：新台幣${booking.price}元`;
            document.getElementById('attraction-address').textContent = attraction.address;
    
            // Display the attraction image
            const attractionImage = document.getElementById('attraction-image');
            attractionImage.src = attraction.image; // Assuming image is a string URL
        } else {
            // If no booking, hide navigation content and display smallText
            navigationContent.style.display = 'none';
            smallText.style.display = 'block'; // Show smallText
        }
    };
    
    

    const showLogoutButton = () => {
        document.querySelector('.login-button').style.display = 'none';
        document.querySelector('.logout-button').style.display = 'block';
    };

    function showLoginButton() {
        document.querySelector('.login-button').style.display = 'block';
        document.querySelector('.logout-button').style.display = 'none';
    }

    document.querySelector('.logout-button').addEventListener('click', function() {
        localStorage.removeItem('token');  
        redirectToHomePage();  
    });
    
    const redirectToHomePage = () => {
        window.location.href = '/'; // 導向首頁
    };
    

    const hideModal = () => {
        const popupmodal = document.getElementById('modal');
        const popupLogin = document.getElementById('popup-login');
        popupmodal.style.display = 'none';
        popupLogin.style.display = 'none';
    };

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

                // 登录成功后只在需要时获取用户信息
                if (!isAuthenticated) {
                    await fetchCurrentUser();
                    isAuthenticated = true;
                }
                fetchBookings(); // 登录成功后获取预订信息
            } else {
                document.querySelector('.success-login').style.display = 'none';
                document.querySelector('.fail-login').style.display = 'block';
            }
        } catch (error) {
            console.error('登入時出現錯誤:', error);
        }
    });

    const titleElement = document.querySelector('.title');

    titleElement.addEventListener('click', () => {
        window.location.href = 'http://52.54.170.66:8000/';
    });


    const handleDeleteBooking = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('Token 不存在');
        return;
    }

    try {
        const response = await fetch(`/api/booking`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ member_id: globalUserId }) // 發送會員ID到後端
        });

        if (response.ok) {
            const data = await response.json();
            // console.log('Delete response:', data);

            // 更新本地預訂信息而不是再次調用 fetchBookings()
            updateBookingInfo({ attraction: null });

        } else {
            console.error('刪除預訂信息失敗，HTTP 狀態碼:', response.status);
            const errorMessage = await response.json();
            console.error('錯誤訊息:', errorMessage);
        }
    } catch (error) {
        console.error('刪除預訂信息時出錯:', error);
    }
};

    
    

    const ClickActions = (memberId) => {
        const popupmodal = document.getElementById('modal');
        const popupLogin = document.getElementById('popup-login');
        const popupSignup = document.getElementById('popup-signup');
        const closeButtons = document.querySelectorAll('.popup-close');

        const handleButtonClick = async (event) => {
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
            else if (target.classList.contains('delete-button')) {
                await handleDeleteBooking(memberId);
            }
        };

        
        document.addEventListener('click', handleButtonClick);


        const hideMessages = () => {
            failLoginMessage.style.display = 'none';
            successLoginMessage.style.display = 'none';
            failSignupMessage.style.display = 'none';
            successSignupMessage.style.display = 'none';
        };

        

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

   

    const token = localStorage.getItem('token');
    if (token) {
        showLogoutButton();
        await fetchCurrentUser();
        isAuthenticated = true;
        fetchBookings(); // 确保 fetchCurrentUser 完成后再调用 fetchBookings
    } else {
        redirectToHomePage(); // 在沒有 token 時導向首頁
    } 
    ClickActions();

    /////order
    //////
    


    var fields = {
        number: {
            // css selector
            element: '#card-number',
            placeholder: '**** **** **** ****'
        },
        expirationDate: {
            // DOM object
            element: document.getElementById('card-expiration-date'),
            placeholder: 'MM / YY'
        },
        ccv: {
            element: '#card-ccv',
            placeholder: 'ccv'
        }
    }

    TPDirect.card.setup({
        fields: fields,
        styles: {
            // Style all elements
            'input': {
                'color': 'gray'
            },
            // Styling ccv field
            'input.ccv': {
                // 'font-size': '16px'
            },
            // Styling expiration-date field
            'input.expiration-date': {
                // 'font-size': '16px'
            },
            // Styling card-number field
            'input.card-number': {
                // 'font-size': '16px'
            },
            // style focus state
            ':focus': {
                // 'color': 'black'
            },
            // style valid state
            '.valid': {
                'color': 'green'
            },
            // style invalid state
            '.invalid': {
                'color': 'red'
            },
            // Media queries
            // Note that these apply to the iframe, not the root window.
            '@media screen and (max-width: 400px)': {
                'input': {
                    'color': 'orange'
                }
            }
        },
        // 此設定會顯示卡號輸入正確後，會顯示前六後四碼信用卡卡號
        isMaskCreditCardNumber: true,
        maskCreditCardNumberRange: {
            beginIndex: 6, 
            endIndex: 11
        }
    })

    TPDirect.card.onUpdate(function (update) {
        if (update.canGetPrime) {
            // 可以取得 prime
            document.querySelector('.submit-button').removeAttribute('disabled');
        } else {
            // 不能取得 prime
            document.querySelector('.submit-button').setAttribute('disabled', true);
        }

        // 根據不同的欄位更新狀態
        if (update.status.number === 2) {
            // setNumberFormGroupToError()
        } else if (update.status.number === 0) {
            // setNumberFormGroupToSuccess()
        }

        if (update.status.expiry === 2) {
            // setExpiryFormGroupToError()
        } else if (update.status.expiry === 0) {
            // setExpiryFormGroupToSuccess()
        }

        if (update.status.ccv === 2) {
            // setCcvFormGroupToError()
        } else if (update.status.ccv === 0) {
            // setCcvFormGroupToSuccess()
        }
    });


    document.querySelector('.submit-button').addEventListener('click', async function(event) {
        event.preventDefault();
    
        const tappayStatus = TPDirect.card.getTappayFieldsStatus();
        if (!tappayStatus.canGetPrime) {
            alert('請正確填寫付款資訊');
            return;
        }
    
        TPDirect.card.getPrime(async (result) => {
            if (result.status !== 0) {
                alert('取得 prime 失敗 ' + result.msg);
                return;
            }
    
            const contactName = document.querySelector('.nameinput').value;
            const contactEmail = document.querySelector('.emailinput').value;
            const contactPhone = document.querySelector('.phoneinput').value;
    
            const orderData = {
                prime: result.card.prime,
                order: {
                    price: bookingInfo.price,
                    trip: {
                        attraction: {
                            id: bookingInfo.attraction.id,
                            name: bookingInfo.attraction.name,
                            address: bookingInfo.attraction.address,
                            image: bookingInfo.attraction.image
                        },
                        date: bookingInfo.date,
                        time: bookingInfo.time
                    },
                    contact: {
                        name: contactName,
                        email: contactEmail,
                        phone: contactPhone
                    }
                }
            };
    
            try {
                const response = await fetch('/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(orderData)
                });
    
                if (response.ok) {
                    const data = await response.json();
                    // alert('訂單提交成功');
                    const orderNumber = data.data.number;
                    window.location.href = `http://52.54.170.66:8000/thankyou?number=${orderNumber}`;
                    await handleDeleteBooking();
                } else {
                    console.error('提交訂單失敗，HTTP 狀態碼:', response.status);
                    const errorMessage = await response.json();
                    console.error('錯誤訊息:', errorMessage);
                    alert('訂單提交失敗');
                }
            } catch (error) {
                console.error('提交訂單時出錯:', error);
                alert('提交訂單時出錯');
            }
        });
    });

});














