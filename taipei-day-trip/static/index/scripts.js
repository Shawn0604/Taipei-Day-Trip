document.addEventListener('DOMContentLoaded', () => {
    const mrtContainer = document.querySelector('.mrts');
    const searchInput = document.querySelector('.search input');
    const loader = document.querySelector('.loader');
    const allattractionContainer = document.querySelector('.allattraction');
    let currentKeyword = '';

    const fetchMRTs = async () => {
        try {
            const response = await fetch('./api/mrts');
            const data = await response.json();
            const mrtNames = data.data;

            mrtNames.forEach(name => {
                const mrt = createMRTElement(name);
                mrtContainer.appendChild(mrt);
            });
        } catch (error) {
            console.error('Error fetching MRT names:', error);
        }
    };

    const createMRTElement = (name) => {
        const mrt = document.createElement('div');
        mrt.className = 'mrt';
        mrt.textContent = name;
        mrt.addEventListener('click', () => {
            searchInput.value = name;
            searchAttractions(0, true, name);
        });
        return mrt;
    };

    const fetchAttractions = async (page, isSearch = false, keyword = '') => {
        const isLoading = loader ? loader.getAttribute('data-isLoading') === 'true' : false;

        if (!loader || isLoading) return;

        loader.setAttribute('data-isLoading', 'true');

        try {
            const actualKeyword = keyword || currentKeyword;
            const url = `./api/attractions?page=${page}&keyword=${encodeURIComponent(actualKeyword)}`;
            const response = await fetch(url);
            const data = await response.json();
            const attractions = data.data;
            const nextPage = data.nextPage;

            if (isSearch) {
                allattractionContainer.innerHTML = '';
            }

            attractions.forEach(attraction => {
                const attractionElement = createAttractionElement(attraction);
                allattractionContainer.appendChild(attractionElement);
            });

            if (nextPage !== null) {
                loader.setAttribute('data-nextPage', nextPage.toString());
            } else {
                loader.removeAttribute('data-nextPage');
            }
        } catch (error) {
            console.error('Error fetching attractions:', error);
        } finally {
            if (loader) loader.setAttribute('data-isLoading', 'false');
        }
    };

    const createAttractionElement = (attraction) => {
        const attractionElement = document.createElement('div');
        attractionElement.classList.add('attraction');

        const imageElement = document.createElement('img');
        imageElement.src = attraction.images.length > 0 ? attraction.images[0] : '';
        imageElement.alt = 'Attraction Image';

        imageElement.addEventListener('click', () => {
            window.location.href = `/attraction/${attraction.id}`;
        });

        const mrtTextElement = document.createElement('div');
        mrtTextElement.classList.add('mrtText');
        const nameElement = document.createElement('div');
        nameElement.classList.add('name');
        nameElement.textContent = attraction.name;
        mrtTextElement.appendChild(nameElement);

        const mrtTitleElement = document.createElement('div');
        mrtTitleElement.classList.add('mrtTitle');
        const mrtElement = document.createElement('div');
        mrtElement.classList.add('name');
        mrtElement.textContent = attraction.mrt;
        const categoryElement = document.createElement('div');
        categoryElement.classList.add('name');
        categoryElement.textContent = attraction.category;
        mrtTitleElement.append(mrtElement, categoryElement);

        attractionElement.append(imageElement, mrtTextElement, mrtTitleElement);

        return attractionElement;
    };

    const searchAttractions = (page, isSearch = false, keyword = '') => {
        currentKeyword = keyword;
        fetchAttractions(page, isSearch, keyword);
    };

    const scrollContainer = (container, distance) => {
        container.scrollBy({ top: 0, left: distance, behavior: 'smooth' });
    };

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

            if (!response.ok) {
                if (response.status === 400) {
                    failLoginMessage.style.display = 'block';
                    successLoginMessage.style.display = 'none';
                } else {
                    const errorMessage = await response.json();
                    throw new Error(errorMessage.detail);
                }
            } else {
                successLoginMessage.style.display = 'block';
                failLoginMessage.style.display = 'none';
            }

            // 清空表单
            loginForm.reset();
        } catch (error) {
            console.error('Login error:', error.message);
        }
    });

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // 阻止表单的默认提交行为

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
                if (response.status === 400 && errorMessage.detail === 'Email already registered') {
                    failSignupMessage.style.display = 'block';
                    successSignupMessage.style.display = 'none';
                } else {
                    throw new Error(errorMessage.detail);
                }
            } else {
                successSignupMessage.style.display = 'block';
                failSignupMessage.style.display = 'none';
            }

            // 清空表单
            registerForm.reset();
        } catch (error) {
            console.error('Registration error:', error.message);
        }
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
    };
    
    ClickActions();
    
    fetchMRTs();
    fetchAttractions(0);

    const mrtContainerElement = document.querySelector('.mrt-container');
    const leftButton = document.querySelector('.arrow-left');
    const rightButton = document.querySelector('.arrow-right');

    leftButton.addEventListener('click', () => scrollContainer(mrtContainerElement, -200));
    rightButton.addEventListener('click', () => scrollContainer(mrtContainerElement, 200));

    let currentPage = 0;
    window.addEventListener('scroll', () => {
        if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 200) {
            const nextPage = parseInt(loader.getAttribute('data-nextPage'));
            if (!isNaN(nextPage)) {
                currentPage = nextPage;
                fetchAttractions(currentPage);
            }
        }
    });

    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            const keyword = searchInput.value;
            searchAttractions(0, true, keyword);
        }
    });
});











