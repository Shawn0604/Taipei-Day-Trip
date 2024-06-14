document.addEventListener('DOMContentLoaded', () => {
    const attractionImagesContainer = document.querySelector('.attraction-images');
    const attractionNameElement = document.querySelector('.attraction-name');
    const attractionCategoryElement = document.querySelector('.attraction-category');
    const attractionMrtElement = document.querySelector('.attraction-mrt');
    const descriptionElement = document.querySelector('.description');
    const addressElement = document.querySelector('.address');
    const transportElement = document.querySelector('.transport');
    const titleElement = document.querySelector('.title');
    const circleBar = document.querySelector('.circleBar');

    let currentImageIndex = 0; 
    let data = null;

    const fetchAttractionDetails = async () => {
        try {
            const attractionId = getAttractionIdFromUrl();
            const response = await fetch(`/api/attraction/${attractionId}`); 
            const result = await response.json();
            data = result.data; 

            attractionNameElement.textContent = data.name;
            attractionCategoryElement.textContent = data.category;
            attractionMrtElement.textContent = data.mrt;
            descriptionElement.textContent = data.description;
            addressElement.textContent = `地址：${data.address}`;
            transportElement.textContent = `交通：${data.transport}`;

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
            updateCircles();
            document.querySelector('.right-arrow').addEventListener('click', () => {
                if (currentImageIndex < data.images.length - 1) {
                    currentImageIndex++;
                } else {
                    currentImageIndex = 0; 
                }
                mainImage.src = data.images[currentImageIndex];
                updateCircles();
            });

            document.querySelector('.left-arrow').addEventListener('click', () => {
                if (currentImageIndex > 0) {
                    currentImageIndex--;
                } else {
                    currentImageIndex = data.images.length - 1; 
                }
                mainImage.src = data.images[currentImageIndex];
                updateCircles();
            });

        } catch (error) {
            console.error('Error fetching attraction details:', error);
        }
    };
    const getAttractionIdFromUrl = () => {
        const urlParts = window.location.href.split('/');
        return urlParts[urlParts.length - 1];
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
    titleElement.addEventListener('click', () => {
        window.location.href = '/';
    });

    fetchAttractionDetails();
});




  
  
  