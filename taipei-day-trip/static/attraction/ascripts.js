document.addEventListener('DOMContentLoaded', () => {
    const attractionImagesContainer = document.querySelector('.attraction-images');
    const attractionNameElement = document.querySelector('.attraction-name');
    const attractionCategoryElement = document.querySelector('.attraction-category');
    const attractionMrtElement = document.querySelector('.attraction-mrt');
    const descriptionElement = document.querySelector('.description');
    const addressElement = document.querySelector('.address');
    const transportElement = document.querySelector('.transport');

    const fetchAttractionDetails = async () => {
        try {
            const attractionId = getAttractionIdFromUrl();
            const response = await fetch(`http://127.0.0.1:8000/api/attraction/${attractionId}`); // Replace with your actual API URL
            const data = await response.json();
            attractionNameElement.textContent = data.data.name;
            attractionCategoryElement.textContent = data.data.category;
            attractionMrtElement.textContent = data.data.mrt;
            descriptionElement.textContent = data.data.description;
            addressElement.textContent = `地址：${data.data.address}`;
            transportElement.textContent = `交通：${data.data.transport}`;
            const mainImage = document.createElement('img');
            mainImage.src = data.data.images[0]; 
            mainImage.alt = 'Attraction Image';
            mainImage.classList.add('main-image');
            attractionImagesContainer.appendChild(mainImage);
            const prevButton = document.createElement('button');
            prevButton.textContent = '上一張';
            prevButton.classList.add('prev-button');
            attractionImagesContainer.appendChild(prevButton);
            const nextButton = document.createElement('button');
            nextButton.textContent = '下一張';
            nextButton.classList.add('next-button');
            attractionImagesContainer.appendChild(nextButton);
            let currentImageIndex = 0; 
            prevButton.addEventListener('click', () => {
                if (currentImageIndex > 0) {
                    currentImageIndex--;
                    mainImage.src = data.data.images[currentImageIndex];
                }
            });

            nextButton.addEventListener('click', () => {
                if (currentImageIndex < data.data.images.length - 1) {
                    currentImageIndex++;
                    mainImage.src = data.data.images[currentImageIndex];
                }
            });

        } catch (error) {
            console.error('Error fetching attraction details:', error);
        }
    };

    const getAttractionIdFromUrl = () => {
        const urlParts = window.location.href.split('/');
        return urlParts[urlParts.length - 1];
    };

    fetchAttractionDetails();
});




  
  
  