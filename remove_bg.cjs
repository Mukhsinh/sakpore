const { Jimp } = require("jimp");
const path = require("path");

async function removeBackground(imagePath) {
    console.log(`Processing: ${imagePath}`);
    try {
        const image = await Jimp.read(imagePath);

        // Remove near-white pixels (with tolerance)
        // DALL-E images often have white background #ffffff or close to it
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
            const r = this.bitmap.data[idx + 0];
            const g = this.bitmap.data[idx + 1];
            const b = this.bitmap.data[idx + 2];

            // Check if color is close to white (tolerance of 20)
            if (r > 240 && g > 240 && b > 240) {
                // Determine if it's edge/shadow by looking at difference between RGB
                // the more variation, the more likely it's a shadow, not pure background
                if (Math.abs(r - g) < 15 && Math.abs(g - b) < 15 && Math.abs(r - b) < 15) {
                    this.bitmap.data[idx + 3] = 0; // Set alpha to 0
                }
            }
        });

        await image.write(imagePath.replace('.png', '-transparent.png'));
        console.log(`Saved: ${imagePath.replace('.png', '-transparent.png')}`);
    } catch (error) {
        console.error(`Error processing ${imagePath}:`, error);
    }
}

async function main() {
    const files = process.argv.slice(2);
    for (const file of files) {
        await removeBackground(file);
    }
}

main();
