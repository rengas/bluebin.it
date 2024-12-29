import { recyclableItems } from '../../config/recyclables';

let ml5Instance = null;

export async function setupClassifier() {
    if (!ml5Instance) {
        ml5Instance = await window.ml5.imageClassifier('MobileNet');
    }
    return ml5Instance;
}

export function classifyImage(classifier, canvas, callback) {
    classifier.classify(canvas, (results, error) => {
        if (error) {
            console.error(error);
            return;
        }

        const item = results[0].label.toLowerCase();
        const isRecyclable = recyclableItems.some(recyclable =>
            item.includes(recyclable)
        );

        callback(item, isRecyclable, results[0].confidence);
    });
}