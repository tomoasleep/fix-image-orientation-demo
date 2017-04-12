const jpeg = require('jpeg-js');
const piexif = require('piexifjs')

window.addEventListener('load', () => {
  document.querySelector('input').addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const arrayBuffer = reader.result;
      const imgData = Buffer.from(arrayBuffer);
      insertImage(imgData);

      let start = Date.now();
      const orientation = removeOrientationMetadata(imgData);
      console.log('Rewrite header:', Date.now() - start, 'ms');

      start = Date.now();
      const rawImage = jpeg.decode(imgData);
      console.log('Decode:', Date.now() - start, 'ms');

      start = Date.now();
      const rotatedImage = fixImageOrientation(rawImage, orientation);
      console.log('Fix orientation:', Date.now() - start, 'ms');

      start = Date.now();
      const image = jpeg.encode(rotatedImage);
      console.log('Encode:', Date.now() - start, 'ms');

      insertImage(image.data);
    });
    reader.readAsArrayBuffer(file);
  });
});

function removeOrientationMetadata(imgData) {
  const imgStr = imgData.toString('binary');

  const exifobj = piexif.load(imgStr);
  const orientation = Number(exifobj['0th'][piexif.ImageIFD.Orientation]) || 0;
  exifobj['0th'][piexif.ImageIFD.Orientation] = 0;
  piexif.insert(piexif.dump(exifobj), imgStr);

  imgData.write(imgStr, 0, 1 << 2, 'binary');
  return orientation;
}

function insertImage(imageData) {
  const blob = new Blob([imageData], { type: 'image/jpeg' });
  const url = URL.createObjectURL(blob);

  const el = document.createElement('img');
  el.setAttribute('src', url)
  el.setAttribute('width', '50%')
  document.body.appendChild(el);
}

function fixImageOrientation(image, orientation) {
  switch(orientation) {
    case 1:
      return image;
    case 2:
      return flip(image);
    case 3:
      return rotate(image, 180);
    case 4:
      return rotate(flip(image), 180);
    case 5:
      return flip(rotate(image, 90));
    case 6:
      return rotate(image, 90);
    case 7:
      return flip(rotate(image, 270));
    case 8:
      return rotate(image, 270);
    default:
      return image;
  }
}

function flip(image) {
  const buffer = image.data;
  const width = image.width;
  const height = image.height;

  const new_buffer = Buffer.alloc(buffer.length)
  for(var x = 0; x < width; x++)
  {
    for(var y = 0; y < height; y++)
    {
      const offset = (width * y + x) << 2
      const new_offset = (width * y + width - 1 - x) << 2
      const pixel = buffer.readUInt32BE(offset, true)
      new_buffer.writeUInt32BE(pixel, new_offset, true)
    }
  }
  return {
    data: new_buffer,
    width: width,
    height: height,
  };
}

// rotate clockwise
function rotate(image, degree) {
  const amount = degree / 90
  const buffer = image.data;
  const width = image.width;
  const height = image.height;

  const new_width = amount % 2 === 0 ? width : height;
  const new_height = amount % 2 === 0 ? height : width;
  const new_buffer = Buffer.alloc(buffer.length);

  const rotatePosition = (x, y) => {
    switch (amount) {
      case 1:
        return { x: height - y - 1, y: x };
      case 2:
        return { x: width - x - 1, y: height - y - 1 };
      case 3:
        return { x: y, y: width - x - 1 };
      default:
        return { x: x, y: y };
    } 
  }

  for(var x = 0; x < width; x++)
  {
    for(var y = 0; y < height; y++)
    {
      const offset = (width * y + x) << 2
      const new_position = rotatePosition(x, y);
      const new_offset = (new_width * new_position.y + new_position.x) << 2
      const pixel = buffer.readUInt32BE(offset, true)
      new_buffer.writeUInt32BE(pixel, new_offset, true)
    }
  }
  return {
    data: new_buffer,
    width: new_width,
    height: new_height,
  };
}
