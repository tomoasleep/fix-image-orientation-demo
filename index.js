import binaryRewriter from './src/binary-rewriter';
import canvasRewriter from './src/canvas-rewriter';

window.addEventListener('load', () => {
  listenChangeEvent('input#binary', (arrayBuffer) => {
    insertImage(arrayBuffer);

    let start = Date.now();
    const fixedImgData = binaryRewriter(arrayBuffer);
    console.log('Rewrite image:', Date.now() - start, 'ms');

    insertImage(fixedImgData.data);
  });

  listenChangeEvent('input#canvas', (arrayBuffer) => {
    insertImage(arrayBuffer);

    let start = Date.now();
    canvasRewriter(arrayBuffer).then((fixedImgData) => {
      console.log('Rewrite image:', Date.now() - start, 'ms');

      insertImage(fixedImgData.data);
    });
  });
});

function listenChangeEvent(query, callback) {
  document.querySelector(query).addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      callback(reader.result);
    });
    reader.readAsArrayBuffer(file);
  });
}

function insertImage(imageData, contentType) {
  contentType = contentType || 'image/jpeg';
  const blob = new Blob([imageData], { type: contentType });
  const url = URL.createObjectURL(blob);

  const el = document.createElement('img');
  el.setAttribute('src', url)
  el.setAttribute('width', '50%')
  document.body.appendChild(el);
}
