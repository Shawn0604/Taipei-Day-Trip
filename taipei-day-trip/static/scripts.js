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

    const ClickActions = () => {
        document.addEventListener('click', (event) => {
            const target = event.target;
            if (target.classList.contains('search-icon')) {
                searchAttractions(0, true, searchInput.value);
            }
            if (target.classList.contains('arrow-left')) {
                scrollContainer(mrtContainer, -1000);
            }
            if (target.classList.contains('arrow-right')) {
                scrollContainer(mrtContainer, 1000);
            }
        });

        searchInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                searchAttractions(0, true, searchInput.value);
            }
        });

        const attractionIntersectionObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting && loader && loader.getAttribute('data-nextPage')) {
                    fetchAttractions(parseInt(loader.getAttribute('data-nextPage')), false, currentKeyword);
                }
            });
        }, {
            root: null,
            rootMargin: '0px',
            threshold: 1.0
        });
        if (loader) attractionIntersectionObserver.observe(loader);
        fetchMRTs();
        fetchAttractions(0);
    };
    ClickActions();
});






