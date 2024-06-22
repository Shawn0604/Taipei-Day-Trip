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
        window.location.href = 'http://54.196.142.222:8000/';
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

    fetchAttractionDetails();
});





  
  
  