// src/utils/imageHelpers.js
export const getBase64FromUrl = async (url) => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result); // includes "data:image/png;base64,"
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};