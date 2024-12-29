let ml5Instance = null;

export async function setupClassifier() {
  if (!ml5Instance) {
    ml5Instance = await window.ml5.imageClassifier('https://teachablemachine.withgoogle.com/models/0zaBpu9j5/model.json');
  }
  return ml5Instance;
}

export function classifyImage(classifier, canvas, callback) {
  classifier.classify(canvas, (results,error) => {
    if (error) {
      console.error(error);
      return;
    }

    console.log(results)
    let highest_score =results[0];
    for (let item in results){
      if (item.confidence> highest_score.confidence ){
        highest_score = item
      }
    }

    callback(highest_score.label, highest_score.label==="Blue bin", highest_score.confidence);
  });
}