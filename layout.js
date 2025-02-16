class PortfolioLayout {
    constructor(container, photos) {
        this.container = container;
        this.photos = photos;
        this.maxRowHeight = 400;
        this.containerPadding = 16;
    }

    async initialize() {
        await this.loadImageDimensions();
        this.render();
        window.addEventListener('resize', () => this.render());
    }

    async loadImageDimensions() {
        const promises = this.photos.map(photo => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    photo.width = img.width;
                    photo.height = img.height;
                    resolve();
                };
                img.src = photo.src;
            });
        });
        await Promise.all(promises);
    }

    calculateLayout() {
        const rows = [];
        let currentRow = [];
        let rowWidth = 0;
        const containerWidth = this.container.clientWidth - (this.containerPadding * 2);

        this.photos.forEach(photo => {
            const aspectRatio = photo.width / photo.height;
            const scaledWidth = this.maxRowHeight * aspectRatio;
            
            if (rowWidth + scaledWidth > containerWidth && currentRow.length > 0) {
                rows.push(this.finalizeRow(currentRow, containerWidth));
                currentRow = [];
                rowWidth = 0;
            }
            
            currentRow.push({ ...photo, scaledWidth });
            rowWidth += scaledWidth;
        });

        if (currentRow.length > 0) {
            rows.push(this.finalizeRow(currentRow, containerWidth));
        }

        return rows;
    }

    finalizeRow(row, containerWidth) {
        const totalWidth = row.reduce((sum, photo) => sum + photo.scaledWidth, 0);
        const scale = containerWidth / totalWidth;

        return row.map(photo => ({
            ...photo,
            width: Math.floor(photo.scaledWidth * scale),
            height: Math.floor(this.maxRowHeight * scale)
        }));
    }

    render() {
        const rows = this.calculateLayout();
        
        this.container.innerHTML = rows.map(row => `
            <div class="flex w-full gap-4 mb-4">
                ${row.map(photo => `
                    <div class="overflow-hidden" style="width: ${photo.width}px; height: ${photo.height}px;">
                        <a href="${photo.src}" data-fancybox="gallery">
                            <img 
                                src="${photo.src}"
                                alt="${photo.alt}"
                                class="block h-full w-full object-cover object-center opacity-0 animate-fade-in transition duration-500 transform scale-100 hover:scale-110"
                            />
                        </a>
                    </div>
                `).join('')}
            </div>
        `).join('');
    }
}