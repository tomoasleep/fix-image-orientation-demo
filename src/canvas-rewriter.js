const exif = require('exif-js');
require('babel-polyfill');
const ImageFile = require('image-file');

export default function fixImageOrientationWithCanvas(image) {
  const tags = exif.readFromBinaryFile(image);
  const orientation = tags.Orientation;
  console.log(orientation);

  /*
  createImage(image).then((imageEl) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    ctx.drawImage(imageEl, 0, 0);
    document.body.appendChild(canvas);
  });
  */

  return drawImage(image, orientation);
}

function drawInformation(orientation) {
  switch(orientation) {
    case 1:
      return {
        rotate: 0,
        flipX: false,
      };
    case 2:
      return {
        rotate: 0,
        flipX: true,
      };
    case 3:
      return {
        rotate: 180,
        flipX: false,
      };
    case 4:
      return {
        rotate: 180,
        flipX: true,
      };
    case 5:
      return {
        rotate: 90,
        flipX: true,
      };
    case 6:
      return {
        rotate: 90,
        flipX: false,
      };
    case 7:
      return {
        rotate: 270,
        flipX: true,
      };
    case 8:
      return {
        rotate: 270,
        flipX: false,
      };
    default:
      return {
        rotate: 0,
        flipX: false,
      }
  }
}

function drawImage(image, orientation) {
  const imageFile = new ImageFile(image);
  const width = imageFile.width;
  const height = imageFile.height;

  const drawInfo = drawInformation(orientation);
  const new_width = drawInfo.rotate % 180 === 0 ? width : height;
  const new_height = drawInfo.rotate % 180 === 0 ? height : width;

  return createImage(image).then((imageEl) => {
    const canvas = document.createElement('canvas');
    canvas.width = new_width;
    canvas.height = new_height;

    const ctx = canvas.getContext('2d');
    if (drawInfo.flipX) {
      ctx.transform(-1, 0, 0, 1, new_width, 0); // Flip x-coordinate
    }

    switch(drawInfo.rotate) {
      case 90:
        ctx.transform(0, 1, -1, 0, height, 0); // Rotate 90 degree clockwise
        break;
      case 180:
        ctx.transform(-1, 0, 0, -1, width, height); // Rotate 180 degree clockwise
        break;
      case 270:
        ctx.transform(0, -1, 1, 0, 0, width); // Rotate 270 degree clockwise
        break;
    }

    ctx.drawImage(imageEl, 0, 0);

    window.imageEl = imageEl;
    window.ctx = ctx;

    return new Promise((resolve) => {
      canvas.toBlob((data) => {
        resolve({ data: data, width: new_width, height: new_height });
      }, 'image/jpeg', 1);
    });
  });
}

function createImage(imageData) {
  return new Promise((resolve) => {
    const blob = new Blob([imageData], { type: 'image/jpeg' });
    const url = URL.createObjectURL(blob);

    const image = new Image();
    image.src = url
    image.onload = () => {
      resolve(image);
    };
  });
}
